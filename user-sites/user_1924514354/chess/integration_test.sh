#!/bin/bash
cd "$(dirname "$0")"
# Kill any existing server
pkill -f "python3 server.py" 2>/dev/null
sleep 1
# Start server
python3 server.py > server_test.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 3
# Run test
python3 << 'PYEOF'
import asyncio
import websockets
import json
import sys
async def test():
    uri = "ws://127.0.0.1:8080/ws"
    try:
        ws1 = await websockets.connect(uri)
        await ws1.send(json.dumps({'type':'login','username':'test1'}))
        resp1 = json.loads(await ws1.recv())
        print('Login1:', resp1)
        ws2 = await websockets.connect(uri)
        await ws2.send(json.dumps({'type':'login','username':'test2'}))
        resp2 = json.loads(await ws2.recv())
        print('Login2:', resp2)
        # Join queue
        await ws1.send(json.dumps({'type':'join_queue'}))
        await ws2.send(json.dumps({'type':'join_queue'}))
        q1 = json.loads(await ws1.recv())
        q2 = json.loads(await ws2.recv())
        print('Queue joined')
        # Game start
        start1 = json.loads(await ws1.recv())
        start2 = json.loads(await ws2.recv())
        print('Game start', start1['game_id'])
        # White moves
        if start1['color'] == 'white':
            await ws1.send(json.dumps({'type':'move','move':'e2e4'}))
        else:
            await ws2.send(json.dumps({'type':'move','move':'e2e4'}))
        state1 = json.loads(await ws1.recv())
        state2 = json.loads(await ws2.recv())
        print('Move 1 OK')
        # Black moves
        if start1['color'] == 'black':
            await ws1.send(json.dumps({'type':'move','move':'e7e5'}))
        else:
            await ws2.send(json.dumps({'type':'move','move':'e7e5'}))
        state3 = json.loads(await ws1.recv())
        state4 = json.loads(await ws2.recv())
        print('Move 2 OK')
        await ws1.close()
        await ws2.close()
        print('SUCCESS')
    except Exception as e:
        print('FAILED:', e)
        sys.exit(1)
asyncio.run(test())
PYEOF
RESULT=$?
# Kill server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
exit $RESULT
