var socket = null;

var ytLiveList , twitchLiveList , standardList = null;
var usingPlaylist = true;
var wPlaylist = [];
var videoUpateOBJ = null;
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
			closeChildView();
			setTimeout(function(){
				addChildView( viewFiles.fullScreenYTLive );
				setTimeout(function() {
					$(document).trigger( "randomYTLiveBG" );
				} , 5000 );
			} , 2000 );
		});

		socket.on( 'playYTSingleVideo' , function(data) {
			usingPlaylist = false;
			wPlaylist = data.playlist;
			closeChildView();
			setTimeout(function(){
				addChildView( viewFiles.fullScreenYT );
			} , 2000 );
		});

		socket.on( 'playYTStandard', function(data) {
			closeChildView();
			setTimeout(function(){
				addChildView( viewFiles.fullScreenYT );
			} , 2000 );
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
			$(document).trigger( "nextMedia" );
		});

		socket.on( 'previousMedia' , function (data) {
			$(document).trigger( "previousMedia" );
		});		

	// -----------------------------------------------------

	wInit();

});


$(document).on( "glitchIntoFullScreen" , function( event , einfo ) { socket.emit( 'firefox-glitch-fullscreen' ); });
$(document).on( "toggle-f-keypress" , function( event , einfo ) { socket.emit( 'firefox-f-key' ); });
$(document).on( "closefirefoxtab" , function( event , einfo ) { closeChildView(); });
$(document).on( "yt-player-destoyed" , function( event , einfo ) { socket.emit( 'yt-player-destoyed' ); });

$(document).on( "ytLivePlaying" , function( event , einfo ) { socket.emit( 'ytLivePlaying' ); });
$(document).on( "ytStandardPlaying" , function( event , einfo ) { socket.emit( 'ytStandardPlaying' ); });

$(document).on( "updateYTStandardInfo" , function( event , efinfo ) { socket.emit( 'updateYTStandardInfo' , videoUpateOBJ ); });

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
		$(document).trigger( "tearDownPlayer" );
		$("#wChildView").remove();
		viewFiles.active = false;
		$("#wPlaceHolder").show();
	}

}


function wMain() {
	
	//addChildView( viewFiles.fullScreenYT );
	
}