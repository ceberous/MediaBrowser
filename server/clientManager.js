var fs = require('fs');
var path = require("path");
var colors = require("colors");

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
		firefoxClientTaskNeedQued: false,
		firefoxClientTask: { online: false , name: null },
		firefoxClientYTPlayerReady: false,
	},

	singleYTVideoID: null,

	managerMap: {
		"skype": wSM,
		"mopidy": wMM,
		"mopidyBGYT": wMM,
		"youtubeFG": wVM,
		//"twitchFG": wVM,
		//"singleYT": wVV,
		//"podcast": wVV,
		//"audioBook": wVV,
	},

	prepare: function(wAction) {

		if ( wCM.state.skype.activeCall ) { return; }

		if ( !wCM.state.tvON ) {
			//wIM.togglePower();
			wCM.state.tvON = true;
		}

		if ( wCM.state.lastAction === null ) { wCM.state.lastAction = wAction; }
		else { wCM.state.lastAction = wCM.state.currentAction }
		wCM.state.currentAction = wAction;

		console.log( colors.magenta( "[CLIENT_MAN] --> LastAction = " + wCM.state.lastAction ) );
		console.log( colors.magenta( "[CLIENT_MAN] --> CurrentAction = " + wCM.state.currentAction ) );

		if ( wCM.state.lastAction === wCM.state.currentAction ) { wCM.state.actionSkipped = true; }
				
		var isFFOpen = wFM.isFFOpen();

		if ( wAction != "skype" ) {
			if ( !isFFOpen ) { 
				wFM.init();
				wCM.state.firefoxClientTaskNeedQued = true;
			}
			else if ( wCM.state.currentAction != wCM.state.lastAction ){
				wFM.init();
				wCM.state.firefoxClientTaskNeedQued = true;
			}
			else if ( !wCM.state.firefoxOpen ) { // this bool needs to be re-named to wCM.state.firefoxClientReady or something
				wCM.state.firefoxClientTaskNeedQued = true;	
			}			
		}
		
		switch (wAction) {

			case "skype":
				console.log("[CLIENT_MAN] --> preparing skype call".magenta);
				if ( wCM.state.firefoxOpen ) { wFM.quit(); }
				wCM.pauseMedia( wCM.state.lastAction );
				wSM.startCall();
				break;

			case "mopidyBGYT":

				console.log("[CLIENT_MAN] --> preparing mopidy with YTLive Background Video".magenta);

				wCM.state.yt.standard = false;

				// Update "Skip Count"  if necessary
				if ( wCM.state.actionSkipped) { wMM.updateSkipCount(); }	

				// Start Mopidy Playlist
				wMM.randomPlaylist( wCM.state.mopidy.playStyleToQue );
				
				// Load Client with View
				wCM.state.firefoxClientTask.name = 'playBackgroundYTLive';
				if ( wCM.state.firefoxClientTaskNeedQued ) {
					wEmitter.emit( 'queClientTaskOnReady' , wCM.state.firefoxClientTask.name );
					wCM.state.firefoxClientTaskNeedQued = false;
				}
				else if ( !wCM.state.firefoxClientTaskNeedQued && !wCM.state.yt.background ) {
					wEmitter.emit( 'socketSendTask' , wCM.state.firefoxClientTask.name );
				}

				break;
				

			case "mopidy":

				break;

			case "youtubeFG":

				if ( wCM.state.mopidy.playing ) { wMM.stopMedia(); }
				if ( wCM.state.yt.background ) { wTM.stopYTShuffleTask(); wCM.state.yt.background = false; }

				wCM.state.firefoxClientTask.name = 'playYTStandard';

				if ( wCM.state.firefoxClientTaskNeedQued ) {
					wEmitter.emit( 'queClientTaskOnReady' , wCM.state.firefoxClientTask.name );
					wCM.state.firefoxClientTaskNeedQued = false;
				}
				else if ( !wCM.state.firefoxClientTaskNeedQued && !wCM.state.yt.standard ) {
					wEmitter.emit( 'socketSendTask' , wCM.state.firefoxClientTask.name );
				}

				break;

			case "twitchFG":

				break;

			case "singleYT":
				
				if ( wCM.state.firefoxClientTaskNeedQued ) {
					wEmitter.emit( 'queClientTaskOnReady' , "playYTSingleVideo" , { playlist: [wCM.singleYTVideoID] } );
					wCM.state.firefoxClientTaskNeedQued = false;
				}
				else if ( !wCM.state.firefoxClientTaskNeedQued && !wCM.state.yt.standard ) {
					wEmitter.emit( 'socketSendTask' , "playYTSingleVideo" , { playlist: [wCM.singleYTVideoID] } );
				}
				
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
		if ( wCM.state.firefoxOpen ) { wFM.quit(); }
		if ( wCM.state.mopidy.playing ) { wMM.stopMedia(); }
		if ( wCM.state.skype.activeCall ) { wSM.stopCall(); }
		//if ( wCM.state.vlcVideo.playing ) { wVV.stop(); wCM.state.vlcVideo.playing = false;  }

	},

	pauseMedia: function( wAction ) {
		if ( wCM.state.currentAction != "skype" ) {
			wCM.managerMap[wCM.state.currentAction].pauseMedia();
		}
		else if ( wAction !== undefined && wAction != "skype" )	{ // Why is this else if here?
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
		console.log("[CLIENT_MAN] --> now-playing--> random-classic".magenta);
		wCM.state.mopidy.playStyleToQue = "classic";
		
		//wCM.prepare( "mopidyBGYT" );

		wCM.prepare( "singleYT" );
		wCM.singleYTVideoID = "ybSNXGKM304";
	});

	wEmitter.on( 'button2Press' , function() { 
		console.log("[CLIENT_MAN] --> now-playing--> random-edm".magenta);
		wCM.state.mopidy.playStyleToQue = "edm";
		wCM.prepare( "mopidyBGYT" );
	});

	wEmitter.on( 'button3Press' , function() { 
		console.log("[CLIENT_MAN] --> now-playing --> random-misc".magenta);
		wCM.state.mopidy.playStyleToQue = "misc";
		wCM.prepare( "mopidyBGYT" );
	});

	wEmitter.on( 'button4Press' , function() { 
		console.log("[CLIENT_MAN] --> skype call cameron".magenta);
		fs.writeFileSync( path.join( __dirname , "py_scripts" , "wUserName.py" ) , "callingName = 'live:ccerb96'" );
		wCM.prepare( "skype" );
	});

	wEmitter.on( 'button5Press' , function() { 
		console.log("skype call collin".magenta);
		fs.writeFileSync( path.join( __dirname , "py_scripts" , "wUserName.py" ) , "callingName = 'collin.cerbus'" );
		wCM.prepare( "skype" );
	});

	wEmitter.on( 'button6Press' , function() { 
		console.log("[CLIENT_MAN] --> \"Emergency\" Stop Everything".magenta);
		wCM.stopEverything();
	});	

	wEmitter.on( 'button7Press' , function() { 
		console.log("[CLIENT_MAN] --> now-playing --> YTStandardList".magenta);
		wCM.prepare( "youtubeFG" );
	});	

	wEmitter.on( 'button8Press' , function() { 
		console.log("[CLIENT_MAN] --> play Previous-Media".magenta);
		wCM.previousMedia();
	});

	wEmitter.on( 'button9Press' , function() { 
		console.log("[CLIENT_MAN] --> play Next-Media".magenta);
		wCM.nextMedia();
	});

	wEmitter.on( 'button10Press' , function() { 
		console.log("[CLIENT_MAN] --> stop all client tasks and play local-movie".magenta);
		// wEmitter.emit("")
		wEmitter.emit( 'socketSendTask' , 'stopBackgroundYTLive' );
	});				

// --------------------------------------------------------------------



// Task-Event Handling
// --------------------------------------------------------------------

	wEmitter.on( 'updateYTLiveList' , function() {
		wVM.updateYTLiveList();
		setTimeout(function(){
			wEmitter.emit( 'socketSendTask' , 'latestYTLiveList', { 
				message: 'here is the latest ytLiveList',
				ytLiveList: wVM.returnYTLiveList()
			});
		} , 5000 );
	});

	wEmitter.on( 'updateTwitchLiveList' , function() {
		wVM.updateTwitchLiveList();
		setTimeout(function(){
			wEmitter.emit( 'socketSendTask' , 'latestTwitchLiveList', { 
				message: 'here is the latest ytLiveList',
				twitchLiveList: wVM.returnTwitchLiveList(),
			});
		} , 3000 );		
	});

	wEmitter.on( 'updateStandardList' , function() {
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
	wEmitter.on( 'firefoxOpen' , function() { console.log("[CLIENT_MAN] --> FireFox Open and Ready on localhost:6969".magenta); wCM.state.firefoxOpen = true; });
	wEmitter.on( 'firefoxClosed' , function() { wCM.state.firefoxOpen = false; wCM.state.firefoxClientYTPlayerReady = true; });

	wEmitter.on( 'skypeCallStarted' , function() { wCM.state.skype.activeCall = true; } );

	wEmitter.on( 'skypeCallOver' , function() {
		console.log("[CLIENT_MAN] --> skype call is over".magenta);
		wCM.state.skype.activeCall = false;
		if ( wCM.state.lastAction != "skype" ) {
			console.log( colors.magenta( "[CLIENT_MAN] --> restoring previous action --> " + wCM.state.lastAction ) );
			wCM.prepare( wCM.state.lastAction );
		}
	});

	wEmitter.on( 'mopidyOnline' , function() {
		wCM.state.mopidy.online = true;
	});

	wEmitter.on( 'mopidyOffline' , function() {
		console.log("mopidy offline");
		wCM.state.mopidy.online = false;
		wCM.state.mopidy.playing = false;
		wCM.state.mopidy.paused = false;
	});

	wEmitter.on( "mopidyPlaying"  , function() { wCM.state.mopidy.playing = true; });
	wEmitter.on( "mopidyNotPlaying"  , function() { wCM.state.mopidy.playing = false; });

	wEmitter.on( 'firefoxClientYTPlayerReady' , function() { wCM.state.firefoxClientYTPlayerReady = true; } );
// ---------------------------------------------------------------------------------


// 					Testing / MISC
// --------------------------------------------------------------
	wEmitter.on( 'closeChildView' , function() {
		console.log("[CLIENT_MAN] --> closing all client views".magenta);
		wEmitter.emit( 'socketSendTask' , 'closeChildView', { });
	});

	wEmitter.on( 'properShutdown' , function() {
		console.log("[CLIENT_MAN] --> Proper Shutdown".magenta);
		wCM.stopEverything();
	});

// --------------------------------------------------------------





// Firefox-Specific
// --------------------------------------------------
	module.exports.firefoxFKey = function() {
		wFM.toggleFKeyPress();
		wCM.state.firefoxClientTask.online = true;
	};

	module.exports.firefoxCloseTab = function() {
		wFM.closeCurrentTab();
	};

	module.exports.firefoxQuit = function() {
		wFM.quit();
	};
// --------------------------------------------------

module.exports.ytLive = function(wBool) {
	wCM.state.yt.background = wBool;
	if ( wCM.state.yt.background ) { setTimeout( ()=> { wTM.startYTShuffleTask(); } , 3000 ); }
};

module.exports.ytStandard = function(wBool) {
	wCM.state.yt.standard = wBool;
};

module.exports.updateYTStandardInfo = function(wOBJ) { 
	wVM.updateYTStandardInfo(wOBJ)
};	





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
	wCM.stopEverything();
};