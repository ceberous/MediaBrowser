var spawn = require("child_process").spawn;
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
require('shelljs/global');

var wChild;
var wKillPIDS = [];
var superKill = false;

function printData(wData) {
	if ( wData === null || wData === undefined ) { return; }
	var message = decoder.write(wData);
	message = message.trim();
	if ( message.substring( 0 , 6 ) === "@@PID=" ) {
		console.log("new Child PID to kill");
		var wN = message.substring( 6 , 10 );
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
		console.log("child is dead");
		printData(data);
		if (!superKill) {
			console.log("Preparing to Respawn Child in 10 seconds");
			setTimeout(function(){
				launchChild();
			} , 10000 );
		}
	});


	wChild.on( "close"  , function(data){
		console.log("child is dead");
		printData(data);
		if (!superKill) {
			console.log("Preparing to Respawn Child in 10 seconds");
			setTimeout(function(){
				launchChild();
			} , 10000 );
		}
	});

	wKillPIDS.push(wChild.pid);
}

function launchChild() {
	wChild = null;
	wChild = spawn( "node" , ["./main"] );
	loadEventListeners();
}

function cleanupChildren() {
	superKill = true;
	wChild.kill('SIGINT');
	for ( var i = 0; i < wKillPIDS.length; ++i ) {
		exec( "sudo kill -9 " + wKillPIDS[i].toString() , { silent:true , async: false });
		console.log( "killed @@PID = " + wKillPIDS[i].toString() );
	}
}

process.on( 'SIGINT' , function () {
	cleanupChildren();
});

process.on( 'exit' , function (){
  	cleanupChildren();
});

/*
setTimeout(function(){
	process.exit(1);
} , 10000 );
*/


launchChild();