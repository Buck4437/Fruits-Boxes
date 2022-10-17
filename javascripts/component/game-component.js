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

            document.addEventListener("mousedown", this.handleClickDown);
            document.addEventListener("mousemove", this.handleClickMove);
            document.addEventListener("mouseup", this.handleClickEnd); 

            document.addEventListener("touchstart", this.handleClickDown);
            document.addEventListener("touchmove", this.handleClickMove);
            document.addEventListener("touchend", this.handleClickEnd); 

            await this.$nextTick(); // Wait for the canvas to load
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
            document.removeEventListener("mousedown", this.handleClickDown);
            document.removeEventListener("mousemove", this.handleClickMove);
            document.removeEventListener("mouseup", this.handleClickEnd); 

            document.removeEventListener("touchstart", this.handleClickDown);
            document.removeEventListener("touchmove", this.handleClickMove);
            document.removeEventListener("touchend", this.handleClickEnd);

            this.resetMousePos();
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
            const canvas = this.$el.querySelector(".selection-box-canvas")
            const topPos = canvas.getBoundingClientRect().top + window.scrollY;
            const leftPos = canvas.getBoundingClientRect().left + window.scrollX;
            const bottomPos = canvas.getBoundingClientRect().bottom + window.scrollY;
            const rightPos = canvas.getBoundingClientRect().right + window.scrollX;
            return [topPos, leftPos, bottomPos, rightPos];
        },
        mousePosWithinBound(mousePos) {
            const [top, left, bottom, right] = this.getCanvasCorners();
            return left <= mousePos[0] && mousePos[0] <= right && top <= mousePos[1] && mousePos[1] <= bottom
        },
        handleClickDown(event) {
            const mousePos = getClickPos(event);
            if (!this.mousePosWithinBound(mousePos)) return;
            this.drawingMode = true;
            this.mousePos.end = this.mousePos.start = mousePos;
        },
        handleClickMove(event) {
            if (this.drawingMode) {
                this.mousePos.end = getClickPos(event);
            }
        },
        handleClickEnd() {
            this.drawingMode = false;
            this.resetMousePos();
            this.deleteFruit();
        },
        moveMousePosWithinBound() {
            const oldMousePos = this.mousePos.start;
            const [top, left, bottom, right] = this.getCanvasCorners();
            this.mousePos.start = [
                Util.limit(left+2, oldMousePos[0], right-2),
                Util.limit(top+2, oldMousePos[1], bottom-2)
            ]
        },
        resetMousePos() {
            this.mousePos.end = [0, 0];
            this.mousePos.start = this.mousePos.end;
        },
        preventScrollingHandler(e) {
            if (this.isGameOngoing) {
                const mousePos = this.mousePos.start;
                if (this.drawingMode === true || this.mousePosWithinBound(mousePos)) {
                    e.preventDefault();
                }
            }
        },
        // Relaods canvas and fruit positions
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
        this.forceRerender();
        document.body.addEventListener('touchmove', this.preventScrollingHandler, { passive: false });
        window.addEventListener("resize", () => {
            this.forceRerender();
            this.moveMousePosWithinBound();
        })
        setInterval(() => {
            dt = Date.now() - this.currentTick;
            this.currentTick += dt;
            this.timer = Math.max(0, this.timer - dt / 1000);
            if (this.isGameOngoing && this.timer <= 0) {
                this.stopGame();            
                this.playSound("end");
            }
        }, 50);
    },
    template:
    `
<div class="game-tab">
    <div class="game-container">
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
                                        @change="state => updateSelectedState(i, j, state)">
                            {{fruit.getValue()}}
                        </fruit-component>
                    </td>
                </tr>
            </table>
            <selection-box-canvas :mouse-pos="mousePos" :key="reloadKey"/>
        </div>
    </div>
</div>`
})

function getClickPos(event) {
    if (event.type.match(new RegExp("touch", "g")) !== null) {
        const touch = event.targetTouches[0];
        return [touch.clientX, touch.clientY];
    }
    return [event.clientX, event.clientY];
}
