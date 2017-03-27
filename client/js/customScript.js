var port = wCreds.socketIOPort;
var OAUTH2_CLIENT_ID = wCreds.webBrowser;
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

	socket = io.connect( socketIOServerAddress + ":" + port.toString() );
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

	socket.on( 'playBackgroundYTLive', function(data) {
		ytLiveSwapDuration = data.swapDuration;
		addChildView( viewFiles.fullScreenYT );
		setTimeout(function() {
			$(document).trigger( "randomYTLive" );
		} , 3000 );
	})

	socket.on( 'latestYTLiveList' , function (data) {
		console.log(data.message);
		console.log(data.ytLiveList);
	});

	socket.on( 'latestTwitchLiveList' , function (data) {
		console.log(data.message);
		console.log(data.twitchLiveList);
	});			

	socket.on( 'latestStandardList' , function (data) {
		console.log(data.message);
		console.log(data.standardList);
	});			
	
	wInit();

});


$(document).on( "glitchIntoFullScreen" , function( event , einfo ) { socket.emit( 'firefox-glitch-fullscreen' ); });
$(document).on( "toggle-f-keypress" , function( event , einfo ) { socket.emit( 'firefox-f-key' ); });
$(document).on( "closefirefoxtab" , function( event , einfo ) { closeChildView(); });

function wInit() {

	$("#wPlaceHolder").hide();
	$("#vAPP").show();
	//wMain();

}

function addChildView(viewName) {

	var wName = viewName || viewFiles.error;
	if ( viewFiles.active ) { closeChildView(); }

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