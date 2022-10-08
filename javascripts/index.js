const app = new Vue({
    el: "#app",
    data: {

        // Options
        defaultInputs: {
            fruitTypes: 1,
            rowCount: 10,
            columnCount: 17,
            timeLimit: 120,
            sumRequirement: 10,
            seed: -1,
            comboScoring: true,
            weightedNumber: true,
            highlightHelp: false,
            bgm: true,
            sfx: true
        },

        inputs: {
            fruitTypes: "1",
            rowCount: "",
            columnCount: "",
            timeLimit: "",
            sumRequirement: "",
            seed: "",
            comboScoring: true,
            weightedNumber: true,
            highlightHelp: false,
            bgm: true,
            sfx: true
        },
        
        isGameOngoing: false,
        timer: 0,

        gameSeed: 0,
        random: Math.random, // Default value, not the actual generator used

        // Game related
        score: 0,
        grid: [],
        selected: [],
        drawingMode: false,
        mousePos: {
            start: [0, 0],
            end: [0, 0]
        },

        audios: {
            bgm: {
                type: "bgm",
                object: new Audio("res/fruitbox.mp3"),
            },
            delete: {
                type: "sfx",
                object: new Audio("res/delete.mp3") 
            },
            end: {
                type: "sfx",
                object: new Audio("res/end.mp3")
            }
        },

        reloadKey: 0,
        currentTick: Date.now()
    },
    computed: {
        timerProgress() {
            return  (this.timer / this.parsedInputs.timeLimit) ?? 0
        },
        isGameEnded() {
            return this.isGameOngoing && this.timer <= 0;
        },
        parsedInputs() {
            let parsed = {}
            for (let key in this.inputs) {
                const input = this.inputs[key];
                if (typeof input === "string" && input.trim() === "") {
                    parsed[key] = this.defaultInputs[key];
                } else if (["comboScoring", "weightedNumber", "highlightHelp", "bgm", "sfx"].indexOf(key) != -1) {
                    parsed[key] = this.inputs[key];
                } else {
                    parsed[key] = parseInt(this.inputs[key]);
                }
            }
            return parsed;
        },
        inputStats() {
            return [
                {
                    class: ".row-count",
                    filter: () => this.inputs.rowCount == "" || (Util.isInteger(this.inputs.rowCount) && parseInt(this.inputs.rowCount) >= 1)
                },
                {
                    class: ".column-count",
                    filter: () => this.inputs.columnCount == "" || (Util.isInteger(this.inputs.columnCount) && parseInt(this.inputs.columnCount) >= 1),
                },
                {
                    class: ".time-limit",
                    filter: () => this.inputs.timeLimit == "" || (Util.isInteger(this.inputs.timeLimit) && parseInt(this.inputs.timeLimit) > 0),
                },
                {
                    class: ".target-sum",
                    filter: () => this.inputs.sumRequirement == "" || (Util.isInteger(this.inputs.sumRequirement) && parseInt(this.inputs.sumRequirement) >= 10)
                },
                {
                    class: ".seed-number",
                    filter: () => this.inputs.seed == "" || (Util.isInteger(this.inputs.seed) && parseInt(this.inputs.seed) >= -1)
                }
            ]
        },
        allInputValid() {
            return this.inputStats.every(x => x.filter() === true)
        },
        removableFruits() {
            const fruits = {};
            const removableFruits = [];
            for (let pair of this.selected) {
                let [i, j] = pair.split(",");
                const fruit = this.grid[i][j];
                if (fruit.type in fruits) {
                    fruits[fruit.type].push(fruit);
                } else {
                    fruits[fruit.type] = [fruit];
                }
            }
            for (let type in fruits) {
                let sum = 0;
                for (let fruit of fruits[type]) {
                    const val = fruit.val;
                    if (val != null) {
                        sum += val;
                    }
                }
                if (sum != this.parsedInputs.sumRequirement) continue;
                removableFruits.push(fruits[type]) // Add the fruit list to the array
            }
            return removableFruits;
        }
    },
    methods: {
        async playGame() {
            if (!this.allInputValid) return;

            let seed = this.parsedInputs.seed;
            if (seed == -1) {
                seed = Math.floor(Math.random() * 1e9);
            }

            this.gameSeed = seed;
            this.random = new Math.seedrandom(String(seed));

            this.createGrid(this.parsedInputs.rowCount, this.parsedInputs.columnCount);
            this.score = 0;

            this.timer = this.parsedInputs.timeLimit;
            this.isGameOngoing = true;

            await this.$nextTick(); // Wait for the canvas to load
            rescaleCanvas();
            this.forceRerender();
            this.playSound("bgm", {loop: true});
        },
        stopGame() {
            this.clearCanvas();
            this.drawingMode = false;
            this.stopSound("bgm");
        },
        playSound(key, attr) {
            this.stopSound(key);
            const [audio, type] = [this.audios[key].object, this.audios[key].type];
            if (type == "bgm" && this.parsedInputs.bgm == false) return
            if (type == "sfx" && this.parsedInputs.sfx == false) return
            for (let ky in attr) {
                audio[ky] = attr[ky];
            }
            audio.play();
        },
        stopSound(key) {
            const audio = this.audios[key].object;
            audio.pause();
            audio.currentTime = 0;
        },
        createFruit(val, type) {
            return new Fruit(val, `fruit${type}.png`, type)
        },
        createGrid(row=10, column=10) {
            const grid = [];
            for (let i = 0; i < row; i++) {
                const r = [];
                for (let j = 0; j < column; j++) {
                    const type = Math.floor(this.random() * this.parsedInputs.fruitTypes + 1)
                    let val = 0;
                    if (this.random() < (this.parsedInputs.weightedNumber ? 0.3 : 0)) {
                        val = Math.floor(this.random() * 4 + 1);
                    } else {
                        val = Math.floor(this.random() * 9 + 1);
                    }
                    r.push(this.createFruit(val, type));
                }
                grid.push(r);
            }
            this.grid = grid;
            this.selected = [];
        },
        updateSelectedState(i, j, state) {
            const key = i + "," + j
            if (state === true) {
                if (this.selected.indexOf(key) == -1) {
                    this.selected.push(i + "," + j)
                }
            } else {
                const index = this.selected.indexOf(key);
                if (this.index != -1) {
                    this.selected.splice(index, 1)
                }
            }
        },
        deleteFruit() {
            const removableFruits = this.removableFruits;
            let cumulative = 0, combo = 0;
            for (let fruits of removableFruits) {
                for (let fruit of fruits) {
                    fruit.val = null;
                }
                cumulative += fruits.length;
                combo += 1;
            }
            if (cumulative > 0) {
                this.playSound("delete");
            }
            this.score += cumulative * (this.parsedInputs.comboScoring ? combo : 1);
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
            if (!this.isGameOngoing || this.timer <= 0) return;
            const mousePos = getMousePos(event);
            const [top, left, bottom, right] = this.getCanvasCorners();
            if (mousePos[0] < left || mousePos[0] > right || mousePos[1] < top || mousePos[1] > bottom) return;
            
            this.drawingMode = true;
            this.mousePos.start = mousePos;
            this.mousePos.end = this.mousePos.start
        },
        handleMouseMove(event) {
            if (!this.isGameOngoing || this.timer <= 0) return;
            if (this.drawingMode) {
                this.mousePos.end = getMousePos(event);
                this.drawSelectionBox()
            }
        },
        handleMouseUp(event) {
            if (!this.isGameOngoing || this.timer <= 0) return;
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
            const borderWidth = 1;
            context.fillStyle = "#aaaaaa";
            context.fillRect(xStart - xBase, yStart - yBase, xEnd-xStart + 2 * borderWidth * xSgn, yEnd-yStart + 2 * borderWidth * ySgn);

            // Draws selection box
            if (this.parsedInputs.highlightHelp) {
                context.fillStyle = this.removableFruits.length > 0 ? "rgb(0, 160, 160, 0.3)" : "rgb(160, 0, 0, 0.15)";
            } else {
                context.fillStyle = "rgb(160, 160, 160, 0.15)";
            }
            
            let limit = (min, x, max) => Math.max(Math.min(x, max), min)
            const [xMax, yMax] = [canvas.width, canvas.height];
            
            const [xStart2, yStart2] = [xStart + borderWidth * xSgn - xBase, yStart + borderWidth * ySgn - yBase]
            const [xShift, yShift] = [
                limit(-xStart2+borderWidth, xEnd-xStart, xMax-xStart2-borderWidth),
                limit(-yStart2+borderWidth, yEnd-yStart, yMax-yStart2-borderWidth)
            ];
            context.clearRect(xStart2, yStart2, xShift, yShift);
            context.fillRect(xStart2, yStart2, xShift, yShift);
        },
        clearCanvas() {
            const canvas = document.querySelector("#selection-box-canvas")
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        // This is used when resizing the window and the canvas, as the position value will change
        forceRerender() { 
            this.reloadKey += 1;
        }
    },
    watch: {
        inputs: {
            handler() {
                const stats = this.inputStats;
                for (let obj of stats) {
                    const [className, isValid] = [obj.class, obj.filter()]
                    if (isValid) {
                        document.querySelector(className).classList.remove("error")
                    } else {
                        document.querySelector(className).classList.add("error")
                    }
                }
            },
            deep: true
        },
        isGameEnded(bool) {
            if (bool === true) {
                this.stopGame();            
                this.playSound("end");
            }
        }
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
        setInterval(() => {
            dt = Date.now() - this.currentTick;
            this.currentTick += dt;
            this.timer = Math.max(0, this.timer - dt / 1000);
        }, 50)
        rescaleCanvas();
        
        document.querySelector(".loading-text").innerHTML = "";
    }
});

function getMousePos(event) {
    return [event.clientX, event.clientY]
}
