var wEmitter = require('../xmain.js').wEmitter;

var request = require("request");
var cheerio = require('cheerio');

var path = require("path");
var bSPath = path.join( __dirname , "save_files" );
var jsonfile = require("jsonfile");
var followers 			= jsonfile.readFileSync( bSPath + "/followers.json" );
var ytLiveList 			= jsonfile.readFileSync( bSPath + "/ytLiveList.json");
var ytStandardList 		= jsonfile.readFileSync( bSPath + "/ytStandardList.json" );
var twitchLiveList 		= jsonfile.readFileSync( bSPath + "/twitchLiveList.json" );
var twitchStandardList 	= jsonfile.readFileSync( bSPath + "/twitchStandardList.json");

var YTLiveManager = {

	followers: followers.ytLive,
	lastSearch: null,
	searchResults: ytLiveList,

	enumerateFollowers: function() {

		for( var i = 0; i < YTLiveManager.followers.length; ++i ) {
			YTLiveManager.searchUserName( YTLiveManager.followers[i] );
		}

	},

	searchUserName: function( wUserName ) {

		var wURL = "https://www.youtube.com/user/" + wUserName + "/videos?view=2&live_view=501&flow=grid";
		
		var wResults = [];

		request( wURL , function ( err , response , body ) {
	        if (err) throw err;
	        var $ = cheerio.load(body);
	        $('.yt-lockup-title > a').each(function () {
	        	wResults.push( { title: $(this).text() , url: $(this).attr('href') } );
	        });
        	YTLiveManager.lastSearch = wUserName;
        	YTLiveManager.searchResults[wUserName] = wResults;

        	jsonfile.writeFileSync( bSPath + "/ytLiveList.json" , YTLiveManager.searchResults );
    	});

	},

};

function updateAllSources() {
	YTLiveManager.enumerateFollowers();
	//twitchAPI.enumerateFollowing();
}

function returnAllSources() {
	var wOBJ = {
		ytLiveList: YTLiveManager.searchResults,
		twitchLiveList: null,
		standardList: null,
	};
	return wOBJ;
}



wEmitter.on( 'updateYTLiveList' , function() {
	console.log("SCHEDULED-> updateYTLiveList");
	YTLiveManager.enumerateFollowers();
	setTimeout(function(){
		wEmitter.emit('publishYTLiveList');
	} , 3000 );
});

wEmitter.on( 'updateTwitchLiveList' , function() {
	console.log("SCHEDULED-> updateTwitchLiveList");
});

wEmitter.on( 'updateStandardList' , function() {
	console.log("SCHEDULED-> updateStandardList");
});





module.exports.updateAllSources = function() {
	updateAllSources();
};

module.exports.returnAllSources = function() {
	return returnAllSources();
};