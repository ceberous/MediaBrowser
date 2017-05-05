var wEmitter = require('../main.js').wEmitter;
var colors = require("colors");
var fs = require("fs");
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var spawn = require('child_process').spawn;
require('shelljs/global');


function getUSBDeviceEventPath() {

	var usbDeviceID = "usb-DragonRise_Inc._Generic_USB_Joystick-event-joystick";
	var findEventPath = 'ls -la /dev/input/by-id';
	var findEventPathCMD = exec( findEventPath , { silent:true , async: false });
	
	if ( findEventPathCMD.stderr.length > 1 ) { console.log( colors.green( "[BUTTON_MAN] --> ERROR --> " + findEventPathCMD.stderr  ) ); }

	findEventPathCMD = findEventPathCMD.stdout.split("\n");

	for (var i = 0; i < findEventPathCMD.length; ++i) {
		
		var wT = findEventPathCMD[i].split(" ");
		if ( wT[wT.length-3] === usbDeviceID ) {
			var wEvent = wT[wT.length-1].split("../");
			var wEventPath = 'eventPath = "/dev/input/' + wEvent[1] + '"';
			console.log( colors.green( "[BUTTON_MAN] --> " + wEventPath ) );
			fs.writeFileSync( path.join( __dirname , "py_scripts" , "usbDevicePath.py" ) , wEventPath );
			return true;
		}
		
	}

	return false;

}

if ( !getUSBDeviceEventPath() ) { throw new Error( "[BUTTON_MAN] --> Cannot Find USB-Buttton Controller" ); }

var buttonScript = path.join( __dirname , "py_scripts" , "buttonWatcher.py" );
var ButtonManager = spawn( 'python' , [buttonScript] );
console.log( "@@PID=" + ButtonManager.pid );

var lastPressed = new Date().getTime();
var timeNow;
var handleButtonInput = function(wInput) {

	timeNow = new Date().getTime();
	if ( ( timeNow - lastPressed ) < 3000 ) { console.log("pressed too soon"); return; }
	lastPressed = timeNow;

	switch(wInput) {

		case "1":
			//console.log("toggle Play / Pause");
			//MopidyManager.playbackManager.togglePlayPause();
			wEmitter.emit("button1Press");
			break;
		case "2":
			//console.log("previous");
			//MopidyManager.playbackManager.previous();
			wEmitter.emit("button2Press");
			break;
		case "3":
			//console.log("next");
			//MopidyManager.playbackManager.next();
			wEmitter.emit("button3Press");
			break;
        case "4":
        	//console.log("we got a 4");
        	wEmitter.emit("button4Press");
			break;
		case "5":
			//console.log("play random list");
			//MopidyManager.tracklistManager.setRandomList();
			wEmitter.emit("button5Press");
			break;
		case "6":
			//console.log("toggle suffle");
			//MopidyManager.tracklistManager.toggleShuffle();
			wEmitter.emit("button6Press");
			break;
		case "7":
			wEmitter.emit("button7Press");
			break;			
		case "8":
			wEmitter.emit("button8Press");
			break;
		case "9":
			wEmitter.emit("button9Press");
			break;
		case "10":
			wEmitter.emit("button10Press");
			break;			
		case "11":
			wEmitter.emit("button11Press");
			break;
		case "12":
			wEmitter.emit("button12Press");
			break;						
		default:
			break;
	}

};

ButtonManager.stdout.on( "data" , function(data) {
		var message = decoder.write(data);
		message = message.trim();
		handleButtonInput(message);
});


ButtonManager.stderr.on( "data" , function(data) {
		var message = decoder.write(data);
		message = message.trim();
		console.log( "[buttonWatcher.py] --> ERROR -->".green  );
		console.log(message);
		wEmitter.emit( "properShutdown" );
		setTimeout( ()=> { process.exit(1); } , 2000 );
});




setTimeout( function() {
	wEmitter.emit( "button11Press" );
} , 10000 );

/*
setTimeout( function() {
	wEmitter.emit( "button7Press" );
} , 20000 );

setTimeout( function() {
	wEmitter.emit( "button7Press" );
} , 25000 );

*/