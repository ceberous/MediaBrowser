var fork = require("child_process").fork;
var path = require("path");
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');


var wChild = spawn("./main");


wChild.stdout.on( "data" , function(data) {
	var message = decoder.write(data);
	message = message.trim();
	childWrapper.handleOutput(message);
});
wChild.stderr.on( "data" , function(data) {
	var message = decoder.write(data);
	message = message.trim();
	console.log(message);
});