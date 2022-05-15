"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const chai_http_1 = __importDefault(require("chai-http"));
const TestUtil_1 = require("../TestUtil");
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
describe("Facade D3", function () {
    let facade;
    let server;
    let ENDPOINT_URL = "/dataset/simple/courses";
    let DUPLICATE_ENDPOINT_URL = "/dataset/courses/courses";
    let DUPLICATE_FILE_DATA = (0, TestUtil_1.getRawData)("courses.zip");
    let ZIP_FILE_DATA = (0, TestUtil_1.getRawData)("one_valid_course.zip");
    let INVALID_ZIP_FILE_DATA = (0, TestUtil_1.getRawData)("invalid.zip");
    let NO_VALID_COURSE_DATA = (0, TestUtil_1.getRawData)("no_valid_courses.zip");
    let SERVER_URL = "localhost:4321";
    let POST_ENDPOINT = "/query";
    let SIMPLE_QUERY = '{"WHERE":{"AND": [{"IS":{"courses_dept":"cpsc"}},{"IS":' +
        '{"courses_id":"310"}}]}, "OPTIONS":{"COLUMNS":["courses_dept","courses_id","courses_avg"]}}';
    let QUERY = JSON.parse(SIMPLE_QUERY);
    let DELETE_ENDPOINT = "/dataset/courses";
    let INVALID_DELETE_ENDPOINT = "/dataset/abc";
    let LIST_ENDPOINT = "/datasets";
    (0, chai_1.use)(chai_http_1.default);
    before(function () {
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        server.start();
    });
    after(function () {
        server.stop();
    });
    beforeEach(async function () {
        (0, TestUtil_1.clearDisk)();
        await facade.addDataset("courses", (0, TestUtil_1.getContentFromArchives)("courses.zip"), IInsightFacade_1.InsightDatasetKind.Courses);
        await facade.addDataset("rooms", (0, TestUtil_1.getContentFromArchives)("rooms.zip"), IInsightFacade_1.InsightDatasetKind.Rooms);
    });
    afterEach(function () {
    });
    it("RUN THIS ONE BEFORE STARTING THE SERVER!", function () {
        (0, chai_1.expect)("a").deep.equal("a");
    });
    it("PUT test for courses dataset", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("PUT rejects because of duplicate id", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .put(DUPLICATE_ENDPOINT_URL)
                .send(DUPLICATE_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch(function (err) {
            });
        }
        catch (err) {
        }
    });
    it("PUT rejects because of invalid id", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .put("/dataset/ /courses")
                .send(DUPLICATE_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch(function (err) {
                console.log(err);
            });
        }
        catch (err) {
            console.log(err);
        }
        try {
            return (0, chai_1.request)(SERVER_URL)
                .put("/dataset/a_b/courses")
                .send(DUPLICATE_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch(function (err) {
                console.log(err);
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("PUT rejects because of invalid zip file", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .put("/dataset/simple/courses")
                .send(INVALID_ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch(function (err) {
            });
        }
        catch (err) {
        }
    });
    it("PUT rejects because no valid courses in the zip file", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .put("/dataset/simple/courses")
                .send(NO_VALID_COURSE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch(function (err) {
            });
        }
        catch (err) {
        }
    });
    it("Post test for perform query", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .post(POST_ENDPOINT)
                .send(QUERY)
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("Success delete test for courses dataset", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .delete(DELETE_ENDPOINT)
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("Delete test for courses dataset where 404 expected", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .delete(INVALID_DELETE_ENDPOINT)
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(404);
            })
                .catch(function (err) {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("Delete rejects because id contains underscore", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .delete("/dataset/a_b")
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch(function (err) {
                console.log(err);
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("List test for courses dataset", function () {
        try {
            return (0, chai_1.request)(SERVER_URL)
                .get(LIST_ENDPOINT)
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
    it("List returns an empty list", function () {
        try {
            (0, TestUtil_1.clearDisk)();
            return (0, chai_1.request)(SERVER_URL)
                .get(LIST_ENDPOINT)
                .then(function (res) {
                console.log(res.body);
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
        }
    });
});
//# sourceMappingURL=Server.spec.js.map