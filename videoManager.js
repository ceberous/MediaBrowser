var request = require("request");
var cheerio = require('cheerio');

var standardYTChannelList = [ "PowerfulJRE" , "kylelandry" , "brtvofficial" ];

var YTLiveManager = {

	followingUsers: [ "ouramazingspace" , "MontereyBayAquarium" ],
	lastSearch: null,
	searchResults: {},

	enumerateFollowing: function() {

		for( var i = 0; i < YTLiveManager.followingUsers.length; ++i ) {
			YTLiveManager.searchUserName( YTLiveManager.followingUsers[i] );
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
    	});

	},

};

function updateAllSources() {
	YTLiveManager.enumerateFollowing();
	//twitchAPI.enumerateFollowing();
}

function returnAllSources() {
	var wOBJ = {
		ytLiveVideos: YTLiveManager.searchResults,
		//twitchVideos: "",
	};
	return wOBJ;
}


module.exports.updateAllSources = function() {
	updateAllSources();
};

module.exports.returnAllSources = function() {
	return returnAllSources();
};

module.exports.getStandardYTChannelList = function() {
	return standardYTChannelList; 
};