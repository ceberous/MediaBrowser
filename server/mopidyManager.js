var wEmitter = require('../main.js').wEmitter;
var Mopidy = require("mopidy");
var mopidy = new Mopidy({webSocketUrl: "ws://localhost:6690/mopidy/ws/"});


var MopidyManager = {

	init: function() {

		MopidyManager.playlistManager.getRawPlaylists();
		MopidyManager.playbackManager.getState();
		MopidyManager.tracklistManager.setConsumeMode(true);
		MopidyManager.tracklistManager.getCurrentList();

	},

	playbackManager: {

		currentState: "",
		currentTimePosition: "",

		getState: function() {

		    mopidy.playback.getState().then(function (state) {
		        console.log(state);
		        MopidyManager.playbackManager.currentState = state;
		    });

		},		
		
		togglePlayPause: function() {

			if ( MopidyManager.playbackManager.currentState === "paused" ) {
				MopidyManager.playbackManager.play();
			}
			else {
				MopidyManager.playbackManager.pause();
			}

		},

		play: function() {

		    mopidy.playback.play().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });

		},

		next: function() {
		    mopidy.playback.next().then(function (something) {
		        MopidyManager.playbackManager.getState();
		        setTimeout( function() {
		        	MopidyManager.tracklistManager.getCurrentList();
		        } , 1000 );
		    });
		},

		previous: function() {
		    mopidy.playback.previous().then(function (something) {
		        MopidyManager.playbackManager.getState();
		        setTImeout( function() {
		        	MopidyManager.tracklistManager.getCurrentList();
		        } , 1000 );
		    });
		},

		stop: function() {
		    mopidy.playback.stop().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });
		},

		pause: function() {
		    mopidy.playback.pause().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });
		},

		resume: function() {
		    mopidy.playback.resume().then(function (something) {
		        MopidyManager.playbackManager.getState();
		    });
		},

		getTimePosition: function() {
		    mopidy.playback.getTimePosition().then(function (timePosition) {
		    	console.log(timePosition);
		        MopidyManager.playbackManager.currentTimePosition = timePosition;
		    });
		},

		seek: function() {

		},

	},

	playlistManager: {

		rawPlaylists: null,
		randomList: null,
		cachedPlaylists: [],
		relaxingPlaylists: [],
		standardPlaylists: [],
		nonVocalPlaylists: [],
		
		getRawPlaylists: function() {
			mopidy.playlists.getPlaylists().then( function(playlists) {
				playlists.shift();
				MopidyManager.playlistManager.rawPlaylists = playlists;
				MopidyManager.playlistManager.getNewRandomList();
			});
		},

		getNewRandomList: function() {
			var i = Math.floor((Math.random() * MopidyManager.playlistManager.rawPlaylists.length ) + 0);
			MopidyManager.playlistManager.randomList = MopidyManager.playlistManager.rawPlaylists[i];
			
			// Need to Change , this name is actually the *Next* currentListName
			MopidyManager.tracklistManager.currentListName = MopidyManager.playlistManager.randomList.name;
		},		

		// About to Delete
		printCache: function() {

			for ( var i = 0; i < MopidyManager.playlistManager.cachedPlaylists.length; ++i ) {
				console.log( MopidyManager.playlistManager.cachedPlaylists[i].name + " = " + MopidyManager.playlistManager.cachedPlaylists[i].uri );
			}

		},

		updateCache: function() {
		
			mopidy.playlists.asList().then(function(list){
				for ( var i = 0; i < list.length; ++i ) {
					var j = {};
					j.name = list[i].name;
					j.uri = list[i].uri;
					MopidyManager.playlistManager.cachedPlaylists.push(j);
				}
				//MopidyManager.playlistManager.printCache();
				MopidyManager.playlistManager.getRandomList();
			});

		},

		getRandomListItems: function() {
			mopidy.playlists.getItems( MopidyManager.playlistManager.randomList.uri ).then( function(items) {
				MopidyManager.playlistManager.randomList.items = items;
				//MopidyManager.playlistManager.randomList.itemURIS = [];
				//for (var i = 0; i < items.length; ++i) {
					//MopidyManager.playlistManager.randomList.itemURIS.push(items[i].uri);
				//}
			});
		},
		// About to Delete

	},

	tracklistManager: {

		currentList: null,
		currentListName: null,
		currentIndex: 0,
		currentListLength: 0,
		currentRandomMode: false,

		getCurrentList: function() {

		    mopidy.tracklist.getTracks().then( function(tracks) {
		    	//console.log(tracks);
		        MopidyManager.tracklistManager.currentList = tracks;
		        MopidyManager.tracklistManager.currentListLength = tracks.length;
		        MopidyManager.tracklistManager.getCurrentPosition();
		    });

		},

		getCurrentPosition: function() {
		    mopidy.tracklist.index().then( function(index) {
		    	if ( index === null ) { index = 0;  }
		    	MopidyManager.tracklistManager.currentIndex = index;
		    	MopidyManager.tracklistManager.getRandomMode();
		    	console.log( MopidyManager.tracklistManager.currentListName );
		    	setTimeout(function(){
					console.log( MopidyManager.tracklistManager.currentList[index].name + "\n[" + index + "] of " + MopidyManager.tracklistManager.currentListLength.toString() + " || SHUFFLE = " + MopidyManager.tracklistManager.currentRandomMode.toString() );
		    	} , 500 );
		    });
		},

		setConsumeMode: function(value) {
			mopidy.tracklist.setConsume(value).then(function(result){

			});
		},

		getRandomMode: function() {
			mopidy.tracklist.getRandom().then( function( result ){
				//console.log(result);
				MopidyManager.tracklistManager.currentRandomMode = result;
			})
		},

		setRandomMode: function(value) {
			mopidy.tracklist.setRandom(value).then( function( result ){
				console.log(result);
				MopidyManager.tracklistManager.currentRandomMode = result;
			});
		},

		toggleShuffle: function() {
			if ( MopidyManager.tracklistManager.currentRandomMode === false ) {
				MopidyManager.tracklistManager.setRandomMode(true);
			}
			else {
				MopidyManager.tracklistManager.setRandomMode(false);
			}
		},

		clearCurrentList: function() {
			mopidy.tracklist.clear().then( function( result ){
				//console.log(result);
				MopidyManager.tracklistManager.getCurrentList();
			});
		},

		setRandomList: function() {
			mopidy.tracklist.clear().then( function( result ){
				mopidy.tracklist.add( MopidyManager.playlistManager.randomList.tracks ).then(function(result){
					//console.log(result);
					MopidyManager.playbackManager.play();
					MopidyManager.tracklistManager.getCurrentList();
					MopidyManager.playlistManager.getNewRandomList();
				});
			});
		},

	}


};

mopidy.on('state:online', function () {
    
    MopidyManager.init();

});

mopidy.on( 'event:trackPlaybackEnded' , function(data) {
	//console.log(data);
	setTimeout(function() {
		MopidyManager.tracklistManager.getCurrentList();
	} , 1000 );

});



module.exports.stop = function() {
	MopidyManager.playbackManager.stop();
};

module.exports.pause = function() {
	MopidyManager.playbackManager.pause();
};

module.exports.nextTrack = function() {
	MopidyManager.playbackManager.next();
};

module.exports.previousTrack = function() {
	MopidyManager.playbackManager.previous();
};

module.exports.randomPlaylist = function() {
	MopidyManager.tracklistManager.setRandomList();
};




/*
process.on('SIGINT', function () {
	mopidy.close();
	mopidy.off();
	mopidy = null;
	ButtonManager.kill('SIGHUP');
	console.log("\nShutting Everything Down\n");
});
*/