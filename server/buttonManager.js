var wEmitter = require('../main.js').wEmitter;

var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var spawn = require('child_process').spawn;

var buttonScript = path.join( __dirname , "py_scripts" , "buttonWatcher.py" );
var ButtonManager = spawn( 'python' , [buttonScript] );

var handleButtonInput = function(wInput) {

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