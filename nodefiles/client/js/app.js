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
var onCanvasMouseClick = function(canvasPoints) {
	return function(e) {
		canvasPoints.addPoint(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
		canvasPoints.drawPoints(this);
	}
}

// Scope preserving wrapper for canvas callback function
var onCanvasMouseDown = function(canvasPoints) {
	return function(e) {
		canvasPoints.setPaint(true);
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

// Scope preserving wrapper for canvas callback functions
var onClickErase = function(canvas, canvasPoints) {
	return function(e) {
		canvasPoints.reset();
		canvasPoints.setPaint(false);
		canvasPoints.drawPoints(canvas);
	}
}

var onClickEraseLast = function(canvas, canvasPoints) {
	return function(e) {
		if (canvasPoints.nPoints() > 1 ) {
			canvasPoints.popPoint();
			canvasPoints.drawPoints(canvas);
		}
	}
}

// Check for integer.  Function lifted from:
// http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

// Helper function for setting backlash to valid values
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
				svg.setAttribute('class', "svgDisplay");
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

// Function to display what is currently being drawn on the screen.
// TBD - write this function
var drawStylusPosition = function(data) {
	// Get the context to draw the line at
	var imDisp = document.getElementById('imDisplay');
	
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
		} else if (cmd == 'b' || cmd == 'B') {  //Receiving backlash info
			var numList = getIntegersFromString(data.substring(2));
			if (numList.length) {
				document.getElementById('xBacklash').innerHTML = "Horz: " + numList[0];
				document.getElementById('yBacklash').innerHTML = "Vert: " + numList[1];
			}
		} else if (cmd == 's') {	// Receiving size info
			document.getElementById('etchSize').innerHTML = "<h4>Etch A Sketch</h4>" + data.substring(2);
		}	else if (cmd == 'L' || cmd == 'M' || cmd == 'l' || cmd == 'm') {
			// Mark the currently drawn line in red if we're drawing an svg or the currently
			// drawn pixel if it is an image.
			drawStylusPosition(data);
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

// Appends points in current node and its children to coordList - a list of [x,y]
// coordinate pairs.  Returns a bounding box with min/max x,y values of the node points.
var nodeToCoords = function(node, coordList, hOffset, vOffset) {

	var children = node.childNodes;
	for (var i = children.length-1; i >= 0; i--) {
		var child = children[i];
		if (child.nodeType != 1) continue; // skip anything that isn't an element
		var parent = child.parentNode;
		switch(child.nodeName) {
			case 'g':  // Recursively expand child nodes that are part of groups
				nodeToCoords(child, coordList, hOffset, vOffset);
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
				// Eventually should put in variable spacing for smaller SVGs
				var spacing = 1;
				if (len < 50) spacing = len/100.0;  // Scale down for small scale SVGs
				for (var j = 0; j < len; j += spacing) {
					p0 = child.getPointAtLength(j);
					p = p0.matrixTransform(CTM);
					// Must subtract out window origin
					p.x -= hOffset;
					p.y -= vOffset;
					if (j == 0) {
						coordList.push([p.x, p.y, 'M']);  //"move" command to get to beginning of each new path
					} else {
						coordList.push([p.x, p.y, 'L']);  //"line" command to traverse path
					}
				}
				parent.removeChild(child);
				break;
		}
	}
}

// Helper function to return the border width of a page element
var getBorderWidth = function(el) {
	var border = getComputedStyle(el, null).border;
	alert(border);
	if (border === null || border === "") return 0;
	var parts = border.split(' ');
	for (i = 0; i < parts.length; i++) {
		if (parts[i].indexOf('px') > 0) {
			return parseInt(parts[i]);
		}
	}
}

// Converts the current SVG to a list of drawing commands for the etch a sketch
var svgToCmdList = function(svg, display, cmdList) {

	// Get canvas and context for drawing
	// Scale to fit inside the div box - first get div box dimensions
	var disp = document.getElementById('imageDisplay');
	var style = getComputedStyle(disp);
	var hDiv = parseInt(style.getPropertyValue("height"));
	var wDiv = parseInt(style.getPropertyValue("width"));
	
	// Find origin of image display relative to page
	var boundingRect = disp.getBoundingClientRect();
	var borderWidth  = getBorderWidth(disp);
	var offsetX = boundingRect.left + borderWidth;
	var offsetY = boundingRect.top + borderWidth;

	// Reset the cmdlist
	cmdList.length = 0;
	cmdList.push('E');  // Start drawing commands by erasing Etch-a-sketch
	cmdList.push('M 0 0');  // Go to origin
	
	// Get scale factor between display and Etch A Sketch coordinates
	var scaleFactor = getScaleFactor(display);
	//alert("ScaleFactor = " + scaleFactor);
	
	// Compute the new screen coords
	var screenCoords = [];
	nodeToCoords(svg, screenCoords, offsetX, offsetY);
	
	// Comvert screen coords to command list
	for (var i = 0; i < screenCoords.length; i++) {
		cmdList.push(makeCmdString(screenCoords[i][2], screenCoords[i][0]*scaleFactor, screenCoords[i][1]*scaleFactor));
	}
	
	// Get new drawing context and canvas
	disp.innerHTML =  "";
	var canvas = document.createElement('canvas');
	canvas.width = wDiv;
	canvas.height = hDiv;
	disp.appendChild(canvas);
	var ctx = canvas.getContext("2d");

	// Last command returns pen to origin - may want to take a cleaner route back (TBD???)
	cmdList.push(makeCmdString('M', 0, 0)); 
	cmdList.push('O EHV');  // Turn off motors when done

    // Render drawing commands to screen.  Red lines indicate 'Move', and
	//  black lines indicate 'Line'
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.moveTo(0,0);
	for (var i = 0; i < screenCoords.length-1; i++) {
		var p = screenCoords[i];
		var curDrawMode = p[2];
		var nextDrawMode = screenCoords[i+1][2];
		if (nextDrawMode == curDrawMode) {
			ctx.lineTo(Math.round(p[0]), Math.round(p[1]));
		} else {
			//alert(curDrawMode);
			ctx.lineTo(Math.round(p[0]), Math.round(p[1]));
			ctx.strokeStyle = (curDrawMode == 'M' ? 'Red' : 'Black');
			ctx.lineWidth = 0.5;
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(Math.round(p[0]), Math.round(p[1]));
		}
	}
	var p = screenCoords[screenCoords.length-1];
	ctx.lineTo(Math.round(p[0]), Math.round(p[1]));
	ctx.strokeStyle = (p[2] == 'M' ? 'Red' : 'Black');
	ctx.lineWidth = 0.5;
	ctx.stroke();

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
			var avg;
			if (imgPixels.data[i+3] == 0) {
				avg = 0;  // If completely transparent, should appear white
			} else {
				avg = (imgPixels.data[i] + imgPixels.data[i+1] + imgPixels.data[i+2])/3;
			}
			imgPixels.data[i] = avg;
			imgPixels.data[i+1] = avg;
			imgPixels.data[i+2] = avg;
			// Eliminate transparency in alpha channel
			//imgPixels.data[i+3] = 255;
		}
	}

	// Can probably use image_src tag to resize displayed data (TBD)
	context.putImageData(imgPixels, 0, 0, 0, 0, w, h);
	return canvas.toDataURL();
}

// Converts the raster image to a series of drawing commands
//  that renders the current image crosshatch style.  Not for
//  use with EtchABot, but works well with a V-plotter 
var imgToCrosshatchCmds = function(img, display, cmdList) {
	// Clear out any old points from cmdList
	cmdList.length = 0;
}

// Converts the raster image to a series of drawing commands
//  which render the image in back and forth "jitter" style
//  where the height of the "jitter" corresponds to the darkness
//  of the pixel.
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
	var inMax = imgPixels.data[0];
	var inMin = imgPixels.data[0];
	var nPixels = w*h;
	for (var i = 1; i < nPixels; i++) {
		var pixVal = imgPixels.data[i*4];
		if (pixVal > inMax) {
			inMax = pixVal;
		} else if (pixVal < inMin) {
			inMin = pixVal;
		}
	}
	// Get range of values
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
	
		if ((j%2) == 0) direction = LEFT_TO_RIGHT;  // First row is always left to right
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
		cmdList.push(makeCmdString('M', rowStartX, rowBaseY));
		// Traverse the row
		for (var i = 0; i < w; i++) {
			var val = rowPixels[i];
			var intensity = (inMax - val)/inRange;		// White (hightest val) gets smallest jitter
			var jitter = Math.round(maxStrokes*intensity);
			//alert("j = " + j + " i = " + i + " val = " + val + " jitter = " + jitter);
			if (jitter == 0) {
				cmdList.push(makeCmdString('L', rowStartX + direction*(i+1)*scaleFactor, rowBaseY));
			} else {
				var jitterWidth = scaleFactor/jitter;
				var dx = jitterWidth/2;
				var jhscale = jh*jitter/maxStrokes;  // try scaling jitter height with intensity
				//var jhscale = jh;
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
	
	// Get drawing context of the canvas
	disp.innerHTML =  "";
	var canvas = document.createElement('canvas');
	canvas.width = wDiv;
	canvas.height = hDiv;
	disp.appendChild(canvas);
	var ctx = canvas.getContext("2d");
	
	// Let user know they might wait while converting image to commands
	// TBD - this doesn't work - figure out why
	ctx.font = "40px Arial";
	ctx.fillStyle = "red";
	ctx.textAlign = "center";
	ctx.fillText("Please wait.  Converting image...", canvas.width/2, canvas.height/2); 
	
	// Convert image to list of commands
	imgToCmds(img, display, cmdList);
	
	// Draw pixelated grayscale image
	// Use a context to scale it up without interpolation
	ctx.imageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, (wDiv - img.width)/2 , (hDiv - img.height)/2, img.width, img.height);
	
	// return
	return cmdList.length;
}

// Convert an image to a list of drawing commands
var convertToData = function(img, points, cmdList, display) {
	return function(evt) {
		var nPts = 0;
		
		// Warn user about wait - this might take a while
		if (getDisplayMode() == "draw"  && points.nPoints() > 1) {
			nPts = pointsToCmdList(points, display, cmdList);
		} else if (isDisplayingSVG(display)) {
			nPts = svgToCmdList(document.getElementsByTagName('svg')[0], display, cmdList);
		} else if (img.src != "" && img.complete) {
			nPts = imgToCmdList(img, display, cmdList);
		} else {
			alert("No drawing in display area");
			return;
		}

		// Set the value of the textarea to the drawing instructions
		var cmdString = "";
		for (var i = 0; i < cmdList.length; i++) {
			cmdString += (cmdList[i] + '\n');
		}
		document.getElementById('sentText').value = "Commands to Send\n" + cmdString;
		if (nPts > 0) {
			document.getElementById('sendData').disabled = false;
		}
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
		// Only add new point if it differs from the last one
		addPoint : function(x, y) { if (x != this.clickX[this.nPoints()-1] || y != this.clickY[this.nPoints()-1]) {
									   this.clickX.push(x); 
									   this.clickY.push(y); 
								       }
								  },		
		clearPoints : function() { this.clickX = [0]; this.clickY = [0]; this.paint = false; },
		nPoints : function() { return this.clickX.length; },
		popPoint : function() { return [this.clickX.pop(), this.clickY.pop()];},
		reset : function() { this.clickX = [0]; this.clickY = [0]; },
		setPaint : function(p) { this.paint = p; }
	};	
	
	// Register some listeners for the canvas and the erase button
	var canvas = document.getElementById('theCanvas');
	canvas.addEventListener('click', onCanvasMouseClick(canvasPoints));
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
	//var socket = io.connect('http://192.168.1.22:8000')
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
