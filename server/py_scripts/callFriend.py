import sys
import Skype4Py

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
    print 'Call status: ' + wText
    sys.stdout.flush()
    if wText == "Call in Progress":
        print("trying to add video")
        sys.stdout.flush()
        callobj1.StartVideoSend()

def OnAttach(status): 
    print 'API attachment status: ' + AttachmentStatusText(status)
    if status == Skype4Py.apiAttachAvailable:
        skype.Attach()
        

skype = Skype4Py.Skype()
skype.OnAttachmentStatus = OnAttach
skype.OnCallStatus = OnCall

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
