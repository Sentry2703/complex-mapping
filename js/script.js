var Z_MAX_X = 2;
var Z_MIN_X = -2;
var Z_MAX_Y = 2;
var Z_MIN_Y = -2;
var W_MAX_X = 2;
var W_MIN_X = -2;
var W_MAX_Y = 2;
var W_MIN_Y = -2;
var STROKEWIDTH = 5;
var AXISWIDTH = 1.5; // Slightly thicker for visibility
var BRANCH_CUT_THRESHHOLD = 10;

var FRAMESIZE = Math.round(Math.min(window.innerHeight*(0.8),window.innerWidth*(0.4)));
var STROKECOLOR = "#FF0000";

document.getElementById("mapping").value = "z";

// z plane canvas
var zCanvasDiv = document.getElementById('zPlaneDiv');
var zCanvas = document.createElement('canvas');
zCanvas.setAttribute('width', FRAMESIZE);
zCanvas.setAttribute('height', FRAMESIZE);
zCanvas.setAttribute('id', 'zCanvas');
zCanvasDiv.appendChild(zCanvas);
var zContext = zCanvas.getContext("2d");	

var clickX = new Array();
var clickY = new Array();
var clickColor = new Array();
var clickDrag = new Array();
var paint;

/**
 * NEW: Helper function to draw grid lines and integer labels
 */
function drawGrid(ctx, minX, maxX, minY, maxY) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Transformation from math coordinates to pixel coordinates
    const toX = (x) => ((x - minX) / (maxX - minX)) * width;
    const toY = (y) => (1 - (y - minY) / (maxY - minY)) * height;

    const originX = toX(0);
    const originY = toY(0);

    // Gridline style
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#e0e0e0"; // Light gray gridlines
    ctx.font = "10px Arial";
    ctx.fillStyle = "#888";

    // Draw Vertical Gridlines and X-axis Labels
    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
        const px = toX(x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();

        // Position labels near the x-axis, but keep them on screen if the axis is off-screen
        let labelY = originY + 12;
        if (originY < 0) labelY = 12;
        if (originY > height) labelY = height - 5;
        
        ctx.textAlign = "center";
        ctx.fillText(x, px, labelY);
    }

    // Draw Horizontal Gridlines and Y-axis Labels
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
        const py = toY(y);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();

        // Position labels near the y-axis, but keep them on screen
        let labelX = originX - 5;
        if (originX < 0) labelX = 5;
        if (originX > width) labelX = width - 15;
        
        if (y !== 0) { // Don't draw '0' twice
            ctx.textAlign = "right";
            ctx.fillText(y, labelX, py + 3);
        }
    }

    // Draw Main Axes
    ctx.lineWidth = AXISWIDTH;
    ctx.strokeStyle = "#000000";
    
    // X-Axis
    if (originY >= 0 && originY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.stroke();
    }
    // Y-Axis
    if (originX >= 0 && originX <= width) {
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();
    }
}

$('#zCanvas').mousemove(function(e) {
	if(paint) {
		addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
		redraw();
	}
});

$('#zCanvas').mousedown(function(e){
	paint = true;
	addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	redraw();
});

$('#zCanvas').mouseup(function(e) { paint = false; });
$('#zCanvas').mouseleave(function(e) { paint = false; });

var f = function(z){ return z; };

function addClick(x, y, dragging) {
	clickX.push(x);
	clickY.push(y);
	clickColor.push(STROKECOLOR);
	clickDrag.push(dragging);
}

function distance(x1,y1,x2,y2) {
	return Math.sqrt(Math.pow((y2-y1),2) + Math.pow((x2-x1),2));
}

function updateColor(jscolor) {
	STROKECOLOR = "#" + jscolor;
}

function mapUpdate() {
	var map = document.getElementById("mapping").value;
	try {
		var funk = Complex.parseFunction(map,['z']);
		f = function(z){ return funk(z); };
		wMap();
	} catch (err) {
		document.getElementById("mapping").value = "z";
		f = function(z){ return z; };
		alert("Invalid Function");	
	}
}

// w plane canvas setup
var wCanvasDiv = document.getElementById('wPlaneDiv');
var wCanvas = document.createElement('canvas');
wCanvas.setAttribute('width', FRAMESIZE);
wCanvas.setAttribute('height', FRAMESIZE);
wCanvas.setAttribute('id', 'wCanvas');
wCanvasDiv.appendChild(wCanvas);
var wContext = wCanvas.getContext("2d");	

function clearCanvas() {
	clickX = []; clickY = []; clickDrag = []; clickColor = [];
	redraw();
}

function updateBCT() {
	var newBCT = parseFloat(document.getElementById("bct").value);
	if(!isNaN(newBCT) && newBCT > 1) {
		BRANCH_CUT_THRESHHOLD = newBCT;
	} else {
		document.getElementById("bct").value = 10;
	}
	redraw();
}

function resetBCT() {
	BRANCH_CUT_THRESHHOLD = 10;
	document.getElementById("bct").value = 10;
	redraw();
}

function resetRange() {
	document.getElementById("ZMAXX").value = 2;
	document.getElementById("ZMINX").value = -2;
	document.getElementById("ZMAXY").value = 2;
	document.getElementById("ZMINY").value = -2;
	document.getElementById("WMAXX").value = 2;
	document.getElementById("WMINX").value = -2;
	document.getElementById("WMAXY").value = 2;
	document.getElementById("WMINY").value = -2;
	Z_MAX_X = 2; Z_MIN_X = -2; Z_MAX_Y = 2; Z_MIN_Y = -2;
	W_MAX_X = 2; W_MIN_X = -2; W_MAX_Y = 2; W_MIN_Y = -2;
	redraw();
}

function updateRange() {
	Z_MAX_X = parseFloat(document.getElementById("ZMAXX").value) || 2;
	Z_MIN_X = parseFloat(document.getElementById("ZMINX").value) || -2;
	Z_MAX_Y = parseFloat(document.getElementById("ZMAXY").value) || 2;
	Z_MIN_Y = parseFloat(document.getElementById("ZMINY").value) || -2;
	W_MAX_X = parseFloat(document.getElementById("WMAXX").value) || 2;
	W_MIN_X = parseFloat(document.getElementById("WMINX").value) || -2;
	W_MAX_Y = parseFloat(document.getElementById("WMAXY").value) || 2;
	W_MIN_Y = parseFloat(document.getElementById("WMINY").value) || -2;
	redraw();
}

function redraw() {
	zContext.clearRect(0, 0, zContext.canvas.width, zContext.canvas.height);
    // Draw the new dynamic grid for the Z plane
    drawGrid(zContext, Z_MIN_X, Z_MAX_X, Z_MIN_Y, Z_MAX_Y);
	
	zContext.lineJoin = "round";
	zContext.lineWidth = STROKEWIDTH;
			
	for(var i=0; i < clickX.length; i++) {
		zContext.strokeStyle = clickColor[i];
		zContext.beginPath();
		if(clickDrag[i] && i) {
			zContext.moveTo(clickX[i-1], clickY[i-1]);
		} else {
			zContext.moveTo(clickX[i]-1, clickY[i]);
		}
		zContext.lineTo(clickX[i], clickY[i]);
		zContext.closePath();
		zContext.stroke();
	}
	wMap();
}

function wMap() {
	wContext.clearRect(0,0,wCanvas.width,wCanvas.height);
    // Draw the new dynamic grid for the W plane
    drawGrid(wContext, W_MIN_X, W_MAX_X, W_MIN_Y, W_MAX_Y);

	var prevx = -1;
	var prevy = -1;
	
	for(var i = 0; i < clickDrag.length; i++) {
		var zreal = Z_MIN_X + (Z_MAX_X - Z_MIN_X)*(clickX[i]/zCanvas.width);
		var zimg = Z_MIN_Y + (Z_MAX_Y - Z_MIN_Y)*(1-(clickY[i]/zCanvas.height));
		var inp = Complex(zreal, zimg);
		var out = f(inp);
		var out_re = out.real();
		var out_im = out.imag();

		var out_x = Math.round(((out_re - W_MIN_X)/(W_MAX_X - W_MIN_X))*wCanvas.width);
		var out_y = Math.round((1-((out_im - W_MIN_Y)/(W_MAX_Y - W_MIN_Y)))*wCanvas.height);

		wContext.lineWidth = STROKEWIDTH;
		wContext.lineJoin = "round";
		if(i != 0) {
			wContext.strokeStyle = clickColor[i];
			wContext.beginPath();
			if(clickDrag[i]) {
				if((distance(out_x,out_y,prevx,prevy)/distance(clickX[i-1],clickY[i-1],clickX[i],clickY[i]))<BRANCH_CUT_THRESHHOLD)
					wContext.moveTo(prevx, prevy);
				else
					wContext.moveTo(out_x, out_y);
			} else {
				wContext.moveTo(out_x, out_y);
			}
			wContext.lineTo(out_x,out_y);
			wContext.closePath();
			wContext.stroke();
		}
		prevx = out_x;
		prevy = out_y;
	}
}
redraw();