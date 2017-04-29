var wEmitter = require('../main.js').wEmitter;
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
var spawn = require('child_process').spawn;
require('shelljs/global');

var windowWrapper = {

	windowID: null,

	init: function() {

		console.log("[SKYPE_MAN] --> wrapping skype window");
		windowWrapper.getWindowID();
		windowWrapper.activateWindowID();
		windowWrapper.setFocusWindow();
		windowWrapper.windowRaise();
		windowWrapper.setFullScreen();

	},

	getWindowID: function() {
	
		var findCallWindow = 'xdotool search --name "Call with"';
		var activeWindowID = exec( findCallWindow , {silent:true , async: false}).stdout;
		windowWrapper.windowID = activeWindowID.trim();
		console.log("[SKYPE_MAN] --> callWindowID = " + windowWrapper.windowID );

	},

	resetFocus: function() {
		windowWrapper.activateWindowID();
		windowWrapper.setFocusWindow();
	},

	activateWindowID: function() {
		var activateWindow = 'xdotool windowactivate ' + windowWrapper.windowID;
		exec( activateWindow , {silent:true , async: false}).stdout;
	},

	setFocusWindow: function() {

		var setAsFocus = 'xdotool windowfocus ' + windowWrapper.windowID;
		exec( setAsFocus , {silent:true , async: false}).stdout;

	},

	windowRaise: function() {
		var windowRaiseTopCMD = "xdotool windowraise " + windowWrapper.windowID;
		exec( windowRaiseTopCMD , {silent:true , async: false});
	},	

	setFullScreen: function() {
		
		//var setToMaximumWindowDualScreen = 'xdotool windowsize %1' + windowWrapper.windowID + ' 100% 100%';
		var setToMaximumWindowSingleScreen = 'xdotool windowsize ' + windowWrapper.windowID + ' 100% 100%';
		exec( setToMaximumWindowSingleScreen , {silent:true ,  async: false}).stdout;
		wEmitter.emit("skypeCallStarted");
		
	},

	closeWindow: function() {

		var closeWindowCMD = 'xdotool windowkill ' + windowWrapper.windowID;
		exec( closeWindowCMD , {silent:true , async: false}).stdout;

	},

	minimizeWindow: function() {
		var minimizeWindowCMD = 'xdotool windowminimize ' + windowWrapper.windowID;
		exec( minimizeWindowCMD , {silent:true , async: false}).stdout;
	},

};

var callScript = path.join( __dirname , "py_scripts" , "callFriend.py" );
var childPROC = null;
var childPROC_PID = null;
var childWrapper = {

	start: function() {
		childPROC = spawn( 'python' , [callScript] , {detatched: false} );
		console.log("[SKYPE_MAN] --> callFriend.py spawned");
		childPROC_PID = childPROC.pid;
		childPROC.stdout.on( "data" , function(data) {
			var message = decoder.write(data);
			message = message.trim();
			childWrapper.handleOutput(message);
		});
		childPROC.stderr.on( "data" , function(data) {
			var message = decoder.write(data);
			message = message.trim();
			console.log(message);
		});
	},

	handleOutput: function(wMesssage) {

		//console.log( "[SKYPE_MAN] --> " + wMesssage );
		switch( wMesssage ) {

			case "Call status: Never placed":
				childWrapper.regularCleanup();
				setTimeout( ()=> { childWrapper.start(); } , 2000 );
				break;

			case "API attachment status: Refused":
				childWrapper.regularCleanup();
				break;

			case "Call status: Sorry, call failed!":
				childWrapper.regularCleanup();
				break;

			case "Call status: Call in Progress":
				windowWrapper.init();
				break;

			case "Call status: Finished":
				childWrapper.regularCleanup();
				break;

			/*
			case "Call status: Cancelled":
				childWrapper.regularCleanup();
				break;


			case "Call status: Recording":
				childWrapper.voicemailCleanUp();
				break;
			*/

			case "Call status: Voicemail Has Been Sent":
				childWrapper.regularCleanup();
				break;

		}

	},

	regularCleanup: function() {
		// skype freaks out if you close the window ubruptly with xdotool so... we have to just minimize it
		// and wait for it to close on it's own.
		//windowWrapper.closeWindow();
		//windowWrapper.minimizeWindow();
		childPROC.kill();
		exec( "sudo kill -9 " + childPROC_PID.toString() , {silent:true ,  async: false} );
		//process.kill(childPROC_PID);
		wEmitter.emit("skypeCallOver");
	},

	voicemailCleanUp: function() {
		console.log("[SKYPE_MAN] --> waiting 5 seconds to record voicemail");
		setTimeout( function() {
			//windowWrapper.closeWindow();
			//windowWrapper.minimizeWindow();
			childPROC.kill();
			//process.kill(childPROC_PID);
			exec( "sudo kill -9 " + childPROC_PID.toString() , {silent:true ,  async: false} );
			wEmitter.emit("skypeCallOver");
		} , 5000 );
	}


};

//childWrapper.start();
module.exports.startCall = function() {  
	childWrapper.start();
};

module.exports.stopCall = function() {  
	childWrapper.regularCleanup();
};

module.exports.stopMedia = function() {  
	childWrapper.regularCleanup();
};

