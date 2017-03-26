var wEmitter = require('../main.js').wEmitter;

var FeedParser = require('feedparser');
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
	newResults: {},
	computedUnWatchedList: ytLiveList,

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
	        	var wID = $(this).attr('href');
	        	wID = wID.substring( wID.length - 11 , wID.length );
	        	wResults.push( { title: $(this).text() , id: wID } );
	        });

        	YTLiveManager.newResults[wUserName] = wResults;

        	YTLiveManager.updateComputedUnWatchedList(wUserName);
        	
    	});

	},

	updateComputedUnWatchedList: function(wProp) {

		for ( var i = 0; i < YTLiveManager.newResults[wProp].length; ++i ) {

			if ( !YTLiveManager.computedUnWatchedList[wProp] ) {
				YTLiveManager.computedUnWatchedList[wProp] = {};
			}

			if ( !YTLiveManager.computedUnWatchedList[wProp][YTLiveManager.newResults[wProp][i]["id"]] ) {
				
				console.log("we need to store this id");
				YTLiveManager.computedUnWatchedList[wProp][YTLiveManager.newResults[wProp][i]["id"]] = {
					
					title: YTLiveManager.newResults[wProp][i].title,
					watched: false,

				};

			} 
			
		}


		jsonfile.writeFileSync( bSPath + "/ytLiveList.json" , YTLiveManager.computedUnWatchedList );

	}

};

var YTFeedManager = {

	feeds: followers.ytStandard,
	newFeedResults: {},
	computedUnWatchedList: ytStandardList,

	enumerateFollowers: function() {

		for( var prop in YTFeedManager.feeds ) {
			
			YTFeedManager.fetchXML( prop , YTFeedManager.feeds[prop] );

		}

	},

	fetchXML: function( wProp , channelID ) {

		var wFeedURL = "https://www.youtube.com/feeds/videos.xml?channel_id=" + channelID;

		var wResults = [];

		var req = request(wFeedURL);

		var wOptions = {
			"normalize": true,
			"feedurl": wFeedURL,
		};

		var feedparser = new FeedParser([wOptions]);

		req.on('error', function (error) {
			console.log(error);
		});

		req.on('response', function (res) {
			var stream = this; // `this` is `req`, which is a stream

			if (res.statusCode !== 200) {
				this.emit('error', new Error('Bad status code'));
			}
			else {
				stream.pipe(feedparser);
			}
		});

		feedparser.on('error', function (error) {
			console.log(error);
		});

		feedparser.on('readable', function () {

			var stream = this; 
			var meta = this.meta;
			var item;

			while (item = stream.read()) {
				wResults.push(item);
			}

		});

		feedparser.on( "end" , function() {
			YTFeedManager.parseResults(  wProp , wResults );
		});

	},

	parseResults: function( wProp , wResults ) {

		YTFeedManager.newFeedResults[wProp] = [];

		for ( var i = 0; i < wResults.length; ++i ) {

			var wEntry = {
				title: wResults[i].title,
				pubdate: wResults[i].pubdate,
				id: wResults[i]["yt:videoid"]["#"]
			};
			
			YTFeedManager.newFeedResults[wProp].push(wEntry);

		}

		YTFeedManager.updateComputedUnWatchedList( wProp );

	},

	updateComputedUnWatchedList: function( wProp ) {

		for ( var i = 0; i < YTFeedManager.newFeedResults[wProp].length; ++i ) {

			if ( !YTFeedManager.computedUnWatchedList[wProp] ) {
				YTFeedManager.computedUnWatchedList[wProp] = {};
			}

			if ( !YTFeedManager.computedUnWatchedList[wProp][YTFeedManager.newFeedResults[wProp][i]["id"]] ) {
				
				console.log("we need to store this id");
				YTFeedManager.computedUnWatchedList[wProp][YTFeedManager.newFeedResults[wProp][i]["id"]] = {
					
					title: YTFeedManager.newFeedResults[wProp][i].title,
					pubdate: YTFeedManager.newFeedResults[wProp][i].pubdate,
					watched: false,
					completed: false,
					resumeTime: null

				};

			} 
			
		}

		jsonfile.writeFileSync( bSPath + "/ytStandardList.json" , YTFeedManager.computedUnWatchedList );

	}

};








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
	YTFeedManager.enumerateFollowers();
	setTimeout(function(){
		wEmitter.emit('publishStandardList');
	} , 5000 );
});





function returnAllSources() {
	var wOBJ = {
		ytLiveList: YTLiveManager.computedUnWatchedList,
		twitchLiveList: null,
		standardList: { ytStandard: YTFeedManager.computedUnWatchedList , twitchStandard: null },
	};
	return wOBJ;
}


module.exports.returnAllSources = function() {
	return returnAllSources();
};

module.exports.returnYTLiveList = function() {
	return YTLiveManager.computedUnWatchedList;
};

module.exports.returnTwitchLiveList = function() {
	return null;
};

module.exports.returnStandardList = function() {
	return { ytStandard: YTFeedManager.computedUnWatchedList , twitchStandard: null };
};