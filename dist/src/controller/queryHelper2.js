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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasetFromFolders = exports.readFileList = exports.getDatasetId = exports.minmaxCal = exports.isStringValid = exports.calWhenEmpty = exports.isValidColumn = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const queryHelper_1 = require("./queryHelper");
const generalHelper_1 = require("./generalHelper");
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
function isValidColumn(input, id, reject) {
    const needColumns = [id + "_dept", id + "_id", id + "_avg", id + "_instructor",
        id + "_title", id + "_pass", id + "_fail", id + "_audit", id + "_uuid", id + "_year",
        id + "_fullname", id + "_shortname", "rooms_number", id + "_name", id + "_address", id + "_lat",
        id + "_lon", id + "_seats", id + "_type", id + "_furniture", id + "_href"];
    if (input["OPTIONS"]["COLUMNS"] === undefined) {
        reject(new IInsightFacade_1.InsightError("No COLUMNS"));
    }
    if (input["TRANSFORMATIONS"] && input["TRANSFORMATIONS"]["APPLY"]) {
        input["TRANSFORMATIONS"]["APPLY"].map((item) => {
            let str = Object.keys(item)[0];
            needColumns.push(str);
        });
    }
    let validColumn = input["OPTIONS"]["COLUMNS"].every((value) => {
        return needColumns.indexOf(value) > -1;
    });
    if (!validColumn) {
        reject(new IInsightFacade_1.InsightError("COLUMNS ERROR"));
    }
}
exports.isValidColumn = isValidColumn;
function calWhenEmpty(dataSet, input, res, resolve, reject) {
    dataSet.map((item) => {
        let temp = {};
        input["OPTIONS"]["COLUMNS"].map((key) => {
            temp[key] = item[key];
        });
        res.push(temp);
    });
    if (input["OPTIONS"]["ORDER"]) {
        (0, queryHelper_1.sortFunc)(res, input["OPTIONS"]["ORDER"]);
    }
    let tempRess = (0, generalHelper_1.tooLargeError)(res, resolve, reject, input["TRANSFORMATIONS"]);
    const resNoRepeat = [];
    tempRess.map((item) => {
        if ((!resNoRepeat.includes(item)) && (!(JSON.stringify(item) === "{}"))) {
            resNoRepeat.push(item);
        }
    });
    resolve(resNoRepeat);
}
exports.calWhenEmpty = calWhenEmpty;
function isStringValid(str) {
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
exports.isStringValid = isStringValid;
function minmaxCal(obj, applyarr) {
    for (let key in obj) {
        for (let apply of applyarr) {
            let temp = Object.values(apply)[0];
            if (Object.keys(temp)[0] === "MAX") {
                let max = 0;
                for (let item of obj[key]) {
                    if (item[Object.values(temp)[0]] > max) {
                        max = item[Object.values(temp)[0]];
                    }
                }
                obj[key][0][Object.keys(apply)[0]] = max;
            }
            if (Object.keys(temp)[0] === "MIN") {
                let min = 9999;
                for (let item of obj[key]) {
                    if (item[Object.values(temp)[0]] < min) {
                        min = item[Object.values(temp)[0]];
                    }
                }
                obj[key][0][Object.keys(apply)[0]] = min;
            }
        }
    }
}
exports.minmaxCal = minmaxCal;
function findIdFromList(allKeys) {
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
function findIdFromWHERE(query, allKeys) {
    let moreClauses = [];
    for (let key of query) {
        for (let innerKey of Object.keys(key)) {
            if (innerKey === "GT" || innerKey === "LT" || innerKey === "EQ" || innerKey === "IS") {
                allKeys.push(Object.keys(key[innerKey])[0]);
            }
            else {
                moreClauses.push(key[innerKey]);
            }
        }
    }
    if (moreClauses.length > 0) {
        findIdFromWHERE(moreClauses, allKeys);
    }
    return findIdFromList(allKeys);
}
function getDatasetId(query) {
    let hasColumn = false;
    let keys = [];
    let idFromColumn = "";
    let idFromWhere = "";
    for (let key of Object.keys(query)) {
        if (key === "WHERE") {
            if (JSON.stringify(query["WHERE"]) === "{}") {
                idFromWhere = "invalid";
            }
            else {
                for (let keyInsideWhere of Object.keys(query["WHERE"])) {
                    if (keyInsideWhere === "GT" || keyInsideWhere === "LT" ||
                        keyInsideWhere === "EQ" || keyInsideWhere === "IS") {
                        let clauses = [];
                        clauses.push(query["WHERE"]);
                        idFromWhere = findIdFromWHERE(clauses, keys);
                    }
                    else {
                        let clauses = [];
                        clauses.push(query["WHERE"][keyInsideWhere]);
                        idFromWhere = findIdFromWHERE(clauses, keys);
                    }
                }
            }
        }
        else if (key === "OPTIONS") {
            if (query["OPTIONS"]["COLUMNS"]) {
                hasColumn = true;
                if (JSON.stringify(query["OPTIONS"]["COLUMNS"]) === "{}") {
                    throw new IInsightFacade_1.InsightError("No valid column key exists");
                }
                idFromColumn = findIdFromList(Object.values(query["OPTIONS"]["COLUMNS"]));
            }
        }
    }
    if (!hasColumn) {
        throw new IInsightFacade_1.InsightError("Does not have column");
    }
    if (idFromWhere === "invalid") {
        return idFromColumn;
    }
    else if (idFromWhere === idFromColumn) {
        return idFromWhere;
    }
    else if (idFromColumn !== idFromWhere) {
        throw new IInsightFacade_1.InsightError("Column contains invalid key");
    }
    return idFromWhere;
}
exports.getDatasetId = getDatasetId;
function readFileList(dir) {
    try {
        let fileList = {
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
    }
    catch (e) {
        throw new IInsightFacade_1.InsightError(e);
    }
}
exports.readFileList = readFileList;
function getDatasetFromFolders(folderPath) {
    let pathList = [];
    let dataset = [];
    const files = fs.readdirSync(folderPath);
    files.forEach((item) => {
        let fullPath = path_1.default.join(folderPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            readFileList(folderPath);
        }
        else {
            pathList.push(fullPath);
        }
    });
    for (let dataPath of pathList) {
        dataset = dataset.concat(fs.readJsonSync(dataPath));
    }
    return dataset;
}
exports.getDatasetFromFolders = getDatasetFromFolders;
//# sourceMappingURL=queryHelper2.js.map