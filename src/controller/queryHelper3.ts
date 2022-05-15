function checkValue(logicKey: string, key: any, id: string): boolean {
	let numberValue = [id + "_avg", id + "_pass", id + "_fail", id + "_audit", id + "_year",
		id + "_lat", id + "_lon", id + "_seats"];
	switch (logicKey) {
		case "GT":
			return numberValue.includes(key);
		case "LT":
			return numberValue.includes(key);
		case "EQ":
			return numberValue.includes(key);
		case "MAX":
			return numberValue.includes(key);
		case "AVG":
			return numberValue.includes(key);
		case "MIN":
			return numberValue.includes(key);
		case "SUM":
			return numberValue.includes(key);
	}
	return true;
}

function equar(columnKeys: any[], groupKeys: any[], applyKeys: any[]) {
	let isColumnKeyIncluded = false;

	for (let columnKey of columnKeys) {
		if (!groupKeys.includes(columnKey)) {
			isColumnKeyIncluded = false;
			let isColumnKeyInApply = false;
			for (let applyKey of applyKeys) {
				if (applyKey[columnKey]) {
					isColumnKeyInApply = true;
				}
			}
			isColumnKeyIncluded = isColumnKeyInApply;
			if (!isColumnKeyIncluded) {
				return isColumnKeyIncluded;
			}
		} else {
			isColumnKeyIncluded = true;
		}
	}
	return isColumnKeyIncluded;
}

export {checkValue, equar};
