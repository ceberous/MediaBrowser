var wEmitter = require('../main.js').wEmitter;
require('shelljs/global');
var path = require("path");

var ffWrapper = {

	instancePID: null,
	windowID: null,

	firstInit: function() {
		console.log("[FIREFOX] --> BOOT-initializing ffWrapper");
		setTimeout( ()=>{ 
			if ( !ffWrapper.checkIfFFIsOpen() ) {
				ffWrapper.launchFF();
			}
			ffWrapper.getWindowID();
			ffWrapper.activateWindowID();
			ffWrapper.setFocusWindow();
			ffWrapper.setFullScreen();

			setTimeout(function(){
				ffWrapper.openNewTab("http://localhost:6969"); // testing
			} , 30000 );			
		} , 8000 );

	},

	init: function() {
		console.log("[FIREFOX] --> initializing ffWrapper");
		ffWrapper.terminateFF();
		ffWrapper.launchFF();
		ffWrapper.getWindowID();
		ffWrapper.activateWindowID();
		ffWrapper.setFocusWindow();
		ffWrapper.setFullScreen();
	},

	checkIfFFIsOpen: function() {

		var ffBinaryLocation1 = '/usr/lib/firefox/firefox';
		var ffBinaryLocation2 = '/bin/sh -c firefox';
		var checkFFOpen = 'ps aux | grep firefox';
		var isFFOpen = exec( checkFFOpen , { silent:true , async: false }).stdout;
		isFFOpen = isFFOpen.split("\n");

		for (var i = 0; i < isFFOpen.length; ++i) {
			var wT = isFFOpen[i].split(" ");
			if ( wT[wT.length-1] === ffBinaryLocation1 ) {
				ffWrapper.instancePID = wT[1].toString();
				console.log("[FIREFOX] --> is OPEN");
				return true;
			}
			else if ( ( wT[wT.length-3] + " " + wT[wT.length-2] + " " + wT[wT.length-1] ) === ffBinaryLocation2 ){
				ffWrapper.instancePID = wT[1].toString();
				console.log("[FIREFOX] --> is OPEN");
				return true;
			}
		}
		console.log("[FIREFOX] --> is CLOSED");
		return false;
		
	},

	launchFF: function() {

		var isFFOpen = ffWrapper.checkIfFFIsOpen();
		var launchFFPath = path.join( __dirname , "ffLauncher.js"  );
		var lauchFFString = "node " + launchFFPath; 
		if (!isFFOpen) {
			console.log("[FIREFOX] --> Launching Firefox");
			exec( lauchFFString , {silent:true , async: false }).stdout;
			setTimeout( ()=>{ ffWrapper.checkIfFFIsOpen(); } , 2000 );
		}

	},

	terminateFF: function() {
		exec( "pkill -9 firefox" , {silent:true ,  async: false }).stdout;
		console.log("[FIREFOX] --> Killed Firefox");
		wEmitter.emit("firefoxClosed");
	},

	getWindowID: function() {
		
		var findFirefox = 'xdotool search --title "Mozilla Firefox"';
		var activeFFWindowID = exec( findFirefox , {silent:true , async: false }).stdout;
		ffWrapper.windowID = activeFFWindowID.trim();
		console.log(ffWrapper.windowID);

	},

	resetFocus: function() {
		ffWrapper.activateWindowID();
		ffWrapper.setFocusWindow();
	},

	restoreFullScreen: function() {
		ffWrapper.resetFocus();
		ffWrapper.setFullScreen();
	},

	activateWindowID: function() {
		var activateFFWindow = 'xdotool windowactivate ' + ffWrapper.windowID;
		exec( activateFFWindow , {silent:true ,  async: false}).stdout;
	},

	setFocusWindow: function() {

		var setFFAsFocus = 'xdotool windowfocus ' + ffWrapper.windowID;
		exec( setFFAsFocus , {silent:true , async: false }).stdout;

	},

	setFullScreen: function() {
	
		//var setToMaximumWindowDualScreen = 'xdotool windowsize %0' + ffWrapper.windowID + ' 100% 100%';
		var setToMaximumWindowSingleScreen = 'xdotool windowsize ' + ffWrapper.windowID + ' 100% 100%';
		exec( setToMaximumWindowSingleScreen , {silent:true , async: false}).stdout;
		
	},
	
	minimizeWindow: function() {
		var minimizeCMD = 'xdotool windowminimize ' + ffWrapper.windowID;
		exec( minimizeCMD , {silent:true , async: false}).stdout;
	},

	openNewTab: function(w_URL) {
		var openNewTab = 'firefox -new-tab ' + w_URL;
		exec( openNewTab , {silent:true , async: false }).stdout;	
	},

	closeCurrentTab: function() {
		var closeCurrentTab = 'xdotool key ctrl+w';
		exec( closeCurrentTab , {silent:true , async: false}).stdout;
	},
	
	moveMouseToCenterOfWindow: function() {
		var centerOfWindow2Screen = "xdotool mousemove --window %0 2537 510"
		exec( centerOfWindow2Screen , {silent:true , async: false }).stdout;
	},

	mouseLeftClick: function() {
		var click = "xdotool click 1"
		exec( click , {silent:true , async: false}).stdout;
	},

	pressSpaceKey: function() {
		var spaceKey = "xdotool key space";
		exec( spaceKey , {silent:true , async: false}).stdout;
	},

	glitchFullScreen: function() {
		ffWrapper.resetFocus();
		ffWrapper.moveMouseToCenterOfWindow();
		ffWrapper.mouseLeftClick();
		setTimeout(function() {
			var fKeyPress = 'xdotool key f';
			exec( fKeyPress , {silent:true , async: false}).stdout;
			console.log(fKeyPress);
			ffWrapper.pressSpaceKey();
		} , 1000 ); 
		
	},

	toggleFKeyPress: function() {
		ffWrapper.resetFocus();
		ffWrapper.moveMouseToCenterOfWindow();
		ffWrapper.mouseLeftClick();		
		setTimeout(function() {
			var fKeyPress = 'xdotool key f';
			exec( fKeyPress , {silent:true , async: false}).stdout;
			console.log( "[FIREFOX] --> " + fKeyPress );
			//ffWrapper.pressSpaceKey();
		} , 1000 ); 
		
	}	

};


// On Module-Import
ffWrapper.firstInit();

module.exports.init = function() {
	ffWrapper.init();
	setTimeout(function(){
		ffWrapper.openNewTab("http://localhost:6969"); // testing
	} , 3000 ); 
};

module.exports.minimizeWindow = function() {
    ffWrapper.minimizeWindow();
};

module.exports.restoreFullScreen = function() {
    ffWrapper.restoreFullScreen();
};

module.exports.quit = function() {
    ffWrapper.terminateFF();
};

module.exports.openNewTab = function(wURL) {
    ffWrapper.openNewTab(wURL);
};

module.exports.closeCurrentTab = function() {
    ffWrapper.closeCurrentTab();
};

module.exports.toggleFKeyPress = function() {
    ffWrapper.toggleFKeyPress();
};

module.exports.glitchFullScreen = function() {
    ffWrapper.glitchFullScreen();
};