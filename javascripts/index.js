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
        startGameTrigger: 0,
        reloadKey: 0,
        currentTick: Date.now()
    },
    computed: {
        timerProgress() {
            return  (this.timer / this.parsedInputs.timeLimit) ?? 0
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
        }
    },
    methods: {
        startGame() {
            this.startGameTrigger += 1;
            this.isGameOngoing = true
        },
        exitGame() {
            this.isGameOngoing = false;
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
        }
    },
    mounted() {
        document.querySelector(".loading-text").innerHTML = "";
    }
});