import sys
from evdev import InputDevice, categorize, ecodes, KeyEvent
gamepad = InputDevice('/dev/input/event4')

for event in gamepad.read_loop():
    if event.type == ecodes.EV_KEY:
        
        keyevent = categorize(event)
        
        if keyevent.keystate == KeyEvent.key_up:
            
            if keyevent.keycode[0] == 'BTN_JOYSTICK':
                print "1"
        sys.stdout.flush()
            elif keyevent.keycode == 'BTN_THUMB':
                print "2"
        sys.stdout.flush()
            elif keyevent.keycode == 'BTN_THUMB2':
                print "3"
        sys.stdout.flush()
            elif keyevent.keycode == 'BTN_TOP':
                print "4"
        sys.stdout.flush()
            elif keyevent.keycode == 'BTN_TOP2':
                print "5"
        sys.stdout.flush()
            elif keyevent.keycode == 'BTN_PINKIE':
                print "6"
        sys.stdout.flush()
                
            '''
            elif keyevent.keycode == 'BTN_???':
                print "7"
            elif keyevent.keycode == 'BTN_???':
                print "8"
            elif keyevent.keycode == 'BTN_???':
                print "9"
            elif keyevent.keycode == 'BTN_???':
                print "10"
            elif keyevent.keycode == 'BTN_???':
                print "11"
            elif keyevent.keycode == 'BTN_???':
                print "12"
            '''