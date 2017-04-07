var fs = require('fs');
var path = require("path");

var wEmitter = require('../main.js').wEmitter;

var wTM = require("./taskManager.js"); 		// Task-Manager
var wFM = require("./ffManager.js");		// Firefox-Manager
var wVM = require("./videoManager.js"); 	// Video-Manager
var wMM = require("./mopidyManager.js"); 	// Mopidy-Manager
var wSM = require("./skypeManager.js"); 	// Skype-Manager
var wBM = require("./buttonManager.js"); 	// Button-Manager
var wIM = require("./usbIRManager.js"); 	// USB_IR-Manager
//var wVV = require("./vlcManager.js")		// VLC-Manager

wVM.updateYTLiveList();

var wCM =  {

	state: {
		yt: { background: false , live: false , standard: false , paused: false },
		twitch: { live: false , standard: false , paused: false },
		vlcVideo: { playing: false , paused: false },
		mopidy: { playing: false , paused: false },
		podcast: { playing: false , paused: false },
		skype: { activeCall: false },
		tvON: false,
		lastAction: null,
		currentAction: null,
		firefoxOpen: true,
	},

	prepare: function(wAction) {

		if ( !wCM.state.tvON ) {
			//wIM.togglePower();
			wCM.state.tvON = true;
		}

		if ( wCM.state.lastAction == null ) { wCM.state.lastAction = wAction; }
		else { wCM.state.lastAction = wCM.state.currentAction }
		wCM.state.currentAction = wAction;

		console.log( "LastAction = " + wCM.state.lastAction );
		console.log( "CurrentAction = " + wCM.state.currentAction );

		switch (wAction) {

			case "skype":
				if ( wCM.state.skype.activeCall ) { break; }
				console.log("preparing skype call");
				if ( wCM.state.firefoxOpen ) { wFM.quit(); wCM.state.firefoxOpen = false; }
				wCM.pauseAll();
				wCM.state.skype.activeCall = true;
				wSM.startCall();
				break;

			case "mopidyBGYT":
				if ( wCM.state.skype.activeCall ) { break; }
				console.log("preparing mopidy with YTLive Background Video");
				wCM.state.yt.background = true;
				wCM.state.mopidy.playing = true;
				wMM.randomPlaylist();
				if ( !wCM.state.firefoxOpen ) { 
					wCM.state.firefoxOpen = true;
					wFM.init();
					wEmitter.emit( 'queClientTaskOnReady' , 'playBackgroundYTLive' );
					break;
				}
				else {
					wEmitter.emit( 'socketSendTask' , 'playBackgroundYTLive' );
					break;
				}

			case "mopidy":

				break;

			case "youtubeFG":

				break;

			case "twitchFG":

				break;

			case "savedVideo":

				break;

			case "podcast":

				break;

		}

	},

	stopEverything: function() {

		if ( wCM.state.tvON ) {
			wIM.togglePower();
			wCM.state.tvON = false;
		}

		if ( wCM.state.yt.background ) { wTM.stopYTShuffleTask(); wCM.state.yt.background = false; }
		if ( wCM.state.firefoxOpen ) { wFM.quit(); wCM.state.firefoxOpen = false; }
		if ( wCM.state.mopidy.playing ) { wMM.closeMopidy(); wCM.state.mopidy.playing = false; }
		//if ( wCM.state.skype.activeCall ) { wSM.stopCall(); wCM.state.skype.activeCall = false; }
		//if ( wCM.state.vlcVideo.playing ) { wVV.stop(); wCM.state.vlcVideo.playing = false;  }


	},

	pauseAll: function() {
		wCM.pauseMopidy();
		wCM.pausePodcast();
		wCM.pauseVideo();
	},

	pauseMopidy: function() {
		if ( wCM.state.mopidy.playing ) { /*wMM.pause();*/ }
		wCM.state.mopidy.paused = true;
		wMM.pause();
	},

	pausePodcast: function() {
		if ( wCM.state.podcast.playing ) { /*wPM.pause();*/ }
		wCM.state.podcast.paused = true;
	},	

	pauseVideo: function() {

		if ( wCM.state.yt.background || wCM.state.yt.live.background  ) {
			wTM.stopYTShuffleTask();
			wEmitter.emit('closeChildView');
		}
		else if ( wCM.state.yt.standard ) {

		}
		else if ( wCM.state.twitch.live ) {

		}
		else if ( wCM.state.twitch.standard ) {

		}		
		else if ( wCM.state.vlcVideo.playing ) {

		}

	},


};

// 				Button-Event Handling
// --------------------------------------------------------------------
	wEmitter.on( 'button1Press' , function() { 
		console.log("now-playing--> random-edm-vocal");
		wCM.prepare( "mopidyBGYT" );
		//wEmitter.emit( 'socketSendTask' , 'playBackgroundYTLive' );
	});

	wEmitter.on( 'button2Press' , function() { 
		console.log("now-playing--> random-edm-nonvocal");
		// wEmitter.emit("mopidy-random-edm-nonvocal")
		wEmitter.emit( 'socketSendTask' , 'playBackgroundYTLive' );
	});

	wEmitter.on( 'button3Press' , function() { 
		console.log("now-playing--> random-classic-rock");
		// wEmitter.emit("mopidy-random-classic-rock")
		wEmitter.emit( 'socketSendTask' , 'playBackgroundYTLive' );
	});

	wEmitter.on( 'button4Press' , function() { 
		console.log("skype call cameron");
		fs.writeFileSync( path.join( __dirname , "py_scripts" , "wUserName.py" ) , "callingName = 'live:ccerb96'" );
		wCM.prepare( "skype" );
	});

	wEmitter.on( 'button5Press' , function() { 
		console.log("skype call collin");
		fs.writeFileSync( path.join( __dirname , "py_scripts" , "wUserName.py" ) , "callingName = 'collin.cerbus'" );
		wCM.prepare( "skype" );
	});

	wEmitter.on( 'button6Press' , function() { 
		console.log("\"Emergency\" Stop Everything");
		wCM.stopEverything();
	});	

	wEmitter.on( 'button7Press' , function() { 
		console.log("mopidy--> nextSong");
		// wEmitter.emit("")
	});	

	wEmitter.on( 'button8Press' , function() { 
		console.log("play standard YT Stream");
		// wEmitter.emit("")
		wEmitter.emit( 'socketSendTask' , 'stopBackgroundYTLive' );
		wEmitter.emit( 'socketSendTask' , 'startStandardYTStream' );
	});

	wEmitter.on( 'button9Press' , function() { 
		console.log("play standard Twitch Stream");
		// wEmitter.emit("")
		wEmitter.emit( 'socketSendTask' , 'stopBackgroundYTLive' );
		wEmitter.emit( 'socketSendTask' , 'startStandardYTStream' );
	});

	wEmitter.on( 'button10Press' , function() { 
		console.log("stop all client tasks and play local-movie");
		// wEmitter.emit("")
		wEmitter.emit( 'socketSendTask' , 'stopBackgroundYTLive' );
	});				

// --------------------------------------------------------------------



// Task-Event Handling
// --------------------------------------------------------------------

	wEmitter.on( 'updateYTLiveList' , function() {
		console.log("SCHEDULED-> updateYTLiveList");
		wVM.updateYTLiveList();
		setTimeout(function(){
			wEmitter.emit( 'socketSendTask' , 'latestYTLiveList', { 
				message: 'here is the latest ytLiveList',
				ytLiveList: wVM.returnYTLiveList()
			});
		} , 5000 );
	});

	wEmitter.on( 'updateTwitchLiveList' , function() {
		console.log("SCHEDULED-> updateTwitchLiveList");
		wVM.updateTwitchLiveList();
		setTimeout(function(){
			wEmitter.emit( 'socketSendTask' , 'latestTwitchLiveList', { 
				message: 'here is the latest ytLiveList',
				twitchLiveList: wVM.returnTwitchLiveList(),
			});
		} , 3000 );		
	});

	wEmitter.on( 'updateStandardList' , function() {
		console.log("SCHEDULED-> updateStandardList");
		wVM.updateStandardList();
		setTimeout(function(){
			wEmitter.emit( 'socketSendTask' , 'latestStandardList', { 
				message: 'here is the latest standardList',
				standardList: wVM.returnStandardList()
			});
		} , 5000 );
	});
	
// --------------------------------------------------------------------




// 					Testing / MISC
// --------------------------------------------------------------
	wEmitter.on( 'closeChildView' , function() {
		console.log("closing all client views");
		wEmitter.emit( 'socketSendTask' , 'closeChildView', { });
	});	


	wEmitter.on( 'skypeCallOver' , function() {
		console.log("skype call is over");
		wCM.state.skype.activeCall = false;
		if ( wCM.state.lastAction != "skype" ) {
			console.log( "restoring previous action --> " + wCM.state.lastAction );
			wCM.prepare( wCM.state.lastAction );
		}
	});
// --------------------------------------------------------------


// Firefox-Specific
// --------------------------------------------------
	module.exports.firefoxFKey = function() {
		wFM.toggleFKeyPress();
		if ( wCM.state.yt.background ) { setTimeout( ()=> { wTM.startYTShuffleTask(); } , 3000 ); }
	};

	module.exports.firefoxCloseTab = function() {
		wFM.closeCurrentTab();
	};

	module.exports.firefoxQuit = function() {
		wFM.quit();
	};
// --------------------------------------------------



module.exports.prepare = function(wAction) {
	wCM.prepare(wAction);
};

module.exports.returnAllSources = function() {
	return wVM.returnAllSources();
};

module.exports.returnYTLiveList = function() {
	return wVM.returnYTLiveList();
};

module.exports.returnTwitchLiveList = function() {
	return wVM.returnTwitchLiveList();
};

module.exports.returnStandardList = function() {
	return wVM.returnStandardList();
};

module.exports.properShutdown = function() {
	wMM.closeMopidy();
};