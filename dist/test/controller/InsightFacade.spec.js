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
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const TestUtil_1 = require("../TestUtil");
const fs = __importStar(require("fs-extra"));
const assert_1 = require("assert");
const folder_test_1 = require("@ubccpsc310/folder-test");
const chai_1 = require("chai");
describe("InsightFacade", function () {
    let insightFacade;
    const persistDir = "./data";
    const datasetContents = new Map();
    let courses;
    let invalid;
    let noValidCourses;
    let simple;
    let rooms;
    let simpleRooms;
    let coursesWithRooms;
    const datasetsToLoad = {
        courses: "./test/resources/archives/courses.zip",
    };
    before(function () {
        courses = (0, TestUtil_1.getContentFromArchives)("courses.zip");
        invalid = (0, TestUtil_1.getContentFromArchives)("invalid.zip");
        noValidCourses = (0, TestUtil_1.getContentFromArchives)("no_valid_courses.zip");
        simple = (0, TestUtil_1.getContentFromArchives)("one_valid_course.zip");
        rooms = (0, TestUtil_1.getContentFromArchives)("rooms.zip");
        simpleRooms = (0, TestUtil_1.getContentFromArchives)("simpleRoom.zip");
        coursesWithRooms = (0, TestUtil_1.getContentFromArchives)("coursesWithRooms.zip");
        for (const key of Object.keys(datasetsToLoad)) {
            const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
            datasetContents.set(key, content);
        }
    });
    describe("Add/Remove/List Dataset", function () {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
            (0, TestUtil_1.clearDisk)();
        });
        beforeEach(function () {
            console.info(`BeforeTest: ${this.currentTest?.title}`);
            insightFacade = new InsightFacade_1.default();
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
        });
        afterEach(function () {
            console.info(`AfterTest: ${this.currentTest?.title}`);
            fs.removeSync(persistDir);
        });
        it("Should add a valid dataset", function () {
            const id = "courses";
            const content = datasetContents.get("courses") ?? "";
            const expected = [id];
            return insightFacade.addDataset(id, content, IInsightFacade_1.InsightDatasetKind.Courses).then((result) => {
                (0, chai_1.expect)(result).to.deep.equal(expected);
            });
        });
    });
    describe("PerformQuery", () => {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
            (0, TestUtil_1.clearDisk)();
            insightFacade = new InsightFacade_1.default();
            const loadDatasetPromises = [
                insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", IInsightFacade_1.InsightDatasetKind.Courses),
                insightFacade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms)
            ];
            return Promise.all(loadDatasetPromises);
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
            fs.removeSync(persistDir);
        });
        function assertResult(actual, expected) {
            (0, chai_1.expect)(actual.length).to.equal(expected.length);
        }
        function assertError(actual, expected) {
            if (expected === "InsightError") {
                (0, chai_1.expect)(actual).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            else {
                (0, chai_1.expect)(actual).to.be.an.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
        }
        (0, folder_test_1.folderTest)("perform Query tests", (input) => insightFacade.performQuery(input), "./test/resources/queries", {
            assertOnResult: assertResult,
            assertOnError: assertError,
        });
    });
    describe("addDataset", function () {
        let facade;
        beforeEach(function () {
            facade = new InsightFacade_1.default();
            (0, TestUtil_1.clearDisk)();
        });
        it("ADD should reject with invalid id", async function () {
            try {
                await facade.addDataset("", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                chai_1.expect.fail("did not reject on white space");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                await facade.addDataset("_", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                chai_1.expect.fail("did not reject on underscore");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                await facade.addDataset(" ", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                chai_1.expect.fail("did not reject on all white space");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                await facade.addDataset("", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                chai_1.expect.fail("did not reject on white space");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                await facade.addDataset("_", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                chai_1.expect.fail("did not reject on underscore");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                await facade.addDataset(" ", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                chai_1.expect.fail("did not reject on all white space");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("ADD should reject on existed id", async function () {
            try {
                await facade.addDataset("course0", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                await facade.addDataset("course0", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                chai_1.expect.fail("did not reject on existed id");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
                let result = await facade.listDatasets();
                (0, chai_1.expect)(result).length(1);
            }
            try {
                await facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                await facade.addDataset("courses", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                (0, assert_1.fail)("did not reject on existed id");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
                let result = await facade.listDatasets();
                (0, chai_1.expect)(result).length(2);
            }
        });
        it("Cannot add a file because it does not have a valid course", async function () {
            try {
                await facade.addDataset("invalidCourse", noValidCourses, IInsightFacade_1.InsightDatasetKind.Courses);
                chai_1.expect.fail("did not reject on invalid file");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should add a simple dataset", async function () {
            let result;
            try {
                result = await facade.addDataset("simple", simple, IInsightFacade_1.InsightDatasetKind.Courses);
                (0, chai_1.expect)(result).be.an.instanceof(Array);
                (0, chai_1.expect)(result).length(1);
                let expected = ["simple"];
                (0, chai_1.expect)(result).deep.equal(expected);
            }
            catch (err) {
                (0, assert_1.fail)("should not catch an error");
            }
        });
        it("should add a dataset", async function () {
            let result;
            try {
                result = await facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                (0, chai_1.expect)(result).be.an.instanceof(Array);
                (0, chai_1.expect)(result).length(1);
                let expected = ["courses"];
                (0, chai_1.expect)(result).deep.equal(expected);
            }
            catch (err) {
                (0, assert_1.fail)("should not catch an error");
            }
            try {
                result = await facade.addDataset("a b c", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                (0, chai_1.expect)(result).be.an.instanceof(Array);
                (0, chai_1.expect)(result).length(2);
                let expected = ["a b c", "courses"];
                (0, chai_1.expect)(result).deep.equal(expected);
            }
            catch (err) {
                console.log(err);
                (0, assert_1.fail)("should not catch an error");
            }
        });
        it("should add a dataset of KIND room", async function () {
            let result;
            try {
                result = await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                (0, chai_1.expect)(result).be.an.instanceof(Array);
                (0, chai_1.expect)(result).length(1);
                const expected = ["rooms"];
                (0, chai_1.expect)(result).deep.equal(expected);
            }
            catch (err) {
                (0, assert_1.fail)("should not catch an error");
            }
        });
        it("should add two kind of dataset at the same time", async function () {
            let result;
            try {
                await facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                result = await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                (0, chai_1.expect)(result).be.an.instanceof(Array);
                (0, chai_1.expect)(result).length(2);
                const expected = ["courses", "rooms"];
                (0, chai_1.expect)(result).deep.equal(expected);
            }
            catch (err) {
                (0, assert_1.fail)("should not catch an error");
            }
        });
    });
    describe("removeDataset", function () {
        let facade;
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
            (0, TestUtil_1.clearDisk)();
            await facade.addDataset("courses0", courses, IInsightFacade_1.InsightDatasetKind.Courses);
            await facade.addDataset("rooms0", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
        });
        it("REMOVE should return an invalid id error", async function () {
            try {
                await facade.removeDataset("");
                chai_1.expect.fail("did not reject on whitespace id");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            try {
                await facade.removeDataset("_");
                chai_1.expect.fail("did not reject on underscore");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("REMOVE should return an NotFoundError", async function () {
            try {
                await facade.removeDataset("courses1");
                chai_1.expect.fail("did not reject on not found id");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.NotFoundError);
                (0, chai_1.expect)(err);
            }
        });
        it("should remove the dataset", async function () {
            let result;
            try {
                result = await facade.removeDataset("courses0");
                (0, chai_1.expect)(result).deep.equal("courses0");
            }
            catch {
                (0, assert_1.fail)("should not catch an error");
            }
            try {
                result = await facade.removeDataset("rooms0");
                (0, chai_1.expect)(result).deep.equal("rooms0");
            }
            catch (err) {
                (0, assert_1.fail)("should not catch an error");
            }
        });
        it("should remove multiple datasets", async function () {
            let result;
            try {
                await facade.addDataset("courses1", courses, IInsightFacade_1.InsightDatasetKind.Courses);
                result = await facade.removeDataset("courses0");
                (0, chai_1.expect)(result).equal("courses0");
                result = await facade.removeDataset("courses1");
                (0, chai_1.expect)(result).equal("courses1");
                result = await facade.removeDataset("rooms0");
                (0, chai_1.expect)(result).equal("rooms0");
            }
            catch (err) {
                (0, assert_1.fail)("should not catch an error");
            }
        });
    });
    describe("listDatasets", function () {
        let facade;
        beforeEach(function () {
            facade = new InsightFacade_1.default();
            (0, TestUtil_1.clearDisk)();
        });
        it("should list no datasets", async function () {
            return facade.listDatasets().then((insightDatasets) => {
                (0, chai_1.expect)(insightDatasets).to.deep.equal([]);
                (0, chai_1.expect)(insightDatasets).to.be.an.instanceof(Array);
                (0, chai_1.expect)(insightDatasets).to.have.length(0);
            });
        });
        it("should list one dataset of KIND.COURSES", function () {
            return facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses)
                .then((addedIds) => facade.listDatasets())
                .then((insightDatasets) => {
                (0, chai_1.expect)(insightDatasets).to.deep.equal([{
                        id: "courses",
                        kind: IInsightFacade_1.InsightDatasetKind.Courses,
                        numRows: 64612,
                    }]);
                (0, chai_1.expect)(insightDatasets).to.be.an.instanceof(Array);
                (0, chai_1.expect)(insightDatasets).to.have.length(1);
            });
        });
        it("should list one dataset of KIND.Rooms", function () {
            return facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms)
                .then((addedIds) => facade.listDatasets())
                .then((insightDatasets) => {
                (0, chai_1.expect)(insightDatasets).to.deep.equal([{
                        id: "rooms",
                        kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                        numRows: 364,
                    }]);
                (0, chai_1.expect)(insightDatasets).to.be.an.instanceof(Array);
                (0, chai_1.expect)(insightDatasets).to.have.length(1);
            });
        });
        it("should list multiple datasets", function () {
            return facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses)
                .then(() => {
                return facade.addDataset("courses-2", courses, IInsightFacade_1.InsightDatasetKind.Courses);
            })
                .then(() => {
                return facade.listDatasets();
            })
                .then((insightDatasets) => {
                const expectedDatasets = [
                    {
                        id: "courses",
                        kind: IInsightFacade_1.InsightDatasetKind.Courses,
                        numRows: 64612,
                    },
                    {
                        id: "courses-2",
                        kind: IInsightFacade_1.InsightDatasetKind.Courses,
                        numRows: 64612,
                    }
                ];
                (0, chai_1.expect)(insightDatasets).to.be.an.instanceof(Array);
                (0, chai_1.expect)(insightDatasets).to.have.length(2);
                (0, chai_1.expect)(insightDatasets).to.deep.equal(expectedDatasets);
            });
        });
        it("should list multiple datasets of different kinds", function () {
            return facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses)
                .then(() => {
                return facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            })
                .then(() => {
                return facade.listDatasets();
            })
                .then((insightDatasets) => {
                const expectedDatasets = [
                    {
                        id: "courses",
                        kind: IInsightFacade_1.InsightDatasetKind.Courses,
                        numRows: 64612,
                    },
                    {
                        id: "rooms",
                        kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                        numRows: 364,
                    }
                ];
                (0, chai_1.expect)(insightDatasets).to.be.an.instanceof(Array);
                (0, chai_1.expect)(insightDatasets).to.have.length(2);
                (0, chai_1.expect)(insightDatasets).to.deep.equal(expectedDatasets);
            });
        });
    });
    describe("Dataset validity", function () {
        let facade;
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
            (0, TestUtil_1.clearDisk)();
        });
        it("should not add invalid file", async function () {
            try {
                await facade.addDataset("invalid", invalid, IInsightFacade_1.InsightDatasetKind.Courses);
                (0, assert_1.fail)("did not catch any error");
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an.instanceof(IInsightFacade_1.InsightError);
                (0, chai_1.expect)(err);
            }
        });
    });
    describe("Add rooms", function () {
        let facade;
        beforeEach(async function () {
            facade = new InsightFacade_1.default();
            (0, TestUtil_1.clearDisk)();
        });
        it("should not add invalid file", async function () {
            try {
                await facade.addDataset("invalid", invalid, IInsightFacade_1.InsightDatasetKind.Courses);
                (0, assert_1.fail)("did not catch any error");
            }
            catch (err) {
                (0, chai_1.expect)(err);
            }
        });
        it("should add a valid file", async function () {
            try {
                await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            }
            catch (err) {
                (0, assert_1.fail)("catched error");
            }
        });
    });
    describe("Dynamic folder test", function () {
        let facade;
        before(async function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
            await facade.addDataset("abc", courses, IInsightFacade_1.InsightDatasetKind.Courses);
            await facade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses);
            await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
        });
        function assertResult(actual, expected) {
            fs.writeFileSync("./actual.json", JSON.stringify(actual));
            fs.writeFileSync("./expected.json", JSON.stringify(expected));
            (0, chai_1.expect)(actual.length).to.equal(expected.length);
        }
        function assertError(actual, expected) {
            if (expected === "InsightError") {
                (0, chai_1.expect)(actual).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            else {
                (0, chai_1.expect)(actual).to.be.an.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
        }
        (0, folder_test_1.folderTest)("perform Query tests", (input) => facade.performQuery(input), "./test/resources/json", {
            assertOnResult: assertResult,
            assertOnError: assertError,
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map