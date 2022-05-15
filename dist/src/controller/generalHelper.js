"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tooLargeError = exports.isInputLogicVaild = exports.getDateSet = exports.makeDir = exports.loadDataFromEachFile = exports.readFileList = exports.isInputValid = exports.calWhere = void 0;
const fs = __importStar(require("fs-extra"));
const IInsightFacade_1 = require("./IInsightFacade");
const queryHelper_1 = require("./queryHelper");
const queryHelper2_1 = require("./queryHelper2");
Object.defineProperty(exports, "readFileList", { enumerable: true, get: function () { return queryHelper2_1.readFileList; } });
const queryHelper3_1 = require("./queryHelper3");
function loadDataFromEachFile(jsonFiles, id, input, fileNum, oneFile, numRows, validity) {
    let num = 0;
    oneFile.content = [];
    for (let jFile of jsonFiles) {
        let obj;
        obj = JSON.parse(jFile);
        let sections = obj.result;
        if (num >= 500) {
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
            }
            else {
                validity = loadOverallDataIntoInput(oneFile, obj, i);
            }
        }
    }
    fs.writeJsonSync("./data/" + id + "/" + fileNum, oneFile.content);
    return { fileNum, numRows, validity };
}
exports.loadDataFromEachFile = loadDataFromEachFile;
function loadOverallDataIntoInput(input, obj, i) {
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
    }
    catch (e) {
        return false;
    }
}
function loadDataIntoInput(input, obj, i) {
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
    }
    catch (e) {
        return false;
    }
}
function makeDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}
exports.makeDir = makeDir;
function getDateSet(id) {
    let dataset = (0, queryHelper2_1.getDatasetFromFolders)("./data/" + id);
    return dataset;
}
exports.getDateSet = getDateSet;
function tooLargeError(res, resolve, reject, transformations) {
    if (res.length > 5000) {
        reject(new IInsightFacade_1.ResultTooLargeError("result data is too large!!!"));
        return [];
    }
    else {
        let rawdata = res;
        if (transformations !== undefined && transformations["GROUP"] !== undefined
            && transformations["APPLY"] !== undefined) {
            let calRes = (0, queryHelper_1.groupCal)(rawdata, transformations["GROUP"], transformations["APPLY"]);
            return calRes;
        }
        else {
            return res;
        }
    }
}
exports.tooLargeError = tooLargeError;
function calWhere(arr, where, datasetId, kind) {
    let tempRes;
    if (where["GT"] || where["IS"] || where["EQ"] || where["LT"]) {
        return (0, queryHelper_1.logicCal)(arr, where, kind);
    }
    else {
        if (where["OR"] || where["AND"]) {
            if (where["OR"]) {
                tempRes = where["OR"].map((item) => {
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
                const temparr = where["AND"];
                tempRes = temparr.map((item) => {
                    return calWhere(arr, item, datasetId, kind);
                });
                let a = tempRes[0];
                for (let i = 1; i < tempRes.length; i++) {
                    let bSet = new Set(tempRes[i]);
                    a = Array.from(new Set(a.filter((v) => bSet.has(v))));
                }
                return a;
            }
        }
        else if (where["NOT"]) {
            tempRes = calWhere(arr, where["NOT"], datasetId, kind);
            let a = [];
            for (let item of arr) {
                if (!tempRes.includes(item)) {
                    if (tempRes[0][datasetId + "_dept"] === undefined) {
                        if (item[datasetId + "_dept"] === undefined && item.id === undefined) {
                            a.push(item);
                        }
                    }
                    else {
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
exports.calWhere = calWhere;
function isInputValid(arr, where, id) {
    let isInvalid = false;
    const temp = Object.keys(where);
    temp.map((item) => {
        if (arr.indexOf(item) === -1) {
            isInvalid = true;
        }
        else {
            if (item === "GT" || item === "LT" || item === "EQ") {
                if ((0, queryHelper3_1.checkValue)(item, Object.keys(where[item])[0], id)) {
                    if (typeof (Object.values(where[item])[0]) !== "number") {
                        isInvalid = true;
                    }
                }
                else {
                    isInvalid = true;
                }
            }
            if (item === "IS") {
                let value = Object.values(where[item])[0];
                if (typeof value !== "string") {
                    isInvalid = true;
                }
                else if (!(0, queryHelper2_1.isStringValid)(value)) {
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
exports.isInputValid = isInputValid;
function isInputLogicVaild(query, reject) {
    let input = query;
    let keys = Object.keys(query);
    const needKeys = ["AND", "IS", "GT", "LT", "OR", "EQ", "NOT"];
    if (keys.indexOf("WHERE") === -1 || keys.indexOf("OPTIONS") === -1) {
        reject(new IInsightFacade_1.InsightError("key error"));
    }
    let id = (0, queryHelper2_1.getDatasetId)(input);
    (0, queryHelper2_1.isValidColumn)(input, id, reject);
    if (input["OPTIONS"]["ORDER"] && typeof input["OPTIONS"]["ORDER"] === "string" &&
        (input["OPTIONS"]["COLUMNS"].indexOf(input["OPTIONS"]["ORDER"]) === -1)) {
        reject(new IInsightFacade_1.InsightError("ORDER ERROR"));
    }
    if (input["TRANSFORMATIONS"]) {
        if (!input["TRANSFORMATIONS"]["APPLY"] || !input["TRANSFORMATIONS"]["GROUP"]) {
            reject(new IInsightFacade_1.InsightError("TRANSFORMATIONS ERROR"));
        }
        const applykeyarr = input["TRANSFORMATIONS"]["APPLY"];
        let containUnderScore = false;
        applykeyarr.map((item) => {
            const key = Object.keys(item);
            if (key[0].indexOf("_") !== -1) {
                containUnderScore = true;
            }
        });
        let validApply = (0, queryHelper_1.isValidApply)(input["TRANSFORMATIONS"]["APPLY"], id);
        if (containUnderScore || !validApply) {
            reject(new IInsightFacade_1.InsightError("apply ERROR"));
        }
        if (input["TRANSFORMATIONS"]["GROUP"].length === 0) {
            reject(new IInsightFacade_1.InsightError("Group ERROR"));
        }
        if (!(0, queryHelper3_1.equar)(input["OPTIONS"]["COLUMNS"], input["TRANSFORMATIONS"]["GROUP"], input["TRANSFORMATIONS"]["APPLY"])) {
            reject(new IInsightFacade_1.InsightError("Gruop ERROR"));
        }
    }
    if (isInputValid(needKeys, input["WHERE"], id)) {
        reject(new IInsightFacade_1.InsightError("invalid key in WHERE"));
    }
    return id;
}
exports.isInputLogicVaild = isInputLogicVaild;
//# sourceMappingURL=generalHelper.js.map