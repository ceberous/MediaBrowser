#!/usr/bin/python

import subprocess
import os
import signal

def findNoMachineSSHPID():
	child = subprocess.Popen([ "ps aux | awk '/nomachine/{print $2}'"  ], stdout=subprocess.PIPE, shell=True)
	result = child.communicate()[0]
	result = [ s.strip() for s in result.splitlines()  ][0]
	result = int( result )
	os.kill( result , signal.SIGTERM )

findNoMachineSSHPID()
