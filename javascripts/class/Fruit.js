class Fruit {
    constructor(value, src, type) {
        this.$value = value;
        this.src = src;
        this.type = type;
        this.$deleted = false;
    }

    isDeleted() {
        return this.$deleted;
    }

    getValue() {
        return this.deleted ? 0 : this.$value;
    }

    delete() {
        this.$deleted = true;
    }
}