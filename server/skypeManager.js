var wEmitter = require('../main.js').wEmitter;
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var spawn = require('child_process').spawn;
require('shelljs/global');

var windowWrapper = {

	windowID: null,

	init: function() {

		console.log("wrapping skype window");
		windowWrapper.getWindowID();
		windowWrapper.activateWindowID();
		windowWrapper.setFocusWindow();
		windowWrapper.setFullScreen();

	},

	getWindowID: function() {
	
		var findCallWindow = 'xdotool search --name "Call with"';
		var activeWindowID = exec( findCallWindow , {silent:true}).stdout;
		windowWrapper.windowID = activeWindowID.trim();
		console.log(windowWrapper.windowID);

	},

	resetFocus: function() {
		windowWrapper.activateWindowID();
		windowWrapper.setFocusWindow();
	},

	activateWindowID: function() {
		var activateWindow = 'xdotool windowactivate ' + windowWrapper.windowID;
		exec( activateWindow , {silent:true}).stdout;
	},

	setFocusWindow: function() {

		var setAsFocus = 'xdotool windowfocus ' + windowWrapper.windowID;
		exec( setAsFocus , {silent:true}).stdout;

	},

	setFullScreen: function() {
		
		//var setToMaximumWindowDualScreen = 'xdotool windowsize %0' + windowWrapper.windowID + ' 100% 100%';
		var setToMaximumWindowSingleScreen = 'xdotool windowsize ' + windowWrapper.windowID + ' 100% 100%';
		exec( setToMaximumWindowSingleScreen , {silent:true}).stdout;
		
	},

};

var callScript = path.join( __dirname , "py_scripts" , "callFriend.py" );
var childPROC = null;
var childWrapper = {

	start: function() {
		childPROC = spawn( 'python' , [callScript] );
		console.log("callFriend.py spawned");
		childPROC.stdout.on( "data" , function(data) {
			var message = decoder.write(data);
			message = message.trim();
			childWrapper.handleOutput(message);
		});
	},

	handleOutput: function(wMesssage) {

		console.log(wMesssage);
		switch( wMesssage ) {

			case "trying to add video":
				windowWrapper.init();
				break;

			case "Call status: Finished":
				// ensure child process gets killed
				wEmitter.emit("restoreFFWindow");
				break;

			case "Call status: Voicemail Has Been Sent":
				// kill child process
				wEmitter.emit("restoreFFWindow");
				break;

		}

		
	},


};

module.exports.startCall = function() {
    
	childWrapper.start();

};