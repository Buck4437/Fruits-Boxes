function init() {
    rescaleCanvas();
}

function rescaleCanvas() {
    canvas = document.getElementById("selection-box-canvas");
    field = document.querySelector(".game-field")
    canvas.width = field.clientWidth; //document.width is obsolete
    canvas.height = field.clientHeight; //document.height is obsolete
}

init();