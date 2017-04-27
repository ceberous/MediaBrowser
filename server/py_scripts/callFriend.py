import sys
import Skype4Py
import time

from wUserName import callingName

CallStatus = 0
callobj1 = 0

CallIsFinished = set ([Skype4Py.clsFailed, Skype4Py.clsFinished, Skype4Py.clsMissed, Skype4Py.clsRefused, Skype4Py.clsBusy, Skype4Py.clsCancelled]);

def AttachmentStatusText(status):
   return skype.Convert.AttachmentStatusToText(status)

def CallStatusText(status):
    return skype.Convert.CallStatusToText(status)

def OnCall(call, status):
    global CallStatus
    global callobj1
    CallStatus = status
    wText = CallStatusText(status)

    if ( wText == "Recording" ):
        time.sleep(5)
        callobj1.Finish()
        print("ended call")
        sys.stdout.flush()
        
    elif ( wText == "Never placed" ):
        callobj1.Finish()
        sys.stdout.flush()

    else:
        print 'Call status: ' + wText
        sys.stdout.flush()

def OnAttach(status): 
    print 'API attachment status: ' + AttachmentStatusText(status)
    if status == Skype4Py.apiAttachAvailable:
        skype.Attach()


'''
def OnVideo( call , status):
    print(status)
    #sys.stdout.flush()

def OnVideoSend( call , status):
    print(status)
    #sys.stdout.flush()

def OnVideoRecieved( call , status):
    print(status)
    #sys.stdout.flush()
'''


skype = Skype4Py.Skype()
skype.OnAttachmentStatus = OnAttach
skype.OnCallStatus = OnCall
#skype.OnCallVideoStatusChanged = OnVideo
#skype.OnCallVideoSendStatusChanged = OnVideoSend
#skype.OnCallVideoReceiveStatusChanged = OnVideoRecieved


# Starting Skype if it's not running already..
if not skype.Client.IsRunning:
    print 'Starting Skype..'
    skype.Client.Start()


# Attatching to Skype..
print 'Connecting to Skype..'
skype.Attach()
		
print 'Calling ' + callingName + '..'
callobj1 = skype.PlaceCall(callingName)

		
# Loop until CallStatus gets one of "call terminated" values in OnCall handler
while not CallStatus in CallIsFinished:
    pass

