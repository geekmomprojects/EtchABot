var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  url = require('url'),
  rl = require('readline'),
  serialport = require("serialport"),
  // Cache of commands to send to arduino
  cmdList = [];
   
  
  // User should have specified portname as an argument
  var portName = null;
  var useSerialPort = false;
  if (process.argv.length > 2)  {
	portName = process.argv[2];
	useSerialPort = true;
  } else {
	console.log("Please provide serial port name as argument.  Starting without port access.");
	//process.exit(1);
  }
 
  // localize object constructor for serial port
  var SerialPort = serialport.SerialPort;
  if (useSerialPort) {
	  var sp = new SerialPort(portName, {
		baudRate: 57600,
		parser: serialport.parsers.readline("\r\n")
	  }, false);	// Don't open serial port immediately so we can check for errors when we do
	 
	  sp.open(function(err) {
		if (err) {
			console.log('Serial port ' + portName +' failed to open: ' + err);
			//process.exit(1);
		} else {
			console.log('Successfully opened serial port ' + portName);
			// Register event handlers
			sp.on('data', onSpData);
			sp.on('error', function(err) {
				console.error('Serial port error', err);
			});
			sp.on('close', function(err) {
				console.log('Port closed!');
			});
		}
	  });
  }
  var arduinoMessage = '';  // Contains the message string dispatched by Arduino
  var STATUS_WAITING = 1;
  var STATUS_NOT_WAITING = 0;
  var status = STATUS_NOT_WAITING;  // Whether or not the Arduino is ready to receive commands
  var browserSocket = null;  // Will initialize this variable once connected to a browser
  
  /**
   * helper function to load any app file required by client.html
   * @param  { String } pathname: path of the file requested to the nodejs server
   * @param  { Object } res: http://nodejs.org/api/http.html#http_class_http_serverresponse
   */
  var readFile = function(pathname, res) {
    // an empty path returns client.html
    if (pathname === '/')
      pathname = 'client.html';
	
	// right now there is only the client.html file, but we could serve others in the future
    fs.readFile('./Node Files/client/' + pathname, function(err, data) {
      if (err) {
        console.log(err);
        res.writeHead(500);
        return res.end('Error loading client.html');
      }
      res.writeHead(200);
      res.end(data);
    });
  };
  
  /**
   *
   * This function is used as proxy to print the arduino messages into the nodejs console and on the page
   * @param  { Buffer } buffer: buffer data sent via serialport
   * @param  { Object } socket: it's the socket.io instance managing the connections with the client.html page
   *
   */
  var sendMessage = function(buffer, socket) {
    
      // send the message to the client
      socket.volatile.emit('notification', arduinoMessage);
    
  };
  
   /**
   *
   * This function receives the list of drawing commands from the client and adds them to the current list
   * if there is one.
   * 
   * @param  { List of String } cmds: list of commands to send to the arduino, in newline separated form
   *
   */
 var handleCmdList = function(cmds) {
	
	//console.log("in handle cmd List");
	if (cmdList.length) {
		cmdList.concat(cmds.split('\n'));
	} else {
		cmdList = cmds.split('\n');
	}
	//console.log("holding " + cmdList.length + " commands ");
	if (status == STATUS_WAITING) {
		sendNextCommand();
	} else {
		// TBD - replace this with something more elegant - for now, check
		//  to see if the command queue is empty
		//sp.write("S;");
	}
 };
 
 function sendNextCommand()  {
	//console.log("in send next command");
	if (cmdList.length) {
		var cmd = cmdList.shift();
		if (cmd.length) {
			//console.log("Sending command: " + cmd);
			sp.write(cmd + ";");
			status = STATUS_NOT_WAITING;
		}
	} else {
		// TBD - add a check so that we don't hang if there are no commands in the queue
		console.log("No commands in queue to send");
	}
 }
 
// Creating a new websocket - we need to maintain the command list, and dispatch commands to the Arduino
//  when there is demand.  Data comes from Arduino - commands come from client.
io.sockets.on('connection', function(socket) {

	// Store the connection to the most recent browser to connect.  
	// Right now I think this means we can only connect to one browser at a time
	browserSocket = socket;
	// listen to all the messages coming from the client.html page
	socket.on('cmds', handleCmdList);
	// register handlers
	socket.on('disconnect', function() {
	console.log("Socket disconnected");
  });
});

// Handles data from the serial port
var onSpData = function(data) {
	// TBD - Parse data from Arduino, see if it is request for commands
	arduinoMessage += data.toString();
	if (arduinoMessage[0] == '#') {	// Informational message from arduino
		console.log("Arduino message: " + arduinoMessage);
		// Only send message to browser if we are connected
		if (browserSocket && (browserSocket.connected)) {
			sendMessage(arduinoMessage, browserSocket);
		}
	} else if (arduinoMessage == "OK") {
		//console.log("Arduino OK");
		status = STATUS_WAITING;
		sendNextCommand();
	} else {
		console.log("Non-matching Arduino message->" + arduinoMessage + "<-");
	}
	arduinoMessage = '';
}


// Time to run!
// creating the server ( localhost:8000 if client is on server, or 'server-ip':8000 on remote client )
  app.listen(8000);
  console.log("Server started on port 8000");
// server handler
function handler(req, res) {
  // Serve favicon file when requested
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
	var img = fs.readFileSync('./favicon.ico');
    res.end(img, 'binary');
    //console.log('favicon requested');
    return;
  }
  // Serve the requested page
  readFile(url.parse(req.url).pathname, res);
  //console.log("handler got request");
}