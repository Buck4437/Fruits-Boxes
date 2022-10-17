Vue.component("fruit-component", {
    props: {
        fruit: Fruit,
        selectBoxPos: Object,
        getState: Boolean
    },
    data() {
        return {
            avgPos: [0, 0]
        }
    },
    computed: {
        selected() {
            if (this.fruit.isDeleted()) return false;

            const [start, end] = [this.selectBoxPos.start, this.selectBoxPos.end];
            if (start[0] == end[0] && start[1] == end[1]) {
                return false
            }
            const [scrollX, scrollY] = [window.scrollX, window.scrollY]
            const [minX, minY] = [Math.min(start[0], end[0]) + scrollX, Math.min(start[1], end[1]) + scrollY]
            const [maxX, maxY] = [Math.max(start[0], end[0]) + scrollX, Math.max(start[1], end[1]) + scrollY]
            const [posX, posY] = this.avgPos;
            return minX <= posX && posX <= maxX && minY <= posY && posY <= maxY;
        },
        path() {
            if (this.selected) {
                return "img/selected_" + this.fruit.src;
            }
            return "img/" + this.fruit.src;
        }
    },
    watch: {
        selected() {
            this.$emit("change", this.selected)
        }
    },
    mounted() {
        const rect = this.$el.getBoundingClientRect();
        this.avgPos = [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2]
    },
    template:
    `<div class="component fruit-component disable-select" :class="{'hidden': fruit.isDeleted()}">
        <img :src="path" draggable="false">
        <div class="fruit-value">
            <slot>0</slot>
        </div>
    </div>`
})