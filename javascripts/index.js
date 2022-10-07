const app = new Vue({
    el: "#app",
    data: {

        // Options
        fruitTypes: 4,
        sumRequirement: 10,
        row: 16,
        column: 20,

        // Game related
        score: 0,
        grid: [],
        selected: new Set(),
        drawingMode: false,
        mousePos: {
            start: [0, 0],
            end: [0, 0]
        },
        reloadKey: 0,
    },
    methods: {
        createFruit(val, type) {
            return new Fruit(val, `fruit${type}.png`, type)
        },
        generateGrid(row=10, column=10) {
            const grid = [];
            for (let i = 0; i < row; i++) {
                const r = [];
                for (let j = 0; j < column; j++) {
                    const type = Math.floor(Math.random() * this.fruitTypes + 1)
                    let val = 0;
                    if (Math.random() < 0.3) {
                        val = Math.floor(Math.random() * 4 + 1);
                    } else {
                        val = Math.floor(Math.random() * 9 + 1);
                    }
                    r.push(this.createFruit(val, type));
                }
                grid.push(r);
            }
            this.grid = grid;
            this.selected = new Set()
        },
        updateSelectedState(i, j, state) {
            if (state === true) {
                this.selected.add(i + "," + j)
            } else {
                this.selected.delete(i + "," + j)
            }
        },
        deleteFruit() {
            const fruits = {};
            for (let pair of this.selected.values()) {
                let [i, j] = pair.split(",");
                const fruit = this.grid[i][j];
                if (fruit.type in fruits) {
                    fruits[fruit.type].push(fruit);
                } else {
                    fruits[fruit.type] = [fruit];
                }
            }
            let cumulative = 0, combo = 0;
            for (let type in fruits) {
                let sum = 0, count = 0;
                for (let fruit of fruits[type]) {
                    const val = fruit.val;
                    if (val != null) {
                        sum += val;
                        count += 1;
                    }
                }
                if (sum != this.sumRequirement) continue;
                for (let fruit of fruits[type]) {
                    fruit.val = null;
                }
                cumulative += count;
                combo += 1;
            }
            this.score += cumulative * combo;
        },
        getCanvasCorners() {
            const canvas = document.querySelector("#selection-box-canvas")
            const topPos = canvas.getBoundingClientRect().top + window.scrollY;
            const leftPos = canvas.getBoundingClientRect().left + window.scrollX;
            const bottomPos = canvas.getBoundingClientRect().bottom + window.scrollY;
            const rightPos = canvas.getBoundingClientRect().right + window.scrollX;
            return [topPos, leftPos, bottomPos, rightPos];
        },
        handleMouseDown(event) {
            const mousePos = getMousePos(event);
            const [top, left, bottom, right] = this.getCanvasCorners();
            if (mousePos[0] < left || mousePos[0] > right || mousePos[1] < top || mousePos[1] > bottom) return;
            
            this.drawingMode = true;
            this.mousePos.start = mousePos;
            this.mousePos.end = this.mousePos.start
        },
        handleMouseMove(event) {
            if (this.drawingMode) {
                this.mousePos.end = getMousePos(event);
                this.drawSelectionBox()
            }
        },
        handleMouseUp(event) {
            this.drawingMode = false;
            this.mousePos.end = getMousePos(event);
            this.clearCanvas();
            this.deleteFruit()
            this.mousePos.start = this.mousePos.end;
        },
        drawSelectionBox() {
            if (!this.drawingMode) return;
            const canvas = document.querySelector("#selection-box-canvas")
            const context = canvas.getContext('2d');
            this.clearCanvas()

            const viewportOffset = canvas.getBoundingClientRect();
            const [xBase, yBase] = [viewportOffset.left, viewportOffset.top];
            const [xStart, yStart] = this.mousePos.start;
            const [xEnd, yEnd] = this.mousePos.end;

            const [xSgn, ySgn] = [xEnd > xStart ? 1 : -1, yEnd > yStart ? 1 : -1]

            // Draws border
            context.fillStyle = "#aaaaaa";
            context.fillRect(xStart - xBase, yStart - yBase, xEnd-xStart + 4 * xSgn, yEnd-yStart + 4 * ySgn);

            // Draws selection box
            context.fillStyle = "rgb(160, 160, 160, 0.15)";
            
            let limit = (min, x, max) => Math.max(Math.min(x, max), min)
            const [xMax, yMax] = [canvas.width, canvas.height];
            
            const [xStart2, yStart2] = [xStart + 2 * xSgn - xBase, yStart + 2 * ySgn - yBase]
            const [xShift, yShift] = [
                limit(-xStart2+2, xEnd-xStart, xMax-xStart2-2),
                limit(-yStart2+2, yEnd-yStart, yMax-yStart2-2)
            ];
            context.clearRect(xStart2, yStart2, xShift, yShift);
            context.fillRect(xStart2, yStart2, xShift, yShift);
        },
        clearCanvas() {
            const canvas = document.querySelector("#selection-box-canvas")
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        // This is used when resizing the window, as the position value will change
        forceRerender() { 
            this.reloadKey += 1;
        }
    },
    created() {
        this.generateGrid(this.row, this.column);
    },
    mounted() {
        document.addEventListener("mousedown", this.handleMouseDown);
        document.onmousemove = this.handleMouseMove;
        document.addEventListener("mouseup", this.handleMouseUp); 
        window.addEventListener("resize", () => {
            rescaleCanvas();
            this.drawSelectionBox()
            this.forceRerender();
        })
        rescaleCanvas();
    }
});

function getMousePos(event) {
    return [event.clientX, event.clientY]
}
