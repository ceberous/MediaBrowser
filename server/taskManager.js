var schedule = require('node-schedule');
var wEmitter = require('../main.js').wEmitter;


// [TESTING]Every 30 Seconds = "*/30 * * * * *"
// Every 10 - Minutes = "*/10 * * * *"
var updateYouTubeLiveList = schedule.scheduleJob( "*/30 * * * * *" , function() {
	
	wEmitter.emit('updateYTLiveList');

});

// [TESTING]Every 30 Seconds = "*/30 * * * * *"
// Every 10 - Minutes = "*/10 * * * *"
var updateTwitchLiveList = schedule.scheduleJob( "*/30 * * * * *" , function() {
	
	wEmitter.emit('updateTwitchLiveList');

});


// [TESTING]Every 30 Seconds = "*/30 * * * * *"
// Every 30 Minutes = "*/30 * * * *"
var updateStandardList = schedule.scheduleJob( "*/30 * * * * *" , function() {
	
	wEmitter.emit('updateStandardList');

});


var gotoNextYTLiveVideo;
wEmitter.on( 'startYTShuffleTask' , function() {
	//console.log("were starting yt shuffle task");
	gotoNextYTLiveVideo = schedule.scheduleJob( "*/10 * * * * *" , function() { // every 10 seconds [TESTING]
		wEmitter.emit('nextYTLiveVideo');
	});
});

wEmitter.on( 'stopYTShuffleTask' , function() {
	//console.log("were stopping yt shuffle task");
	gotoNextYTLiveVideo.cancel();
});