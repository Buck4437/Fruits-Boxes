Util = {
    isNumber(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    isInteger(str) {
        return Util.isNumber(str) && (parseInt(str) % 1 == 0)
    },
    limit(min, num, max) {
        return Math.max(Math.min(num, max), min)
    }
}
