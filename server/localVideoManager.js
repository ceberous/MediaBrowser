var colors = require("colors");
//var wEmitter = require('../main.js').wEmitter;
var wEmitter = new (require('events').EventEmitter);

var fs = require('fs');
var path = require("path");
var spawn = require("child_process").spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');
require('shelljs/global');
var dirTree = require("directory-tree");
var jsonfile = require("jsonfile");
var Filehound = require("filehound");
var mime = require('mime');



var mediaFiles = {
	
	hardDrive: { UUID: null , baseDIR: null , structureCacheSaveFP: null , watchedListFP: null  },
	structure: null,
	watchedList: null,

	init: function( ) {

		mediaFiles.findUSBHardDrive();

		mediaFiles.hardDrive.structureCacheFP = path.join( __dirname , "save_files" , "hdFolderStructure.json" );
		mediaFiles.hardDrive.watchedListFP = path.join( __dirname , "save_files" , "hdWatchedList.json" );
		mediaFiles.structure = jsonfile.readFileSync( mediaFiles.hardDrive.structureCacheFP );
		mediaFiles.watchedList = jsonfile.readFileSync( mediaFiles.hardDrive.watchedListFP );
		
		//mediaFiles.updateStructureCache();
		//mediaFiles.updateWatchList();
	
	},

	findUSBHardDrive: function() {
		var usbHardDriveLabel = "LABEL=\"Seagate"; 
		var findEventPathCMD = exec( "sudo blkid" , { silent: true , async: false } );
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
						console.log( colors.green( "[LOCAL_VM] --> UUID = " + mediaFiles.hardDrive.UUID + " || " + mediaFiles.hardDrive.baseDIR ) );
						if ( mediaFiles.hardDrive.baseDIR === '' ) {
							exec( "sudo mkdir /media/haley/Seagate\ Expansion\ Drive" , { silent: true , async: false } );
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
		jsonfile.writeFileSync( mediaFiles.hardDrive.structureCacheFP , mediaFiles.structure );
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

		var finalResults = {globalLastWatched: {}};
		var wIndex = 0;
		for ( var iprop in wList ) {
			finalResults[iprop] = { lastWached: {} , totalItems: wList[iprop].length };
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


var wPM = {

	randomMode: false,
	genre: null,
	genreIndex: null,
	genreFolders: [],
	lastWachedinGenre: null,
	globalLastWatched: null,

	wPlayer: null,

	nowPlaying: {},

	tableMap: {
		previous: [],
		now: [],
		next: [],
	},

	state: {
		paused: false,
	},

	playRandom: function( wGenre ) {

		wPM.randomMode = true;
		wPM.genre = wGenre;
		wPM.genreIndex = mediaFiles.watchedList.rootMap[wGenre];
		wPM.lastWachedinGenre = mediaFiles.watchedList[wGenre].lastWached;

		wPM.nowPlaying = wPM.getRandom();
		wPM.startPlayer();
		wEmitter.emit("mPlayerPlaying");

	},

	getRandom: function() {

		var genreFoldersLength = mediaFiles.watchedList[wPM.genre].totalItems - 1;
		var randomShowIndex = wPM.getRandomVal( 0 , genreFoldersLength );
		var randomShowName = mediaFiles.structure.children[ wPM.genreIndex ].children[ randomShowIndex ].name;
		var wFolderMax = mediaFiles.watchedList[wPM.genre][randomShowName].items.length - 1;
		var randomShowFolderIndex = wPM.getRandomVal( 0 , wFolderMax );
		var wEpisodeMax = mediaFiles.watchedList[wPM.genre][randomShowName].items[randomShowFolderIndex] - 1;
		var randomEpisodeIndex = wPM.getRandomVal( 0 , wEpisodeMax );

		//console.log( "Genre Index = " + wPM.genreIndex.toString() );
		//console.log( "Show Index = " + randomShowIndex.toString() );
		//console.log( "Folder Max = " + wFolderMax.toString() );
		//console.log( "ShowSubFolder Index = " + randomShowFolderIndex.toString() );
		//console.log( "Episode Max = " + wEpisodeMax.toString() );
		//console.log( "ShowItem Index = " + randomEpisodeIndex.toString() );
		
		var wEpisode , newTableMapEntry;

		// More Rediculousness 
		switch( wPM.genre ) {
			case "TV Shows":
				wEpisode = wPM.tableLookUp( wPM.genreIndex , randomShowIndex , randomShowFolderIndex , randomEpisodeIndex  );
				newTableMapEntry = [ wPM.genreIndex , randomShowIndex , randomShowFolderIndex , randomEpisodeIndex ];
				break;

			case "Movies":
				wEpisode = wPM.tableLookUp( wPM.genreIndex , randomShowIndex  );
				newTableMapEntry = [ wPM.genreIndex , randomShowIndex ];
				break;

			case "Podcasts":

				break;

			case "Audio Books":

				break;

			case "Music":
				wEpisode = wPM.tableLookUp( wPM.genreIndex , randomShowIndex , randomEpisodeIndex  );
				newTableMapEntry = [ wPM.genreIndex , randomShowIndex , randomEpisodeIndex ];
				break;

		}

		return {
			name: wEpisode.name,
			path: wEpisode.path,
			tableMap: newTableMapEntry
		}

	},

	playNextInTVShow: function( wShowName ) {

		var wGenreIndex = mediaFiles.watchedList.rootMap["TV Shows"];
		var wShowIndex = mediaFiles.watchedList["TV Shows"][wShowName].index;
		var wFolderMax = mediaFiles.watchedList["TV Shows"][wShowName].items.length - 1;
		var wEpisodeMax;
		var wFolderIndex = 0; 
		var wEpisodeIndex = 0;
		
		console.log(mediaFiles.watchedList["TV Shows"][wShowName]);
		if ( mediaFiles.watchedList["TV Shows"][wShowName]["lastWached"].length > 1 ) {
			wFolderIndex = mediaFiles.watchedList["TV Shows"][wShowName].lastWached[0];
			wEpisodeIndex = mediaFiles.watchedList["TV Shows"][wShowName].lastWached[1] + 1;
			wEpisodeMax = ( mediaFiles.watchedList["TV Shows"][wShowName].items[wFolderIndex] - 1 );
		}
		
		if ( wEpisodeIndex > wEpisodeMax ) { wEpisodeIndex = 0; wFolderIndex += 1; }
		if ( wFolderIndex > wFolderMax ) { wFolderIndex = 0; }
		
		//console.log( "GenreIndex = " + wGenreIndex.toString() );
		//console.log( "ShowIndex = " + wShowIndex.toString() );
		//console.log( "FolderIndex = " + wFolderIndex.toString() );
		//console.log( "EpisodeIndex = " + wEpisodeIndex.toString() );

		var wEpisode = wPM.tableLookUp( wGenreIndex , wShowIndex , wFolderIndex , wEpisodeIndex );

		mediaFiles.watchedList["TV Shows"][wShowName]["lastWached"][0] = wFolderIndex;
		mediaFiles.watchedList["TV Shows"][wShowName]["lastWached"][1] = wEpisodeIndex;

		wPM.tableMap.previous = wPM.tableMap.now;
		wPM.tableMap.now = [ "TV Shows" , wShowIndex , wFolderIndex , wEpisodeIndex ];
		
		wPM.nowPlaying.name = wEpisode.name;
		wPM.nowPlaying.path = wEpisode.path;
		wPM.nowPlaying.tableMap = wPM.tableMap.now;
		wPM.startPlayer();
		wEmitter.emit("mPlayerPlaying");

	},

	getNextInCycle: function( wGenre ) {

	},

	getRandomVal: function( min , max ) {
		return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
	},

	// my other autistic moment
	tableLookUp: function( genreIndex , showIndex , showSubFolderIndex , itemIndex ) {

		if ( !itemIndex ) {
			if ( itemIndex === 0 ) {
				console.log("we were passed a 3 deep item");
				return mediaFiles.structure.children[ genreIndex ].children[ showIndex ].children[ showSubFolderIndex ].children[ itemIndex ];
			}
			else if ( !showSubFolderIndex ) {
				if ( showSubFolderIndex === 0 ) {
					console.log("was passed a 2 deep item");
					return mediaFiles.structure.children[ genreIndex ].children[ showIndex ].children[ showSubFolderIndex ];
				}
				else {
					console.log("passed a 1 deep item");
					return mediaFiles.structure.children[ genreIndex ].children[ showIndex ];
				}
			}
			else {
				console.log("was passed a 2 deep item");
				return mediaFiles.structure.children[ genreIndex ].children[ showIndex ].children[ showSubFolderIndex ];		
			}
		}
		else {
			console.log("we were passed a 3 deep item");
			return mediaFiles.structure.children[ genreIndex ].children[ showIndex ].children[ showSubFolderIndex ].children[ itemIndex ];
		}
	
	},

	startPlayer: function() {

		console.log(wPM.nowPlaying);

		mediaFiles.watchedList.globalLastWatched = wPM.nowPlaying;
		jsonfile.writeFileSync( mediaFiles.hardDrive.watchedListFP , mediaFiles.watchedList );
		
		var wOptions = {
		
		};
		
		var defaultArgs = [ wPM.nowPlaying.path , '-msglevel', 'global=0', '-msglevel', 'cplayer=4', '-idle', '-slave', '-fs', '-noborder'];
		wPM.wPlayer = spawn( "mplayer" , defaultArgs , wOptions );
		wEmitter.emit("mPlayerPlaying");

		var ignoreMessages = [
			"MPlayer 1.2.1 (Debian), built with gcc-5.3.1 (C) 2000-2016 MPlayer Team",
			"Playing /media/haley/Seagate Expansion Drive/TV Shows/Parks and Recreation/5/Parks and Recreation - S05E22 - Are You Better Off.mp4.",
			"libavformat version 56.40.101 (external)",
			"libavformat file format detected.",
			"[mov,mp4,m4a,3gp,3g2,mj2 @ 0x7f89ed539d80]",
			"Protocol name not provided, cannot determine if input is local or a network protocol, buffers and access patterns cannot be configured optimally without knowing the protocol",
			"[lavf] stream 0: video (h264), -vid 0",
			"[lavf] stream 1: audio (aac), -aid 0",
			", -alang und",
			"VIDEO:  [H264]  720x404  24bpp  23.976 fps  1277.2 kbps (155.9 kbyte/s)",
			"Clip info:",
			 "major_brand: isom",
			 "minor_version: 1",
			 "compatible_brands: isom",
			 "creation_time: 2013-05-02 01:41:44",
			"Load subtitles in /media/haley/Seagate Expansion Drive/TV Shows/Parks and Recreation/5/",
			"==========================================================================",
			"Opening video decoder: [ffmpeg] FFmpeg's libavcodec codec family",
			"libavcodec version 56.60.100 (external)",
			"Selected video codec: [ffh264] vfm: ffmpeg (FFmpeg H.264)",
			"Opening audio decoder: [ffmpeg] FFmpeg/libavcodec audio decoders",
			"AUDIO: 48000 Hz, 2 ch, floatle, 107.5 kbit/3.50% (ratio: 13436->384000)",
			"Selected audio codec: [ffaac] afm: ffmpeg (FFmpeg AAC (MPEG-2/MPEG-4 Audio))",
			"AO: [pulse] 48000Hz 2ch floatle (4 bytes per sample)",
			"Starting playback...",
			"Movie-Aspect is undefined - no prescaling applied.",
			"VO: [xv] 720x404 => 720x404 Planar YV12  [fs]"
		];
		var ignoreMessagesLength = ignoreMessages.length;

		var ignoreErrorMessages = [
			"do_connect: could not connect to socket",
			"connect: Connection refused",
			"Failed to open LIRC support. You will not be able to use your remote control.",
			"Failed to open VDPAU backend libvdpau_va_gl.so: cannot open shared object file: No such file or directory",
			"[vdpau] Error when calling vdp_device_create_x11: 1",
			"[ac3 @ 0x7f4459fc3560]Channel layout '5.1(side)' with 6 channels does not match specified number of channels 2: ignoring specified channel",
			"layou",
		];
		var ignoreErrorMessagesLength = ignoreErrorMessages.length;

		var ignore = false;
		wPM.wPlayer.stdout.on( "data" , function(data) {
				
				var message = decoder.write(data);
				message = message.trim();
				if ( data.indexOf('A:') != 0 )  {
					for ( var i = 0; i < ignoreMessagesLength; ++i ) {
						if ( message === ignoreMessages[i] ) {
							ignore = true;
						}
					}
					if ( !ignore ) {
						console.log(message);	
					} 
				}
				
		});

		wPM.wPlayer.stderr.on( "data" , function(data) {
				var message = decoder.write(data);
				message = message.trim();
				for ( var i = 0; i < ignoreErrorMessagesLength; ++i ) {
					if ( message === ignoreErrorMessages[i] ) {
						ignore = true;
					}
				}

				if ( !ignore ) {
					console.log(message);	
				} 

		});

		wPM.wPlayer.on( "close" , function(code) {
			console.log( "Exit Code = " + code.toString() );
		});

	},

	sendCMD: function( wCMD , wARGS ) {
		wPM.wPlayer.stdin.write([wCMD].concat(wARGS).join(' ') + '\n');
	},

	pause: function() {
		wPM.sendCMD( "pause" );
		wPM.state.paused = !wPM.state.paused;
		wEmitter.emit("mPlayerPaused");
	},

	stop: function() {
		wPM.sendCMD( "stop" );
		wPM.state.playing = false;
		wPM.wPlayer.kill();
		wPM.wPlayer = null;
		wEmitter.emit("mPlayerStopped");
	},

	seek: function(seconds) {
		wPM.sendCMD( "seek" , [ seconds , 2 ] );
    },

};










mediaFiles.init();
//wPM.playRandom( "TV Shows" );
wPM.playNextInTVShow( "Gilmore Girls" );


wEmitter.on( "mPlayerPlaying" , function(data) {
	console.log( "now Playing" );
	console.log( data );
});

module.exports.playMedia = function( wRandom , wGenre ) {
	wPM.prepare( wRandom , wGenre );
};

module.exports.pauseMedia = function() {
	wMPWrapper.pause();
};

module.exports.nextMedia = function() {
	wPM.next();
};

module.exports.previousMedia = function() {
	wPM.previous();
};

module.exports.stopMedia = function() {
	wMPWrapper.stop();
};


/*
// Testing Example
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
*/