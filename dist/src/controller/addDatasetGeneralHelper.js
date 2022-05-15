"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.check_id = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const fs_1 = __importDefault(require("fs"));
function check_id(id, datasetContents) {
    if (id === "") {
        throw new IInsightFacade_1.InsightError("The given id is a whitespace.");
    }
    else if (id.includes("_")) {
        throw new IInsightFacade_1.InsightError("The given id contains underscore.");
    }
    else if (fs_1.default.existsSync("./data/" + id)) {
        throw new IInsightFacade_1.InsightError("The given id exists in current file.");
    }
    let allWhiteSpace = true;
    for (const letter of id) {
        if (letter !== " ") {
            allWhiteSpace = false;
        }
    }
    if (allWhiteSpace) {
        throw new IInsightFacade_1.InsightError("The given id is all whitespace");
    }
}
exports.check_id = check_id;
//# sourceMappingURL=addDatasetGeneralHelper.js.map