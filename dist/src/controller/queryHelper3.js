"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.equar = exports.checkValue = void 0;
function checkValue(logicKey, key, id) {
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
exports.checkValue = checkValue;
function equar(columnKeys, groupKeys, applyKeys) {
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
        }
        else {
            isColumnKeyIncluded = true;
        }
    }
    return isColumnKeyIncluded;
}
exports.equar = equar;
//# sourceMappingURL=queryHelper3.js.map