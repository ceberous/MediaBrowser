var spawn = require("child_process").spawn;
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
require('shelljs/global');

var wChild = null;
var wKillPIDS = [];
var superKill = false;
var alreadyRespawning = false;

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
	wChild = spawn( "node" , ["./main"] );
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


launchChild();