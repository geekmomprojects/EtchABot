// Helper function to convert units of length measurement to screen pixels.
// Assumes 96 dpi screen measurement.  Takes string as input.
function toPixels(lengthStr) {
	var pix;
	if (lengthStr.search("in") >= 0) pix = parseFloat(lengthStr) * 96;
	else if (lengthStr.search("cm") >= 0) pix = parseFloat(lengthStr) * 96 / 2.2;
	else if (lengthStr.search("px") >= 0) pix = parseInt(lengthStr);
	else pix = parseInt(lengthStr);
	return Math.round(pix);
}


// Makes a command string out of a command and two numbers
function makeCmdString(cmd, x, y) {
return cmd + ' ' + Math.round(x) + ' ' + Math.round(y);
}

// Canvas drawing functions

// Scope preserving wrapper for canvas callback function
var onCanvasMouseDown = function(canvasPoints) {
	return function(e) {
		canvasPoints.setPaint(true);
		canvasPoints.addPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
		canvasPoints.drawPoints(this);
	}
}

// Scope preserving wrapper for canvas callback function
var onCanvasMouseUp = function(canvasPoints) {
	return function(e) {
		canvasPoints.setPaint(false);
		canvasPoints.drawPoints(this);
	}
}

// Scope preserving wrapper for canvas callback function
var onCanvasMouseMove = function(canvasPoints) {
	return function(e) {
		if(canvasPoints.paint) {
			canvasPoints.addPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
			canvasPoints.drawPoints(this);
		} 
	}
}

// Scope preserving wrapper for canvas callback function
var onCanvasMouseLeave = function(canvasPoints) {
	return function(e) {
		canvasPoints.setPaint(false);
	}
}

// Scope preserving wrapper for canvas callback function
var onClickErase = function(canvas, canvasPoints) {
	return function(e) {
		canvasPoints.clickX = [0];
		canvasPoints.clickY = [0];
		canvasPoints.setPaint(false);
		canvasPoints.drawPoints(canvas);
	}
}

var onClickEraseLast = function(canvas, canvasPoints) {
	return function(e) {
		if (canvasPoints.length > 1 ) {
			canvasPoints.clickX.pop();
			canvasPoints.clickY.pop();
			canvasPoints.drawPoints(canvas);
		}
	}
}

// Check for integer.  Function lifted from:
// http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript

function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

function validateBacklashValue(val, min, max) {
	if (isInt(val) && val >= min && val <= max) return true;
	else return false;
}
// Scope preserving function - get new backlash values and send them to the EtchABot
var onClickSetBacklash = function(socket) {
	return function(e) {
		var bMin = 0;
		var bMax = 500;
		// Get and validate values for backlash
		var h = prompt("Horz backlash: [" + bMin + "-" + bMax + "]", document.getElementById('xBacklash').value);
		if (!validateBacklashValue(h, bMin, bMax)) {
			alert("Invalid backlash value " + h + " Exiting.");
			return;
		}
		var v = prompt("Horz backlash: [" + bMin + "-" + bMax + "]", document.getElementById('xBacklash').value);
		if (!validateBacklashValue(h, bMin, bMax)) {
			alert("Invalid backlash value " + h + " Exiting.");
			return;
		}
		// Now send valid values to Etch-a-Sketch
		socket.emit('cmds', makeCmdString('B', parseInt(h), parseInt(v)));
	}
}

// Sets browser HTML elements for drawing mode
var setDrawMode = function() {
	// Set button visibility and display canvas
	document.getElementById('filechooser').style.display = 'none';
	document.getElementById('imageDisplay').style.display = 'none';
	document.getElementById('eraseLast').style.display = 'initial';
	document.getElementById('erase').style.display = 'initial';
	document.getElementById('theCanvas').style.display = 'block';
	document.getElementById('imToData').value = 'Drawing to Data';
}

// Sets browser HTML elements for image mode
var setImageMode = function() {
	// Set button visibility and hide the canvas
	document.getElementById('filechooser').style.display = 'initial';
	document.getElementById('eraseLast').style.display = 'none';
	document.getElementById('erase').style.display = 'none';
	document.getElementById('theCanvas').style.display = 'none';
	document.getElementById('imageDisplay').style.display = 'block';
	document.getElementById('imToData').value = 'Image to Data';
}

// Event handler for selecting drawing mode
var switchModes = function(e) {
	//alert(this.value + " was selected");	
	if (this.value === "draw") setDrawMode();
	else if (this.value === "image") setImageMode();
	else alert("Unknown mode " + this.value + " selected");
}

// Returns either "draw" or "image" currently
var getDisplayMode = function() {
	return document.getElementById('drawMode').value;
}

// Returns true if the currently displayed image is SVG
var isDisplayingSVG = function() {
	if ((getDisplayMode() === "image") && (document.getElementsByTagName('svg').length > 0)) return true;
	else return false;
}

// Reads in the contents of an image raster (.jpg, .gif, .png) file or vector (.svg) file
var onFileSelect = function(img) {
	return function(evt) {
		if (evt.target.files.length == 0) return;
		var file = evt.target.files[0];  // FileList object
		
		var imDisp = document.getElementById('imageDisplay');
		
		// Treat vector (SVG) files differently from raster images
		if (file.type == "image/svg+xml") {

			var reader = new FileReader();
			// Callback function runs when SVG file is loaded
			reader.onload = function(e) {
				// Read in SVG and scale it to fit in the display
				// First remove any existing child images
				imDisp.innerHTML = e.target.result;
				var svg = document.getElementsByTagName('svg')[0];
				// Set the viewbox if we don't have one
				if (!svg.getAttribute('viewBox')) {
					var w = toPixels(svg.getAttribute("width"));
					var h = toPixels(svg.getAttribute("height"));
					svg.setAttribute('viewBox', '0 0 ' + parseInt(w) + ' ' + parseInt(h));
				}
				//svg.setAttribute('class', "imDisplay");
				svg.setAttribute('class', "svgDisplay");
				//var box = svg.getBBox();
				//alert("x, y, w, h = " + box.x + ", " + box.y + ", " + box.width + ", " + box.height);
				//svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
			}
			reader.readAsText(file);
		} else {
			var reader = new FileReader();
			// Callback function runs when file is completely loaded
			reader.onload = function(e) {
				// Clear any old images from the imDisplay element
				imDisp.innerHTML = "";
				
				// need to reset any old image values for height/width and copy the image
				img.setAttribute("height", "auto");
				img.setAttribute("width", "auto");
				
				img.src = reader.result;
				
				// Scale to fit inside the divbox
				var style = getComputedStyle(imDisp);
				var hDiv = parseInt(style.getPropertyValue('height'));
				var wDiv = parseInt(style.getPropertyValue('width'));
				//alert("Hdiv, wdiv = " + hDiv + " " + wDiv);
				// Get image dimensions, and rescale to fit in the divbox while maintaining
				//  the original aspect ratio of the image
				var h = parseFloat(img.naturalHeight);
				var w = parseFloat(img.naturalWidth);
				if (h/w > 1.0*hDiv/wDiv) {
					img.setAttribute('height', hDiv + 'px');
					img.setAttribute('width', Math.round(w*hDiv/h) + 'px');
				} else {
					img.setAttribute('width', wDiv + 'px');
					img.setAttribute('height', Math.round(h*wDiv/w) + 'px');
				}
				// Put image on the screen
				imDisp.appendChild(img);
			}
			reader.readAsDataURL(file);
		}
				
	}
}

// Helper functions to extract one or more integers from a string.  Returns list
//  of integers in the string.  Assumes the first character in the string is part
//  of the first integer.  Integers must be separated by spaces.
function getIntegersFromString(str) {
	var numList = [];
	while (str.length > 0) {
		while (str[0] == ' ') {			// Eliminate leading spaces
			str = str.substring(1);
		}
		var space = str.indexOf(' ');	// Find next space separator
		if (space == -1) {
			numList.push(parseInt(str));
			str = "";
		} else {
			numList.push(parseInt(str.substring(0,space)));
			str = str.substring(space);
		}
	}
	return numList;
}

// Event handler for data received from server
var onSocketNotification = function(display) {
	return function(data) {
		// Display recevied notifications in text area
		var cmd = ' ';
		if (data.length > 2 && data[0] == '#') { cmd = data[1]; }
		if (cmd == 'D') { // Set dimensions
			var numList = getIntegersFromString(data.substring(2));
			if (numList.length) {
				var w = numList[0]; var h = numList[1];
			}
			//alert("Setting display size to [" + w + ", " + h + "]");
			display.size = [w,h];
			display.center = [(display.origin[0] + w)/2, (display.origin[1] + h)/2];
		} else if (cmd == 'b') {  //Receiving backlash info
			var numList = getIntegersFromString(data.substring(2));
			if (numList.length) {
				document.getElementById('xBacklash').innerHTML = "Horz: " + numList[0];
				document.getElementById('yBacklash').innerHTML = "Vert: " + numList[1];
			}
		} else if (cmd == 's') {	// Receiving size info
			document.getElementById('etchSize').innerHTML = "<h4>Etch A Sketch</h4>" + data.substring(2);
		}	
		document.getElementById('receivedText').value += ('\n' + data);
		//alert(data);
	}
}

// If I ever decide to convert polygons to paths, this function will be useful.
// currently it is unused
var convertAllPolysToPaths = function() {
	var polys = document.querySelectorAll('polygon,polyline');
	[].forEach.call(polys,convertPolyToPath);

	function convertPolyToPath(poly){
	  var svgNS = poly.ownerSVGElement.namespaceURI;
	  var path = document.createElementNS(svgNS,'path');
	  var points = poly.getAttribute('points').split(/\s+|,/);
	  var x0=points.shift(), y0=points.shift();
	  var pathdata = 'M'+x0+','+y0+'L'+points.join(' ');
	  if (poly.tagName=='polygon') pathdata+='z';
	  path.setAttribute('d',pathdata);
	  poly.parentNode.replaceChild(path,poly);
	}
}


var nodeToCmdList = function(node, scaleFactor, cmdList) {
	allPoints = "";
	var children = node.childNodes;
	for (var i = children.length-1; i >= 0; i--) {
		var child = children[i];
		if (child.nodeType != 1) continue; // skip anything that isn't an element
		parent = child.parentNode;
		switch(child.nodeName) {
			case 'g':  // Recursively blow out child nodes that are groups - may not work with transforms
				allPoints += nodeToCmdList(child, scaleFactor, cmdList);
				break;
			case 'circle':
			case 'eclipse':
			case 'line':
			case 'polyline':
			case 'polygon':
			case 'rect':
				alert("can't convert element of type " + child.NodeName + " to path");
				break;
			case 'path':
				var len = child.getTotalLength();
				var CTM = child.getScreenCTM();
				// p0 = SVG coords, p = screen coords
				var p0, p; 
				var stp = "";
				// The smaller the spacing the closer the sampling points we take along the path
				var spacing = 1;
				for (var j = 0; j < len; j += spacing) {
					p0 = child.getPointAtLength(j);
					p = p0.matrixTransform(CTM);
					stp += (" " + p0.x + "," + p0.y);
					cmdList.push(makeCmdString('L', p.x*scaleFactor, p.y*scaleFactor));
				}
				allPoints += (" " + stp);
				parent.removeChild(child);
				break;
		}
	}
	return allPoints;
}

// Converts the current SVG to a list of drawing commands for the etch a sketch
var svgToCmdList = function(svg, display, cmdList) {
	var svgNS = "http://www.w3.org/2000/svg"; 
	// Reset the cmdlist
	cmdList.length = 0;
	var allPoints = "0 0";    // Starts drawing at origin
	cmdList.push('E');  // Start by erasing Etch-a-sketch
	cmdList.push('L 0 0');
	
	var scaleFactor = getScaleFactor(display);
	allPoints += nodeToCmdList(svg, scaleFactor, cmdList);

	// Last command returns pen to origin - may want to take a cleaner route back (TBD???)
	cmdList.push(makeCmdString('L', 0, 0)); 
	cmdList.push('O EHV');  // Turn off motors when done
	
	// Replace the current paths with a single, black line with no fill
	var myPath = document.createElementNS(svgNS, "polyline");
	myPath.setAttributeNS(null, "fill", "#FFFFFF");
	myPath.setAttributeNS(null, "stroke", "#000000");
	myPath.setAttributeNS(null, "stroke-width", "0.5");
	myPath.setAttributeNS(null, "points", allPoints);
	parent.appendChild(myPath);
	
	return cmdList.length;
}


// Returns the relative scale of Etch-a-Sketch display to image
var getScaleFactor = function(display) {
	var scaleFactor = 1.0;
	var etchCanvas = document.getElementById('theCanvas');
	var h = etchCanvas.height;
	var w = etchCanvas.width;
	
	if (h/w > display.size[1]/display.size[0]) {
		scaleFactor = display.size[1]/h;
	} else {
		scaleFactor = display.size[0]/w;
	}
	return scaleFactor;
}

// Turns user drawn points from the screen into a list of commands
var pointsToCmdList = function(points, display, cmdList) {
	// Clear out old points from list
	cmdList.length = 0;
	
	// Compute the relative scale of display to image
	var scaleFactor = getScaleFactor(display);
	
	// Loop over the list of lines, and create an instruction string to send
	// out via the socket.
	// Canvas and display both have origin at (0,0) - don't need to recenter
	// points, only need to rescale them.
	cmdList.push("E"); // First cmd - erase old points
	for (var i = 0; i < points.clickX.length; i++) {
		cmdList.push(makeCmdString('L', points.clickX[i]*scaleFactor, points.clickY[i]*scaleFactor));
	}
	cmdList.push(makeCmdString('L', 0, 0));  // Last cmd - return to origin
	return cmdList.length;
}

// Resizes a raster image to size (w, h)
function resizeImage(im, w, h) {
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	var context = canvas.getContext('2d');
	context.drawImage(im, 0, 0, w, h);
	return canvas.toDataURL();
}
  
// Returns a grayscale version of the raster image passed in
function makeGrayscaleImage(im) {
	var canvas = document.createElement('canvas');
	var w = im.naturalWidth;
	var h = im.naturalHeight;
	canvas.width = w;
	canvas.height = h;
	var context = canvas.getContext('2d');
	context.drawImage(im, 0, 0 );
	var imgPixels = context.getImageData(0, 0, w, h);
	 
	for (var y = 0; y < h; y++) {
		for (var x = 0; x < w; x++) {
			var i = (y*4) * w + x*4;
			var avg = (imgPixels.data[i] + imgPixels.data[i+1] + imgPixels.data[i+2])/3;
			imgPixels.data[i] = avg;
			imgPixels.data[i+1] = avg;
			imgPixels.data[i+2] = avg;
		}
	}

	// Can probably use image_src tag to resize displayed data (TBD)
	context.putImageData(imgPixels, 0, 0, 0, 0, w, h);
	return canvas.toDataURL();
}


// Converts the raster image to a series of drawing commands
var imgToCmds = function(img, display, cmdList) {
	// Clear out any old points from cmdList
	cmdList.length = 0;
	
	// Image parameters - these give scaled height
	var w = img.naturalWidth;
	var h = img.naturalHeight;
	//alert("width = " + w + " height = " + h );

	// Create a virtual canvas for image manipulation and access to individual pixels
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	var context = canvas.getContext('2d');
	context.drawImage(img, 0, 0 );
	var imgPixels = context.getImageData(0, 0, w, h);
	
	// Find the max/min image intensity values
	var inMax = Math.max.apply(null, imgPixels.data);
	var inMin = Math.min.apply(null, imgPixels.data);
	var inRange = inMax - inMin;
	//alert("Max = " + inMax + "  Min = " + inMin);

	// Compute the relative scale of display to image
	// Compare image aspect ratio to canvas aspect ratio.
	// Then scaleFactor up the image to MAXIMSIZE pixels 
	// on the largest side.  Add a slight margin for error 
	// to make sure we don't exceed boundaries
	var scaleFactor = 1.0;
	var margin = 200.0;
	var maxStrokes = 6;  // Max density of strokes per pixel.
	//alert ("image height  = " + h + " image width = " + w);
	if (1.0*h/w > 1.0*display.size[1]/display.size[0]) {
		scaleFactor = (display.size[1] - margin)/h;
		//alert("Height scale factor = " + scaleFactor);
	} else {
		scaleFactor = (display.size[0] - margin)/w;
		//alert("Width scale factor = " + scaleFactor);
	} 

	// Compute starting point of image
	var startx = display.center[0] - w*scaleFactor/2;
	var starty = display.center[1] - h*scaleFactor/2;

	// Start by erasing etch-a-sketch and moving to first point
	cmdList.push(makeCmdString('E', 0, 0));
	cmdList.push(makeCmdString('L', startx, starty));
	
	// Compute lines to draw each pixel in the image
	var jh = scaleFactor;	// Maximum jitterHeight
	//alert("jitterheight = " + jh);
	
	var LEFT_TO_RIGHT = 1;
	var RIGHT_TO_LEFT = -1;
	var direction;
	
	// Iterate over rows
	for (var j = 0; j < h; j++) {
	
		if ((j%2) == 0) direction = LEFT_TO_RIGHT;  // First row is alwyas left to right
		else direction = RIGHT_TO_LEFT;
		
		var rowBaseY = starty + j*scaleFactor;  // Y-coordinate of row base
		// Copy the current row's intensity values into an array
		var rowPixels = [];
		var rowStart = j*w;
		var rowEnd = (j+1)*w;
		for (var i = rowStart; i < rowEnd; i++) {
			rowPixels.push(imgPixels.data[i*4]);
		}
		if (direction == RIGHT_TO_LEFT) rowPixels.reverse();

		// X coordinate of first pixel in row
		var rowStartX;
		if (direction == LEFT_TO_RIGHT) rowStartX = startx;
		else rowStartX = startx + w*scaleFactor;
		
		// Move to first pixel in new row
		cmdList.push(makeCmdString('L', rowStartX, rowBaseY));
		// Traverse the row
		for (var i = 0; i < w; i++) {
			var val = rowPixels[i];
			var intensity = (inMax - val)/inRange;
			var jitter = Math.round(maxStrokes*intensity);
			if (jitter == 0) {
				cmdList.push(makeCmdString('L', rowStartX + direction*(i+1)*scaleFactor, rowBaseY));
			} else {
				var jitterWidth = scaleFactor/jitter;
				var dx = jitterWidth/2;
				var jhscale = jh*intensity;
				var pixelStartX = rowStartX + direction*i*scaleFactor;
				for (var k = 0; k < jitter; k++) {
					cmdList.push(makeCmdString('L', pixelStartX + k*jitterWidth*direction, rowBaseY + jhscale));
					cmdList.push(makeCmdString('L', pixelStartX + (k*jitterWidth +dx)*direction, rowBaseY + jhscale));
					cmdList.push(makeCmdString('L', pixelStartX + (k*jitterWidth+dx)*direction, rowBaseY));
					cmdList.push(makeCmdString('L', pixelStartX + (k*jitterWidth + 2*dx)*direction, rowBaseY))
				}
			}
		}
	}
	// When done, send pen back to origin
	cmdList.push(makeCmdString('L', display.origin[0], starty + scaleFactor*h));
	cmdList.push(makeCmdString('L', display.origin[0], display.origin[1]));
	cmdList.push('O HV');	// Command to turn off motors once we've arrived there
}


// Converts the image to Grayscale, downsizes resolution, and obtains drawing commands
var imgToCmdList = function(img, display, cmdList) {
	
	
	// Rescale the image - max resolution =  display.pixels
	var newHeight, newWidth;
			
	// Figure out new image dimensions
	if (img.naturalWidth > img.naturalHeight) {
		newWidth = display.maxPixels;
		newHeight = (img.naturalHeight/img.naturalWidth)*display.maxPixels;
	} else {
		newHeight = display.maxPixels;
		newWidth = (img.naturalWidth/img.naturalHeight)*display.maxPixels;
	}
	// Resize, then grayscale the image
	img.src = resizeImage(img, newWidth, newHeight);
	img.src = makeGrayscaleImage(img);
	
	// Display a pixelated version of the image
	
	// Scale to fit inside the div box - first get div box dimensions
	var disp = document.getElementById('imageDisplay');
	var style = getComputedStyle(disp);
	var hDiv = parseInt(style.getPropertyValue("height"));
	var wDiv = parseInt(style.getPropertyValue("width"));
	
	// Display the grayscale image, using a context to scale it up without interpolation
	disp.innerHTML =  "";
	var canvas = document.createElement('canvas');
	canvas.width = wDiv;
	canvas.height = hDiv;
	disp.appendChild(canvas);
	var ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.drawImage(img, (wDiv - img.width)/2 , (hDiv - img.height)/2, img.width, img.height);
	imgToCmds(img, display, cmdList);

	return cmdList.length;
}

// Convert an image to a list of drawing commands
var convertToData = function(img, points, cmdList, display) {
	return function(evt) {
		var nPts = 0;
		if (getDisplayMode() == "draw") {
			nPts = pointsToCmdList(points, display, cmdList);
		} else if (isDisplayingSVG(display)) {
			nPts = svgToCmdList(document.getElementsByTagName('svg')[0], display, cmdList);
		} else if (img.complete) {
			nPts = imgToCmdList(img, display, cmdList);
		} else {
			alert("No image to convert yet");
		}
		
		// Set the value of the textarea to the drawing instructions
		var cmdString = "";
		for (var i = 0; i < cmdList.length; i++) {
			cmdString += (cmdList[i] + '\n');
		}
		document.getElementById('sentText').value = "Commands to Send\n" + cmdString;
		if (nPts > 0) document.getElementById('sendData').disabled = false;
	}
}

// Send list of commands to the browser
var sendDrawingData = function(socket, cmdList, canvasPoints) {
	return function(evt) {
		var cmdString = "";
		for (var i = 0; i < cmdList.length; i++) {
			cmdString += (cmdList[i] + '\n');
		}
		socket.emit('cmds', cmdString);
		
		// Reset cmdList once sent
		cmdList.length = 0;
		// Reset the list of points if any
		canvasPoints.clearPoints();
		// Deactivate the send button
		document.getElementById('sendData').disabled = true;
		// Clear out any old received commands
		document.getElementById('receivedText').value = "Received Response";
	}
}

//  Main Function - will run when the page loads
window.onload = function () {

    // Create object canvasPoints to hold list of points, with member 
	// functions to draw them into the canvas context
	var canvasPoints = {
		clickX : [0],
		clickY : [0], 
		paint : false,
		drawPoints : function(cvs) {
			//cvs = document.getElementById('theCanvas');
			var ctx = cvs.getContext("2d");
			ctx.clearRect(0, 0, cvs.width, cvs.height);
			ctx.strokeStyle = 'black';
			ctx.beginPath();
			ctx.moveTo(this.clickX[0], this.clickY[0]);
			for (var i = 0; i < this.clickX.length; i++) {
				ctx.lineTo(this.clickX[i], this.clickY[i]);
				ctx.moveTo(this.clickX[i], this.clickY[i]);
			}
			ctx.stroke();
			ctx.closePath();				
		},
		addPoint : function(x, y) { this.clickX.push(x); this.clickY.push(y); },
		clearPoints : function() { this.clickX = [0]; this.clickY = [0]; this.paint = false; },
		setPaint : function(p) { this.paint = p; }
	};	
	
	// Register some listeners for the canvas and the erase button
	var canvas = document.getElementById('theCanvas');
	canvas.addEventListener('mousedown', onCanvasMouseDown(canvasPoints));
	canvas.addEventListener('mouseup', onCanvasMouseUp(canvasPoints));
	canvas.addEventListener('mousemove', onCanvasMouseMove(canvasPoints));
	canvas.addEventListener('mouseleave', onCanvasMouseLeave(canvasPoints));
	document.getElementById('eraseLast').addEventListener('click', onClickEraseLast(canvas, canvasPoints));
	document.getElementById('erase').addEventListener('click', onClickErase(canvas, canvasPoints));

	// Start in drawing mode
	setDrawMode();
	
	
	// Register event listener for the select element
	document.getElementById('drawMode').addEventListener('change', switchModes);
	
	var img = new Image();
	var cmdList = [];					// List of drawing commands to send to plotter
	var display = {						// Display parameters
		type:"Etch-a-Sketch",
		origin:[0,0],	   // Upper left
		size:[6000,4000],  // Actual size in steps with 2048 steps/rev
		maxPixels:48   // Maximum pixels resolution on a side of the image
	};
	display.center = [(display.origin[0] + display.size[0])/2, (display.origin[1] + display.size[1])/2];
	
	// Create socket.  User server's local ip address if connecting from remote machine,
	// otherwise use localhost if connecting from this machine.
	//var socket = io.connect('http://192.168.1.16:8000')
	var socket = io.connect('http://localhost:8000');
	// Set socket listener
	socket.on('notification', onSocketNotification(display));
	socket.on('connect', function(s) { 
							this.emit('cmds', "D"); 	// Request drawing dimensions
							this.emit('cmds', "b"); 	// Request backlash values
							this.emit('cmds', "s");		// Request size
							}); 
	
	
	// Event handler for file select element
	document.getElementById('files').addEventListener('change', onFileSelect(img));
	document.getElementById('imToData').addEventListener('click', convertToData(img, canvasPoints, cmdList, display));
	document.getElementById('sendData').addEventListener('click', sendDrawingData(socket, cmdList, canvasPoints));
	document.getElementById('setBacklash').addEventListener('click', onClickSetBacklash(socket));}
