var sockServerAddr = wCreds.socketIOServer;
var port = wCreds.socketIOPort;
var OAUTH2_CLIENT_ID = wCreds.webBrowser;
var socket = null;

var standardYTChannels = null;

var viewFiles = {
	path: "../views",
	active: false,
	photoWall: "photoWall.html",
	fullScreenYT: "fullScreenYoutube.html",
	error: "error.html"
};



$(document).ready( function() {

	$("#vAPP").hide();

	var messages = [];
	socket = io.connect( sockServerAddr + ":" + port.toString() );
	console.log(socket.id);

	socket.on( 'newConnection' , function (data) {
		console.log(data.message);
		standardYTChannels = data.standardYTChannels;
		console.log(standardYTChannels);
	});

	socket.on( 'latestvideos' , function (data) {
		console.log(data.videos);
	});

	socket.on( 'getlatestpublishedyoutube' , function (data) {
		console.log(data.message);
		$(document).trigger( "getlatestpublishedyoutube" );
	});			

	
	
});

//$(document).on( "closefirefoxtab" , function( event , einfo ) { socket.emit( 'firefox-close-tab' ); });
$(document).on( "closefirefoxtab" , function( event , einfo ) { closeChildView(); });
$(document).on( "glitchIntoFullScreen" , function( event , einfo ) { socket.emit( 'firefox-f-key' ); });
$(document).on( "ytDataClientReady" , function( event , einfo ) { wInit(); });

function wInit() {

	$("#wPlaceHolder").hide();
	$("#vAPP").show();
	wMain();

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
	
	addChildView( viewFiles.fullScreenYT );
	
}

//https://github.com/justintv/Twitch-API/blob/master/embed-video.md
//https://dev.twitch.tv/docs/v5/guides/embed-video/
//https://github.com/danmactough/node-feedparser

//https://addons.mozilla.org/en-US/firefox/addon/procon-latte/reviews/
//https://help.ubuntu.com/community/AppArmor

