var schedule = require('node-schedule');
var wEmitter = require('../main.js').wEmitter;

var colors = require("colors");

var ytLiveList 		= "*/15 * * * *"; // every 5 minutes 
var twitchLiveList 	= "*/59 * * * *"; // every 1 hour 
//var standardList 	= "*/59 * * * *"; // every 1 hour
var standardList 	= "*/59 * * * *"; // every 1 hour

var ytShuffle 		= "*/3 * * * *"; // every 3 Minutes


var updateYouTubeLiveList = schedule.scheduleJob( ytLiveList , function() {
	console.log( "[TASK_MAN] --> SCHEDULED --> updateYTLiveList".black.bgWhite );	
	wEmitter.emit('updateYTLiveList');
});


var updateTwitchLiveList = schedule.scheduleJob( twitchLiveList , function() {
	console.log("[TASK_MAN] --> SCHEDULED --> updateTwitchLiveList".black.bgWhite );
	wEmitter.emit('updateTwitchLiveList');
});


var updateStandardList = schedule.scheduleJob( standardList , function() {
	console.log("[TASK_MAN] --> SCHEDULED --> updateStandardList".black.bgWhite );	
	wEmitter.emit('updateStandardList');
});


var gotoNextYTLiveVideo = null;
module.exports.startYTShuffleTask = function() {
	gotoNextYTLiveVideo = schedule.scheduleJob( ytShuffle , function() { 
		console.log("[TASK_MAN] --> SCHEDULED--> nextYTLiveVideo".black.bgWhite );
		wEmitter.emit( 'socketSendTask' , 'nextYTLiveVideo', { 
			message: 'goto nextYTLiveVideo',
		});
	});
};

module.exports.stopYTShuffleTask = function() {
	//console.log("were stopping yt shuffle task");
	if ( gotoNextYTLiveVideo != null ) {
		gotoNextYTLiveVideo.cancel();
	}
};
