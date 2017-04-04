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


var clientManager = require("./server/clientManager.js");

var io = require('socket.io')(server); // Client-Interaction
io.sockets.on( 'connection' , function (socket) {

	var wC = socket.request.connection._peername;
	console.log( wC.address.toString() +  " connected" );

	socket.emit( 'newConnection', { 
		message: 'you are now connected to the sock.io server',
		ytLiveList: clientManager.returnYTLiveList(),
		twitchLiveList: clientManager.returnTwitchLiveList(),
		standardList: clientManager.returnStandardList(),
	});

	socket.on( 'firefox-close-tab' , function( data ){
		clientManager.firefoxCloseTab();
	});

	socket.on( 'firefox-quit' , function( data ){
		clientManager.firefoxQuit();
	});

	socket.on( 'firefox-f-key' , function( data ){
		// Client-Player is supposedly Ready by this point
		clientManager.firefoxFKey();
	});	

	wEmitter.on( 'socketSendTask' , function( wTask , wOptions ) {
		console.log( "socketEmit--> " + wTask );
		socket.emit( wTask , wOptions );
	});


});


server.listen( port , function() {
	
	console.log( "Server Started on : \nhttp://" + localIP + ":" + port + "\n \t or \nhttp://localhost:" + port + "\n" );
	
	setTimeout(function() {
		console.log("testing--> button1Press");
		wEmitter.emit("button1Press"); // testing
	} , 10000 );

});