var fs = require('fs');
var path = require("path");

var wEmitter = require('../main.js').wEmitter;

var wTM = require("./taskManager.js"); 		// Task-Manager
var wFM = require("./ffManager.js");		// Firefox-Manager
var wVM = require("./videoManager.js"); 	// Video-Manager
var wMM = require("./mopidyManager.js"); 	// Mopidy-Manager
var wSM = require("./skypeManager.js"); 	// Skype-Manager
var wBM = require("./buttonManager.js"); 	// Button-Manager
//var wIM = require("./usbIRManager.js"); 	// USB_IR-Manager
//var wVV = require("./vlcManager.js")		// VLC-Manager


wVM.updateYTLiveList();

var wCM =  {

	state: {
		yt: { background: false , live: false , standard: false , paused: false },
		twitch: { live: false , standard: false , paused: false },
		vlcVideo: { playing: false , paused: false },
		mopidy: { playing: false , paused: false , playStyleToQue: null },
		podcast: { playing: false , paused: false },
		audioBook: { playing: false , paused: false },
		skype: { activeCall: false },
		tvON: false,
		lastAction: null,
		currentAction: null,
		firefoxOpen: false,
		firefoxClientTask: { online: false , name: null },
	},

	managerMap: {
		"skype": wSM,
		"mopidy": wMM,
		"mopidyBGYT": wMM,
		//"youtubeFG": wVM,
		//"twitchFG": wVM,
		//"savedVideo": wVV,
		//"podcast": wVV,
		//"audioBook": wVV,
	},

	prepare: function(wAction) {

		if ( wCM.state.skype.activeCall ) { return; }

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
				console.log("preparing skype call");
				if ( wCM.state.firefoxOpen ) { wFM.quit(); wCM.state.firefoxOpen = false; }
				wCM.pauseMedia( wCM.state.lastAction );
				wCM.state.skype.activeCall = true;
				wSM.startCall();
				break;

			case "mopidyBGYT":

				console.log("preparing mopidy with YTLive Background Video");
				//wCM.state.mopidy.playing = true;
				wMM.randomPlaylist( wCM.state.mopidy.playStyleToQue );
				
				wCM.state.firefoxClientTask.name = 'playBackgroundYTLive';
				
				if ( !wCM.state.firefoxOpen ) { 
					wFM.init(); 
					wEmitter.emit( 'queClientTaskOnReady' , wCM.state.firefoxClientTask.name );				
				}
				else if ( !wCM.state.yt.background ) { 
					wEmitter.emit( 'socketSendTask' , wCM.state.firefoxClientTask.name );
				}


				break;
				

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

			case "audioBook":

				break;	

		}

	},

	stopEverything: function() {

		if ( wCM.state.tvON ) {
			//wIM.togglePower();
			wCM.state.tvON = false;
		}

		if ( wCM.state.yt.background ) { wTM.stopYTShuffleTask(); wCM.state.yt.background = false; }
		if ( wCM.state.firefoxOpen ) { wFM.quit(); wCM.state.firefoxOpen = false; }
		if ( wCM.state.mopidy.playing ) { wMM.closeMopidy(); wCM.state.mopidy.playing = false; }
		//if ( wCM.state.skype.activeCall ) { wSM.stopCall(); wCM.state.skype.activeCall = false; }
		//if ( wCM.state.vlcVideo.playing ) { wVV.stop(); wCM.state.vlcVideo.playing = false;  }

		wCM.managerMap[wCM.state.currentAction].stopMedia();

	},

	pauseMedia: function( wAction ) {
		if ( wCM.state.currentAction != "skype" ) {
			wCM.managerMap[wCM.state.currentAction].pauseMedia();
		}
		else if ( wAction !== undefined && wAction != "skype" )	{
			wCM.managerMap[wAction].pauseMedia();
		}
	},

	nextMedia: function() {
		if ( wCM.state.currentAction != "skype" ) {
			wCM.managerMap[wCM.state.currentAction].nextMedia();
		}
	},

	previousMedia: function() {
		if ( wCM.state.currentAction != "skype" ) {
			wCM.managerMap[wCM.state.currentAction].previousMedia();
		}
	},


};

// 				Button-Event Handling
// --------------------------------------------------------------------
	wEmitter.on( 'button1Press' , function() { 
		console.log("now-playing--> random-classic");
		wCM.state.mopidy.playStyleToQue = "classic";
		wCM.prepare( "mopidyBGYT" );
	});

	wEmitter.on( 'button2Press' , function() { 
		console.log("now-playing--> random-edm");
		wCM.state.mopidy.playStyleToQue = "edm";
		wCM.prepare( "mopidyBGYT" );
	});

	wEmitter.on( 'button3Press' , function() { 
		console.log("now-playing--> random-misc");
		wCM.state.mopidy.playStyleToQue = "misc";
		wCM.prepare( "mopidyBGYT" );
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
		//console.log("mopidy--> nextSong");
		// wEmitter.emit("")
	});	

	wEmitter.on( 'button8Press' , function() { 
		console.log("play Previous-Media");
		wCM.previousMedia();
	});

	wEmitter.on( 'button9Press' , function() { 
		console.log("play Next-Media");
		wCM.nextMedia();
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


//					State Management
// ---------------------------------------------------------------------------------
	wEmitter.on( 'firefoxOpen' , function() { console.log("FireFox Open and Ready on localhost:6969"); wCM.state.firefoxOpen = true; });
	wEmitter.on( 'firefoxClosed' , function() { wCM.state.firefoxOpen = false; });

	wEmitter.on( 'skypeCallOver' , function() {
		console.log("skype call is over");
		wCM.state.skype.activeCall = false;
		if ( wCM.state.lastAction != "skype" ) {
			console.log( "restoring previous action --> " + wCM.state.lastAction );
			wCM.prepare( wCM.state.lastAction );
		}
	});

	wEmitter.on( 'mopidyOnline' , function() {
		console.log("mopidy online");
		wCM.state.mopidy.online = true;
	});

	wEmitter.on( 'mopidyOffline' , function() {
		console.log("mopidy offline");
		wCM.state.mopidy.online = false;
		wCM.state.mopidy.playing = false;
		wCM.state.mopidy.paused = false;
	});
// ---------------------------------------------------------------------------------


// 					Testing / MISC
// --------------------------------------------------------------
	wEmitter.on( 'closeChildView' , function() {
		console.log("closing all client views");
		wEmitter.emit( 'socketSendTask' , 'closeChildView', { });
	});	
// --------------------------------------------------------------





// Firefox-Specific
// --------------------------------------------------
	module.exports.firefoxFKey = function() {
		wFM.toggleFKeyPress();
		wCM.state.firefoxClientTask.online = true;
		wCM.state.yt.background = true;
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