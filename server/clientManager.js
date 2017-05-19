var fs = require('fs');
var path = require("path");
var colors = require("colors");

var wEmitter = require('../main.js').wEmitter;

var wTM 	= require("./taskManager.js"); 		// Task-Manager
var wFM 	= require("./ffManager.js");		// Firefox-Manager
var wVM 	= require("./videoManager.js"); 	// Video-Manager
var wMM 	= require("./mopidyManager.js"); 	// Mopidy-Manager
var wSM 	= require("./skypeManager.js"); 	// Skype-Manager
var wBM 	= require("./buttonManager.js"); 	// Button-Manager
//var wIM 	= require("./usbIRManager.js"); 	// USB_IR-Manager
var wLVM 	= require("./localVideoManager.js");// MPlayer-Manager


var wCM =  {

	state: {
		yt: { background: false , live: false , standard: false , paused: false },
		twitch: { live: false , standard: false , paused: false },
		mopidy: { playing: false , paused: false , playStyleToQue: null },
		mPlayer: { error: {} , active: false , playing: false , paused: false , activeGenre: null , activeShow: null },
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
		nowPlayingString: "",
		nowPlayingOBJ: {  },
	},

	singleYTVideoID: null,

	managerMap: {
		"skype": wSM,
		"mopidyBGYT": wMM,
		"youtubeFG": wVM,
		//"twitchFG": wVM,
		"singleYT": wVM,
		//"podcast": wVV,
		"audioBook": wLVM,
		"odyssey": wLVM,
		"tvShow": wLVM,
	},

	configureFirefox: function() {
		if ( !wFM.isFFOpen() ) { 
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
	},

	prepare: function(wAction) {

		if ( wCM.state.skype.activeCall ) { return; }

		if ( !wCM.state.tvON ) {
			//wIM.togglePower();
			wCM.state.tvON = true;
		}

		// Shift Actions
		if ( wCM.state.lastAction === null ) { wCM.state.lastAction = wAction; wCM.state.currentAction = wAction; }
		else {
			wCM.state.lastAction = wCM.state.currentAction
			wCM.state.currentAction = wAction; 
			if ( wCM.state.lastAction != wCM.state.currentAction ) {
				wCM.stopMedia( wCM.state.lastAction );
			}
			else {
				wCM.state.actionSkipped = true;
			}
		}		
		console.log( colors.magenta( "[CLIENT_MAN] --> LastAction = " + wCM.state.lastAction ) );
		console.log( colors.magenta( "[CLIENT_MAN] --> CurrentAction = " + wCM.state.currentAction ) );
		
		switch (wAction) {

			case "skype":
				console.log("[CLIENT_MAN] --> preparing skype call".magenta);
				if ( wCM.state.firefoxOpen ) { wFM.quit(); }
				wSM.startCall();
				break;

			case "mopidyBGYT":

				wCM.configureFirefox();
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

				//wEmitter.emit( 'socketSendTask' , "showToast" );

				break;

			case "youtubeFG":

				wCM.configureFirefox();
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
				wCM.configureFirefox();
				break;

			case "singleYT":
				wCM.configureFirefox();
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

			case "tvShow":

				if ( wFM.isFFOpen() ) { wFM.quit(); }
				if ( wCM.state.mopidy.playing ) { wMM.stopMedia(); }
				if ( wCM.state.yt.background ) { wTM.stopYTShuffleTask(); wCM.state.yt.background = false; }

				wLVM.playMedia( "nextTVShow" );

				break;

			case "odyssey":

				wCM.configureFirefox();
				console.log("[CLIENT_MAN] --> preparing odyssey with YTLive Background Video".magenta);

				wCM.state.yt.standard = false;

				// Update "Skip Count"  if necessary
				if ( wCM.state.actionSkipped) { wMM.updateSkipCount(); }	
				
				// Load Client with View
				wCM.state.firefoxClientTask.name = 'playBackgroundYTLive';
				if ( wCM.state.firefoxClientTaskNeedQued ) {
					wEmitter.emit( 'queClientTaskOnReady' , wCM.state.firefoxClientTask.name );
					wCM.state.firefoxClientTaskNeedQued = false;
				}
				else if ( !wCM.state.firefoxClientTaskNeedQued && !wCM.state.yt.background ) {
					wEmitter.emit( 'socketSendTask' , wCM.state.firefoxClientTask.name );
				}

				if ( wCM.state.mopidy.playing ) { wMM.stopMedia(); }
				if ( wCM.state.yt.background ) { wTM.stopYTShuffleTask(); wCM.state.yt.background = false; }

				wLVM.playMedia( "odyssey" );

				break;	

		}

	},

	stopEverything: function() {

		if ( wCM.state.tvON ) {
			//wIM.togglePower();
			wCM.state.tvON = false;
		}

		//wBM.stop();

		wCM.state.lastAction = null;
		wCM.state.currentAction = null;
		
		wTM.stopYTShuffleTask();
		wCM.state.yt.background = false;
		wFM.quit();

		wMM.stopMedia();
		wSM.stopCall();
		wCM.state.skype.activeCall = false;
		wCM.state.mPlayer.playing = false;
		wLVM.stopMedia(); 

	},

	stopMedia: function( wAction ) {
		wCM.managerMap[wAction].stopMedia();
	},	

	pauseMedia: function( wAction ) {
		if ( wAction === undefined || wCM.state.currentAction === "skype" ) { return; }

		wCM.managerMap[wCM.state.currentAction].pauseMedia();
		
		if ( wCM.state.mopidy.playing ) {
			wMM.pauseMedia();
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
		
		wCM.prepare( "mopidyBGYT" );

		// Adhoc Testing
		//wCM.prepare( "singleYT" );
		//wCM.singleYTVideoID = "ybSNXGKM304";
	});

	wEmitter.on( 'button2Press' , function() { 
		console.log("[CLIENT_MAN] --> now-playing--> random-edm".magenta);
		wCM.state.mopidy.playStyleToQue = "edm";
		wCM.prepare( "mopidyBGYT" );
	});

	wEmitter.on( 'button3Press' , function() { 
		//console.log("[CLIENT_MAN] --> now-playing --> random-misc".magenta);
		//wCM.state.mopidy.playStyleToQue = "misc";
		//wCM.prepare( "mopidyBGYT" );
		console.log("[CLIENT_MAN] --> now-playing --> YTStandardList".magenta);
		wCM.prepare( "youtubeFG" );
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
		//console.log("[CLIENT_MAN] --> now-playing --> YTStandardList".magenta);
		//wCM.prepare( "youtubeFG" );
		console.log( "[CLIENT_MAN] --> Pause-Media".magenta );
		wCM.pauseMedia( wCM.state.currentAction );
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

	wEmitter.on( 'button11Press' , function() { 
		console.log("[CLIENT_MAN] --> stop all client tasks and play local-TV Show".magenta);
		wCM.prepare( "odyssey" );
	});	

	wEmitter.on( 'button12Press' , function() { 
		console.log("[CLIENT_MAN] --> stop all client tasks and play local-TV Show".magenta);
		wCM.prepare( "tvShow" );
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
		if ( wCM.state.lastAction != null && wCM.state.lastAction != "skype" ) {
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
	wEmitter.on( "mopidyPaused"  , function() { wCM.state.mopidy.playing = false; wCM.state.mopidy.paused = true; });

	wEmitter.on( 'firefoxClientYTPlayerReady' , function() { wCM.state.firefoxClientYTPlayerReady = true; } );

	wEmitter.on( "mPlayerError" , function(wMSG) { 
		wCM.state.mPlayer.active = false; 
		wCM.state.mPlayer.error["active"] = true; 
		wCM.state.mPlayer.error["message"] = wMSG; 
		console.log(wCM.state.mPlayer.error.magenta); 
	});

	wEmitter.on( "mPlayerPlaying" , function() { wCM.state.mPlayer.active = true; wCM.state.mPlayer.playing = true; });
	wEmitter.on( "mPlayerPaused" , function() { wCM.state.mPlayer.paused = true; wCM.state.mPlayer.playing = false; });
	wEmitter.on( "mPlayerStopped" , function() { wCM.state.mPlayer.playing = false; });
	wEmitter.on( "mPlayerClosed" , function(wCode) { wCM.state.mPlayer.active = false; if ( wCode != undefined ) { console.log( "mPlayer Exit Code = " + wCode.toString() ); } });

// ---------------------------------------------------------------------------------


// 					Testing / MISC
// --------------------------------------------------------------
	wEmitter.on( 'closeChildView' , function() {
		console.log("[CLIENT_MAN] --> closing all client views".magenta);
		wEmitter.emit( 'socketSendTask' , 'closeChildView', { });
	});

	wEmitter.on( 'updateNowPlayingOBJ' , function( data ) {
		wCM.state.nowPlayingOBJ = data;
		wCM.state.nowPlayingOBJ.currentAction = wCM.state.currentAction;
		wEmitter.emit( "nowPlayingInfo" , wCM.state.nowPlayingOBJ );
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

module.exports.ytStandard = function( wBool , id ) {
	wCM.state.yt.standard = wBool;
	wCM.state.nowPlayingString = "YT Standard --> " + id;
};

module.exports.updateYTStandardInfo = function(wOBJ) { 
	wVM.updateYTStandardInfo(wOBJ)
};	

module.exports.getNowPlayingInfo = function() { 
	return {
		currentAction: wCM.state.currentAction,
		nowPlayingMode: wCM.state.nowPlayingOBJ.mode,
		nowPlayingString: wCM.state.nowPlayingOBJ.string,
	};
};	

module.exports.pressButton = function(wNum) {
	wBM.pressButton( wNum );
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
