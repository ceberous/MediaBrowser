var wEmitter = require('../main.js').wEmitter;

var colors = require("colors");

var FeedParser = require('feedparser');
var request = require("request");
var cheerio = require('cheerio');

var path = require("path");
var bSPath = path.join( __dirname , "save_files" );
var jsonfile = require("jsonfile");
var followers 			= jsonfile.readFileSync( bSPath + "/followers.json" );
var ytLiveList 			= null;
var ytLiveBlackList 	= jsonfile.readFileSync( bSPath + "/ytLiveBlackList.json" );
var ytStandardList 		= jsonfile.readFileSync( bSPath + "/ytStandardList.json" );
var twitchLiveList 		= jsonfile.readFileSync( bSPath + "/twitchLiveList.json" );
var twitchStandardList 	= jsonfile.readFileSync( bSPath + "/twitchStandardList.json");

/*
var TwitchManager = {

	followers: followers.twitch,
	newResults: {},
	computedUnWatchedList: twitchStandardList,

	enumerateFollowers: function() {

		for( var i = 0; i < TwitchManager.followers.length; ++i ) {
			console.log( TwitchManager.followers[i] )
			TwitchManager.checkLive( TwitchManager.followers[i] );
			//TwitchManager.checkPublishedVideos( TwitchManager.followers[i] );
		}


	},

	checkLive: function(wUserName) {

		var wURL = "https://www.twitch.tv/" + wUserName;
		
		var wResults = [];

		//recent-past-broadcast__message

		request( wURL , function ( err , response , body ) {
	        
	        if (err) throw err;
	        var $ = cheerio.load(body);
	     
	        var liveTest = $('.recent-past-broadcast__message_sub').html();//.children().length;
	        console.log(liveTest);
	        if ( liveTest > 0 ) {

	        	console.log( wUserName + " is offline");
	        }

        	//YTLiveManager.newResults[wUserName] = wResults;

        	//YTLiveManager.updateComputedUnWatchedList(wUserName);
        	
    	});		

	},

	checkPublishedVideos: function() {

	},



};

//TwitchManager.enumerateFollowers();
*/

var YTLiveManager = {

	followers: followers.ytLive,
	newResults: {},
	computedUnWatchedList: ytLiveList,

	init: function() {
		YTLiveManager.enumerateFollowers();
	},

	enumerateFollowers: function() {

		for( var i = 0; i < YTLiveManager.followers.length; ++i ) {
			YTLiveManager.searchUserName( YTLiveManager.followers[i] );
		}

	},

	searchUserName: function( wUserName ) {

		var wURL;
		if ( typeof wUserName === 'object' ) {
			wURL = "https://www.youtube.com/user/" + wUserName.channelID + "/videos?view=2&live_view=501&flow=grid";
		}
		else {
			wURL = "https://www.youtube.com/user/" + wUserName + "/videos?view=2&live_view=501&flow=grid";
		}
		
		var wResults = [];

		request( wURL , function ( err , response , body ) {
			//console.log(wURL);
	        if (err) {console.log(err); return;}
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

			if ( YTLiveManager.computedUnWatchedList == null ) { YTLiveManager.computedUnWatchedList = {}; }

			if ( !YTLiveManager.computedUnWatchedList[wProp] ) {
				YTLiveManager.computedUnWatchedList[wProp] = {};
			}

			if ( !YTLiveManager.computedUnWatchedList[wProp][YTLiveManager.newResults[wProp][i]["id"]] ) {

				var wStoring = true;
				for ( var j = 0; j < ytLiveBlackList[wProp].length; ++j ) {
					if ( YTLiveManager.newResults[wProp][i]["id"] === ytLiveBlackList[wProp][j] ) { wStoring = false; }
				}

				if ( wStoring ) {

					console.log( colors.cyan( "[VIDEO_MAN] --> Storing --> YTLiveID: " + YTLiveManager.newResults[wProp][i]["id"] ) );
					YTLiveManager.computedUnWatchedList[wProp][YTLiveManager.newResults[wProp][i]["id"]] = {
						
						title: YTLiveManager.newResults[wProp][i].title,
						watched: false,

					};

				}

			} 
			
		}

		jsonfile.writeFileSync( bSPath + "/ytLiveList.json" , YTLiveManager.computedUnWatchedList );

	}

};

var YTFeedManager = {

	feeds: followers.ytStandard,
	newFeedResults: {},
	cachedResults: ytStandardList,
	computedUnWatchedList: null,

	init: function() {
		YTFeedManager.updateComputedUnWatchedList();
	},

	enumerateFollowers: function() {

		for( var follower in YTFeedManager.feeds ) {
			
			YTFeedManager.fetchXML( follower , YTFeedManager.feeds[follower] );

		}

	},

	fetchXML: function( followerUserName , channelID ) {

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
			YTFeedManager.parseResults(  followerUserName , wResults );
		});

	},

	parseResults: function( followerUserName , wResults ) {

		YTFeedManager.newFeedResults[followerUserName] = [];

		for ( var i = 0; i < wResults.length; ++i ) {

			var wEntry = {
				title: wResults[i].title,
				pubdate: wResults[i].pubdate,
				id: wResults[i]["yt:videoid"]["#"]
			};
			
			YTFeedManager.newFeedResults[followerUserName].push(wEntry);

		}

		YTFeedManager.updateCachedResults( followerUserName );

	},

	updateCachedResults: function( followerUserName ) {

		for ( var i = 0; i < YTFeedManager.newFeedResults[followerUserName].length; ++i ) {

			// If UserName Does not Exist Already
			if ( !YTFeedManager.cachedResults[followerUserName] ) {
				YTFeedManager.cachedResults[followerUserName] = {};
			}

			// If ID is not in UserName
			if ( !YTFeedManager.cachedResults[followerUserName][YTFeedManager.newFeedResults[followerUserName][i]["id"]] ) {
				
				console.log( colors.cyan( "[VIDEO_MAN] --> STORING --> ytStandardID( " + followerUserName + " , " + YTFeedManager.newFeedResults[followerUserName][i]["id"] + " )" ) );
				YTFeedManager.cachedResults[followerUserName][YTFeedManager.newFeedResults[followerUserName][i]["id"]] = {
					
					title: YTFeedManager.newFeedResults[followerUserName][i].title,
					pubdate: YTFeedManager.newFeedResults[followerUserName][i].pubdate,
					//watched: false,
					completed: false,
					resumeTime: null

				};

			}

		}

		jsonfile.writeFileSync( bSPath + "/ytStandardList.json" , YTFeedManager.cachedResults );
		YTFeedManager.newFeedResults = {};

		YTFeedManager.updateComputedUnWatchedList();

	},

	updateComputedUnWatchedList: function() {

		YTFeedManager.computedUnWatchedList = YTFeedManager.cachedResults;

		for ( var iprop in YTFeedManager.computedUnWatchedList ) {

			for ( var jprop in YTFeedManager.computedUnWatchedList[iprop] ) {

				if ( YTFeedManager.computedUnWatchedList[iprop][jprop].completed ) {
					delete YTFeedManager.computedUnWatchedList[iprop][jprop];
				}

			}

		}

	}

};


YTLiveManager.init();
YTFeedManager.init();

module.exports.returnAllSources = function() {
	return {
		ytLiveList: YTLiveManager.computedUnWatchedList,
		twitchLiveList: null,
		standardList: { ytStandard: YTFeedManager.computedUnWatchedList , twitchStandard: null },
	};
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

module.exports.updateYTLiveList = function() {
	YTLiveManager.enumerateFollowers();
};

module.exports.updateTwitchLiveList = function() {
	//YTLiveManager.enumerateFollowers();
};

module.exports.updateStandardList = function() {
	YTFeedManager.enumerateFollowers();
	//TwitchFeedManager.enumerateFollowers();
};

module.exports.pauseMedia = function() {
	wEmitter.emit( 'socketSendTask' , "pauseMedia" );
};

module.exports.stopMedia = function() {
	wEmitter.emit( 'socketSendTask' , "stopMedia" );
	setTimeout(function(){
		wEmitter.emit("killFirefox");
	});
};

module.exports.nextMedia = function() {
	wEmitter.emit( 'socketSendTask' , "nextMedia" );	
};

module.exports.previousMedia = function() {
	wEmitter.emit( 'socketSendTask' , "previousMedia" );	
};

module.exports.updateYTStandardInfo = function(wOBJ) {

	var lID = wOBJ.last.id;
	var lT 	= parseInt( wOBJ.last.time ); 
	var lDuration = wOBJ.last.duration;
	var cID = wOBJ.now.id;
	var cT 	= parseInt( wOBJ.now.time );
	var cDuration = wOBJ.now.duration;

	//console.log( "Updating ytStandardList.json with: " );

	for ( var iprop in YTFeedManager.cachedResults ) {
		for ( var jprop in YTFeedManager.cachedResults[iprop] ) {
			if ( jprop === lID ) {
				if ( lT >= lDuration - 5 ) { YTFeedManager.cachedResults[iprop][jprop].completed = true; }
				else { YTFeedManager.cachedResults[iprop][jprop].resumeTime = lT }
				YTFeedManager.cachedResults[iprop][jprop].completed = true;
				//console.log("Last = ");
				//console.log( wOBJ.last );
				//console.log( YTFeedManager.cachedResults[iprop][jprop] );
			}
			else if ( jprop === cID ) {
				if ( cT >= cDuration - 5 ) { YTFeedManager.cachedResults[iprop][jprop].completed = true; }
				else { YTFeedManager.cachedResults[iprop][jprop].resumeTime = cT }
				YTFeedManager.cachedResults[iprop][jprop].completed = true;					
				//console.log("Current = ");
				//console.log( wOBJ.now );
				//console.log( YTFeedManager.cachedResults[iprop][jprop] );
			}
		}
	}

	jsonfile.writeFileSync( bSPath + "/ytStandardList.json" , YTFeedManager.cachedResults );

};	