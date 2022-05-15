import {InsightError} from "./IInsightFacade";
import fs from "fs";

interface DataFile {
	info: object;
	content: object[];
}


function check_id(id: string, datasetContents: Map<string, string>) {
	if (id === "") {
		throw new InsightError("The given id is a whitespace.");
	} else if (id.includes("_")) {
		throw new InsightError("The given id contains underscore.");
	} else if (fs.existsSync("./data/" + id)) {
		throw new InsightError("The given id exists in current file.");
	}
	let allWhiteSpace = true;
	for (const letter of id) {
		if (letter !== " ") {
			allWhiteSpace = false;
		}
	}
	if (allWhiteSpace) {
		throw new InsightError("The given id is all whitespace");
	}
}

export {check_id, DataFile};
