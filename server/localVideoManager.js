var fs = require('fs');
var path = require("path");
require('shelljs/global');
var dirTree = require("directory-tree");
var jsonfile = require("jsonfile");
var Filehound = require("filehound");
var mime = require('mime');
var MPlayer = require("mplayer");


var mediaFiles = {
	
	hardDrive: { UUID: null , baseDIR: null , structureCacheSaveFP: null , watchedListFP: null  },
	structure: null,
	watchedList: null,

	init: function( ) {

		mediaFiles.findUSBHardDrive();

		mediaFiles.hardDrive.structureCacheFP = path.join( __dirname , "hdFolderStructure.json" );
		mediaFiles.hardDrive.watchedListFP = path.join( __dirname , "hdWatchedList.json" );
		mediaFiles.structure = jsonfile.readFileSync( mediaFiles.hardDrive.structureCacheFP );
		mediaFiles.watchedList = jsonfile.readFileSync( mediaFiles.hardDrive.watchedListFP );
		
		//mediaFiles.updateStructureCache();
		mediaFiles.updateWatchList();
	
	},

	findUSBHardDrive: function() {
		var usbHardDriveLabel = "LABEL=\"Seagate"; 
		var findEventPathCMD = exec( "blkid" , { silent: true , async: false } );
		if ( findEventPathCMD.stderr !== undefined && findEventPathCMD.stderr.length > 1 ) { console.log("error finding USB Hard Drive"); process.exit(1); }
		else{ 
			var wOUT = findEventPathCMD.stdout.split("\n");
			for ( var i = 0; i < wOUT.length; ++i ) {

				var wT = wOUT[i].split(" ");
				if ( wT[ 1 ] === usbHardDriveLabel ) {
					var wOUT1 = exec( "findmnt -rn -S " + wT[4] + " -o TARGET" , { silent:true , async: false } );
					if ( wOUT1.stderr !== undefined && wOUT1.stderr.length > 1 ) { console.log("error finding USB Hard Drive"); process.exit(1); }
					else{
						mediaFiles.hardDrive.UUID = wT[4].split("UUID=\"")[1].slice(0,-1);
						mediaFiles.hardDrive.baseDIR = wOUT1.stdout.trim().replace( /\\x20/g , " " );
						if ( mediaFiles.hardDrive.baseDIR === '' ) {
							exec( "sudo mkdir /media/morpheous/Seagate\ Expansion\ Drive" , { silent: true , async: false } );
							exec( "sudo mount -U " + mediaFiles.hardDrive.UUID , { silent: true , async: false } );
							mediaFiles.findUSBHardDrive();
						}
					}
				}

			}
		}
	},

	updateStructureCache: function() {
		mediaFiles.structure = dirTree( mediaFiles.hardDrive.baseDIR );
		jsonfile.writeFileSync( mediaFiles.hardDrive.structureCacheSaveFP , mediaFiles.structure );
		mediaFiles.updateWatchList();
	},

	updateWatchList: function() { // autistically terrible

		var wRootMap = {};
		var wList = {};

		var wFolderName = "";
		function eachChild( item ) {
			
			if ( Array.isArray( item.children ) ) {
				//console.log( wDepth.toString() + " = " + wFolderName + " = " + item.name );
				wList[wFolderName][ wList[wFolderName].length - 1 ].push([]);
				item.children.forEach(eachChild);
			}
			else {
				try {
					wList[wFolderName][ wList[wFolderName].length - 1 ][ wList[wFolderName][ wList[wFolderName].length - 1 ].length - 1 ].push(1);
				}
				catch (e) {
					wList[wFolderName][ wList[wFolderName].length - 1 ].push( [1] );
				}
			}

		}

		// Each Root-Level-Folder
		for( var i = 0; i < mediaFiles.structure.children.length; ++i ) {
			
			wFolderName = mediaFiles.structure.children[i].name;
			wList[ wFolderName ] = [];
			wRootMap[wFolderName] = i;

			// Each Item in Genre-Folder 	i.e. "Movies" , "TV Shows" , "Podcasts"
			mediaFiles.structure.children[i].children.forEach( function each(item) {
				wList[wFolderName].push([]);
				eachChild(item);
			});

		}

		var finalResults = {};
		var wIndex = 0;
		for ( var iprop in wList ) {
			finalResults[iprop] = {};
			for ( var j = 0; j < wList[iprop].length; ++j ) {

				wList[iprop][j] = wList[iprop][j].filter(String);
				finalResults[iprop][mediaFiles.structure.children[wIndex].children[j].name] = { index: j , items:[] , lastWached:[] };

					for ( var k = 0; k < wList[iprop][j].length; ++k ) {
						finalResults[iprop][mediaFiles.structure.children[wIndex].children[j].name].items.push(wList[iprop][j][k].length);
					}
	
			}
			wIndex += 1;
		}

		finalResults["rootMap"] = wRootMap;
		mediaFiles.watchedList = finalResults;
		jsonfile.writeFileSync( mediaFiles.hardDrive.watchedListFP , finalResults );

	},

	markWatched: function() {

	},

	fixPathSpace: function(wFP) {
		var fixSpace = new RegExp( " " , "g" );
		wFP = wFP.replace( fixSpace , String.fromCharCode(92) + " " );
		return wFP;
	}

};


var wMPWrapper = {

	wPlayer: null,

	state: {
		muted: false,
		playing: false,
		volume: 0,
		duration: 0,
		fullscreen: false,
		subtitles: false,
		resumeTime: 0,
	},

	init: function() {
		wMPWrapper.wPlayer = new MPlayer();
	},

	watch: function(wFP) {
		if ( wMPWrapper.wPlayer === null ) { wMPWrapper.init(); }
		wMPWrapper.wPlayer.openFile( wFP );
		wMPWrapper.wPlayer.on( 'ready' , (wStatus)=> { wMPWrapper.onReady(wStatus) });
	},

	onReady: function(wStatus) {
		//wMPWrapper.wPlayer.mute();
		wMPWrapper.wPlayer.volume(100);
		setTimeout( ()=> { wMPWrapper.wPlayer.hideSubtitles();  } , 2000 );
		wMPWrapper.wPlayer.on( 'status' , (wStatus)=> { wMPWrapper.onStatus(wStatus) });
		wMPWrapper.wPlayer.on( 'play' , (wEvent)=> { wMPWrapper.onPlay(wEvent); });
		wMPWrapper.wPlayer.on( 'pause' , (wEvent)=> { wMPWrapper.onPause(wEvent); });
		wMPWrapper.wPlayer.on( 'stop' , (wEvent)=> { wMPWrapper.onStop(wEvent); });
		wMPWrapper.wPlayer.on( 'time' , (wTime)=> { wMPWrapper.onTime(wTime); });
	},

	onStatus: function(wStatus) {
		if ( wStatus.playing && wStatus.filename !== null ) {
			console.log(wStatus);
			wMPWrapper.state.muted 		= wStatus.muted;
			wMPWrapper.state.playing 	= wStatus.playing;
			wMPWrapper.state.volume 	= wStatus.volume;
			wMPWrapper.state.duration 	= wStatus.duration;
			wMPWrapper.state.fullscreen = wStatus.fullscreen;
			wMPWrapper.state.subtitles 	= wStatus.subtitles;
		}
	},

	onPlay: function(wEvent) {

	},

	onPause: function(wEvent) {

	},

	onStop: function(wEvent) {
		//console.log( "playback has ended" );
		return true;
	},

	onTime: function(wTime) {
		wMPWrapper.state.resumeTime = wTime;
	},

};

mediaFiles.init();



var wGenre = "TV Shows";
var wShowName = "Parks and Recreation";

var wGenreIndex = mediaFiles.watchedList.rootMap[wGenre];
var wShowIndex = mediaFiles.watchedList[wGenre][wShowName].index;
// Last Season Example
var wSeasonIndex = mediaFiles.watchedList[wGenre][wShowName].items.length - 1 
// Final Episode Example
var wEpisodeIndex = mediaFiles.watchedList[wGenre][wShowName].items[ mediaFiles.watchedList[wGenre][wShowName].items.length - 1 ];

var nowPlaying = mediaFiles.structure.children[wGenreIndex].children[wShowIndex].children[wSeasonIndex].children[ wEpisodeIndex - 1 ] 
console.log( nowPlaying );



wMPWrapper.watch(nowPlaying.path);