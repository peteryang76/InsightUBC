"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
class Server {
    constructor(port) {
        console.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.registerMiddleware();
        this.registerRoutes();
        this.facade = new InsightFacade_1.default();
        this.express.use(express_1.default.static("./frontend/public"));
    }
    start() {
        return new Promise((resolve, reject) => {
            console.info("Server::start() - start");
            if (this.server !== undefined) {
                console.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express.listen(this.port, () => {
                    console.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                }).on("error", (err) => {
                    console.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        console.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                console.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    console.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.put("/dataset/:id/:kind", Server.putDataset);
        this.express.delete("/dataset/:id", Server.dataset);
        this.express.get("/datasets", Server.list);
        this.express.post("/query", Server.query);
    }
    static putDataset(req, res) {
        try {
            console.log(`Server::put(..) - params: ${JSON.stringify(req.params)}`);
            let raw = req.body;
            let zip = Buffer.from(raw).toString("base64");
            const response = Server.performPUT(req.params.id, req.params.kind, zip);
            response.then((output) => {
                res.status(200).json({ result: output });
            }).catch((e) => {
                console.log(e);
                res.status(400).json({ error: e.message });
            });
        }
        catch (e) {
            console.log(e);
            res.status(400).json({ error: e.message });
        }
    }
    static async performPUT(id, kind, zip) {
        let facade = new InsightFacade_1.default();
        if (kind === "courses") {
            return await facade.addDataset(id, zip, IInsightFacade_1.InsightDatasetKind.Courses);
        }
        else if (kind === "rooms") {
            return await facade.addDataset(id, zip, IInsightFacade_1.InsightDatasetKind.Rooms);
        }
        else {
            return new IInsightFacade_1.InsightError("Invalid KIND");
        }
    }
    static dataset(req, res) {
        try {
            console.log(`Server::delete(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performDataset(req.params.id);
            response.then((output) => {
                res.status(200).json({ result: output });
            }).catch((e) => {
                if (e instanceof IInsightFacade_1.NotFoundError) {
                    console.log(e);
                    res.status(404).json({ error: e.message });
                }
                else {
                    console.log(e);
                    res.status(400).json({ error: e.message });
                }
            });
        }
        catch (e) {
            console.log(e);
            res.status(400).json({ error: e.message });
        }
    }
    static async performDataset(id) {
        let facade = new InsightFacade_1.default();
        return await facade.removeDataset(id);
    }
    static query(req, res) {
        try {
            let query = req.body;
            console.log(`Server::query(...) - paramscasda: ${JSON.stringify(req.params)}`);
            const response = Server.performQuery(query);
            response.then((output) => {
                res.status(200).json({ result: output });
            }).catch((e) => {
                console.log(e);
                res.status(400).json({ error: e.message });
            });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async performQuery(query) {
        let facade = new InsightFacade_1.default();
        return await facade.performQuery(query);
    }
    static list(req, res) {
        try {
            console.log(`Server::List(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performList();
            response.then((output) => {
                res.status(200).json({ result: output });
            }).catch((e) => {
                console.log(e);
            });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async performList() {
        let facade = new InsightFacade_1.default();
        return await facade.listDatasets();
    }
    static echo(req, res) {
        try {
            console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map