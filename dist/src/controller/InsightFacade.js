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
const IInsightFacade_1 = require("./IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const generalHelper_1 = require("./generalHelper");
const addDatasetHelper_1 = require("./addDatasetHelper");
const addDatasetGeneralHelper_1 = require("./addDatasetGeneralHelper");
const queryHelper_1 = require("./queryHelper");
const fs = __importStar(require("fs-extra"));
const queryHelper2_1 = require("./queryHelper2");
class InsightFacade {
    constructor() {
        console.log("InsightFacadeImpl::init()");
        this.datasetContents = new Map();
    }
    addDataset(id, content, kind) {
        (0, addDatasetGeneralHelper_1.check_id)(id, this.datasetContents);
        if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
            return this.addCourses(content, id, kind);
        }
        else {
            return this.addRooms(content, id, kind);
        }
    }
    addRooms(content, id, kind) {
        let { zip, result, roomFile, nameSet, numRooms, parser } = this.initiate();
        return new Promise((resolve, reject) => {
            zip.loadAsync(content, { base64: true })
                .then(() => {
                return zip.file("rooms/index.htm")?.async("text");
            }).then((jsonFIle) => {
                (0, generalHelper_1.makeDir)("./data");
                (0, generalHelper_1.makeDir)("./data/" + id);
                let pathAndName = this.findPathAndName(jsonFIle);
                let pathSet = pathAndName.path;
                nameSet = pathAndName.shortName;
                const promises = [];
                for (const buildingPath of pathSet) {
                    promises.push(zip.file("rooms"
                        + buildingPath.substring(1, buildingPath.length))?.async("string"));
                }
                return Promise.all(promises);
            }).then((htmlFiles) => {
                const promises = [];
                for (let i = 0; i < htmlFiles.length; i++) {
                    let obj = parser.parse(htmlFiles[i]);
                    promises.push((0, addDatasetHelper_1.findInfo)(obj, nameSet[i], numRooms));
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
                    roomFile.info = { id: id, kind: kind, numRows: numRooms };
                    fs.writeJsonSync("./data/" + id + "/info.json", roomFile.info);
                    fs.readdirSync("./data").forEach((file) => {
                        result.push(file);
                    });
                    return resolve(result);
                }
                else {
                    throw new IInsightFacade_1.InsightError("The zip file is invalid");
                }
            }).catch((error) => {
                return reject(new IInsightFacade_1.InsightError(error));
            });
        });
    }
    initiate() {
        let zip = new jszip_1.default();
        let result = [];
        let roomFile = {
            info: {},
            content: []
        };
        let nameSet = [];
        let numRooms = 0;
        let parser = require("parse5");
        return { zip, result, roomFile, nameSet, numRooms, parser };
    }
    findPathAndName(jsonFIle) {
        let parser = require("parse5");
        let index = parser.parse(jsonFIle);
        let table = (0, addDatasetHelper_1.findTable)(index, "views-table cols-5 table");
        let tbody = (0, addDatasetHelper_1.findTBody)(table);
        return (0, addDatasetHelper_1.findPath)(tbody);
    }
    addCourses(content, id, kind) {
        let zip = new jszip_1.default();
        let result = [];
        let validity = false;
        let numRows = 0;
        let input = {
            info: {},
            content: []
        };
        let oneFile = {
            content: [{}]
        };
        let fileNum = 0;
        return new Promise((resolve, reject) => {
            zip.loadAsync(content, { base64: true })
                .then(() => {
                const promises = [];
                zip.folder("courses")?.forEach((relativePath, file) => {
                    promises.push(file.async("binarystring"));
                });
                return Promise.all(promises);
            }).then((jsonFiles) => {
                (0, generalHelper_1.makeDir)("./data");
                (0, generalHelper_1.makeDir)("./data/" + id);
                const ret = (0, generalHelper_1.loadDataFromEachFile)(jsonFiles, id, input, fileNum, oneFile, numRows, validity);
                fileNum = ret.fileNum;
                numRows = ret.numRows;
                validity = ret.validity;
            }).then(() => {
                if (validity) {
                    input.info = { id: id, kind: kind, numRows: numRows };
                    fs.writeJsonSync("./data/" + id + "/info.json", input.info);
                    fs.readdirSync("./data").forEach((file) => {
                        result.push(file);
                    });
                    return resolve(result);
                }
                else {
                    throw new IInsightFacade_1.InsightError("The zip file is invalid");
                }
            }).catch((error) => {
                console.log(error);
                return reject(new IInsightFacade_1.InsightError(error));
            });
        });
    }
    removeDataset(id) {
        let allWhiteSpace = true;
        for (const letter of id) {
            if (letter !== " ") {
                allWhiteSpace = false;
            }
        }
        if (allWhiteSpace) {
            throw new IInsightFacade_1.InsightError("The given id is all white space");
        }
        if (id === "") {
            throw new IInsightFacade_1.InsightError("The given id is a whitespace.");
        }
        else if (id.includes("_")) {
            throw new IInsightFacade_1.InsightError("The given id contains underscore.");
        }
        else if (!fs.existsSync("./data/" + id)) {
            throw new IInsightFacade_1.NotFoundError("Cannot find the given id");
        }
        return new Promise((resolve, reject) => {
            try {
                fs.removeSync("./data/" + id);
                return resolve(id);
            }
            catch (e) {
                return reject(new IInsightFacade_1.InsightError(e));
            }
        });
    }
    listDatasets() {
        return new Promise((resolve, reject) => {
            let result;
            result = [];
            try {
                fs.readdirSync("./data").forEach((file) => {
                    let content = fs.readFileSync("./data/" + file + "/info.json", "utf8");
                    let obj = JSON.parse(content);
                    let dataset = {
                        id: obj.id,
                        kind: obj.kind,
                        numRows: obj.numRows
                    };
                    result = result.concat(dataset);
                });
                return resolve(result);
            }
            catch (e) {
                return resolve(result);
            }
        });
    }
    performQuery(query) {
        let input = query;
        return new Promise((resolve, reject) => {
            let res = [];
            let id = (0, generalHelper_1.isInputLogicVaild)(query, reject);
            let dataSet = (0, generalHelper_1.getDateSet)(id);
            let kind = "";
            try {
                let info = fs.readJsonSync("./data/" + id + "/info.json");
                kind = info.kind;
            }
            catch (e) {
                throw new IInsightFacade_1.InsightError("Cannot find the required dataset");
            }
            const isEmpty = (JSON.stringify(input["WHERE"]) === "{}");
            let tempRes;
            if (isEmpty) {
                (0, queryHelper2_1.calWhenEmpty)(dataSet, input, res, resolve, reject);
            }
            else {
                tempRes = (0, generalHelper_1.calWhere)(dataSet, input["WHERE"], id, kind);
                let tempRess = (0, generalHelper_1.tooLargeError)(tempRes, resolve, reject, input["TRANSFORMATIONS"]);
                tempRess.map((item) => {
                    let temp = {};
                    input["OPTIONS"]["COLUMNS"].map((key) => {
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
                    reject(new IInsightFacade_1.ResultTooLargeError("result data is too large!!!"));
                    return [];
                }
                if (input["OPTIONS"]["ORDER"]) {
                    (0, queryHelper_1.sortFunc)(res, input["OPTIONS"]["ORDER"]);
                }
                resolve(res);
            }
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map