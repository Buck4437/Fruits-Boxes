Util = {
    isNumber(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    isInteger(str) {
        return Util.isNumber(str) && (parseInt(str) % 1 == 0)
    }
}
