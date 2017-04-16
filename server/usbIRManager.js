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

		if ( !USBIRManager.createRunFolder() ) { return; }
		
		if ( !USBIRManager.isIguanaIRServiceRunning() ) {	
			USBIRManager.startIguanaIRService();
		}

		if ( !USBIRManager.isLircOpen() ) {
			USBIRManager.startLirc();
		}

		if ( USBIRManager.LIRC_OPEN ) {
			USBIRManager.setTransmitters();
		}
		else {
			USBIRManager.tryReinstallIguanaIR();
		}

	},

	tryReinstallIguanaIR: function() {

		console.log( "[USB_IR] --> couldn't start LIRC because: \"" + USBIRManager.LIRC_OPEN_ERROR + "\"" );
		var wReasons = [
			"Driver `iguanaIR' not supported.",
			"do_connect: could not connect to socket",
			"connect: Connection refused",
			"Cannot open socket /run/lirc/lircd: Connection refused"
		];

		for ( var i = 0; i < wReasons.length; ++i ) {
			if ( USBIRManager.LIRC_OPEN_ERROR === wReasons[i] ) {

				console.log("[USB_IR] --> trying to reinstall dev package");
				var reinstallCMD = "sudo dpkg -i /home/haley/WORKSPACE/lirc_0.9.0-0ubuntu6_amd64.deb";
				var runCMD2 = exec( reinstallCMD , { silent:true  , async: false } ).stdout;
				
				setTimeout( ()=> {
					console.log("[USB_IR] --> rebooting");
					var restartCMD = "sudo reboot";
					exec( restartCMD , { silent:true ,  async: false } );
				} , 10000 );

			}
		}


	},

	createRunFolder: function() {

		console.log("[USB_IR] --> Creating Run Folder");
		var runDIR = "/var/run/lirc/";
		var mkdirCmd = "sudo mkdir " + runDIR;
		var runCMD1 = exec( mkdirCmd , { silent:true , async: false } );
		if ( runCMD1.stderr.length > 1 ) {
			var acceptableError = "mkdir: cannot create directory ‘/var/run/lirc/’: File exists\n";
			if ( runCMD1.stderr === acceptableError ) {
				console.log("[USB_IR] --> Run Folder Exists..... Still Procceding.....");
				return true;
			}
			return false
		}
		return true;
	},

	isIguanaIRServiceRunning: function() {
		
		console.log("[USB_IR] --> Checking iguanaIR service status");
		
		var chkCMD = "sudo service iguanaIR status";
		var wStatus = exec( chkCMD , { silent: true , async: false } );
		
		if ( wStatus.stderr.length > 1 ) { return false; }

		wStatus = wStatus.stdout.split("\n");
		wStatus = wStatus[2].replace( / /g , '' );
		wStatus = wStatus.split("Active:");
		var wCondition = wStatus[1].split("(");
		var wCondition2 = wCondition[1].split(")");

		if ( wCondition[0] === "active" ) { 
			USBIRManager.IGUANAIR_SERVICE_ACTIVE = true;
			USBIRManager.IGUANAIR_SERVICE_STATUS = wCondition2[0];
			console.log( "[USB_IR] --> iguanaIR Service = ACTIVE" );
			return true; 
		}
		else { 
			console.log( "[USB_IR] --> iguanaIR Service = STOPPED" );
			return false;
		}

	},

	startIguanaIRService: function() {

		var startServiceCMD = "sudo service iguanaIR start";
		var output1 = exec( startServiceCMD , { silent:true , async: false } )
		if ( output1.stderr.length > 1 ) {
			console.log("[USB_IR] --> [CRITICAL-ERROR] --> failed to start iguanaIR service");
			console.log(output1.stderr);
			process.exit(1);
		}
		else { 
			console.log("[USB_IR] --> iguanaIR Service Started Successfully");
			return true; 
		}
		
	},

	isLircOpen: function() {

		console.log( "[USB_IR] --> Checking if LIRC is Open" );
		var checkLircOpen = 'ps aux | grep lircd';
		var isLircOpen = exec( checkLircOpen , {silent:true , async: false});

		if ( isLircOpen.stderr.length > 1 ) { console.log( isLircOpen.stderr); return false; }

		isLircOpen = isLircOpen.stdout.split("\n"); 
		for (var i = 0; i < isLircOpen.length; ++i) {

			var wT = isLircOpen[i].split(" ");
			for( var j = 0; j < wT.length; ++j  ){
			
				if ( wT[j] === "/usr/sbin/lircd" ) {

					USBIRManager.LIRC_OPEN = true;
					USBIRManager.LIRC_PID = isLircOpen[i].split( /[\s,]+/ )[1];

					console.log( "[USB_IR] --> Lirc is running @ PID: " + USBIRManager.LIRC_PID );

					return true;

				}

			}
			
		}

		USBIRManager.LIRC_OPEN = false;
		console.log( "[USB_IR] --> Lirc is closed" );
		return false;

	},

	killExistingLirc: function(wPID) {

		console.log( "killing lircd @ PID: " + wPID );
		var killLircCmd = 'sudo kill -9 ' + wPID;
		var killLirc = exec( killLircCmd , { silent:true , async: false }).stdout;
		console.log(killLirc.length);

	},

	startLirc: function() {

		console.log("[USB_IR] --> starting lirc");
		var startLircCmd = "sudo /usr/sbin/lircd --output=/run/lirc/lircd --driver=iguanaIR /etc/lirc/lircd.conf";
		var wRun = exec( startLircCmd , { silent: true , async: false });

		if ( wRun.stderr.length > 5 ) { 
			var check = wRun.stderr.split("\n");
			if ( check[0] === "Driver `iguanaIR' not supported." ) {
				USBIRManager.LIRC_OPEN = false;
				USBIRManager.LIRC_OPEN_ERROR = check[0];
			}
		}
		else {
			USBIRManager.isLircOpen();
		}
		

	},

	setTransmitters: function() {

		var setTransmittersCmd = "sudo irsend -d /run/lirc/lircd set_transmitters 1 2 3 4";
		var runSetTrans = exec( setTransmittersCmd , { silent: true , async: false } );
		if ( runSetTrans.stderr.length > 1 ) { console.log( runSetTrans.stderr ); return false; }
		else { console.log("[USB_IR] --> Transmitters READY"); return true; }

	},

	pressButton: function(wButton) {

		var pressButtonCmd = "sudo irsend -d /run/lirc/lircd send_once samsung1 " + wButton;
		var runPressButton = exec( pressButtonCmd , { silent: true , async: false } );
		if ( runPressButton.stderr.length > 1 ) { console.log( "[USB_IR] --> " + runPressButton.stderr.toString() ); }
		else { 
			console.log( "[USB_IR] --> Pressed-Button: " + wButton );
		}

	}


};

                 
USBIRManager.init();

module.exports.togglePower = function() {
    
	USBIRManager.pressButton( USBIRManager.buttons.power );

};
