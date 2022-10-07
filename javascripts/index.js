const app = new Vue({
    el: "#app",
    data: {
        fruitTypes: 4,
        sumRequirement: 10,
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
        handleMouseDown(event) {
            this.drawingMode = true;
            this.mousePos.start = getMousePos(event);
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
                this.score += count;
            }
        },
        drawSelectionBox() {
            if (!this.drawingMode) return;
            const canvas = document.querySelector("#selection-box-canvas")
            const context = canvas.getContext('2d');
            this.clearCanvas()

            let [xStart, yStart] = this.mousePos.start;
            let [xEnd, yEnd] = this.mousePos.end;

            const [xSgn, ySgn] = [xEnd > xStart ? 1 : -1, yEnd > yStart ? 1 : -1]

            // Draws border
            context.fillStyle = "#aaaaaa";
            context.fillRect(xStart, yStart, xEnd-xStart + 4 * xSgn, yEnd-yStart + 4 * ySgn);

            // Draws selection box
            context.fillStyle = "rgb(160, 160, 160, 0.15)";
            
            context.clearRect(xStart + 2 * xSgn, yStart + 2 * ySgn, xEnd-xStart, yEnd-yStart);
            context.fillRect(xStart + 2 * xSgn, yStart + 2 * ySgn, xEnd-xStart, yEnd-yStart);
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
        this.generateGrid(12, 20);
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
    }
});

function getMousePos(event) {
    return [event.clientX, event.clientY]
}
