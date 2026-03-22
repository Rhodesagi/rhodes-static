import asyncio
import websockets
import json
import subprocess
import sys
import os
import time

async def test():
    # Start server
    proc = subprocess.Popen([sys.executable, 'server.py'], cwd=os.path.dirname(__file__))
    try:
        await asyncio.sleep(2)  # wait for server
        uri = "ws://127.0.0.1:8080/ws"
        # Player 1
        ws1 = await websockets.connect(uri)
        await ws1.send(json.dumps({'type':'login','username':'player1'}))
        resp1 = json.loads(await ws1.recv())
        print('Player1:', resp1)
        # Player 2
        ws2 = await websockets.connect(uri)
        await ws2.send(json.dumps({'type':'login','username':'player2'}))
        resp2 = json.loads(await ws2.recv())
        print('Player2:', resp2)
        # Join queue
        await ws1.send(json.dumps({'type':'join_queue'}))
        await ws2.send(json.dumps({'type':'join_queue'}))
        q1 = json.loads(await ws1.recv())
        q2 = json.loads(await ws2.recv())
        print('Queue joined')
        # Game start
        start1 = json.loads(await ws1.recv())
        start2 = json.loads(await ws2.recv())
        print('Game started', start1['game_id'])
        # White moves e2e4
        if start1['color'] == 'white':
            await ws1.send(json.dumps({'type':'move','move':'e2e4'}))
        else:
            await ws2.send(json.dumps({'type':'move','move':'e2e4'}))
        # Receive game state
        state1 = json.loads(await ws1.recv())
        state2 = json.loads(await ws2.recv())
        print('Move 1 applied', state1['fen'])
        # Black moves e7e5
        if start1['color'] == 'black':
            await ws1.send(json.dumps({'type':'move','move':'e7e5'}))
        else:
            await ws2.send(json.dumps({'type':'move','move':'e7e5'}))
        state3 = json.loads(await ws1.recv())
        state4 = json.loads(await ws2.recv())
        print('Move 2 applied')
        # Close
        await ws1.close()
        await ws2.close()
        print('Test PASSED')
    finally:
        proc.terminate()
        proc.wait()

if __name__ == '__main__':
    asyncio.run(test())
