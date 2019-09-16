import sys
import json

from twisted.python import log
from twisted.internet import reactor
from autobahn.twisted.websocket import WebSocketServerProtocol
from mfrc522 import SimpleMFRC522

import RPi.GPIO as GPIO

reader = SimpleMFRC522()

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
            tag = hex(id)[2:-2]
            message = {"rfid":tag}
            self.sendMessage(json.dumps(message).encode('utf8'), False)
        self.send_fut = reactor.callLater(1, self.sendRFID)

log.startLogging(sys.stdout)

from autobahn.twisted.websocket import WebSocketServerFactory
factory = WebSocketServerFactory()
factory.protocol = RfidReaderProtocol
factory.setProtocolOptions(autoPingInterval=5,
                                   autoPingTimeout=2)


reactor.listenTCP(8765, factory)
try:
    reactor.run()
finally:
    print("cleaning up")
    GPIO.cleanup()
