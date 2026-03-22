#!/bin/bash
set -e
cd "$(dirname "$0")"
# Kill any existing server
pkill -f "python3 server.py" 2>/dev/null || true
sleep 1
# Start server in background
python3 server.py > test_server.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID $SERVER_PID"
sleep 3  # wait for server to bind
# Run test
python3 -c "
import asyncio
import aiohttp
import json
async def test():
    async with aiohttp.ClientSession() as session:
        # Player 1
        ws1 = await session.ws_connect('ws://localhost:8080/ws')
        await ws1.send_json({'type':'login','username':'test1'})
        resp = await ws1.receive_json()
        print('Player1 login:', resp)
        # Player 2
        ws2 = await session.ws_connect('ws://localhost:8080/ws')
        await ws2.send_json({'type':'login','username':'test2'})
        resp2 = await ws2.receive_json()
        print('Player2 login:', resp2)
        # Join queue
        await ws1.send_json({'type':'join_queue'})
        await ws2.send_json({'type':'join_queue'})
        await ws1.receive_json()  # queue_joined
        await ws2.receive_json()
        # Game start
        start1 = await ws1.receive_json()
        start2 = await ws2.receive_json()
        print('Game start:', start1['game_id'])
        # White moves
        if start1['color'] == 'white':
            await ws1.send_json({'type':'move','move':'e2e4'})
        else:
            await ws2.send_json({'type':'move','move':'e2e4'})
        # Receive updates
        state1 = await ws1.receive_json()
        state2 = await ws2.receive_json()
        print('Move 1 applied')
        # Black moves
        if start1['color'] == 'black':
            await ws1.send_json({'type':'move','move':'e7e5'})
        else:
            await ws2.send_json({'type':'move','move':'e7e5'})
        state3 = await ws1.receive_json()
        state4 = await ws2.receive_json()
        print('Move 2 applied')
        # Close
        await ws1.close()
        await ws2.close()
        print('Test PASSED')
asyncio.run(test())
" 2>&1
TEST_RESULT=$?
# Kill server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo "Server stopped"
exit $TEST_RESULT
