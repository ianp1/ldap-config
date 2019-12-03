import sys
import json

from twisted.python import log
from twisted.internet import reactor
from autobahn.twisted.websocket import WebSocketServerProtocol
from mfrc522 import SimpleMFRC522

import RPi.GPIO as GPIO
import time
import os

reader = SimpleMFRC522()

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
        id = reader.read_id_no_block()
        if id is not None:
            global lastSend
            lastSend = millis()
            tag = hex(id)[2:-2]
            message = {"rfid":tag}
            self.sendMessage(json.dumps(message).encode('utf8'), False)
            os.system("echo 255 > /sys/class/backlight/rpi_backlight/brightness")
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

screenBrightness()
reactor.listenTCP(8765, factory)
try:
    reactor.run()
finally:
    print("cleaning up")
    GPIO.cleanup()
