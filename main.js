var fs = require('fs');
var path = require("path");
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

var wSources = wVM.returnAllSources(); // Initialize Sources-List

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
	});	


	wEmitter.on( 'button1Press' , function() { 
		console.log("we got a button1Press");
		socket.emit( 'playBackgroundYTLive' , { 
			swapDuration: 10
		}); 
	});

	
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

});


server.listen( port , function() {
	console.log( "Server Started on : \nhttp://" + localIP + ":" + port + "\n \t or \nhttp://localhost:" + port + "\n" );
	setTimeout(function(){
		wFM.openNewTab("http://localhost:6969");
	} , 2500 );
	setTimeout(function(){
		wEmitter.emit("button1Press"); // Testing
	} , 8000 );
});