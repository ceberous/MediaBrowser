var wEmitter = require('../main.js').wEmitter;
var path = require("path");
require('shelljs/global');

var USBIRManager = {

	LIRC_OPEN: false,
	LIRC_PID: null,

	buttons: { 
		power: "KEY_POWER" , 
		volume: {up: "KEY_VOLUMEUP" , down: "KEY_VOLUMEDOWN" },
		arrow: { up: "KEY_UP" , down: "KEY_DOWN" , left: "KEY_LEFT" , right: "KEY_RIGHT" }, 
		menu: "KEY_MENU" ,
		enter: "KEY_ENTER", 
		back: "KEY_BACK", 
		source: "KEY_CONFIG"
	},

	init: function() {
		
		if ( USBIRManager.isLircOpen() ) {
			USBIRManager.killExistingLirc( USBIRManager.LIRC_PID );
		}

		USBIRManager.createRunFolder();

		USBIRManager.startIguanaIRService();

		USBIRManager.startLirc();

		USBIRManager.setTransmitters();

	},

	createRunFolder: function() {

		console.log("Creating Run Folder");
		var runDIR = "/var/run/lirc/";
		var mkdirCmd = "sudo mkdir " + runDIR;
		var runCMD1 = exec( mkdirCmd , { silent:true } ).stdout;
		console.log(runCMD1);
		

	},

	startIguanaIRService: function() {

		console.log("starting iguanaIR service");
		var startServiceCMD = "sudo service iguanaIR start";
		var output1 = exec( startServiceCMD , { silent:true } ).stdout;
		setTimeout(function(){
			console.log(output1);
		} , 1000 );

	},

	isLircOpen: function() {

		var checkLircOpen = 'ps aux | grep lircd';
		var isLircOpen = exec( checkLircOpen , {silent:true}).stdout;
		isLircOpen = isLircOpen.split("\n");

		for (var i = 0; i < isLircOpen.length; ++i) {

			var wT = isLircOpen[i].split(" ");
			for( var j = 0; j < wT.length; ++j  ){
			
				if ( wT[j] === "/usr/sbin/lircd" ) {

					USBIRManager.LIRC_OPEN = true;;
					USBIRManager.LIRC_PID = isLircOpen[i].split( /[\s,]+/ )[1];

					console.log( "Lirc is running @ PID: " + USBIRManager.LIRC_PID );

					return true;

				}

			}
			
		}

		USBIRManager.LIRC_OPEN = false;
		console.log( "Lirc is closed" );
		return false;


	},

	killExistingLirc: function(wPID) {

		console.log( "killing lircd @ PID: " + wPID );
		var killLircCmd = 'sudo kill -9 ' + wPID;
		var killLirc = exec( killLircCmd , {silent:true}).stdout;
		console.log(killLirc.length);

	},

	startLirc: function() {

		console.log("starting lirc");
		var startLircCmd = "sudo /usr/sbin/lircd --output=/run/lirc/lircd --driver=iguanaIR /etc/lirc/lircd.conf";
		var startLirc = exec( startLircCmd , { silent: true } ).stdout;
		console.log(startLirc);
		USBIRManager.isLircOpen();

	},

	setTransmitters: function() {

		var setTransmittersCmd = "sudo irsend -d /run/lirc/lircd set_transmitters 1 2 3 4";
		var runSetTrans = exec( setTransmittersCmd , { silent: true } ).stdout;
		console.log(runSetTrans);

	},

	pressButton: function(wButton) {

		var pressButtonCmd = "sudo irsend -d /run/lirc/lircd send_once samsung1 " + wButton;
		var runPressButton = exec( pressButtonCmd , { silent: true } ).stdout;
		console.log(runPressButton);

	}


};

                 
USBIRManager.init();

USBIRManager.pressButton( USBIRManager.buttons.power );