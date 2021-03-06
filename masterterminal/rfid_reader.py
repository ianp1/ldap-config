import asyncio
import websockets
import json

import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()

async def rfid(websocket, path):
    print("called rfid")
    try:
        id, text = reader.read()
        tag = hex(id)[2:-2]
        message = {"rfid":tag}
        await websocket.send(json.dumps(message))
    except Error:
        print("error")
    '''
    print("received websocket connection")
    message = {"rfid":"2237FAE4"}
    await websocket.send(json.dumps(message))
    print("returned rfid")
    '''

start_server = websockets.serve(rfid, "192.168.2.55", 8765)

#print("loop")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

GPIO.cleanup()
