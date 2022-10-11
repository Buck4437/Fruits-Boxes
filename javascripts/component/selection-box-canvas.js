Vue.component("selection-box-canvas", {
    props: {
        mousePos: Object,
        status: {
            validator: function (value) {
                return ['normal', 'invalid', 'valid'].includes(value)
            },
            default: "normal"
        }
    },
    computed: {
        noDisplay() {
            const [mouseStart, mouseEnd] = [this.mousePos.start, this.mousePos.end];
            return mouseStart[0] == mouseEnd[0] && mouseStart[1] == mouseEnd[1];
        },
        selectedStyle() {
            const styles = {
                normal: "rgb(160, 160, 160, 0.15)",
                invalid: "rgb(160, 0, 0, 0.15)",
                valid: "rgb(0, 160, 160, 0.3)"
            }
            return styles[this.status];
        }
    },
    methods: {
        drawSelectionBox() {
            if (this.noDisplay) return;
            const canvas = this.$el.querySelector(".selection-box-canvas")
            const context = canvas.getContext('2d');
            this.clearCanvas()

            const viewportOffset = canvas.getBoundingClientRect();
            const [xBase, yBase] = [viewportOffset.left, viewportOffset.top];
            const [xStart, yStart] = this.mousePos.start;
            const [xEnd, yEnd] = this.mousePos.end;

            const [xSgn, ySgn] = [xEnd > xStart ? 1 : -1, yEnd > yStart ? 1 : -1]

            // Draws border
            const borderWidth = 1;
            context.fillStyle = "#aaaaaa";
            context.fillRect(xStart - xBase, yStart - yBase, xEnd-xStart + 2 * borderWidth * xSgn, yEnd-yStart + 2 * borderWidth * ySgn);

            // Draws selection box
            context.fillStyle = this.selectedStyle;
            
            const [xMax, yMax] = [canvas.width, canvas.height];
            
            const [xStart2, yStart2] = [xStart + borderWidth * xSgn - xBase, yStart + borderWidth * ySgn - yBase]
            const [xShift, yShift] = [
                Util.limit(-xStart2+borderWidth, xEnd-xStart, xMax-xStart2-borderWidth),
                Util.limit(-yStart2+borderWidth, yEnd-yStart, yMax-yStart2-borderWidth)
            ];
            context.clearRect(xStart2, yStart2, xShift, yShift);
            context.fillRect(xStart2, yStart2, xShift, yShift);
        },
        clearCanvas() {
            const canvas = this.$el.querySelector(".selection-box-canvas")
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        rescaleCanvas() {
            let canvas = this.$el.querySelector(".selection-box-canvas");
            let field = document.querySelector(".game-field")
            if (canvas != null && field != null) {
                canvas.width = field.clientWidth; //document.width is obsolete
                canvas.height = field.clientHeight; //document.height is obsolete
            }
        }
    },
    watch: {
        mousePos: {
            deep: true,
            handler() {
                this.drawSelectionBox();
            }
        },
        noDisplay(newVal) {
            if (newVal === true) {
                this.clearCanvas();
            }
        }
    },
    mounted() {
        this.rescaleCanvas();
        this.drawSelectionBox();
    },
    template:
    `<div>
        <canvas class="selection-box-canvas"></canvas>
    </div>`
})