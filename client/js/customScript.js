var socket = null;

var ytLiveList , twitchLiveList , standardList = null;
var ytLiveSwapDuration = null;

var viewFiles = {
	path: "../views",
	active: false,
	photoWall: "photoWall.html",
	fullScreenYTLive: "fullScreenYoutubeLive.html",
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

	// Child-View Management
	// -------------------------------------------------------
		socket.on( 'playBackgroundYTLive', function(data) {
			addChildView( viewFiles.fullScreenYTLive );
			setTimeout(function() {
				$(document).trigger( "randomYTLiveBG" );
			} , 5000 );
		});

		socket.on( 'playYTStandard', function(data) {
			addChildView( viewFiles.fullScreenYT );
		});

		socket.on( 'playFullScreenTwitch', function(data) {
			addChildView( viewFiles.fullScreenTwitch );
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
			if ( data.ytLiveList != null ) {
				ytLiveList = data.ytLiveList;
			}
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

		socket.on( 'nextMedia' , function (data) {
			console.log(data.message);
			$(document).trigger( "nextMedia" );
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

	$("#wPlaceHolder").hide();	

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