var fs = require('fs');
var path = require("path");
var sleep = require("sleep");
var schedule = require('node-schedule');
var wEmitter = new (require('events').EventEmitter);
module.exports.wEmitter = wEmitter;

var ip = require("ip");
var localIP = ip.address();
var wSIP = 'var socketIOServerAddress = "http://' + localIP + '";';
fs.writeFileSync( path.join( __dirname , "client" , "js" , "sockioServerAddress.js" ) , wSIP );
var app = require("./server/expressApp.js");
var server = require("http").createServer(app);
var port = process.env.PORT || 6969;

var wFM = require("./server/ffManager.js");		// Firefox-Manager
var wVM = require("./server/videoManager.js"); 	// Video-Manager
var wTM = require("./server/taskManager.js"); 	// Task-Manager
//var wBM = require("./server/buttonManager.js"); 	// Button-Manager
//var wMM = require("./server/mopidyManager.js"); // Mopidy-Manager
//var wUM = require("./server/usbIRManager.js"); // USB_IR-Manager

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
		setTimeout( ()=> { wEmitter.emit('stopYTShuffleTask'); } , 15000 ); // TESTING
		setTimeout( ()=> { wEmitter.emit('closeChildView'); } , 20000 ); // TESTING
	});	


	// Button-Event Handling
	// --------------------------------------------------
		wEmitter.on( 'button1Press' , function() { 
			console.log("now-playing--> random-edm-vocal");
			// wEmitter.emit("mopidy-random-edm-vocal")
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
			// wEmitter.emit("")
			socket.emit( 'stopBackgroundYTLive' );
		});

		wEmitter.on( 'button5Press' , function() { 
			console.log("skype call collin");
			// wEmitter.emit("")
			socket.emit( 'stopBackgroundYTLive' );
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
		wEmitter.emit("button1Press"); // Testing
	} , 6000 );
});