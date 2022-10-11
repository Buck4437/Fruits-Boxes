Vue.component("game-component", {
    props: {
        settings: Object,
        startTrigger: Number
    },
    data() {
        return {
            isGameOngoing: false,
            score: 0,
            timer: 0,
            gameSeed: 0,
            random: Math.random, // Default value, not the actual generator used
            grid: [],
            selected: [],
            drawingMode: false,
            mousePos: {
                start: [0, 0],
                end: [0, 0]
            },

            reloadKey: 0,
            currentTick: Date.now()
        }
    },
    computed: {
        timerProgress() {
            return  (this.timer / this.settings.timeLimit) ?? 0
        },
        removableFruits() {
            const sortedFruits = {};
            const target = this.settings.sumRequirement;
            for (let pair of this.selected) {
                let [i, j] = pair.split(",");
                const fruit = this.grid[i][j];
                if (fruit.type in sortedFruits) {
                    sortedFruits[fruit.type].push(fruit);
                } else {
                    sortedFruits[fruit.type] = [fruit];
                }
            }

            const sumReducer = (sum, fruit) => sum + fruit.getValue();
            return Object.values(sortedFruits).filter(
                fruits => fruits.reduce(sumReducer, 0) == target
            )
        }
    },
    methods: {
        async startGame() {
            this.score = 0;
            this.selected = [];
            
            let seed = this.settings.seed;
            if (seed == -1) {
                seed = Math.floor(Math.random() * 1e9);
            }

            this.gameSeed = seed;
            this.random = new Math.seedrandom(String(seed));

            this.grid = this.createGrid();

            this.timer = this.settings.timeLimit;

            
            document.addEventListener("mousedown", this.handleMouseDown);
            document.addEventListener("mousemove", this.handleMouseMove);
            document.addEventListener("mouseup", this.handleMouseUp); 

            await this.$nextTick(); // Wait for the canvas to load
            rescaleCanvas();
            this.forceRerender();
            this.playSound("bgm", {loop: true});
            this.isGameOngoing = true;

        },
        createGrid() {
            const grid = [];
            for (let i = 0; i < this.settings.rowCount; i++) {
                const r = [];
                for (let j = 0; j < this.settings.columnCount; j++) {
                    const type = Math.floor(this.random() * this.settings.fruitTypes + 1)
                    let val = 0;
                    if (this.random() < (this.settings.weightedNumber ? 0.3 : 0)) {
                        val = Math.floor(this.random() * 4 + 1);
                    } else {
                        val = Math.floor(this.random() * 9 + 1);
                    }
                    r.push(this.createFruit(val, type));
                }
                grid.push(r);
            }
            return grid;
        },
        createFruit(val, type) {
            return new Fruit(val, `fruit${type}.png`, type)
        },
        stopGame() {
            this.isGameOngoing = false;
            document.removeEventListener("mousedown", this.handleMouseDown);
            document.removeEventListener("mousemove", this.handleMouseMove);
            document.removeEventListener("mouseup", this.handleMouseUp); 

            this.clearCanvas();
            this.drawingMode = false;
            this.stopSound("bgm");
        },
        quitGame() {
            this.stopGame();
            this.$emit("quit");
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
                    fruit.delete();
                }
                cumulative += fruits.length;
                combo += 1;
            }
            if (cumulative > 0) {
                this.playSound("delete");
            }
            this.score += cumulative * (this.settings.comboScoring ? combo : 1);
        },
        playSound(name, attr) {
            const type = AudioLibrary.getAudioData(name).type;
            if (type == AudioLibrary.BGM && this.settings.bgm == false) return
            if (type == AudioLibrary.SFX && this.settings.sfx == false) return
            AudioLibrary.play(name, attr);
        },
        stopSound(name) {
            AudioLibrary.stop(name);
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
            const canvas = this.$el.querySelector("#selection-box-canvas")
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
            if (this.settings.highlightHelp) {
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
            const canvas = this.$el.querySelector("#selection-box-canvas")
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        // This is used when resizing the window and the canvas, as the position value will change
        forceRerender() { 
            this.reloadKey += 1;
        }
    },
    watch: {
        startTrigger() {
            this.startGame();
        }
    },
    mounted() {
        window.addEventListener("resize", () => {
            rescaleCanvas();
            this.drawSelectionBox()
            this.forceRerender();
        })
        setInterval(() => {
            dt = Date.now() - this.currentTick;
            this.currentTick += dt;
            this.timer = Math.max(0, this.timer - dt / 1000);
            if (this.isGameOngoing && this.timer <= 0) {
                this.stopGame();            
                this.playSound("end");
            }
        }, 50)
        rescaleCanvas();
    },
    template:
    `
<div class="game">
    <header>
        <div class="header-info">
            <span>Score: {{score}}</span>
            <span>Seed: {{gameSeed}}</span>
            <span>Target Sum: {{settings.sumRequirement}}</span>
            <span>Combo Scoring {{settings.comboScoring ? "On" : "Off"}},
                  {{settings.weightedNumber ? "Weighted" : "Unweighted"}},
                  Sum highlighting {{settings.highlightHelp ? "On" : "Off"}}</span>
            <span>Time Remaining: {{timer.toFixed(1)}} / {{settings.timeLimit.toFixed(1)}}s</span>
        </div>
        <div class="header-functions">
            <button v-if="isGameOngoing" @click="timer = 0">Forfeit</button>
            <button @click="quitGame">Back to Menu</button>
        </div>
    </header>
    <div class="game-field">
        <progress-bar :progress="timerProgress" class="timer"></progress-bar>
        <table>
            <tr v-for="(row, i) in grid">
                <td v-for="(fruit, j) in row">
                    <fruit-component :fruit="fruit" 
                                    :selectBoxPos="mousePos"
                                    :key="reloadKey"
                                    @change="state => updateSelectedState(i, j, state)">{{fruit.getValue()}}</fruit-component>
                </td>
            </tr>
        </table>
        <canvas id="selection-box-canvas"></canvas>
    </div>
</div>`
})