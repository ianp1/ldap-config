import asyncio
import websockets
import json

async def rfid(websocket, path):
    print("received websocket connection")
    message = {"rfid":"2237FAE4"}
    await websocket.send(json.dumps(message))
    print("returned rfid")

start_server = websockets.serve(rfid, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
