var request = require("request");
var cheerio = require('cheerio');

var YTliveManager = {

	lastSearch: null,
	searchResults: {},

	searchUserName: function( wUserName ) {

		var wURL = "https://www.youtube.com/user/" + wUserName + "/videos?view=2&live_view=501&flow=grid";
		
		var wResults = [];

		request( wURL , function ( err , response , body ) {
	        if (err) throw err;
	        var $ = cheerio.load(body);
	        $('.yt-lockup-title > a').each(function () {
	        	wResults.push( { title: $(this).text() , url: $(this).attr('href') } );
	        });
        	YTliveManager.lastSearch = wUserName;
        	YTliveManager.searchResults[wUserName] = wResults;
    	});

	},

};

module.exports.searchUserName = function( wUN ) {
	YTliveManager.searchUserName( wUN );
};

module.exports.returnSearchResults = function( wUN ) {
	return YTliveManager.searchResults[wUN];
};