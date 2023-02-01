import sys
import json

from twisted.python import log
from twisted.internet import reactor
from autobahn.twisted.websocket import WebSocketServerProtocol

import RPi.GPIO as GPIO
import MFRC522
import time
import os

MIFAREReader = MFRC522.MFRC522()

millis = lambda: int(round(time.time() * 1000))

lastSend = 0

class RfidReaderProtocol(WebSocketServerProtocol):
    def onOpen(self):
        if not hasattr(self, 'send_fut'):
            self.send_fut = reactor.callLater(1, self.sendRFID)
            print("adding new loop")
        else:
            print("already have loop")

    def onMessage(self, payload, isBinary):
        print("received message", payload)

    def onClose(self, wasClean, code, reason):
        self.send_fut.cancel()
        print("connection closed")

    def sendRFID(self):
        (status, TagType) = MIFAREReader.MFRC522_Request(MIFAREReader.PICC_REQIDL)
        if status == MIFAREReader.MI_OK:
            (status, uid) = MIFAREReader.MFRC522_SelectTagSN()
            if status == MIFAREReader.MI_OK:
                print("Card read UID:", uidToString(uid))
                message = {"rfid":uidToString(uid)}
                global lastSend
                lastSend = millis()
                self.sendMessage(json.dumps(message).encode('utf8'), False)
                os.system("echo 255 > /sys/class/backlight/rpi_backlight/brightness")
            else:
                print("Authentication error?")
        '''id2, text = reader.read()
        print(id2)
        print(text)
        print("ID: %s\nText: %s" % (id2, text))
        id = reader.read_id_no_block()
        if id is not None:
            global lastSend
            lastSend = millis()
            tag = hex(id)[2:-2]
            print(tag)
            print(hex(id))
            tag_list = [tag[i:i+2] for i in range(0, len(tag), 2)]
            print('_'.join(tag_list))
            message = {"rfid":'_'.join(tag_list)}
            self.sendMessage(json.dumps(message).encode('utf8'), False)
            os.system("echo 255 > /sys/class/backlight/rpi_backlight/brightness")
        '''
        self.send_fut = reactor.callLater(0.1, self.sendRFID)
        
log.startLogging(sys.stdout)

from autobahn.twisted.websocket import WebSocketServerFactory
factory = WebSocketServerFactory()
factory.protocol = RfidReaderProtocol
factory.setProtocolOptions(autoPingInterval=5,
                                   autoPingTimeout=2)

def screenBrightness():
    if millis() - lastSend > 1000 * 20:
        print("millis: ", millis(), "; lastSend: ", lastSend)
        os.system("echo 25 > /sys/class/backlight/rpi_backlight/brightness")         
    reactor.callLater(1, screenBrightness)

def uidToString(uid):
    mystring = ""
    for i in uid:
        if mystring != "":
            mystring = mystring + "_" + format(i, '02X')
        else:
            mystring = format(i, '02X')
    return mystring 

screenBrightness()
reactor.listenTCP(8765, factory)
try:
    reactor.run()
finally:
    print("cleaning up")
    GPIO.cleanup()
