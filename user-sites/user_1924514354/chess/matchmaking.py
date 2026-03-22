import asyncio
import time

class MatchmakingQueue:
    def __init__(self, max_diff=200, max_wait=30):
        self.queue = []  # list of (user_id, username, elo, join_time, future)
        self.max_diff = max_diff
        self.max_wait = max_wait
        self.lock = asyncio.Lock()
    
    async def join_queue(self, user_id, username, elo):
        """Join the queue, return a future that resolves with (opponent_id, opponent_username, color)."""
        future = asyncio.Future()
        async with self.lock:
            # Check for match
            for i, (other_id, other_name, other_elo, other_time, other_future) in enumerate(self.queue):
                if abs(other_elo - elo) <= self.max_diff:
                    # Match found
                    self.queue.pop(i)
                    # Determine color: higher ELO gets white
                    if elo >= other_elo:
                        color = 'white'
                        future.set_result((other_id, other_name, 'black'))
                        other_future.set_result((user_id, username, 'white'))
                    else:
                        color = 'black'
                        future.set_result((other_id, other_name, 'white'))
                        other_future.set_result((user_id, username, 'black'))
                    return future
            # No match, add to queue
            self.queue.append((user_id, username, elo, time.time(), future))
        # Schedule timeout
        asyncio.create_task(self._timeout(user_id, future))
        return future
    
    async def _timeout(self, user_id, future):
        await asyncio.sleep(self.max_wait)
        async with self.lock:
            # Remove from queue if still there
            for i, (uid, *_) in enumerate(self.queue):
                if uid == user_id and not future.done():
                    self.queue.pop(i)
                    future.set_result(None)  # timeout
                    break
    
    async def leave_queue(self, user_id):
        """Remove user from queue."""
        async with self.lock:
            for i, (uid, *_) in enumerate(self.queue):
                if uid == user_id:
                    self.queue.pop(i)
                    break

