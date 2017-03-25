var wFM = require("./ffManager.js");
var wVM = require("./videoManager.js");

var schedule = require('node-schedule');

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var ejs = require("ejs");

var ip = require("ip");
var localIP = ip.address();

var app = express();
var server = require("http").createServer(app);
var port = process.env.PORT || 6969;

// View Engine Setup
app.set( "views" , path.join( __dirname , "client" , "views" ) );
app.set( "view engine" , 'ejs' );
app.engine( 'html' , require('ejs').renderFile );

// Set Static Folder
app.use( express.static( path.join( __dirname , "client"  ) ) );

// Setup Middleware
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );

/*
// Cross-Origin Stuff
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
*/

// Routes
app.get( "/" , function( req , res , next ) {
	res.render( 'index.html' );
});


// Client-Interaction
var io = require('socket.io')(server);
io.sockets.on( 'connection' , function (socket) {
	
	var wC = socket.request.connection._peername;
	console.log( wC.address.toString() +  " connected" );
	socket.emit( 'newConnection', { 
		message: 'you are now connected to the sock.io server',
		standardYTChannels: wVM.getStandardYTChannelList() ,
		twitchChannels: null
	});

	socket.on( 'firefox-close-tab' , function( data ){
		wFM.closeCurrentTab();
	});

	socket.on( 'firefox-quit' , function( data ){
		wFM.quit();
	});

	socket.on( 'firefox-f-key' , function( data ){
		wFM.toggleFKeyPress();
	});

	// Check for new LiveYT and TwitchAPI Videos every 30 seconds (for testing) // will change to ~15 minutes ? = "*/15 * * * *"
	var updateVideoList = schedule.scheduleJob( "*/30 * * * * *" , function() {
		
		console.log("running scheduled updateVideoList task");

		wVM.updateAllSources();

		setTimeout( function() {
			var results = wVM.returnAllSources();
			socket.emit( 'latestvideos' , { videos: results } );
		} , 5000 );

	});
	
	// Check for new YT Published Videos Every 1 - Hour = "* */1 * * *"
	var updateYouTubePublishedList = schedule.scheduleJob( "*/30 * * * * *" , function() {
		
		console.log("running scheduled updateYouTubePublishedList task");
		socket.emit( 'getlatestpublishedyoutube' , { message: "time to update all folowing youtube sources" } );

	});


});


server.listen( port , function() {
	console.log( "Server Started on : \nhttp://" + localIP + ":" + port + "\n \t or \nhttp://localhost:" + port + "\n" );
	setTimeout(function(){
		wFM.openNewTab("http://localhost:6969");
	} , 2500 );
});