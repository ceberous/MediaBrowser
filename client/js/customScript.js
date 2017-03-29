var socket = null;

var ytLiveList , twitchLiveList , standardList = null;
var ytLiveSwapDuration = null;

var viewFiles = {
	path: "../views",
	active: false,
	photoWall: "photoWall.html",
	fullScreenYT: "fullScreenYoutube.html",
	fullScreenTwitch: "fullScreenTwitch.html",
	error: "error.html"
};

$(document).ready( function() {

	$("#vAPP").hide();

	socket = io.connect( socketIOServerAddress + ":" + socketIOPORT );
	console.log(socket.id);

	socket.on( 'newConnection' , function (data) {
		console.log(data.message);
		ytLiveList 			= data.ytLiveList;
		twitchLiveList 		= data.twitchLiveList;
		standardList 		= data.standardList;
		console.log(ytLiveList);
		console.log(twitchLiveList);
		console.log(standardList);
	});

	// Button - Controls
	// -------------------------------------------------------
		socket.on( 'playBackgroundYTLive', function(data) {
			addChildView( viewFiles.fullScreenYT );
			setTimeout(function() {
				$(document).trigger( "randomYTLive" );
			} , 3000 );
		});

		socket.on( 'closeChildView', function(data) {
			$(document).trigger( "tearDownPlayer" );
			setTimeout( function() {
				closeChildView();
			} , 3000 );
		});	
	// -------------------------------------------------------

	// Sheduled-Updates
	// -----------------------------------------------------
		socket.on( 'latestYTLiveList' , function (data) {
			console.log(data.message);
			console.log(data.ytLiveList);
			ytLiveList = data.ytLiveList;
		});

		socket.on( 'latestTwitchLiveList' , function (data) {
			console.log(data.message);
			console.log(data.twitchLiveList);
			twitchLiveList = data.twitchLiveList;
		});			

		socket.on( 'latestStandardList' , function (data) {
			console.log(data.message);
			console.log(data.standardList);
			standardList = data.standardList;
		});

		socket.on( 'nextYTLiveVideo' , function (data) {
			console.log(data.message);
			$(document).trigger( "nextYTLiveVideo" );
		});						
	// -----------------------------------------------------

	wInit();

});


$(document).on( "glitchIntoFullScreen" , function( event , einfo ) { socket.emit( 'firefox-glitch-fullscreen' ); });
$(document).on( "toggle-f-keypress" , function( event , einfo ) { socket.emit( 'firefox-f-key' ); });
$(document).on( "closefirefoxtab" , function( event , einfo ) { closeChildView(); });
$(document).on( "yt-player-destoyed" , function( event , einfo ) { socket.emit( 'yt-player-destoyed' ); });

function wInit() {

	$("#wPlaceHolder").hide();
	//wMain();

}

function addChildView(viewName) {

	var wName = viewName || viewFiles.error;
	if ( viewFiles.active ) { closeChildView(); }

	$("#vAPP").show();
	$("#vAPP").append("<div id=wChildView></div>");
	$("#wChildView").load( viewFiles.path + "/" + wName );
	viewFiles.active = true;

}

function closeChildView() {
	
	if ( viewFiles.active ) {
		$("#wChildView").remove();
		viewFiles.active = false;
		$("#wPlaceHolder").show();
	}

}


function wMain() {
	
	//addChildView( viewFiles.fullScreenYT );
	
}

//https://github.com/justintv/Twitch-API/blob/master/embed-video.md
//https://dev.twitch.tv/docs/v5/guides/embed-video/
//https://github.com/danmactough/node-feedparser

//https://addons.mozilla.org/en-US/firefox/addon/procon-latte/reviews/
//https://help.ubuntu.com/community/AppArmor