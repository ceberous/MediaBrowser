var wEmitter = require('../main.js').wEmitter;
var path = require("path");
require('shelljs/global');

var USBIRManager = {

	LIRC_OPEN: false,
	LIRC_OPEN_ERROR: "",
	LIRC_PID: null,
	IGUANAIR_SERVICE_ACTIVE: false,
	IGUANAIR_SERVICE_STATUS: null,

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


		USBIRManager.createRunFolder();

		if ( !USBIRManager.isIguanaIRServiceRunning() ) {
			USBIRManager.startIguanaIRService();
		}

		if ( !USBIRManager.isLircOpen() ) {
			//USBIRManager.killExistingLirc( USBIRManager.LIRC_PID );
			USBIRManager.startLirc();
		}

		USBIRManager.pressButton( USBIRManager.buttons.power );	

		setTimeout(function(){
			if ( USBIRManager.LIRC_OPEN ) {
				USBIRManager.setTransmitters();
				setTimeout(function() {
					USBIRManager.pressButton( USBIRManager.buttons.power );
				} , 1000 );
			}
			else {
				console.log( "couldn't start LIRC because: \"" + USBIRManager.LIRC_OPEN_ERROR + "\"" );
				
			}
		} , 1000 );
		
	},

	createRunFolder: function() {

		console.log("Creating Run Folder");
		var runDIR = "/var/run/lirc/";
		var mkdirCmd = "sudo mkdir " + runDIR;
		var runCMD1 = exec( mkdirCmd , { silent:true } ).stdout;

	},

	isIguanaIRServiceRunning: function() {
		
		console.log("Checking iguanaIR service status");
		
		var chkCMD = "sudo service iguanaIR status";
		var wStatus = exec( chkCMD , { silent: true } ).stdout;
		wStatus = wStatus.split("\n");
		wStatus = wStatus[2].replace( / /g , '' );
		wStatus = wStatus.split("Active:");
		var wCondition = wStatus[1].split("(");
		var wCondition2 = wCondition[1].split(")");

		if ( wCondition[0] === "active" ) { 
			USBIRManager.IGUANAIR_SERVICE_ACTIVE = true;
			USBIRManager.IGUANAIR_SERVICE_STATUS = wCondition2[0];
			return true; 
		}
		else { 
			return false;
		}

	},

	startIguanaIRService: function() {

		console.log("starting iguanaIR service");
		var startServiceCMD = "sudo service iguanaIR start";
		var output1 = exec( startServiceCMD , { silent:true } ).stdout;
		
	},

	isLircOpen: function() {

		var checkLircOpen = 'ps aux | grep lircd';
		var isLircOpen = exec( checkLircOpen , {silent:true}).stdout;
		isLircOpen = isLircOpen.split("\n"); 

		for (var i = 0; i < isLircOpen.length; ++i) {

			var wT = isLircOpen[i].split(" ");
			for( var j = 0; j < wT.length; ++j  ){
			
				if ( wT[j] === "/usr/sbin/lircd" ) {

					USBIRManager.LIRC_OPEN = true;
					USBIRManager.LIRC_PID = irsendLircOpen[i].split( /[\s,]+/ )[1];

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
		exec( startLircCmd , { silent: true , async: false } , function( code , stdout , stderr ) {
			if ( stderr.length > 5 ) { 
				var check = stderr.split("\n");
				if ( check[0] === "Driver `iguanaIR' not supported." ) {
					USBIRManager.LIRC_OPEN = false;
					USBIRManager.LIRC_OPEN_ERROR = check[0];
				}
			}
			else USBIRManager.LIRC_OPEN = true;
		});

	},

	setTransmitters: function() {

		var setTransmittersCmd = "sudo irsend -d /run/lirc/lircd set_transmitters 1 2 3 4";
		var runSetTrans = exec( setTransmittersCmd , { silent: true } ).stdout;
		console.log(runSetTrans);

	},

	pressButton: function(wButton) {

		var pressButtonCmd = "sudo irsend -d /run/lirc/lircd send_once samsung1 " + wButton;
		var runPressButton = exec( pressButtonCmd , { silent: true } ).stdout;
		console.log( "Pressed-Button: " + wButton );

	}


};

                 
USBIRManager.init();

module.exports.togglePower = function() {
    
	USBIRManager.pressButton( USBIRManager.buttons.power );

};
