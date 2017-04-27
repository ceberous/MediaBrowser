import sys
from evdev import InputDevice, categorize, ecodes, KeyEvent

from usbDevicePath import eventPath

gamepad = InputDevice(eventPath)

for event in gamepad.read_loop():
    if event.type == ecodes.EV_KEY:
        
        keyevent = categorize(event)
        
        if keyevent.keystate == KeyEvent.key_up: 
            
            if keyevent.keycode[0] == 'BTN_JOYSTICK':
                print "6"
                sys.stdout.flush()
            elif keyevent.keycode == 'BTN_THUMB':
                print "7"
                sys.stdout.flush()
            elif keyevent.keycode == 'BTN_THUMB2':
                print "10"
                sys.stdout.flush()
            elif keyevent.keycode == 'BTN_TOP':
                print "11"
                sys.stdout.flush()
            elif keyevent.keycode == 'BTN_TOP2':
                print "12"
                sys.stdout.flush()
            elif keyevent.keycode == 'BTN_PINKIE':
                print "8"
                sys.stdout.flush()
            elif keyevent.keycode == 'BTN_BASE':
                print "9"
                sys.stdout.flush()                
            elif keyevent.keycode == 'BTN_BASE4': 
                print "1"
                sys.stdout.flush() 
            elif keyevent.keycode == 'BTN_BASE5':
                print "2"
                sys.stdout.flush() 
            elif keyevent.keycode == 'BTN_BASE6':
                print "3"
                sys.stdout.flush() 
            elif keyevent.keycode == 'BTN_BASE2':
                print "4"
                sys.stdout.flush() 
            elif keyevent.keycode == 'BTN_BASE3':
                print "5"
                sys.stdout.flush() 
            elif keyevent.keycode == 'BTN_BASE4':
                print "12"
                sys.stdout.flush() 
