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
exports.getRawData = exports.clearDisk = exports.persisDir = exports.getContentFromArchives = void 0;
const fs = __importStar(require("fs-extra"));
let JSZip = require("jszip");
const zip = new JSZip();
const persisDir = "./data";
exports.persisDir = persisDir;
function getContentFromArchives(name) {
    return fs.readFileSync("test/resources/archives/" + name).toString("base64");
}
exports.getContentFromArchives = getContentFromArchives;
function getRawData(name) {
    return fs.readFileSync("test/resources/archives/" + name);
}
exports.getRawData = getRawData;
function clearDisk() {
    fs.removeSync(persisDir);
}
exports.clearDisk = clearDisk;
//# sourceMappingURL=TestUtil.js.map