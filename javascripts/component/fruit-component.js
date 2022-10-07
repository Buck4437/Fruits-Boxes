Vue.component("fruit-component", {
    props: {
        src: String,
        deleted: Boolean,
        box: Object,
        getState: Boolean
    },
    data() {
        return {
            avgPos: [0, 0]
        }
    },
    computed: {
        selected() {
            if (this.deleted) return false;

            const [start, end] = [this.box.start, this.box.end];
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
                return "img/selected_" + this.src;
            }
            return "img/" + this.src;
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
    `<div class="component fruit-component disable-select" :class="{'hidden': deleted}">
        <img :src="path" draggable="false">
        <div class="fruit-value">
            <slot>0</slot>
        </div>
    </div>`
})