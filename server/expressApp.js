var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var ejs = require("ejs");


var app = express();
var server = require("http").createServer(app);
var port = process.env.PORT || 6969;

// View Engine Setup
app.set( "views" , path.join( __dirname , "../client" , "views" ) );
app.set( "view engine" , 'ejs' );
app.engine( 'html' , require('ejs').renderFile );

// Set Static Folder
app.use( express.static( path.join( __dirname , "../client"  ) ) );

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

app.get( "/control" , function( req , res , next ) {
	res.render( 'control.html' );
});



module.exports = app;

