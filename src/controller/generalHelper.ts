import * as fs from "fs-extra";
import path from "path";
import {InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import {logicCal,isValidApply,groupCal} from "./queryHelper";
import {isValidColumn, isStringValid, getDatasetId, readFileList, getDatasetFromFolders}
	from "./queryHelper2";
import {checkValue, equar} from "./queryHelper3";
import {DataFile} from "./addDatasetGeneralHelper";

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
interface QueryForm {
	WHERE?: any;
	OPTIONS?: any;
	TRANSFORMATIONS?: any;
}

interface LogicForm {
	"OR": any;
	"AND": any;
	"IS": any;
	"GT": any;
	"EQ": any;
	"LT": any;
	[key: string]: any;
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
interface FileList {
	folderNames: string[];
	paths: string[];
}
function loadDataFromEachFile(jsonFiles: Array<Awaited<string>>, id: string, input: DataFile, fileNum: number,
	oneFile: {content: object[]}, numRows: number, validity: boolean) {
	let num = 0;
	oneFile.content = [];
	for (let jFile of jsonFiles) {
		let obj;
		obj = JSON.parse(jFile);

		let sections: any[] = obj.result;

		if (num >= 500) {
			// input.content = input.content.concat(oneFile.content);
			fs.writeJsonSync("./data/" + id + "/" + fileNum, oneFile.content);
			num = 0;
			fileNum++;
			oneFile.content = [];
		}
		for (let i = 0; i < sections.length; i++) {
			numRows++;
			num++;
			if (obj.result[i].Section !== "overall") {
				validity = loadDataIntoInput(oneFile, obj, i);
			} else {
				validity = loadOverallDataIntoInput(oneFile, obj, i);
			}
		}

	}
	// input.content = input.content.concat(oneFile.content);
	fs.writeJsonSync("./data/" + id + "/" + fileNum, oneFile.content);
	return {fileNum, numRows, validity};
}
function loadOverallDataIntoInput(input: {content: object[]}, obj: any, i: number): boolean {
	try {
		input.content = input.content.concat({
			courses_dept: obj.result[i].Subject,
			courses_id: obj.result[i].Course,
			courses_avg: obj.result[i].Avg,
			courses_instructor: obj.result[i].Professor,
			courses_title: obj.result[i].Title,
			courses_pass: obj.result[i].Pass,
			courses_fail: obj.result[i].Fail,
			courses_audit: obj.result[i].Audit,
			courses_uuid: obj.result[i].id,
			courses_year: 1900
		});
		return true;
	} catch(e) {
		return false;
	}

}
function loadDataIntoInput(input: {content: object[]}, obj: any, i: number): boolean {
	try {
		input.content = input.content.concat({
			courses_dept: obj.result[i].Subject,
			courses_id: obj.result[i].Course,
			courses_avg: obj.result[i].Avg,
			courses_instructor: obj.result[i].Professor,
			courses_title: obj.result[i].Title,
			courses_pass: obj.result[i].Pass,
			courses_fail: obj.result[i].Fail,
			courses_audit: obj.result[i].Audit,
			courses_uuid: obj.result[i].id,
			courses_year: obj.result[i].Year
		});
		return true;
	} catch(e) {
		return false;
	}

}
function makeDir(dir: string) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

function getDateSet(id: string) {
	let dataset = getDatasetFromFolders("./data/" + id);
	return dataset;
}
function tooLargeError(res: InsightResult[],resolve: (item: any) => void,reject: (item: any) => void,
	transformations: any){
	if (res.length > 5000) {
		reject(new ResultTooLargeError("result data is too large!!!"));
		return [];
	} else {
		let rawdata = res as Item[];
		if(transformations !== undefined && transformations["GROUP"] !== undefined
			&& transformations["APPLY"] !== undefined){
			let calRes = groupCal(rawdata,transformations["GROUP"],transformations["APPLY"]);
			return calRes;
		}else{
			return res;
		}
	}
}
function calWhere(arr: Item[], where: LogicForm, datasetId: string, kind: string): Temp[] | undefined {
	let tempRes;
	if (where["GT"] || where["IS"] || where["EQ"] || where["LT"]) {
		return logicCal(arr, where, kind);
	} else {
		if (where["OR"] || where["AND"]) {
			if (where["OR"]) {
				tempRes = where["OR"].map((item: LogicForm) => {
					return calWhere(arr, item, datasetId, kind);
				});
				let a = tempRes[0];
				for (let i = 1; i < tempRes.length; i++) {
					let b = tempRes[i];
					a = Array.from(new Set(a.concat(b)));
				}
				return a;
			}
			if (where["AND"]) {
				const temparr: any[] = where["AND"] as any[];
				tempRes = temparr.map((item: LogicForm) => {
					return calWhere(arr, item, datasetId, kind);
				});
				let a = tempRes[0] as Temp[];
				for (let i = 1; i < tempRes.length; i++) {
					let bSet = new Set(tempRes[i]);
					a = Array.from(new Set(a.filter((v) => bSet.has(v))));
				}
				return a;
			}
		}else if(where["NOT"]){
			tempRes = calWhere(arr, where["NOT"], datasetId, kind) as Item[];
			let a = [] as Item[];
			for (let item of arr){
				if(!tempRes.includes(item)){
					if (tempRes[0][datasetId + "_dept"] === undefined) {  // We are looking for rooms
						if (item[datasetId + "_dept"] === undefined && item.id === undefined) {
							a.push(item);
						}
					} else {                                      // We are looking for courses
						if (item[datasetId + "_fullname"] === undefined && item.id === undefined) {
							a.push(item);
						}
					}
				}
			}
			return a;
		}
	}
}
function isInputValid(arr: string[], where: LogicForm, id: string): boolean {
	let isInvalid = false;
	const temp = Object.keys(where);
	temp.map((item) => {
		if (arr.indexOf(item) === -1) {
			isInvalid = true;
		}else{
			if(item === "GT" || item === "LT" || item === "EQ"){
				if (checkValue(item, Object.keys(where[item])[0], id)) {
					if(typeof (Object.values(where[item])[0]) !== "number"){
						isInvalid = true;
					}
				} else {
					isInvalid = true;
				}

			}
			if(item === "IS"){
				let value = Object.values(where[item])[0];
				if(typeof value !== "string"){
					isInvalid = true;
				} else if (!isStringValid(value)) {
					isInvalid = true;
				}
			}
		}
	});
	for (let key in where) {
		if (where[key] instanceof Array) {
			for (let input of where[key]) {
				let itemFlag = isInputValid(arr, input, id);
				if (itemFlag) {
					isInvalid = true;
				}
			}
		}
	}
	return isInvalid;
}
function isInputLogicVaild(query: unknown, reject: (item: any) => void): string {
	let input: QueryForm = query as QueryForm;
	let keys = Object.keys(query as QueryForm);
	const needKeys = ["AND", "IS", "GT", "LT", "OR", "EQ","NOT"];
	if (keys.indexOf("WHERE") === -1 || keys.indexOf("OPTIONS") === -1) {
		reject(new InsightError("key error"));
	}
	let id = getDatasetId(input);
	isValidColumn(input,id, reject);
	if (input["OPTIONS"]["ORDER"] && typeof input["OPTIONS"]["ORDER"] === "string" &&
		(input["OPTIONS"]["COLUMNS"].indexOf(input["OPTIONS"]["ORDER"]) === -1)) {
		reject(new InsightError("ORDER ERROR"));
	}

	if(input["TRANSFORMATIONS"]){
		if(!input["TRANSFORMATIONS"]["APPLY"] || !input["TRANSFORMATIONS"]["GROUP"]){
			reject(new InsightError("TRANSFORMATIONS ERROR"));
		}
		const applykeyarr: any[] = input["TRANSFORMATIONS"]["APPLY"];
		let containUnderScore = false;
		applykeyarr.map((item)=>{
			const key = Object.keys(item);
			if(key[0].indexOf("_") !== -1){
				containUnderScore = true;
			}
		});
		let validApply = isValidApply(input["TRANSFORMATIONS"]["APPLY"], id);
		if(containUnderScore || !validApply){
			reject(new InsightError("apply ERROR"));
		}
		if(input["TRANSFORMATIONS"]["GROUP"].length === 0){
			reject(new InsightError("Group ERROR"));
		}
		if(!equar(input["OPTIONS"]["COLUMNS"],input["TRANSFORMATIONS"]["GROUP"],input["TRANSFORMATIONS"]["APPLY"])){
			reject(new InsightError("Gruop ERROR"));
		}
	}

	if (isInputValid(needKeys, input["WHERE"], id)) {
		reject(new InsightError("invalid key in WHERE"));
	}
	return  id;
}
export {calWhere, isInputValid, readFileList, loadDataFromEachFile, makeDir,
	getDateSet,isInputLogicVaild,tooLargeError, FileList};
