import {InsightError, InsightResult} from "./IInsightFacade";
import {sortFunc, CalObj} from "./queryHelper";
import {FileList, tooLargeError} from "./generalHelper";
import * as fs from "fs-extra";
import path from "path";
interface QueryForm {
	WHERE?: any;
	OPTIONS?: any;
	TRANSFORMATIONS?: any;
}
interface Item {
	courses_dept: string;
	courses_id: string;
	courses_avg: number;
	courses_instructor: string;
	courses_title: string;
	courses_pass: number;
	courses_fail: number;
	courses_audit: number;
	courses_uuid: number;
	courses_year: string;
	[key: string]: number | string;
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
function isValidColumn(input: QueryForm, id: string, reject: (item: any) => void,){
	const needColumns = [id + "_dept", id + "_id", id + "_avg", id + "_instructor",
		id + "_title", id + "_pass", id + "_fail", id + "_audit", id + "_uuid", id + "_year",
		id + "_fullname", id + "_shortname", "rooms_number", id + "_name", id + "_address", id + "_lat",
		id + "_lon", id + "_seats", id + "_type", id + "_furniture", id + "_href"];
	if (input["OPTIONS"]["COLUMNS"] === undefined) {
		reject(new InsightError("No COLUMNS"));
	}
	if(input["TRANSFORMATIONS"] && input["TRANSFORMATIONS"]["APPLY"]){
		input["TRANSFORMATIONS"]["APPLY"].map((item: any)=>{
			let str = Object.keys(item)[0];
			needColumns.push(str);
		});
	}

	let validColumn = input["OPTIONS"]["COLUMNS"].every((value: any) => {
		return needColumns.indexOf(value) > -1;
	});

	if (!validColumn) {
		reject(new InsightError("COLUMNS ERROR"));
	}
}

function calWhenEmpty(dataSet: any,input: QueryForm,res: InsightResult[],
	resolve: (item: any) => void,reject: (item: any) => void){
	dataSet.map((item: Item) => {
		let temp = {} as Temp2;
		input["OPTIONS"]["COLUMNS"].map((key: keyof Temp) => {
			temp[key] = item[key];
		});
		res.push(temp);
	});
	if (input["OPTIONS"]["ORDER"]) {
		sortFunc(res,input["OPTIONS"]["ORDER"]);
	}
	let tempRess = tooLargeError(res, resolve, reject, input["TRANSFORMATIONS"]);
	const resNoRepeat: any = [];
	tempRess.map((item: any) => {
		if((!resNoRepeat.includes(item)) && (!(JSON.stringify(item) === "{}"))){
			resNoRepeat.push(item);
		}
	});
	resolve(resNoRepeat);
}
function isStringValid(str: string): boolean {
	if (str.length <= 2) {
		return true;
	}
	let frontIndex = 0;
	let backIndex = str.length + 1;
	if (str[0] === "*") {
		frontIndex = 1;
	}
	if (str[str.length - 1] === "*") {
		backIndex = str.length - 1;
	}
	let valid = true;
	for (let s of str.substring(frontIndex, backIndex)) {
		if (s === "*") {
			valid = false;
		}
	}
	return valid;
}
function minmaxCal(obj: CalObj,applyarr: any[]){
	for(let key in obj){
		for(let apply of applyarr){
			let temp = Object.values(apply)[0] as CalObj;
			if(Object.keys(temp)[0] === "MAX"){
				let max = 0;
				for(let item of obj[key]){
					if(item[Object.values(temp)[0]] > max){
						max = item[Object.values(temp)[0]];
					}
				}
				obj[key][0][Object.keys(apply)[0]] = max;
			}
			if(Object.keys(temp)[0] === "MIN"){
				let min = 9999;
				for(let item of obj[key]){
					if(item[Object.values(temp)[0]] < min){
						min = item[Object.values(temp)[0]];
					}
				}
				obj[key][0][Object.keys(apply)[0]] = min;
			}
		}
	}
}
function findIdFromList(allKeys: string[]) {
	let id = "";
	for (let key of allKeys) {
		for (let i = 0; i < key.length; i++) {
			if (key[i] === "_") {
				return id = key.substring(0, i);
			}
		}
	}
	return id;
}
function findIdFromWHERE(query: any, allKeys: string[]) {
	let moreClauses: object[] = [];
	for (let key of query) {
		for (let innerKey of Object.keys(key)) {
			if (innerKey === "GT" || innerKey === "LT" || innerKey === "EQ" || innerKey === "IS") {
				allKeys.push(Object.keys(key[innerKey])[0] as string);
			} else {
				moreClauses.push(key[innerKey]);
			}
		}
	}
	if (moreClauses.length > 0) {
		findIdFromWHERE(moreClauses, allKeys);
	}
	return findIdFromList(allKeys);
}
function getDatasetId(query: any): string {
	let hasColumn = false;
	let keys: string[] = [];
	let idFromColumn: string = "";
	let idFromWhere: string = "";
	for (let key of Object.keys(query)) {  // "WHERE" &| "OPTIONS"
		if (key === "WHERE") {
			if (JSON.stringify(query["WHERE"]) === "{}") {
				idFromWhere = "invalid";
			} else {
				for (let keyInsideWhere of Object.keys(query["WHERE"])) {
					if (keyInsideWhere === "GT" || keyInsideWhere === "LT" ||
						keyInsideWhere === "EQ" || keyInsideWhere === "IS") {
						let clauses: object[] = [];
						clauses.push(query["WHERE"]);
						idFromWhere = findIdFromWHERE(clauses, keys);
					} else {
						let clauses: object[] = [];
						clauses.push(query["WHERE"][keyInsideWhere]);
						idFromWhere = findIdFromWHERE(clauses, keys);
					}

				}
			}
		} else if (key === "OPTIONS") {
			if (query["OPTIONS"]["COLUMNS"]) {
				hasColumn = true;
				if (JSON.stringify(query["OPTIONS"]["COLUMNS"]) === "{}") {
					throw new InsightError("No valid column key exists");
				}
				idFromColumn = findIdFromList(Object.values(query["OPTIONS"]["COLUMNS"]));
			}
		}
	}
	if (!hasColumn){
		throw new InsightError("Does not have column");
	}
	if (idFromWhere === "invalid") {
		return idFromColumn;
	} else if (idFromWhere === idFromColumn) {
		return idFromWhere;
	} else if (idFromColumn !== idFromWhere) {
		throw new InsightError("Column contains invalid key");
	}
	return idFromWhere;
}
function readFileList(dir: string): FileList {
	// returns an array of file names under dir
	try {
		let fileList: FileList = {
			folderNames: [],
			paths: []
		};
		const files = fs.readdirSync(dir);
		files.forEach((item, index) => {
			let fullPath = "";
			let folderPath = "";
			folderPath = dir.concat(item);
			fullPath = dir.concat(item + "/info.json");
			fileList.paths.push(fullPath);
			fileList.folderNames.push(folderPath);
		});
		return fileList;
	} catch (e: any) {
		throw new InsightError(e);
	}


}
function getDatasetFromFolders(folderPath: string) {
	// returns an array of file names under dir
	let pathList: any[] = [];
	let dataset: any[] = [];
	const files = fs.readdirSync(folderPath);
	files.forEach((item: any) => {
		let fullPath: string = path.join(folderPath, item);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
				// recursion for making paths
			readFileList(folderPath);
		} else {
			pathList.push(fullPath);
		}
	});
	for (let dataPath of pathList) {
		dataset = dataset.concat(fs.readJsonSync(dataPath));
	}
	return dataset;
}

export {isValidColumn,calWhenEmpty, isStringValid,minmaxCal,
	getDatasetId, readFileList, getDatasetFromFolders};


