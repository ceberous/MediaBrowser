var spawn = require("child_process").spawn;
var process = require('process'); 
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
require('shelljs/global');

// https://www.npmjs.com/package/file-size-watcher

var wChild = null;
var wKillPIDS = [];
var superKill = false;
var alreadyRespawning = false;

function cleanseENV() {

	function isKeepAliveOpen() {

		var wPIDS = [];
		var wCMD1 = "ps aux | grep node";
		var findKAlive = exec( wCMD1 , { silent:true , async: false });
		if ( findKAlive.stderr.length > 1 || findKAlive.stdout.length < 1 ) { return -1; }

		var wOutput = findKAlive.stdout.split("\n");
		for ( var i = 0; i < wOutput.length; ++i ) {
			var wOut2 = wOutput[i].split(" ");
			var wOut3 = wOut2[ wOut2.length - 1 ].split("/"); 
			if ( wOut3[ wOut3.length - 1 ] === "keepAlive.js" ) {
				for ( var j = 0; j < 8; ++j ) {
					var wTest = wOut2[j].trim();
					if ( wTest === " " ) { continue; }
					wTest = parseInt( wTest );
					if ( isNaN(wTest) ) { continue; }
					if ( wTest < 300 ) { continue; }
					if ( wOut2[j] != process.pid ) {
						console.log( "wTest = " + wTest.toString() +  " PID: " + wOut2[ j ] + " = " + wOut3[ wOut3.length - 1 ] );
						wPIDS.push( wOut2[j] );
					}
				}
				
			}
		}

		return wPIDS;

	}

	var openResult = isKeepAliveOpen();
	if ( openResult === -1 ) {
		console.log("failed to find script");
	}
	else {
		var wCMD2 = "sudo kill -9 ";
		for ( var i = 0; i < openResult.length; ++i ) {
			var wKillCMD = wCMD2 + openResult[i];
			exec( wKillCMD , { silent: true , async: false } );
			console.log( wKillCMD );
		}
	}

	function isMainOpen() {

		var wPIDS = [];
		var wCMD1 = "ps aux | grep node";
		var findMainAlive = exec( wCMD1 , { silent:true , async: false });
		if ( findMainAlive.stderr.length > 1 || findMainAlive.stdout.length < 1 ) { return -1; }

		var wOutput = findMainAlive.stdout.split("\n");
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

	var openMainResult = isKeepAliveOpen();
	if ( openMainResult === -1 ) {
		console.log("failed to find script");
	}
	else {
		var wCMD2 = "sudo kill -9 ";
		for ( var i = 0; i < openMainResult.length; ++i ) {
			var wKillCMD = wCMD2 + openMainResult[i];
			exec( wKillCMD , { silent: true , async: false } );
			console.log( wKillCMD );
		}
	}	

}

function printData(wData) {
	if ( wData === null || wData === undefined ) { return; }
	var message = decoder.write(wData);
	message = message.trim();
	if ( message.substring( 0 , 6 ) === "@@PID=" ) {
		console.log("new Child PID to kill");
		var wN = message.substring( 6 , message.length );
		wKillPIDS.push(wN);
		console.log(wN);
	}
	else {
		console.log("{W}: " + message);
	}
	return message;
}

function loadEventListeners() {
	
	wChild.stdout.on( "data" , function(data) {
		printData(data);
	});

	wChild.stderr.on( "data" , function(data) {
		printData(data);
	});

	wChild.on( "exit" , function(data) {
		if ( !alreadyRespawning && !superKill) {
			alreadyRespawning = true;
			console.log("child is dead");
			printData(data);
			console.log("Preparing to Respawn Child in 10 seconds");
			cleanupChildren();
			setTimeout(function(){
				launchChild();
			} , 10000 );
		}
	});

	wChild.on( "close"  , function(data){
		if ( !alreadyRespawning && !superKill) {
			alreadyRespawning = true;
			console.log("child is dead");
			printData(data);
			console.log("Preparing to Respawn Child in 10 seconds");
			cleanupChildren();
			setTimeout(function(){
				launchChild();
			} , 10000 );
		}
	});

	wKillPIDS.push(wChild.pid);
}

function launchChild() {
	wChild = null;
	alreadyRespawning = false;
	wChild = spawn( "/home/haley/.nvm/versions/node/v7.7.4/bin/node" , [ "/home/haley/WORKSPACE/MediaBrowser/main.js" ] );
	loadEventListeners();
}

function cleanupChildren() {
	while( wKillPIDS.length > 0 ) {
		var x1a1 = wKillPIDS.pop();
		exec( "sudo kill -9 " + x1a1.toString() , { silent:true , async: false });
		console.log( "killed @@PID = " + x1a1.toString() );
	}
}

process.on( 'SIGINT' , function () {
	superKill = true;
	cleanupChildren();
});

process.on( 'exit' , function (){
	superKill = true;
  	cleanupChildren();
});

/*
setTimeout(function(){
	process.exit(1);
} , 10000 );
*/


cleanseENV();
launchChild();