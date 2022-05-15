"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInfo = exports.findTable = exports.findPath = exports.findTBody = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const findInfoHelper_1 = require("./findInfoHelper");
function findTable(root, value) {
    for (const node of root.childNodes) {
        if (node.nodeName === "html") {
            for (const body of node.childNodes) {
                if (body.nodeName === "body") {
                    return findTableHelper(body, value);
                }
            }
            return new IInsightFacade_1.InsightError("cannot find body");
        }
    }
    return new IInsightFacade_1.InsightError("cannot find html");
}
exports.findTable = findTable;
function findTableHelper(root, value) {
    let table = "";
    for (const node of root.childNodes) {
        if (node.nodeName === "table") {
            if (node.attrs[0].value === value) {
                return table = node;
            }
        }
    }
    for (const node of root.childNodes) {
        if (!(node.nodeName === "#text" || node.nodeName === "#comment")) {
            table = findTableHelper(node, value);
            if ((table !== "")) {
                return table;
            }
        }
    }
    return table;
}
function findTBody(root) {
    for (const node of root.childNodes) {
        if (node.nodeName === "tbody") {
            return node;
        }
    }
    return new IInsightFacade_1.InsightError("cannot find tbody");
}
exports.findTBody = findTBody;
function findPath(root) {
    let href = {
        path: [],
        shortName: []
    };
    for (const node of root.childNodes) {
        if (node.nodeName === "tr") {
            for (const tr of node.childNodes) {
                if (tr.nodeName === "td") {
                    for (const td of tr.childNodes) {
                        if (td.nodeName === "a") {
                            let value = td.attrs[0].value;
                            if (!href.path.includes(value)) {
                                href.path = href.path.concat(value);
                            }
                            for (const tr2 of node.childNodes) {
                                if (tr2.nodeName === "td") {
                                    if (tr2.attrs[0].value === "views-field views-field-field-building-code") {
                                        for (const td2 of tr2.childNodes) {
                                            if (td2.nodeName === "#text") {
                                                let value2 = td2.value;
                                                let shortName = value2.substring(13, value2.length - 10);
                                                if (!href.shortName.includes(shortName)) {
                                                    href.shortName =
                                                        href.shortName.concat(shortName);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return href;
}
exports.findPath = findPath;
function initiateNameAndAddress(obj, nameAndAddress) {
    for (const html of obj.childNodes) {
        if (html.nodeName === "html") {
            for (const body of html.childNodes) {
                if (body.nodeName === "body") {
                    nameAndAddress.rooms_fullname = (0, findInfoHelper_1.findRoomsFullName)(body);
                    nameAndAddress.rooms_address = findAddress(body);
                }
            }
        }
    }
}
function findInfo(obj, shortName, numRooms) {
    let datasetInfo = {
        numRooms: 0,
        content: [],
    };
    let nameAndAddress = {
        rooms_fullname: "",
        rooms_shortname: "",
        rooms_address: "",
        rooms_lat: 0,
        rooms_lon: 0
    };
    let geoLocation;
    let allInfo = [];
    initiateNameAndAddress(obj, nameAndAddress);
    let others = findOthers(obj);
    geoLocation = findGeoLocation(nameAndAddress.rooms_address);
    return geoLocation.then((res) => {
        let latAndLon = JSON.parse(res);
        if (others !== undefined) {
            for (let i = 0; i < others.rooms_number.length; i++) {
                numRooms++;
                let info = {
                    rooms_fullname: nameAndAddress.rooms_fullname,
                    rooms_shortname: shortName,
                    rooms_address: nameAndAddress.rooms_address,
                    rooms_number: others.rooms_number[i],
                    rooms_name: shortName + "_" + others.rooms_number[i],
                    rooms_lat: latAndLon.lat,
                    rooms_lon: latAndLon.lon,
                    rooms_seats: 0,
                    rooms_type: others.rooms_type[i],
                    rooms_furniture: others.rooms_furniture[i],
                    rooms_href: others.rooms_href[i]
                };
                if (others.rooms_seats[i] !== "") {
                    info.rooms_seats = +others.rooms_seats[i];
                }
                allInfo = allInfo.concat(info);
            }
        }
        datasetInfo.numRooms = numRooms;
        datasetInfo.content = allInfo;
        return datasetInfo;
    }).catch((err) => {
        return err;
    });
}
exports.findInfo = findInfo;
function findGeoLocation(address) {
    let http = require("http");
    let url = (0, findInfoHelper_1.constructURL)(address);
    return new Promise((resolve, reject) => {
        let req = http.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const buff = Buffer.from(JSON.stringify(data));
                    let geo = JSON.parse(buff.toString());
                    if (geo !== null && typeof geo !== "undefined") {
                        return resolve(geo);
                    }
                    else {
                        throw new IInsightFacade_1.InsightError("the file is invalid");
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
        req.end();
    });
}
function findAddress(root) {
    let address = "";
    for (const node of root.childNodes) {
        if (node.nodeName === "div") {
            if (node.attrs[0].value === "buildings-wrapper") {
                for (const binfo of node.childNodes) {
                    if (binfo.nodeName === "div") {
                        if (binfo.attrs[0].value === "building-info") {
                            for (const next of binfo.childNodes) {
                                if (next.nodeName === "div") {
                                    if (next.attrs[0].value === "building-field") {
                                        for (const next2 of next.childNodes) {
                                            if (next2.attrs[0].value === "field-content") {
                                                address = next2.childNodes[0].value;
                                                return address;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    for (const node of root.childNodes) {
        if (!(node.nodeName === "#text" || node.nodeName === "#comment")) {
            address = findAddress(node);
            if (address !== "") {
                return address;
            }
        }
    }
    return address;
}
function findOthers(root) {
    let info = {
        rooms_number: [],
        rooms_seats: [],
        rooms_furniture: [],
        rooms_type: [],
        rooms_href: []
    };
    let table = findTable(root, "views-table cols-5 table");
    if (table === "") {
        return;
    }
    else {
        let tbody = findTBody(table);
        for (const node of tbody.childNodes) {
            if (node.nodeName === "tr") {
                for (const next of node.childNodes) {
                    if (next.nodeName === "td") {
                        if (next.attrs[0].value === "views-field views-field-field-room-number") {
                            info.rooms_number = info.rooms_number.concat(next.childNodes[1].childNodes[0].value);
                        }
                        else if (next.attrs[0].value === "views-field views-field-field-room-capacity") {
                            let seat = next.childNodes[0].value;
                            info.rooms_seats = info.rooms_seats.concat(seat.substring(13, seat.length - 10));
                        }
                        else if (next.attrs[0].value === "views-field views-field-field-room-furniture") {
                            let value = next.childNodes[0].value;
                            info.rooms_furniture = info.rooms_furniture.concat(value.substring(13, value.length - 10));
                        }
                        else if (next.attrs[0].value === "views-field views-field-field-room-type") {
                            let value = next.childNodes[0].value;
                            info.rooms_type = info.rooms_type.concat(value.substring(13, value.length - 10));
                        }
                        else if (next.attrs[0].value === "views-field views-field-nothing") {
                            info.rooms_href = info.rooms_href.concat(next.childNodes[1].attrs[0].value);
                        }
                    }
                }
            }
        }
        return info;
    }
}
//# sourceMappingURL=addDatasetHelper.js.map