function constructURL(address: string): string {
	let parsedAddress = "";
	let indexPointer = 0;
	for (let i = 0; i < address.length; i++) {
		if (address[i] === " ") {
			parsedAddress = parsedAddress.concat(address.substring(indexPointer, i));
			parsedAddress = parsedAddress.concat("%20");
			indexPointer = i + 1;
		}
	}
	parsedAddress = parsedAddress.concat(address.substring(indexPointer, address.length));
	return "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team672/" + parsedAddress;
}

function findRoomsFullName(root: any): string {
	let fullName: string = "";
	for (const node of root.childNodes) {
		if (node.nodeName === "div") {
			if (node.attrs[0].value === "buildings-wrapper") {
				for (const binfo of node.childNodes) {
					if (binfo.nodeName === "div") {
						if (binfo.attrs[0].value === "building-info") {
							for (const head of binfo.childNodes) {
								if (head.nodeName === "h2") {
									for (const span of head.childNodes) {
										if (span.nodeName === "span") {
											for (const name of span.childNodes) {
												if (name.nodeName === "#text") {
													fullName = name.value;
													return fullName;
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

	for (const node of root.childNodes) {
		if (!(node.nodeName === "#text" || node.nodeName === "#comment")) {
			fullName = findRoomsFullName(node);
			if (fullName !== "") {
				return fullName;
			}
		}
	}
	return fullName;
}
export{constructURL, findRoomsFullName};
