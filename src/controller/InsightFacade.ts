import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError,
} from "./IInsightFacade";
import JSZip from "jszip";
import {calWhere,loadDataFromEachFile, makeDir,getDateSet,isInputLogicVaild,tooLargeError} from "./generalHelper";
import {findTBody, findTable, findPath, findInfo, RoomInfo, PathAndShortName, DatasetInfo} from "./addDatasetHelper";
import {check_id, DataFile} from "./addDatasetGeneralHelper";
import {sortFunc} from "./queryHelper";
import * as fs from "fs-extra";
import {calWhenEmpty} from "./queryHelper2";

// import HTTP_STATUS_TEMPORARY_REDIRECT = module;

interface QueryForm {
	WHERE?: any;
	OPTIONS?: any;
	TRANSFORMATIONS?: any;
}

interface Temp {
	courses_dept?: string | undefined;
	courses_id?: string | undefined;
	courses_avg?: number | undefined;
	courses_instructor?: string | undefined;
	courses_title?: string | undefined;
	courses_pass?: number | undefined;
	courses_fail?: number | undefined;
	courses_audit?: number | undefined;
	courses_uuid?: number | undefined;
	courses_year?: string | undefined;
}

interface Temp2 {
	[key: string]: number | string;
}

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public datasetContents: Map<string, string>;

	constructor() {
		console.log("InsightFacadeImpl::init()");       // Not quite sure how to use this
		// initiate();
		this.datasetContents = new Map<string, string>();
	}


	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Check id
		check_id(id, this.datasetContents);
		// Check zip file
		if (kind === InsightDatasetKind.Courses) {
			return this.addCourses(content, id, kind);
		} else {
			return this.addRooms(content, id, kind);
		}

	}

	private addRooms(content: string, id: string, kind: InsightDatasetKind.Rooms) {
		let {zip, result, roomFile, nameSet, numRooms, parser} = this.initiate();
		return new Promise<string[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then(() => {
					return zip.file("rooms/index.htm")?.async("text");
				}).then((jsonFIle) => {
					makeDir("./data");
					makeDir("./data/" + id);
					let pathAndName = this.findPathAndName(jsonFIle);
					let pathSet = pathAndName.path;
					nameSet = pathAndName.shortName;
					const promises: any[] = [];
					for (const buildingPath of pathSet) {
						promises.push(zip.file("rooms"
						+ buildingPath.substring(1, buildingPath.length))?.async("string"));
					}
					return Promise.all(promises);
				}).then((htmlFiles) => {
					const promises: any[] = [];
					for (let i = 0; i < htmlFiles.length; i++) {
						let obj = parser.parse(htmlFiles[i]);
						promises.push(findInfo(obj, nameSet[i], numRooms));
					}
					return Promise.all(promises);
				}).then((datasetInfos) => {
					for (const datasetInfo of datasetInfos) {
						numRooms += datasetInfo.numRooms;
						roomFile.content = roomFile.content.concat(datasetInfo.content);
					}
					fs.writeJsonSync("./data/" + id + "/content.json", roomFile.content);
				}).then(() => {
					if (numRooms > 0) {
						roomFile.info = {id: id, kind: kind, numRows: numRooms};
						fs.writeJsonSync("./data/" + id + "/info.json", roomFile.info);
						fs.readdirSync("./data").forEach((file) => {
							result.push(file);
						});
						return resolve(result);
					} else {
						throw new InsightError("The zip file is invalid");
					}
				}).catch((error) => {
					return reject(new InsightError(error));
				});
		});
	}

	private initiate() {
		let zip = new JSZip();
		let result: string[] = [];
		let roomFile: DataFile = {
			info: {},
			content: []
		};
		let nameSet: string[] = [];
		let numRooms = 0;
		let parser = require("parse5");
		return {zip, result, roomFile, nameSet, numRooms, parser};
	}

	private findPathAndName(jsonFIle: string | undefined) {
		let parser = require("parse5");
		let index = parser.parse(jsonFIle);
		let table = findTable(index, "views-table cols-5 table");
		let tbody = findTBody(table);
		return findPath(tbody);
	}

	private addCourses(content: string, id: string, kind: InsightDatasetKind) {
		let zip = new JSZip();
		// Add dataset
		let result: string[] = [];
		let validity: boolean = false;
		let numRows = 0;
		let input: DataFile = {
			info: {},
			content: []
		};
		let oneFile = {
			content: [{}]
		};
		let fileNum: number = 0;
		return new Promise<string[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true})
				.then(() => {
					const promises: any[] = [];
					zip.folder("courses")?.forEach((relativePath, file) => {
						promises.push(file.async("binarystring"));
					});
					return Promise.all(promises);
				}).then((jsonFiles) => {
					makeDir("./data");
					makeDir("./data/" + id);
					const ret = loadDataFromEachFile(jsonFiles, id, input, fileNum, oneFile, numRows, validity);
					fileNum = ret.fileNum;
					numRows = ret.numRows;
					validity = ret.validity;
				}).then(() => {
					if (validity) {
						input.info = {id: id, kind: kind, numRows: numRows};
						fs.writeJsonSync("./data/" + id + "/info.json", input.info);
						fs.readdirSync("./data").forEach((file) => {
							result.push(file);
						});
						return resolve(result);
					} else {
						throw new InsightError("The zip file is invalid");
					}
				}).catch((error) => {
					console.log(error);
					return reject(new InsightError(error));
				});
		});
	}

	public removeDataset(id: string): Promise<string> {
		let allWhiteSpace = true;
		for (const letter of id) {
			if (letter !== " ") {
				allWhiteSpace = false;
			}
		}
		if (allWhiteSpace) {
			throw new InsightError("The given id is all white space");
		}
		if (id === "") {
			throw new InsightError("The given id is a whitespace.");
		} else if (id.includes("_")) {
			throw new InsightError("The given id contains underscore.");
		} else if (!fs.existsSync("./data/" + id)) {
			throw new NotFoundError("Cannot find the given id");
		}

		return new Promise<string>((resolve, reject) => {
			try {
				fs.removeSync("./data/" + id);
				return resolve(id);
			} catch (e: any) {
				return reject(new InsightError(e));
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise<InsightDataset[]>((resolve, reject) => {
			let result: InsightDataset[];
			result = [];
			try {
				fs.readdirSync("./data").forEach((file) => {
					let content: string = fs.readFileSync("./data/" + file + "/info.json", "utf8");
					let obj = JSON.parse(content);
					let dataset: InsightDataset = {
						id: obj.id,
						kind: obj.kind,
						numRows: obj.numRows
					};
					result = result.concat(dataset);
				});
				return resolve(result);
			} catch (e) {
				return resolve(result);
			}
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let input: QueryForm = query as QueryForm;
		return new Promise((resolve, reject) => {
			let res: InsightResult[] = [];
			let id = isInputLogicVaild(query,reject);
			let dataSet: any = getDateSet(id);
			let kind = "";
			try {
				let info = fs.readJsonSync("./data/" + id + "/info.json");
				kind = info.kind;
			} catch (e) {
				throw new InsightError("Cannot find the required dataset");
			}
			const isEmpty = (JSON.stringify(input["WHERE"]) === "{}");
			let tempRes;
			if (isEmpty) {
				calWhenEmpty(dataSet,input,res,resolve,reject);
			} else {
				tempRes = calWhere(dataSet, input["WHERE"], id, kind) as InsightResult[];
				let tempRess = tooLargeError(tempRes,resolve,reject,input["TRANSFORMATIONS"]);
				tempRess.map((item: {[x: string]: any}) => {
					let temp: Temp2 = {};
					input["OPTIONS"]["COLUMNS"].map((key: any) => {
						let datasetKey = kind;
						if (!key.includes("_")) {
							datasetKey = key;
						}
						for (let i = 0; i < key.length; i++) {

							if (key[i] === "_") {
								let butt = key.substring(i, key.length);
								datasetKey = datasetKey.concat(butt);
							}
						}
						temp[key] = item[datasetKey];
					});
					res.push(temp);
				});
				if (tempRess.length > 5000) {
					reject(new ResultTooLargeError("result data is too large!!!"));
					return [];
				}
				if (input["OPTIONS"]["ORDER"]) {
					sortFunc(res,input["OPTIONS"]["ORDER"]);
				}
				resolve(res);
			}
		});
	}
}
