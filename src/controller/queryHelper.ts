import Decimal from "decimal.js";
import {minmaxCal} from "./queryHelper2";
import {InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import {checkValue} from "./queryHelper3";

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
interface Applykey {
	[key: string]: any;
}
interface CalObj {
	[key: string]: any;
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
function isValidApply(apply: any[], id: string){
	let isValid = true;
	const obj: Applykey = {
		courses_dept:"String",
		courses_pass:"Number",
		courses_fail:"Number",
		courses_audit:"Number",
		courses_year:"Number",
		courses_id:"Number",
		courses_avg:"Number",
		courses_instructor:"String",
		courses_title:"String",
		courses_uuid:"Number",
	};
	for(let item of apply){
		if(Object.keys(item).length > 1){
			isValid = false;
		}
		let tempArr: any = Object.values(item)[0];
		let applyToken = Object.keys(tempArr)[0];
		let applyKey = Object.values(tempArr)[0];
		if (checkValue(applyToken, applyKey, id)) {
			if(tempArr["MAX"] && obj[tempArr["MAX"]] === "String"){
				isValid = false;
			}
			if(tempArr["MIN"] && obj[tempArr["MAX"]] === "String"){
				isValid = false;
			}
			if(tempArr["AVG"] && obj[tempArr["MAX"]] === "String"){
				isValid = false;
			}
			if(tempArr["SUM"] && obj[tempArr["MAX"]] === "String"){
				isValid = false;
			}
		} else {
			isValid = false;
		}

	}
	return isValid;
}
function logicCal(arr: Item[], where: LogicForm, kind: string) {
	const temp: any[] = [];
	if (where["GT"]) {
		arr.map((item: any) => {
			const key = Object.keys(where["GT"])[0];
			let datasetKey = kind;
			for (let i = 0; i < key.length; i++) {
				if (key[i] === "_") {
					let butt = key.substring(i, key.length);
					datasetKey = datasetKey.concat(butt);
				}
			}
			if (item[datasetKey] > where["GT"][key]) {
				temp.push(item);
			}
		});
	}
	if (where["IS"]) {
		logicCalWhere(arr, where,temp);
	}
	if (where["EQ"]) {
		arr.map((item: Item) => {
			const key = Object.keys(where["EQ"])[0];
			if (item[key] === where["EQ"][key]) {
				temp.push(item);
			}
		});
	}
	if (where["LT"]) {
		arr.map((item: Item) => {
			const key = Object.keys(where["LT"])[0];
			let datasetKey = kind;
			for (let i = 0; i < key.length; i++) {
				if (key[i] === "_") {
					let butt = key.substring(i, key.length);
					datasetKey = datasetKey.concat(butt);
				}
			}
			if (item[datasetKey] < where["LT"][key]) {
				temp.push(item);
			}
		});
	}
	return temp;
}
function handleFrontStar(noStar: any, str: any, value: string, temp: any[], item: Item) {
	noStar = str.substring(1, str.length);
	if (value !== undefined) {
		let valueButt = value.substring(value.length - noStar.length, value.length);
		if (valueButt === noStar) {
			temp.push(item);
		}
	}
	return noStar;
}
function handleBackStar(noStar: any, str: any, value: string, temp: any[], item: Item) {
	noStar = str.substring(0, str.length - 1);
	if (value !== undefined) {
		let valueHead = value.substring(0, noStar.length);
		if (valueHead === noStar) {
			temp.push(item);
		}
	}
	return noStar;
}
function logicCalWhere(arr: Item[], where: LogicForm,temp: any[]) {
	arr.map((item: Item) => {
		const key = Object.keys(where["IS"])[0];
		const str = where["IS"][key];
		let frontStar = false;
		let backStar = false;
		if(str[0] === "*"){
			frontStar = true;
		}
		if(str[str.length - 1] === "*"){
			backStar = true;
		}
		let flagAllStr = false;
		if (str === "*" || str === "**") {
			flagAllStr = true;
		}
		let noStar = str;
		let value = item[key] as string;
		if (flagAllStr){
			let itemStrArr = Object.keys(item);
			if (itemStrArr.indexOf(key) !== -1){
				temp.push(item);
			}
		} else {
			if ((!frontStar && !backStar)){  // no star
				let itemStr = item[key] as string;
				if (itemStr !== undefined && itemStr === noStar) {
					temp.push(item);
				}
			}else if(frontStar && !backStar){
				handleFrontStar(noStar, str, value, temp, item);
			}else if(!frontStar && backStar){
				handleBackStar(noStar, str, value, temp, item);
			} else if(frontStar && backStar) {  // all star
				noStar = str.substring(1, str.length - 1);
				if (value !== undefined) {
					if (value.indexOf(noStar) > -1) {
						temp.push(item);
					}
				}
			}
		}
	});
}
function groupCal(rawRes: Item[],groupArr: any[],applyarr: any[]){
	let groupedRes: CalObj = {};
	for(let item of rawRes){
		let groupHeader = "";
		groupArr.map((attr)=>{
			if(item[attr] !== undefined){
				groupHeader = groupHeader + attr + ":" + item[attr] + ";";
			}
		});
		if(!groupedRes[groupHeader]){
			groupedRes[groupHeader] = [];
			groupedRes[groupHeader].push(item);
		}else{
			groupedRes[groupHeader].push(item);
		}
	}
	let applyRes = applyCal(groupedRes,applyarr);
	let calRes: any = [];
	let arr = Object.values(applyRes);
	for(let item of arr){
		calRes = calRes.concat(item);
	}
	const resNoRepeat: any = [];
	calRes.map((item: any)=>{
		if(!resNoRepeat.includes(item)){
			resNoRepeat.push(item);
		}
	});
	return resNoRepeat;
}
function applyCal(obj: CalObj,applyarr: any[]): any[]{
	let applyRes: any[] = [];
	for(let key in obj){
		for(let apply of applyarr){
			let temp = Object.values(apply)[0] as CalObj;
			let applyRule = Object.keys(temp)[0];
			if(applyRule === "SUM"){
				let sum = new Decimal(0);
				for(let item of obj[key]){
					sum = sum.add(new Decimal(item[Object.values(temp)[0]]));
				}
				let summ = sum.toNumber();
				let summm = Number(summ.toFixed(2));
				for(let item of obj[key]){
					item[Object.keys(apply)[0]] = summm;
				}
			}
			if(applyRule === "AVG"){
				let sum = new Decimal(0);
				for(let item of obj[key]){
					sum = sum.add(new Decimal(item[Object.values(temp)[0]]));
				}
				let avg = sum.toNumber() / obj[key].length;
				avg = Number(avg.toFixed(2));
				obj[key][0][Object.keys(apply)[0]] = avg;
			}
			minmaxCal(obj, applyarr);
			if(applyRule === "COUNT"){
				let count = 0;
				let resArray: any[] = [];
				let countKey = temp["COUNT"];
				for(let item of obj[key]){
					if(!resArray.includes(item[countKey])){
						count++;
						resArray.push(item[countKey]);
					}
				}
				obj[key][0][Object.keys(apply)[0]] = count;
			}
		}
		applyRes.push(obj[key][0]);
	}
	return applyRes;
}
function sortFunc(res: InsightResult[],sort: any){
	if(typeof (sort) === "string"){
		res.sort((a, b) => {
			let c: number = a[sort] as number;
			let d: number = b[sort] as number;
			return c - d;
		});
	}else{
		let isUp = sort["dir"];
		let attrArr = sort["keys"];
		for(let item of attrArr){
			sortFuncOfAttr(res,item,isUp);
		}
	}
}
function sortFuncOfAttr(res: InsightResult[],attr: any,isUp: string){
	if(isUp === "UP"){
		res.sort((a, b) => {
			let c: number = a[attr] as number;
			let d: number = b[attr] as number;
			return c - d;
		});
	}else{
		res.sort((a, b) => {
			let c: number = a[attr] as number;
			let d: number = b[attr] as number;
			return d - c;
		});
	}
}
export {logicCal,isValidApply,groupCal,sortFunc, CalObj};
