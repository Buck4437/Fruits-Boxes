Vue.component("progress-bar", {
    props: {
        progress: Number,
        colour: {
            type: String,
            default: "#FFCCCC"
        },
    },
    methods: {
        updateCanvas() {
            const canvas = this.$el.querySelector("canvas");
            if (canvas === null) return;
            const context = canvas.getContext("2d");
            const [width, height] = [canvas.width, canvas.height];
            context.clearRect(0, 0, width, height);
            context.fillStyle = this.colour;
            context.fillRect(0, 0, width * this.progress, height)
        }
    },
    watch: {
        progress() {
            this.updateCanvas();
        }
    },
    mounted() {
        this.updateCanvas();
    },
    template:
    `<div class="component progress-bar">
        <canvas class="progress-bar-canvas" width="200" height="10"></canvas>
     </div>`
})