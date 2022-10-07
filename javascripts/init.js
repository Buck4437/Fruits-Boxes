function init() {
    rescaleCanvas();
}

function rescaleCanvas() {
    let canvas = document.getElementById("selection-box-canvas");
    let field = document.querySelector(".game-field")
    if (canvas != null && field != null) {
        canvas.width = field.clientWidth; //document.width is obsolete
        canvas.height = field.clientHeight; //document.height is obsolete
    }
}
