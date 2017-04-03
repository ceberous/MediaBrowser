var fs = require('fs');
var path = require("path");
var sleep = require("sleep");
var schedule = require('node-schedule');
var wEmitter = new (require('events').EventEmitter);
module.exports.wEmitter = wEmitter;

var port = process.env.PORT || 6969;
var ip = require("ip");
var localIP = ip.address();
var wSIP = 'var socketIOServerAddress = "http://' + localIP + '"; var socketIOPORT = "' + port + '";';
fs.writeFileSync( path.join( __dirname , "client" , "js" , "sockioServerAddress.js" ) , wSIP );
var app = require("./server/expressApp.js");
var server = require("http").createServer(app);

var wTM = require("./server/taskManager.js"); 	// Task-Manager
var wFM = require("./server/ffManager.js");		// Firefox-Manager
var wVM = require("./server/videoManager.js"); 	// Video-Manager
//var wMM = require("./server/mopidyManager.js"); // Mopidy-Manager
var wSM = require("./server/skypeManager.js"); 	// Skype-Manager
//var wBM = require("./server/buttonManager.js"); 	// Button-Manager
//var wIM = require("./server/usbIRManager.js"); // USB_IR-Manager

var clientManager =  {

	state: {
		yt: { live: false , standard: false , paused: false },
		twitch: { live: false , standard: false , paused: false },
		vlcVideo: { playing: false , paused: false },
		mopidy: { playing: false , paused: false },
		podcast: { playing: false , paused: false },
		skype: { activeCall: false },
		tvON: false,
	},

	prepare: function(wAction) {

		if ( !clientManager.state.tvON ) {
			//wIM.togglePower();
			clientManager.state.tvON = true;
		}

		switch (wAction) {

			case "skype":
				if ( clientManager.state.skype.activeCall ) { break; }
				console.log("preparing skype call");
				clientManager.pauseAll();
				clientManager.state.skype.activeCall = true;
				wSM.startCall();
				break;

			case "mopidyBGYT":
				if ( clientManager.state.skype.activeCall ) { break; }
				console.log("preparing mopidy with YTLive Background Video");
				clientManager.state.mopidy.playing = true;
				wMM.randomPlayList();
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

		}

	},

	pauseAll: function() {
		clientManager.pauseMopidy();
		clientManager.pausePodcast();
		clientManager.pauseVideo();
	},

	pauseMopidy: function() {
		if ( clientManager.state.mopidy.playing ) { /*wMM.pause();*/ }
		clientManager.state.mopidy.paused = true;
	},

	pausePodcast: function() {
		if ( clientManager.state.podcast.playing ) { /*wPM.pause();*/ }
		clientManager.state.podcast.paused = true;
	},	

	pauseVideo: function() {

		if ( clientManager.state.yt.live ) {
			wEmitter.emit('stopYTShuffleTask');
			wEmitter.emit('closeChildView');
		}
		else if ( clientManager.state.yt.standard ) {

		}
		else if ( clientManager.state.twitch.live ) {

		}
		else if ( clientManager.state.twitch.standard ) {

		}		
		else if ( clientManager.state.vlcVideo.playing ) {

		}

	},

};

wEmitter.on( 'restoreFFWindow' , function() {
	console.log("restoring FF Window");
	wFF.restoreFullScreen();
});


wEmitter.emit('updateYTLiveList');
sleep.sleep(2);
var wSources = wVM.returnAllSources();

var io = require('socket.io')(server); // Client-Interaction
io.sockets.on( 'connection' , function (socket) {

	var wC = socket.request.connection._peername;
	console.log( wC.address.toString() +  " connected" );
	socket.emit( 'newConnection', { 
		message: 'you are now connected to the sock.io server',
		ytLiveList: wSources.ytLiveList,
		twitchLiveList: wSources.twitchLiveList,
		standardList: wSources.standardList,
	});

	socket.on( 'firefox-close-tab' , function( data ){
		wFM.closeCurrentTab();
	});

	socket.on( 'firefox-quit' , function( data ){
		wFM.quit();
	});

	socket.on( 'firefox-glitch-fullscreen' , function( data ){
		wFM.glitchFullScreen();
	});

	socket.on( 'firefox-f-key' , function( data ){
		wFM.toggleFKeyPress();
		// Client-Player is supposedly Ready by this point
		setTimeout( ()=> { wEmitter.emit('startYTShuffleTask'); } , 3000 );
		//setTimeout( ()=> { wEmitter.emit('stopYTShuffleTask'); } , 15000 ); // TESTING
		//setTimeout( ()=> { wEmitter.emit('closeChildView'); } , 20000 ); // TESTING
	});	


	// Button-Event Handling
	// --------------------------------------------------
		wEmitter.on( 'button1Press' , function() { 
			console.log("now-playing--> random-edm-vocal");
			clientManager.prepare( "mopidyBGYT" );
			socket.emit( 'playBackgroundYTLive' );
		});

		wEmitter.on( 'button2Press' , function() { 
			console.log("now-playing--> random-edm-nonvocal");
			// wEmitter.emit("mopidy-random-edm-nonvocal")
			socket.emit( 'playBackgroundYTLive' );
		});

		wEmitter.on( 'button3Press' , function() { 
			console.log("now-playing--> random-classic-rock");
			// wEmitter.emit("mopidy-random-classic-rock")
			socket.emit( 'playBackgroundYTLive' );
		});

		wEmitter.on( 'button4Press' , function() { 
			console.log("skype call cameron");
			fs.writeFileSync( path.join( __dirname , "server" , "py_scripts" , "wUserName.py" ) , "callingName = 'ccerb96'" );
			clientManager.prepare( "skype" );
		});

		wEmitter.on( 'button5Press' , function() { 
			console.log("skype call collin");
			fs.writeFileSync( path.join( __dirname , "server" , "py_scripts" , "wUserName.py" ) , "callingName = 'collin.cerbus'" );
			clientManager.prepare( "skype" );
		});

		wEmitter.on( 'button6Press' , function() { 
			console.log("mopidy--> previousSong");
			// wEmitter.emit("")
		});	

		wEmitter.on( 'button7Press' , function() { 
			console.log("mopidy--> nextSong");
			// wEmitter.emit("")
		});	

		wEmitter.on( 'button8Press' , function() { 
			console.log("play standard YT Stream");
			// wEmitter.emit("")
			socket.emit( 'stopBackgroundYTLive' );
			socket.emit( 'startStandardYTStream' );
		});

		wEmitter.on( 'button9Press' , function() { 
			console.log("play standard Twitch Stream");
			// wEmitter.emit("")
			socket.emit( 'stopBackgroundYTLive' );
			socket.emit( 'startStandardYTStream' );
		});

		wEmitter.on( 'button10Press' , function() { 
			console.log("stop all client tasks and play local-movie");
			// wEmitter.emit("")
			socket.emit( 'stopBackgroundYTLive' );
		});				

	// --------------------------------------------------


	// Task-Event Handling
	// --------------------------------------------------
		wEmitter.on( 'publishYTLiveList' , function() {
			socket.emit( 'latestYTLiveList', { 
				message: 'here is the latest ytLiveList',
				ytLiveList: wVM.returnYTLiveList()
			});
		});

		wEmitter.on( 'publishTwitchLiveList' , function() {
			socket.emit( 'latestTwitchLiveList', { 
				message: 'here is the latest twitchLiveList',
				twitchLiveList: wVM.returnTwitchLiveList(),
			});
		});

		wEmitter.on( 'publishStandardList' , function() {
			socket.emit( 'latestStandardList', { 
				message: 'here is the latest standardList',
				standardList: wVM.returnStandardList()
			});
		});	

		wEmitter.on( 'nextYTLiveVideo' , function() {
			console.log("SCHEDULED--> nextYTLiveVideo");
			socket.emit( 'nextYTLiveVideo', { 
				message: 'goto nextYTLiveVideo',
			});
		});	

						// Testing 
		wEmitter.on( 'closeChildView' , function() {
			console.log("closing all client views");
			socket.emit( 'closeChildView', { });
		});	
		
	// --------------------------------------------------

});


server.listen( port , function() {
	console.log( "Server Started on : \nhttp://" + localIP + ":" + port + "\n \t or \nhttp://localhost:" + port + "\n" );
	wFM.openNewTab("http://localhost:6969"); 
	setTimeout(function(){
		wEmitter.emit("button5Press"); // Testing
	} , 6000 );
});