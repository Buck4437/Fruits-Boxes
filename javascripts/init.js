function init() {
    rescaleCanvas();
}

function rescaleCanvas() {
    canvas = document.getElementById("selection-box-canvas");
    canvas.width = document.body.clientWidth; //document.width is obsolete
    canvas.height = document.body.clientHeight; //document.height is obsolete
    canvasW = canvas.width;
    canvasH = canvas.height;
}

init();