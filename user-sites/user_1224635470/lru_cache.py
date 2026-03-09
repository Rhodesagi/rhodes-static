"""
LRU Cache implementation with O(1) get and put operations.
Uses hash map + doubly-linked list for constant-time operations.
"""


class _Node:
    """Doubly-linked list node."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used cache with O(1) get and put.
    
    Attributes:
        capacity: Maximum number of items to store.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> _Node
        
        # Dummy head and tail for O(1) operations without edge cases
        self.head = _Node()
        self.tail = _Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: _Node) -> None:
        """Remove node from list."""
        prev, nxt = node.prev, node.next
        prev.next = nxt
        nxt.prev = prev
    
    def _add_to_tail(self, node: _Node) -> None:
        """Add node right before tail (most recent)."""
        prev = self.tail.prev
        prev.next = node
        node.prev = prev
        node.next = self.tail
        self.tail.prev = node
    
    def _move_to_tail(self, node: _Node) -> None:
        """Move existing node to tail (mark as recently used)."""
        self._remove(node)
        self._add_to_tail(node)
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks key as recently used.
        Time: O(1)
        """
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_tail(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        Evicts least recently used if at capacity.
        Time: O(1)
        """
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_tail(node)
            return
        
        # New key: create node
        node = _Node(key, val)
        self.cache[key] = node
        self._add_to_tail(node)
        
        # Evict if over capacity
        if len(self.cache) > self.capacity:
            lru = self.head.next
            self._remove(lru)
            del self.cache[lru.key]


# === Self-test ===
if __name__ == "__main__":
    # LeetCode 146 test case
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1  # returns 1
    cache.put(3, 3)           # evicts key 2
    assert cache.get(2) == -1 # returns -1 (not found)
    cache.put(4, 4)           # evicts key 1
    assert cache.get(1) == -1 # returns -1 (not found)
    assert cache.get(3) == 3  # returns 3
    assert cache.get(4) == 4  # returns 4
    
    # Edge case: zero capacity
    empty = LRUCache(0)
    empty.put(1, 1)
    assert empty.get(1) == -1
    
    # Update refreshes position
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(2, 2)
    cache2.put(1, 10)  # update key 1, moves to tail
    cache2.put(3, 3)   # should evict key 2, not key 1
    assert cache2.get(1) == 10
    assert cache2.get(2) == -1
    
    print("All tests passed.")
