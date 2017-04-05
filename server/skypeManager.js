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

	closeWindow: function() {

		var closeWindowCMD = 'xdotool windowkill ' + windowWrapper.windowID;
		exec( closeWindowCMD , {silent:true}).stdout;

	},

	minimizeWindow: function() {
		var minimizeWindowCMD = 'xdotool windowminimize ' + windowWrapper.windowID;
		exec( minimizeWindowCMD , {silent:true}).stdout;
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

			case "API attachment status: Refused":
				childWrapper.regularCleanup();
				break;

			case "trying to add video":
				windowWrapper.init();
				break;

			case "Call status: Finished":
				childWrapper.regularCleanup();
				break;

			case "Call status: Cancelled":
				childWrapper.regularCleanup();
				break;

			case "Call status: Recording":
				childWrapper.voicemailCleanUp();
				break;

			case "Call status: Voicemail Has Been Sent":
				childWrapper.regularCleanup();
				break;

		}

	},

	regularCleanup: function() {
		// skype freaks out if you close the window ubruptly with xdotool so... we have to just minimize it
		// and wait for it to close on it's own.
		//windowWrapper.closeWindow();
		windowWrapper.minimizeWindow();
		childPROC.kill();
		wEmitter.emit("skypeCallOver");
	},

	voicemailCleanUp: function() {
		console.log("waiting 10 seconds to record voicemail");
		setTimeout( function() {
			//windowWrapper.closeWindow();
			windowWrapper.minimizeWindow();
			childPROC.kill();
			wEmitter.emit("skypeCallOver");
		} , 10000 );
	}


};

module.exports.startCall = function() {
    
	childWrapper.start();

};