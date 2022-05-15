function inspectACourse() {
	let table = document.getElementById("outputTable")
	if (table){
		table.parentNode.removeChild(table);
	}

	let courses_dept = document.getElementById("inputName").value;
	let courses_id = document.getElementById("inputNumber").value;
	if (courses_dept === null || courses_id === null
		|| typeof courses_dept === "undefined" || typeof courses_id === "undefined"
		|| courses_dept === "" || courses_id === "") {
		alert("Please enter a course name and a course number");
		return;
	}
	courses_dept = courses_dept.toLowerCase();
	let Query = '{"WHERE":{"AND": [{"IS":{"courses_dept":"' + courses_dept + '"}},{"IS":{"courses_id":"' + courses_id + '"}}]}, "OPTIONS":{"COLUMNS":["courses_dept","courses_id"';
	let keySet = [];
	keySet = keySet.concat(document.getElementById("courses_avg").checked ? "courses_avg" : false);
	keySet = keySet.concat(document.getElementById("courses_instructor").checked ? "courses_instructor" : false);
	keySet = keySet.concat(document.getElementById("courses_title").checked ? "courses_title" : false);
	keySet = keySet.concat(document.getElementById("courses_pass").checked ? "courses_pass" : false);
	keySet = keySet.concat(document.getElementById("courses_fail").checked ? "courses_fail" : false);
	keySet = keySet.concat(document.getElementById("courses_audit").checked ? "courses_audit" : false);
	keySet = keySet.concat(document.getElementById("courses_uuid").checked ? "courses_uuid" : false);
	keySet = keySet.concat(document.getElementById("courses_year").checked ? "courses_year" : false);
	let keys = [];
	for (let key of keySet) {
		if (key !== false) {
			keys = keys.concat(key);
		}
	}
	if (keys.length > 0) {
		for (let i = 0; i < keys.length; i++) {
			Query = Query.concat(',"' + keys[i] + '"');
		}
		Query = Query.concat(']}}');
		// alert(Query);
		let json = JSON.parse(Query);
		let myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");

		let raw = JSON.stringify(json);

		let requestOptions = {
			method: 'POST',
			headers: myHeaders,
			body: raw,
			redirect: 'follow'
		};

		fetch("http://localhost:4321/query", requestOptions)
			.then(response => response.text())
			.then(result => {
				let obj = JSON.parse(result);
				constructTable(keys, obj, "courses");
			})
			.catch(error => console.log('error', error));
	} else {
		alert("Please select at least one feature you would like to see!");
		return;
	}
}

function findRoom() {
	let table = document.getElementById("outputTable")
	if (table){
		table.parentNode.removeChild(table);
	}
	let bName = document.getElementById("bName").value;
	let rooms_type = document.getElementById("rooms_type").value;
	let rooms_furniture = document.getElementById("rooms_furniture").value;
	if (isEmpty(bName)) {
		alert("Please enter a building name");
		return;
	}
	if (isEmpty(rooms_type)) {
		alert("ERROR: cannot read rooms type");
	}
	if (isEmpty(rooms_furniture)) {
		alert("ERROR: cannot read rooms furniture");
	}
	if (rooms_furniture === "any") {
		rooms_furniture = "*";
	}
	if (rooms_type === "any") {
		rooms_type = "*";
	}
	let Query;
	if (checkUpperCase(bName)) {
		Query = '{"WHERE":{"AND": [{"IS":{"rooms_shortname":"' + bName + '"}},{"IS":{"rooms_type":"' + rooms_type + '"}},{"IS":{"rooms_furniture":"' + rooms_furniture + '"}}]}, "OPTIONS":{"COLUMNS":["rooms_shortname","rooms_number", "rooms_type", "rooms_furniture"]}}';
	} else {
		Query = '{"WHERE":{"AND": [{"IS":{"rooms_fullname":"' + bName + '"}},{"IS":{"rooms_type":"' + rooms_type + '"}},{"IS":{"rooms_furniture":"' + rooms_furniture + '"}}]}, "OPTIONS":{"COLUMNS":["rooms_shortname","rooms_number", "rooms_type", "rooms_furniture"]}}';
	}
	// alert(Query);
	let json = JSON.parse(Query);

	let myHeaders = new Headers();
	myHeaders.append("Content-Type", "application/json");

	let raw = JSON.stringify(json);

	let requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: raw,
		redirect: 'follow'
	};

	fetch("http://localhost:4321/query", requestOptions)
		.then(response => response.text())
		.then(result => {
			let obj = JSON.parse(result);
			let keys = [];
			constructTable(keys, obj, "rooms");
		})
		.catch(error => console.log('error', error));

}

function isEmpty(value) {
	if (value === null || typeof value === "undefined" || value === "") {
		return true;
	}
}

function checkUpperCase(str) {
	return str.toUpperCase() === str;
}

function constructTable(keys, obj, kind) {
	let table = document.createElement("table");
	table.setAttribute("id", "outputTable");
	let thead = document.createElement("thead");
	let tbody = document.createElement("tbody");

	table.appendChild(thead);
	table.appendChild(tbody);

	// document.getElementById("leftdiv").appendChild(table);

	let totalHeading;
	if (kind === "courses") {
		totalHeading = ["courses_dept", "courses_id"];
		for (let i = 0; i <= 3; i++) {
			let br = document.createElement("br");
			document.getElementById("leftdiv").appendChild(br);
		}
		document.getElementById("leftdiv").appendChild(table);
	} else {
		totalHeading = ["rooms_shortname", "rooms_number", "rooms_type", "rooms_furniture"];
		document.getElementById("rightdiv").appendChild(table);
	}

	totalHeading = totalHeading.concat(keys);
	let row1 = document.createElement("tr");
	for (let i = 0; i < totalHeading.length; i++) {
		let heading = document.createElement("th");
		heading.innerHTML = convertKey(totalHeading[i]);
		row1.appendChild(heading);
	}
	thead.appendChild(row1);

	for (let i = 0; i < obj.result.length; i++) {
		let row = document.createElement("tr")
		for (let j = 0; j < totalHeading.length; j++) {
			let cell = document.createElement("td");
			let attribute = totalHeading[j];
			cell.innerHTML = obj.result[i][attribute];
			row.appendChild(cell);
		}
		tbody.appendChild(row);
	}
}

function convertKey(key) {
	switch (key){
		case "courses_dept":
			return "Course Department";
		case "courses_id":
			return "Course Number";
		case "courses_avg":
			return "Course Average";
		case "courses_instructor":
			return "Course Instructor";
		case "courses_title":
			return "Course Title";
		case "courses_pass":
			return "Number of Pass";
		case "courses_fail":
			return "Number of Fail";
		case "courses_audit":
			return "Number of Audit";
		case "courses_uuid":
			return "Course Unique ID";
		case "courses_year":
			return "Course Year";
		case "rooms_shortname":
			return "Building Name";
		case "rooms_number":
			return "Room Number";
		case "rooms_type":
			return "Room Type";
		case "rooms_furniture":
			return "Room Furniture";
		default:
			return key;
	}
}


function list() {
	let requestOptions = {
		method: 'GET',
		redirect: 'follow'
	};

	fetch("http://localhost:4321/datasets", requestOptions)
		.then(response => response.text())
		.then(result => alert(result))
		.catch(error => alert(error));

}
