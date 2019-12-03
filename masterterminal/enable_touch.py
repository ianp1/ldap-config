import os
import re

import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(4, GPIO.IN)

getInputsCmd = 'xinput --list'
prev_read = False
prev_value = False

def getTouchInput():
    inputs = os.popen(getInputsCmd).read()
    print(inputs)
    inputList = inputs.split("\n")
    for inputLine in inputList:
        if "FT5406" in inputLine:
            inputIdMatch = re.search('id\=[0-9]+', inputLine)
            inputId = inputIdMatch.group(0).split("=")[1]
            return inputId

try:
    while True:
        read_value = GPIO.input(4)
        if read_value != prev_value or not prev_read:
            inputId = getTouchInput()
            prev_read = True
            prev_value = read_value
            if read_value:
                # enable touchscreen
                os.system("xinput --disable "+str(inputId))
            else:
                # disable touchscreen
                os.system("xinput --enable "+str(inputId))
        time.sleep(0.1)
finally:
    GPIO.cleanup()
