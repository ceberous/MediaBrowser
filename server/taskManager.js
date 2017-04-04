var schedule = require('node-schedule');
var wEmitter = require('../main.js').wEmitter;

var ytLiveList 		= "/5 * * * *"; // every 5 minutes [TESTING]
var twitchLiveList 	= "/5 * * * *"; // every 5 minutes [TESTING]
var standardList 	= "/5 * * * *"; // every 5 minutes [TESTING]
var ytShuffle 		= "*/10 * * * * *"; // every 10 seconds [TESTING]


var updateYouTubeLiveList = schedule.scheduleJob( ytLiveList , function() {
	wEmitter.emit('updateYTLiveList');
});


var updateTwitchLiveList = schedule.scheduleJob( twitchLiveList , function() {
	wEmitter.emit('updateTwitchLiveList');
});


var updateStandardList = schedule.scheduleJob( standardList , function() {	
	wEmitter.emit('updateStandardList');
});


var gotoNextYTLiveVideo = null;
module.exports.startYTShuffleTask = function() {
	gotoNextYTLiveVideo = schedule.scheduleJob( ytShuffle , function() { 
		console.log("SCHEDULED--> nextYTLiveVideo");
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
