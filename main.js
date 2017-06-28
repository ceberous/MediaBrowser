require('shelljs/global');
function cleanseMain() {

	function isMainOpen() {

		var wPIDS = [];
		var wCMD1 = "ps aux | grep node";
		var findMain = exec( wCMD1 , { silent:true , async: false });
		if ( findMain.stderr.length > 1 || findMain.stdout.length < 1 ) { return -1; }

		var wOutput = findMain.stdout.split("\n");
		for ( var i = 0; i < wOutput.length; ++i ) {
			var wOut2 = wOutput[i].split(" ");
			var wOut3 = wOut2[ wOut2.length - 1 ].split("/"); 
			if ( wOut3[ wOut3.length - 1 ] === "main.js" ) {
				for ( var j = 0; j < 8; ++j ) {
					var wTest = wOut2[j].trim();
					if ( wTest === " " ) { continue; }
					wTest = parseInt( wTest );
					if ( isNaN(wTest) ) { continue; }
					if ( wTest < 300 ) { continue; }
					console.log( "wTest = " + wTest.toString() +  " PID: " + wOut2[ j ] + " = " + wOut3[ wOut3.length - 1 ] );
					wPIDS.push( wOut2[j] );
				}
				
			}
		}

		return wPIDS;

	}

	var openResult = isMainOpen();
	if ( openResult === -1 ) {
		console.log("failed to find script");
	}
	else {
		var wCMD2 = "sudo kill -9 ";
		var wSavedCurrent = null;
		if ( openResult.length > 1 ) { 
			wSavedCurrent = openResult.pop(); 
			for ( var i = 0; i < openResult.length; ++i ) {
				var wKillCMD = wCMD2 + openResult[i];
				exec( wKillCMD , { silent: true , async: false } );
				console.log( wKillCMD );
			}
		}
	}

}
//cleanseMain();

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

var personalFiles = require("./personal.js");

var clientManager = require("./server/clientManager.js");

var clientReadyQuedTask  , clientReadyQuedTaskOptions = null;
wEmitter.on( 'queClientTaskOnReady' , function( wTask , wOptions ) {
	clientReadyQuedTask = wTask;
	clientReadyQuedTaskOptions = wOptions;
});

var io = require('socket.io')(server); // Client-Interaction
io.sockets.on( 'connection' , function (socket) {

	wEmitter.emit('firefoxOpen');

	var wC = socket.request.connection._peername;
	console.log( wC.address.toString() +  " connected" );

	socket.emit( 'newConnection', { 
		message: 'you are now connected to the sock.io server',
		ytLiveList: clientManager.returnYTLiveList(),
		twitchLiveList: clientManager.returnTwitchLiveList(),
		standardList: clientManager.returnStandardList(),
	});

	if ( clientReadyQuedTask != null ) {
		socket.emit( clientReadyQuedTask , clientReadyQuedTaskOptions );
		clientReadyQuedTask , clientReadyQuedTaskOptions = null;
	}

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

	socket.on( 'ytLivePlaying' , function( data ){
		clientManager.ytLive(true);
	});

	socket.on( 'ytStandardPlaying' , function( data ){
		clientManager.ytStandard( true , data.id );
	});

	socket.on( 'updateYTStandardInfo' , function( data ) {
		clientManager.updateYTStandardInfo(data);
	});				

	wEmitter.on( 'socketSendTask' , function( wTask , wOptions ) {
		console.log( "[MAIN] --> socketEmit--> " + wTask );
		socket.emit( wTask , wOptions );
	});


});

var middleSock = require('socket.io-client')( personalFiles.middleSockIP );

middleSock.on( 'connect' , function( socket ){ 
	console.log("connected");
});

middleSock.on( 'newConnection' , function( data ) { 
        console.log(data);
});

middleSock.on( 'event' , function(data) {
	console.log(data);
})

middleSock.on( 'pressButton' , function( data ) {
	if ( data.button.toString() === "99" ) {
		console.log( "Executing --> " + data.xRSC );
		exec( data.xRSC , { silent:true , async: false } );
	}
	else {
		console.log( "We should be pressing Button + " + data.button.toString() );
		clientManager.pressButton( data.button );
	}
});


function emitNowPlayingInfo() {
	var nowPlayingInfo = clientManager.getNowPlayingInfo();
	
}

middleSock.on( 'nowPlayingInfo' , function( data ) {
	emitNowPlayingInfo();
});

wEmitter.on( 'nowPlayingInfo' , function( data ) {
	middleSock.emit( "sendNowPlayingInfo" , data );
})

wEmitter.on( 'middleSockSend' , function( data ) {
	middleSock.emit( data.command , data.options );
});

middleSock.on('disconnect', function(){console.log("disconnected");});


server.listen( port , function() {
	console.log( "[MAIN] --> Server Started on : \n\thttp://" + localIP + ":" + port + "\n \t\t or \n\thttp://localhost:" + port + "\n" );
});


process.on('SIGINT', function () {
	console.log("\nShutting Everything Down\n");
	clientManager.properShutdown();
});

/*
setTimeout(function(){
	process.exit(1);
} , 8000 );
*/