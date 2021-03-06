var colors = require("colors");

var wEmitter = require('../main.js').wEmitter;
//var wEmitter = new (require('events').EventEmitter);

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

function getRandomVal( min , max ) {
	return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

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

		mediaFiles.updateStructureCache();
		mediaFiles.updateWatchList();
		
	},

	findUSBHardDrive: function() {
		var usbHardDriveLabel = "LABEL=\"Seagate\""; 
		var findEventPathCMD = exec( "sudo blkid" , { silent: true , async: false } );
		//console.log( findEventPathCMD );
		if ( findEventPathCMD.stderr ) { console.log("error finding USB Hard Drive"); process.exit(1); }
		else{ 
			var wOUT = findEventPathCMD.stdout.split("\n");
			for ( var i = 0; i < wOUT.length; ++i ) {

				var wT = wOUT[i].split(" ");
				if ( wT[ 1 ] === usbHardDriveLabel ) {
					var wCMD6 = "findmnt -rn -S " + wT[4] + " -o TARGET";
					var wOUT1 = exec( wCMD6 , { silent:true , async: false } );
					if ( wOUT1.stderr ) { console.log("error finding USB Hard Drive"); process.exit(1); }
					else{
						mediaFiles.hardDrive.UUID = wT[4].split("UUID=\"")[1].slice(0,-1);

						// Need Better Matching because Ubuntu Mounts this using different schemes
						mediaFiles.hardDrive.baseDIR = wOUT1.stdout.trim().replace( /\\x5c/g , "" ).replace( /\\x20/g , "\ \\" );

						console.log( colors.green( "[LOCAL_VM] --> UUID = " + mediaFiles.hardDrive.UUID + " || " + mediaFiles.hardDrive.baseDIR ) );
						if ( mediaFiles.hardDrive.baseDIR === '' ) {
							var wPath = path.join( "/" , "media" , "haley" , "Seagate"  );
							var wPath = "sudo mkdir " + wPath;
							console.log(wPath);
							exec( wPath , { silent: true , async: false } );
							exec( "sudo mount -U " + mediaFiles.hardDrive.UUID + " --target " + wPath , { silent: true , async: false } );
							mediaFiles.findUSBHardDrive();
						}
					}
				}

			}
		}
	},

	updateStructureCache: function() {
		if (  mediaFiles.hardDrive.baseDIR === null || mediaFiles.hardDrive.baseDIR.length < 2 ) { wEmitter.emit("noHardDriveConnected"); return; } 
		console.log( mediaFiles.hardDrive.baseDIR );
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
		var acceptedFolders = [ "TV Shows" , "Podcasts" , "Movies" , "Audio Books" ];
		for( var i = 0; i < mediaFiles.structure.children.length; ++i ) {

			wFolderName = mediaFiles.structure.children[i].name;
			var wTest = acceptedFolders.indexOf( wFolderName );
			if ( wTest === -1 ) { /*console.log( "skipping " + wFolderName );*/ delete wList[ wFolderName ]; continue; }
			
			wList[ wFolderName ] = [];
			wRootMap[ wFolderName ] = i;

			// Each Item in Genre-Folder 	i.e. "Movies" , "TV Shows" , "Podcasts"
			mediaFiles.structure.children[i].children.forEach( function each(item) {
				wList[wFolderName].push([]);
				eachChild(item);
			});

		}

		var finalResults = {globalLastWatched: {}};
		for ( var iprop in wList ) {
			var wIndex = wRootMap[ iprop ];
			finalResults[iprop] = { lastWached: 0 , totalItems: wList[iprop].length , showNames: [] };
			for ( var j = 0; j < wList[iprop].length; ++j ) {

				var wShowName = mediaFiles.structure.children[wIndex].children[j].name;
				finalResults[iprop].showNames.push(wShowName);
				wList[iprop][j] = wList[iprop][j].filter(String);
				finalResults[iprop][wShowName] = { index: j , items:[] , lastWached:[] };
				
				if ( "undefined" != typeof mediaFiles.watchedList[iprop][wShowName] ) {

					if ( mediaFiles.watchedList[iprop][wShowName].lastWached.length > 1 ){
						finalResults[iprop][wShowName].lastWached = mediaFiles.watchedList[iprop][wShowName].lastWached;
					}
				}

				for ( var k = 0; k < wList[iprop][j].length; ++k ) {
					finalResults[iprop][mediaFiles.structure.children[wIndex].children[j].name].items.push(wList[iprop][j][k].length);
				}
	
			}
		}

		finalResults["rootMap"] = wRootMap;
		mediaFiles.watchedList = finalResults;
		jsonfile.writeFileSync( mediaFiles.hardDrive.watchedListFP , finalResults );
		wEmitter.emit("HardDriveConnected");

	},

	markWatched: function() {

	},

	fixPathSpace: function(wFP) {
		var fixSpace = new RegExp( " " , "g" );
		wFP = wFP.replace( fixSpace , String.fromCharCode(92) + " " );
		wFP = wFP.replace( ")" , String.fromCharCode(92) + ")" );
		wFP = wFP.replace( "(" , String.fromCharCode(92) + "(" );
		wFP = wFP.replace( "'" , String.fromCharCode(92) + "'" );
		return wFP;
	},

	structureLookup: function(wOBJ) {

		var wDepth = wOBJ.items.length;
		var wResult;
		switch ( wDepth ) {
			case 1:
				//console.log("we were passed a 1 deep item");
				wResult = mediaFiles.structure.children[ wOBJ.items[0] ];
				break;
			case 2:
				//console.log("we were passed a 2 deep item");
				wResult = mediaFiles.structure.children[ wOBJ.items[0] ].children[  wOBJ.items[1] ];
				break;
			case 3: 
				//console.log("we were passed a 3 deep item");
				wResult = mediaFiles.structure.children[ wOBJ.items[0] ].children[  wOBJ.items[1] ].children[  wOBJ.items[2] ];
				break;
			case 4:
				//console.log("we were passed a 4 deep item");
				wResult = mediaFiles.structure.children[ wOBJ.items[0] ].children[  wOBJ.items[1] ].children[  wOBJ.items[2] ].children[  wOBJ.items[3] ];
				break;
			default:
				break;
		}

		return wResult;

	},

	getNextInStructure: function( wGenre , wShow ) {

		var wGenreIndex = mediaFiles.watchedList.rootMap[wGenre];
		var wShowIndex = mediaFiles.watchedList[wGenre][wShow].index;
		var wFolderMax = mediaFiles.watchedList[wGenre][wShow].items.length - 1;
		var wEpisodeMax = mediaFiles.watchedList[wGenre][wShow].items[0];
		var wFolderIndex = 0; 
		var wEpisodeIndex = 0;

		if ( mediaFiles.watchedList[wGenre][wShow]["lastWached"].length > 1 ) {
			wFolderIndex = mediaFiles.watchedList[wGenre][wShow].lastWached[0];
			wEpisodeIndex = mediaFiles.watchedList[wGenre][wShow].lastWached[1] + 1;
			wEpisodeMax = ( mediaFiles.watchedList[wGenre][wShow].items[wFolderIndex] - 1 );
		}

		if ( wEpisodeIndex > wEpisodeMax ) { wEpisodeIndex = 0; wFolderIndex += 1; }
		if ( wFolderIndex > wFolderMax ) { wFolderIndex = 0; }

		mediaFiles.watchedList[wGenre].lastWached = wShowIndex;
		mediaFiles.watchedList[wGenre][wShow]["lastWached"][0] = wFolderIndex;
		mediaFiles.watchedList[wGenre][wShow]["lastWached"][1] = wEpisodeIndex;

		wPM.tableMap.previous = wPM.tableMap.now;
		wPM.tableMap.now = [ wGenreIndex , wShowIndex , wFolderIndex , wEpisodeIndex ];

		return mediaFiles.structureLookup({
			items: [
				wGenreIndex , wShowIndex , wFolderIndex , wEpisodeIndex 
			],
		});

	},

	getPreviousInStructure: function() {

	},

	getRandom: function(wGenre) {

		var genreIndex = mediaFiles.watchedList.rootMap[wGenre];
		var genreFoldersLength = mediaFiles.watchedList[wGenre].totalItems - 1;
		var randomShowIndex = getRandomVal( 0 , genreFoldersLength );
		var randomShowName = mediaFiles.structure.children[ genreIndex ].children[ randomShowIndex ].name;
		var wFolderMax = mediaFiles.watchedList[wGenre][randomShowName].items.length - 1;
		var randomShowFolderIndex = getRandomVal( 0 , wFolderMax );
		var wEpisodeMax = mediaFiles.watchedList[wGenre][randomShowName].items[randomShowFolderIndex] - 1;
		var randomEpisodeIndex = getRandomVal( 0 , wEpisodeMax );
		
		var wEpisode , newTableMapEntry;
		switch( wGenre ) {
			case "TV Shows":
				wEpisode = mediaFiles.structureLookup({ items: [ genreIndex , randomShowIndex , randomShowFolderIndex , randomEpisodeIndex ] });
				newTableMapEntry = [ genreIndex , randomShowIndex , randomShowFolderIndex , randomEpisodeIndex ];
				break;

			case "Movies":
				wEpisode = mediaFiles.structureLookup({ items: [ genreIndex , randomShowIndex ] });
				newTableMapEntry = [ genreIndex , randomShowIndex ];
				break;

			case "Podcasts":

				break;

			case "Audio Books":

				break;

			case "Music":
				wEpisode = mediaFiles.structureLookup({ items: [ genreIndex , randomShowIndex , randomEpisodeIndex ] });
				newTableMapEntry = [ genreIndex , randomShowIndex , randomEpisodeIndex ];
				break;

		}

		return {
			name: wEpisode.name,
			path: wEpisode.path,
			tableMap: newTableMapEntry
		}

	},			

};


var wPM = {

	active: false,
	randomMode: false,
	continuousWatching: false,
	genre: null,
	genreIndex: null,
	genreFolders: [],
	lastWachedinGenre: null,
	globalLastWatched: null,
	nowQueingGenre: null,

	wPlayer: null,

	nowPlaying: {},

	currentTime: null,
	duration: null,

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

		wPM.nowPlaying = mediaFiles.getRandom(wGenre);
		wPM.tableMap.now = wPM.nowPlaying.tableMap;
		wPM.startPlayer();

	},

	playNextOdyssey: function() {

		var wEpisode = mediaFiles.getNextInStructure( "Audio Books" , "Adventures In Odyssey" );
		
		wPM.nowPlaying.name = wEpisode.name;
		wPM.nowPlaying.path = wEpisode.path;
		wPM.nowPlaying.tableMap = wPM.tableMap.now;
		wPM.startPlayer();

	},

	playNextInTVShow: function( wShowName ) {

		var wIndex = mediaFiles.watchedList["TV Shows"].lastWached + 1; 
		if ( wIndex > ( mediaFiles.watchedList["TV Shows"].totalItems - 1 ) ) {
			var wIndex = 0;
		}

		if ( !wShowName ) { var wShowName = mediaFiles.watchedList["TV Shows"].showNames[ wIndex ]; }

		var wEpisode = mediaFiles.getNextInStructure( "TV Shows" , wShowName );
				
		wPM.nowPlaying.name = wEpisode.name;
		wPM.nowPlaying.path = wEpisode.path;
		wPM.nowPlaying.tableMap = wPM.tableMap.now;
		wPM.startPlayer();

	},

	getNextInCycle: function( wGenre ) {

	},

	nextInAudioBook: function() {

	},

	startPlayer: function() {

		if ( wPM.active ) {
			wPM.sendCMD( "stop" );
			wPM.state.playing = false;
			wPM.active = false;
			wPM.wPlayer = null;
		}

		console.log(wPM.nowPlaying);

		var wPath = mediaFiles.fixPathSpace( wPM.nowPlaying.path );
		var wCMD5 = "mediainfo --Inform=\"Video;%Duration%\" " + wPath;
		var wDuration = exec( wCMD5 , { silent: true , async: false } );
		wDuration = parseInt( wDuration.stdout.trim() );
		
		if ( isNaN(wDuration) || wDuration < 1 ) {
			var wCMD6 = "mediainfo --Inform=\"Audio;%Duration%\" " + wPath;
			console.log(wCMD6);
			wDuration = exec( wCMD6 , { silent: true , async: false } );
			wDuration = wDuration.stdout.trim();
		}

		console.log(wDuration);
		wPM.duration = parseInt(wDuration);

		mediaFiles.watchedList.globalLastWatched = wPM.nowPlaying;
		jsonfile.writeFileSync( mediaFiles.hardDrive.watchedListFP , mediaFiles.watchedList );
		
		var wOptions = {
			
		};
		
		var defaultArgs = [ wPM.nowPlaying.path , '-msglevel', 'global=0', '-msglevel', 'cplayer=4', '-idle', '-slave', '-fs', '-noborder'];
		wPM.wPlayer = spawn( "mplayer" , defaultArgs , wOptions );
		console.log( colors.green( "[LOCAL_VM] -->  MPlayer PID = " + wPM.wPlayer.pid.toString() ) );
		console.log( "@@PID=" + wPM.wPlayer.pid.toString() );
		wPM.active = true;
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

		var headerDamagedExample = "{ active: true, message: '[mpeg4 @ 0x7fb189c08560]header damaged\nError while decoding frame!' }";

		var ignore = false;
		var message;
		var timeStart, timeEnd, time;

		wPM.wPlayer.stderr.on( "data" , function(data) {
			var message = decoder.write(data);
			message = message.trim();
			for ( var i = 0; i < ignoreErrorMessagesLength; ++i ) {
				if ( message === ignoreErrorMessages[i] ) {
					ignore = true;
				}
			}
			if ( !ignore ) {
				//console.log(message);
				wEmitter.emit( "mPlayerError" , message );
			}
		});

		wPM.wPlayer.stdout.on( "data" , function(data) {	
			
			// Regular Messages
			if ( data.indexOf('A:') != 0 )  {
				
				message = decoder.write(data);
				message = message.trim();
				//console.log(message);
				for ( var i = 0; i < ignoreMessagesLength; ++i ) {
					if ( message === ignoreMessages[i] ) {
						ignore = true;
					}
				}
				if ( !ignore ) {
					console.log(message);	
				} 
			}
			// Time Messages
			else {

				data = data.toString("binary");

	            if(data.indexOf(' V:') !== -1) {
	                timeStart = data.indexOf(' V:') + 3;
	                timeEnd = data.indexOf(' A-V:');
	            } else {
	                timeStart = data.indexOf('A:') + 2;
	                timeEnd = data.indexOf(' (');
	            }

				time = data.substring(timeStart, timeEnd).trim();
				time = ( time * 1000 ).toFixed();
	            wPM.currentTime = time;
	            //console.log( wPM.currentTime.toString() + " / " + wPM.duration.toString() );

	            if ( ( wPM.duration - time ) <= 300 ) {
	            	console.log("media over");
	            	wPM.stop();
	            }

			}
				
		});		

		wPM.wPlayer.on( "close" , function(code) {
			wPM.active = false;
			wPM.state.playing = false;
			wPM.wPlayer = null;
			//console.log("we were closed");
			wPM.continuousWatching = false;
			wPM.playNext(-1);
		});

	},

	sendCMD: function( wCMD , wARGS ) {
		//console.log(wCMD);
		if ( wPM.wPlayer != null ) {
			wPM.wPlayer.stdin.write([wCMD].concat(wARGS).join(' ') + '\n');
		}
	},

	pause: function() {
		wPM.sendCMD( "pause" );
		wPM.state.paused = !wPM.state.paused;
		wEmitter.emit("mPlayerPaused");

		var wPercent = Math.floor( ( ( wPM.currentTime / wPM.duration ).toFixed(2) ) * 100 );
    	var wFinished = false;
    	if ( wPercent >= 90 ) {
			wFinished = true;
		}

		console.log( "Finished = " + wFinished );
		console.log( "Percentage Watched = " + wPercent.toString() );

	},

	stop: function() {

		wPM.sendCMD( "stop" );
		wPM.state.playing = false;
		wPM.active = false;
		wPM.wPlayer = null;
		wEmitter.emit("mPlayerStopped");
		//wPM.playNext()

		var wPercent = Math.floor( ( ( wPM.currentTime / wPM.duration ).toFixed(2) ) * 100 );
    	var wFinished = false;
    	if ( wPercent >= 90 ) {
			wFinished = true;
		}

		console.log( "Finished = " + wFinished );
		console.log( "Percentage Watched = " + wPercent.toString() );

	},

	seek: function(seconds) {
		wPM.sendCMD( "seek" , [ seconds , 2 ] );
    },

    playNext: function(code) {

    	var wPercent = Math.floor( ( ( wPM.currentTime / wPM.duration ).toFixed(2) ) * 100 );
    	var wFinished = false;
    	if ( wPercent >= 90 ) {
			wFinished = true;
		}

		console.log( "Finished = " + wFinished );
		console.log( "Percentage Watched = " + wPercent.toString() );
 
		if ( wPM.continuousWatching ) {
			if (wPM.randomMode) {
				wPM.playRandom( wPM.genre );
			}
			else{
				module.exports.playMedia( wPM.watchingMode , wPM.watchingShowName );
			}
		}
		else {
			wEmitter.emit( "mPlayerClosed" , code );
		}
    },

    playPrevious: function() {

    }

};




mediaFiles.init();


wEmitter.on( "mPlayerPlaying" , function(data) {

	console.log("mplayer is playing");
	wEmitter.emit( "updateNowPlayingOBJ" , { mode: wPM.watchingMode , string: wPM.nowPlaying.path } );

});



module.exports.playMedia = function( wOption , wShowName ) {

	if ( wPM.active ) { wPM.stop(); }

	wPM.continuousWatching = true;
	wPM.watchingMode = wOption;
	wPM.watchingShowName = wShowName;

	switch( wOption ) {

		case "odyssey":
			wPM.playNextOdyssey();
			break;

		case "nextInTVShow":
			wPM.playNextInTVShow(wShowName);
			break;

		case "nextTVShow":
			wPM.playNextInTVShow();
			/*
			setTimeout(function(){
				//wPM.stop();
				var wsec = ( wPM.duration / 1000 ) - 5;
				wPM.seek(wsec);
			} , 5000 );
			*/
			break;

		case "movie":

			break;


	}
	
};

module.exports.nextInTVShow = function() {
	wPM.pause();
};

module.exports.pauseMedia = function() {
	wPM.pause();
};

module.exports.nextMedia = function() {
	wPM.playNextInTVShow();
};

module.exports.previousMedia = function() {
	wPM.previous();
};

module.exports.stopMedia = function() {
	wPM.continuousWatching = false;
	wPM.stop();
};


