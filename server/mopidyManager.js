var wEmitter = require('../main.js').wEmitter;

var colors = require("colors");
var path = require("path");
var jsonfile = require("jsonfile");

var Mopidy = require("mopidy");
var mopidy = new Mopidy({webSocketUrl: "ws://localhost:6690/mopidy/ws/"});

var oneHour = 3600000;
var oneDay = 86400000;

var MM = {

	firstLaunchReady: false,

	init: function() {

		MM.playlistManager.init();
		MM.playbackManager.init();
		MM.tracklistManager.init();

	},

	shutdown: function() {
		MM.playbackManager.stop();
		mopidy.close();
		mopidy.off();
		mopidy = null;
		console.log("[MOPIDY_MAN] --> CLOSED".yellow);
		wEmitter.emit( "mopidyNotPlaying" );
		wEmitter.emit("mopidyOffline");
	},

	playlistManager: {

		rawPlaylists: null,
		genreMapFilePath: path.join( __dirname , "save_files" , "mopidyGenreMap.json" ),
		genreMap: null,
		cachedFilePath: path.join( __dirname , "save_files" , "mopidyCache.json" ),
		cachedPlaylists: null,
		randomList: {},

		init: function() {

			MM.playlistManager.genreMap = jsonfile.readFileSync( MM.playlistManager.genreMapFilePath );
			MM.playlistManager.cachedPlaylists = jsonfile.readFileSync( MM.playlistManager.cachedFilePath );
			
			setTimeout( ()=> { MM.playlistManager.updatePlaylistCache(); } , 1000 );

		},

		updatePlaylistCache: function() {

			var timeNow = new Date().getTime();
			var wDiff = timeNow - MM.playlistManager.cachedPlaylists.lastUpdatedTime;
			if ( wDiff < oneHour ) { console.log( "[MOPIDY_MAN] --> already updated playlist cache this hour".yellow ); wEmitter.emit( 'playlistCacheUpdated' ); return; }
			
			mopidy.playlists.getPlaylists().then(function(playlists){

				playlists.shift();
				for ( var i = 0; i < playlists.length; ++i ) {

					var wKey = playlists[i].uri.slice( playlists[i].uri.length - 12 , playlists[i].uri.length );

					if ( MM.playlistManager.genreMap[wKey] === undefined ) { MM.playlistManager.genreMap[wKey] = "unknown"; }
					var wGenre = MM.playlistManager.genreMap[wKey];
					if ( MM.playlistManager.cachedPlaylists.playlists[wGenre] === undefined ) { MM.playlistManager.cachedPlaylists.playlists[wGenre] = {}; }										

					if ( MM.playlistManager.cachedPlaylists.playlists[wGenre][wKey] === undefined ) { 
						MM.playlistManager.cachedPlaylists.playlists[wGenre][wKey] = {};
						MM.playlistManager.cachedPlaylists.playlists[wGenre][wKey].skipCount = 0; 
						MM.playlistManager.cachedPlaylists.playlists[wGenre][wKey].playCount = 0; 
					}

					MM.playlistManager.cachedPlaylists.playlists[wGenre][wKey].name = playlists[i].name;
					MM.playlistManager.cachedPlaylists.playlists[wGenre][wKey].playlistModel = playlists[i];

				}

					MM.playlistManager.cachedPlaylists.lastUpdatedTime = timeNow;
					
					jsonfile.writeFileSync( MM.playlistManager.genreMapFilePath , MM.playlistManager.genreMap );
					jsonfile.writeFileSync( MM.playlistManager.cachedFilePath , MM.playlistManager.cachedPlaylists );
					console.log("[MOPIDY_MAN] --> playlist Cache Updated".yellow);
					wEmitter.emit( 'playlistCacheUpdated' );

			});
			

		},

		getRandomList: function(wGenre) {

			if ( wGenre === undefined || wGenre == null ) { wGenre = "classic"; }

			var wKeys = Object.keys( MM.playlistManager.cachedPlaylists.playlists[wGenre] );
			var i = Math.floor( ( Math.random() * wKeys.length ) + 0 );

			MM.playlistManager.randomList = {};
			MM.playlistManager.randomList.genre = wGenre;
			MM.playlistManager.randomList.key = wKeys[i];
			MM.playlistManager.randomList.name = MM.playlistManager.cachedPlaylists.playlists[wGenre][ wKeys[i] ].name;
			MM.playlistManager.randomList.playlistModel = MM.playlistManager.cachedPlaylists.playlists[wGenre][ wKeys[i] ].playlistModel;
			wEmitter.emit( 'playlistCacheUpdated' );

		},

		updateSkipCount: function() {
			MM.playlistManager.cachedPlaylists.playlists[MM.playlistManager.randomList.genre][MM.playlistManager.randomList.key].skipCount += 1;
			jsonfile.writeFileSync( MM.playlistManager.cachedFilePath , MM.playlistManager.cachedPlaylists );
			console.log("[MOPIDY_MAN] --> playlist Cache Updated with new: SkipCount".yellow);
		},

		updatePlayCount: function() {
			MM.playlistManager.cachedPlaylists.playlists[MM.playlistManager.randomList.genre][MM.playlistManager.randomList.key].playCount += 1;
			jsonfile.writeFileSync( MM.playlistManager.cachedFilePath , MM.playlistManager.cachedPlaylists );
			console.log("[MOPIDY_MAN] --> playlist Cache Updated with new: PlayCount".yellow);
		},		

	},

	playbackManager: {

		currentState: null,
		currentTimePosition: null,

		init: function() {

			MM.playbackManager.getState();
			setTimeout( ()=> { 
				if ( MM.playbackManager.currentState === "playing" ) { MM.playbackManager.stop(); MM.playbackManager.getState(); }
			} , 1500 );

		},

		getState: function() {

		    mopidy.playback.getState().then(function (state) {
		        console.log( colors.yellow( "[MOPIDY_MAN] --> STATE = " + state ) );
		        MM.playbackManager.currentState = state;
		    });

		},		
		
		togglePlayPause: function() {

			if ( MopidyManager.playbackManager.currentState === "paused" ) {
				MopidyManager.playbackManager.play();
			}
			else {
				MM.playbackManager.pause();
			}

		},

		play: function() {
		    mopidy.playback.play().then(function (something) {
		        //setTimeout( ()=> { MM.playbackManager.getState(); } , 1000 );
		        wEmitter.emit( "mopidyPlaying" );
		    });
		},

		next: function() {
		    mopidy.playback.next().then(function (something) {
		        //setTimeout( ()=> { MM.tracklistManager.getCurrentList(); } , 1000 );
		        wEmitter.emit( "mopidyPlaying" );
		    });
		},

		previous: function() {
		    mopidy.playback.previous().then(function (something) {
		       //setTimeout( ()=> { MM.tracklistManager.getCurrentList(); } , 1000 );
		       wEmitter.emit( "mopidyPlaying" );
		    });
		},

		stop: function() {
			if ( mopidy != null ) {
				 mopidy.playback.stop().then(function (something) {
		        	setTimeout( ()=> { MM.playbackManager.getState(); } , 1000 );
		        	wEmitter.emit( "mopidyNotPlaying" );
		    	});
			}
		   
		},

		pause: function() {
		    mopidy.playback.pause().then(function (something) {
		        MM.playbackManager.getState();
		        wEmitter.emit( "mopidyNotPlaying" );
		    });
		},

		resume: function() {
		    mopidy.playback.resume().then(function (something) {
		        MM.playbackManager.getState();
		        wEmitter.emit( "mopidyPlaying" );
		    });
		},

		getTimePosition: function() {
		    mopidy.playback.getTimePosition().then(function (timePosition) {
		    	console.log(timePosition);
		        MM.playbackManager.currentTimePosition = timePosition;
		    });
		},

		seek: function() {

		},

	},

	tracklistManager: {

		nowPlayingList: {},
		randomMode: null,

		init: function() {

			MM.tracklistManager.setConsumeMode(true);
			MM.tracklistManager.setRandomMode(true);
			MM.tracklistManager.getRandomMode();

		},

		startRandomPlaylist: function(wGenre) {

			// If were in a new random genre
			if ( MM.playlistManager.randomList.genre != wGenre ) {

				MM.playlistManager.getRandomList( wGenre );
				setTimeout( ()=> { 
					mopidy.tracklist.clear().then( function( result ){
						mopidy.tracklist.add( MM.playlistManager.randomList.playlistModel.tracks ).then(function(result){
							MM.tracklistManager.nowPlayingList.name 			= MM.playlistManager.randomList.name;
							MM.tracklistManager.nowPlayingList.genre 			= MM.playlistManager.randomList.genre;
							MM.tracklistManager.nowPlayingList.key 				= MM.playlistManager.randomList.key;
							MM.tracklistManager.nowPlayingList.length 			= MM.playlistManager.randomList.playlistModel.tracks.length;
							MM.tracklistManager.nowPlayingList.index 			= 1;
							MM.tracklistManager.nowPlayingList.playlistModel 	= MM.playlistManager.randomList.playlistModel;
							MM.playbackManager.play();
							setTimeout( ()=> { 
								MM.playlistManager.getRandomList();
								MM.tracklistManager.getCurrentList();
							} , 1500 );
						});
					});
				} , 2000 );

			}
			else {
				mopidy.tracklist.clear().then( function( result ){
					mopidy.tracklist.add( MM.playlistManager.randomList.playlistModel.tracks ).then(function(result){
						MM.tracklistManager.nowPlayingList.name 			= MM.playlistManager.randomList.name;
						MM.tracklistManager.nowPlayingList.genre 			= MM.playlistManager.randomList.genre;
						MM.tracklistManager.nowPlayingList.key 				= MM.playlistManager.randomList.key;
						MM.tracklistManager.nowPlayingList.length 			= MM.playlistManager.randomList.playlistModel.tracks.length;
						MM.tracklistManager.nowPlayingList.index 			= 1;
						MM.tracklistManager.nowPlayingList.playlistModel 	= MM.playlistManager.randomList.playlistModel;
						MM.playbackManager.play();
						setTimeout( ()=> { 
							MM.playlistManager.getRandomList();
							MM.tracklistManager.getCurrentList();
						} , 1500 );
					});
				});		

			}

		},

		getCurrentList: function() {

		    mopidy.tracklist.getTracks().then( function(tracks) {
		        MM.tracklistManager.nowPlayingList.tracks = tracks;
		        MM.tracklistManager.nowPlayingList.length = tracks.length;
		       	MM.tracklistManager.getCurrentPosition();
		    });

		},

		getCurrentPosition: function() {
		    mopidy.tracklist.index().then( function(index) {

		    	if ( index === null ) { index = 0; console.log("[MOPIDY_MAN] --> getCurrentPosition()--> null index was returned".yellow); } 
		    	MM.tracklistManager.nowPlayingList.index = index;

		    	console.log( colors.yellow( "[MOPIDY_MAN] --> PlaylistGenre = " + MM.tracklistManager.nowPlayingList.genre ) );
		    	console.log( colors.yellow( "[MOPIDY_MAN] --> Playlist = " + MM.tracklistManager.nowPlayingList.name ) );
		    	console.log( colors.yellow( "[MOPIDY_MAN] --> TrackArtist = " + MM.tracklistManager.nowPlayingList.tracks[index].artists[0].name ) );
		    	setTimeout(function(){
					console.log( colors.yellow( "[MOPIDY_MAN] --> Track = " + MM.tracklistManager.nowPlayingList.tracks[index].name ) );
					console.log( colors.yellow( "[MOPIDY_MAN] --> [" + ( index + 1 ) + "] of " + MM.tracklistManager.nowPlayingList.length.toString() + " || SHUFFLE = " + MM.tracklistManager.randomMode.toString() ) );
		    	} , 500 );

		    });
		},

		setConsumeMode: function(wBool) {
			mopidy.tracklist.setConsume(wBool).then(function(result){

			});
		},

		getRandomMode: function() {
			mopidy.tracklist.getRandom().then( function( result ){
				MM.tracklistManager.randomMode = result;
			})
		},

		setRandomMode: function(wBool) {
			mopidy.tracklist.setRandom(wBool).then( function( result ){
				MM.tracklistManager.randomMode = result;
			});
		},


	}

};


mopidy.on('state:online', function () {
    MM.init();
});

mopidy.on( 'event:trackPlaybackEnded' , function(data) {
	setTimeout(function() {
		if ( MM.tracklistManager.nowPlayingList.length <= 1 ) {
			MM.tracklistManager.startRandomPlaylist( MM.tracklistManager.nowPlayingList.genre );
		}
		else {
			MM.tracklistManager.getCurrentList();
		}
	} , 1000 );
});

wEmitter.on( 'playlistCacheUpdated' , function() {

	if ( !MM.firstLaunchReady ) { MM.firstLaunchReady = true; MM.playlistManager.getRandomList();  } 
	else {
		console.log( "[MOPIDY_MAN] --> ONLINE".yellow ); 
		wEmitter.emit("mopidyOnline"); 
	}

});



module.exports.updateSkipCount = function() {
	MM.playlistManager.updateSkipCount();
};

module.exports.updatePlayCount = function() {
	MM.playlistManager.updatePlayCount();
};

module.exports.randomPlaylist = function(wGenre) {
	MM.tracklistManager.startRandomPlaylist(wGenre);
};

module.exports.stopMedia = function() {
	MM.playbackManager.stop();
};

module.exports.pauseMedia = function() {
	if ( MM.playbackManager.currentState === "paused" ) {
		MM.playbackManager.resume();
	}
	else {
		MM.playbackManager.pause();
		wEmitter.emit("mopidyPaused");
	}
};

module.exports.nextMedia = function() {
	MM.playbackManager.next();
};

module.exports.previousMedia = function() {
	MM.playbackManager.previous();
};

module.exports.closeMopidy = function() {
	MM.shutdown();
};


process.on('SIGINT', function () {
	console.log( "\n[MOPIDY] --> Shutting Down\n".yellow );
	MM.shutdown();
});