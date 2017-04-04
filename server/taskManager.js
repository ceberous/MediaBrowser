var schedule = require('node-schedule');
var wEmitter = require('../main.js').wEmitter;

var ytLiveList 		= "*/60 * * * * *"; // every 60 seconds [TESTING]
var twitchLiveList 	= "*/60 * * * * *"; // every 60 seconds [TESTING]
var standardList 	= "*/60 * * * * *"; // every 60 seconds [TESTING]
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


var gotoNextYTLiveVideo;
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
	gotoNextYTLiveVideo.cancel();
};
