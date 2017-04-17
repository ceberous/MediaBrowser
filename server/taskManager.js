var schedule = require('node-schedule');
var wEmitter = require('../main.js').wEmitter;

var ytLiveList 		= "*/5 * * * *"; // every 5 minutes 
var twitchLiveList 	= "*/60 * * * *"; // every 1 hour 
var standardList 	= "*/60 * * * *"; // every 1 hour

var ytShuffle 		= "*/5 * * * *"; // every 5 Minutes


var updateYouTubeLiveList = schedule.scheduleJob( ytLiveList , function() {
	console.log("[TASK_MAN] --> SCHEDULED --> updateYTLiveList");	
	wEmitter.emit('updateYTLiveList');
});


var updateTwitchLiveList = schedule.scheduleJob( twitchLiveList , function() {
	console.log("[TASK_MAN] --> SCHEDULED --> updateTwitchLiveList");
	wEmitter.emit('updateTwitchLiveList');
});


var updateStandardList = schedule.scheduleJob( standardList , function() {
	console.log("[TASK_MAN] --> SCHEDULED --> updateStandardList");	
	wEmitter.emit('updateStandardList');
});


var gotoNextYTLiveVideo = null;
module.exports.startYTShuffleTask = function() {
	gotoNextYTLiveVideo = schedule.scheduleJob( ytShuffle , function() { 
		console.log("[TASK_MAN] --> SCHEDULED--> nextYTLiveVideo");
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
