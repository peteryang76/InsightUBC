"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortFunc = exports.groupCal = exports.isValidApply = exports.logicCal = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
const queryHelper2_1 = require("./queryHelper2");
const queryHelper3_1 = require("./queryHelper3");
function isValidApply(apply, id) {
    let isValid = true;
    const obj = {
        courses_dept: "String",
        courses_pass: "Number",
        courses_fail: "Number",
        courses_audit: "Number",
        courses_year: "Number",
        courses_id: "Number",
        courses_avg: "Number",
        courses_instructor: "String",
        courses_title: "String",
        courses_uuid: "Number",
    };
    for (let item of apply) {
        if (Object.keys(item).length > 1) {
            isValid = false;
        }
        let tempArr = Object.values(item)[0];
        let applyToken = Object.keys(tempArr)[0];
        let applyKey = Object.values(tempArr)[0];
        if ((0, queryHelper3_1.checkValue)(applyToken, applyKey, id)) {
            if (tempArr["MAX"] && obj[tempArr["MAX"]] === "String") {
                isValid = false;
            }
            if (tempArr["MIN"] && obj[tempArr["MAX"]] === "String") {
                isValid = false;
            }
            if (tempArr["AVG"] && obj[tempArr["MAX"]] === "String") {
                isValid = false;
            }
            if (tempArr["SUM"] && obj[tempArr["MAX"]] === "String") {
                isValid = false;
            }
        }
        else {
            isValid = false;
        }
    }
    return isValid;
}
exports.isValidApply = isValidApply;
function logicCal(arr, where, kind) {
    const temp = [];
    if (where["GT"]) {
        arr.map((item) => {
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
        logicCalWhere(arr, where, temp);
    }
    if (where["EQ"]) {
        arr.map((item) => {
            const key = Object.keys(where["EQ"])[0];
            if (item[key] === where["EQ"][key]) {
                temp.push(item);
            }
        });
    }
    if (where["LT"]) {
        arr.map((item) => {
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
exports.logicCal = logicCal;
function handleFrontStar(noStar, str, value, temp, item) {
    noStar = str.substring(1, str.length);
    if (value !== undefined) {
        let valueButt = value.substring(value.length - noStar.length, value.length);
        if (valueButt === noStar) {
            temp.push(item);
        }
    }
    return noStar;
}
function handleBackStar(noStar, str, value, temp, item) {
    noStar = str.substring(0, str.length - 1);
    if (value !== undefined) {
        let valueHead = value.substring(0, noStar.length);
        if (valueHead === noStar) {
            temp.push(item);
        }
    }
    return noStar;
}
function logicCalWhere(arr, where, temp) {
    arr.map((item) => {
        const key = Object.keys(where["IS"])[0];
        const str = where["IS"][key];
        let frontStar = false;
        let backStar = false;
        if (str[0] === "*") {
            frontStar = true;
        }
        if (str[str.length - 1] === "*") {
            backStar = true;
        }
        let flagAllStr = false;
        if (str === "*" || str === "**") {
            flagAllStr = true;
        }
        let noStar = str;
        let value = item[key];
        if (flagAllStr) {
            let itemStrArr = Object.keys(item);
            if (itemStrArr.indexOf(key) !== -1) {
                temp.push(item);
            }
        }
        else {
            if ((!frontStar && !backStar)) {
                let itemStr = item[key];
                if (itemStr !== undefined && itemStr === noStar) {
                    temp.push(item);
                }
            }
            else if (frontStar && !backStar) {
                handleFrontStar(noStar, str, value, temp, item);
            }
            else if (!frontStar && backStar) {
                handleBackStar(noStar, str, value, temp, item);
            }
            else if (frontStar && backStar) {
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
function groupCal(rawRes, groupArr, applyarr) {
    let groupedRes = {};
    for (let item of rawRes) {
        let groupHeader = "";
        groupArr.map((attr) => {
            if (item[attr] !== undefined) {
                groupHeader = groupHeader + attr + ":" + item[attr] + ";";
            }
        });
        if (!groupedRes[groupHeader]) {
            groupedRes[groupHeader] = [];
            groupedRes[groupHeader].push(item);
        }
        else {
            groupedRes[groupHeader].push(item);
        }
    }
    let applyRes = applyCal(groupedRes, applyarr);
    let calRes = [];
    let arr = Object.values(applyRes);
    for (let item of arr) {
        calRes = calRes.concat(item);
    }
    const resNoRepeat = [];
    calRes.map((item) => {
        if (!resNoRepeat.includes(item)) {
            resNoRepeat.push(item);
        }
    });
    return resNoRepeat;
}
exports.groupCal = groupCal;
function applyCal(obj, applyarr) {
    let applyRes = [];
    for (let key in obj) {
        for (let apply of applyarr) {
            let temp = Object.values(apply)[0];
            let applyRule = Object.keys(temp)[0];
            if (applyRule === "SUM") {
                let sum = new decimal_js_1.default(0);
                for (let item of obj[key]) {
                    sum = sum.add(new decimal_js_1.default(item[Object.values(temp)[0]]));
                }
                let summ = sum.toNumber();
                let summm = Number(summ.toFixed(2));
                for (let item of obj[key]) {
                    item[Object.keys(apply)[0]] = summm;
                }
            }
            if (applyRule === "AVG") {
                let sum = new decimal_js_1.default(0);
                for (let item of obj[key]) {
                    sum = sum.add(new decimal_js_1.default(item[Object.values(temp)[0]]));
                }
                let avg = sum.toNumber() / obj[key].length;
                avg = Number(avg.toFixed(2));
                obj[key][0][Object.keys(apply)[0]] = avg;
            }
            (0, queryHelper2_1.minmaxCal)(obj, applyarr);
            if (applyRule === "COUNT") {
                let count = 0;
                let resArray = [];
                let countKey = temp["COUNT"];
                for (let item of obj[key]) {
                    if (!resArray.includes(item[countKey])) {
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
function sortFunc(res, sort) {
    if (typeof (sort) === "string") {
        res.sort((a, b) => {
            let c = a[sort];
            let d = b[sort];
            return c - d;
        });
    }
    else {
        let isUp = sort["dir"];
        let attrArr = sort["keys"];
        for (let item of attrArr) {
            sortFuncOfAttr(res, item, isUp);
        }
    }
}
exports.sortFunc = sortFunc;
function sortFuncOfAttr(res, attr, isUp) {
    if (isUp === "UP") {
        res.sort((a, b) => {
            let c = a[attr];
            let d = b[attr];
            return c - d;
        });
    }
    else {
        res.sort((a, b) => {
            let c = a[attr];
            let d = b[attr];
            return d - c;
        });
    }
}
//# sourceMappingURL=queryHelper.js.map