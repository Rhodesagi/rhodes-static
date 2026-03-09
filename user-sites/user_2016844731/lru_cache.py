"""
LRU Cache implementation with O(1) get and put operations.

Uses a hash map (dict) for O(1) key lookup and a doubly-linked list
for O(1) reordering on access and eviction.
"""

from typing import Optional


class _Node:
    """Doubly-linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev: Optional['_Node'] = None
        self.next: Optional['_Node'] = None


class LRUCache:
    """
    Least Recently Used (LRU) Cache with O(1) get and put.
    
    Args:
        capacity: Maximum number of items to store
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: dict[int, _Node] = {}
        
        # Dummy head and tail for O(1) edge case handling
        self.head = _Node()
        self.tail = _Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: _Node) -> None:
        """Remove node from linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _add_to_front(self, node: _Node) -> None:
        """Add node right after head (most recently used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: _Node) -> None:
        """Move existing node to front (mark as recently used)."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_tail(self) -> _Node:
        """Remove and return the least recently used node (before dummy tail)."""
        lru_node = self.tail.prev
        self._remove(lru_node)
        return lru_node
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Access marks key as recently used.
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        If at capacity, evicts least recently used item.
        """
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_front(node)
            return
        
        # Create new node
        new_node = _Node(key, val)
        self.cache[key] = new_node
        self._add_to_front(new_node)
        
        # Evict if over capacity
        if len(self.cache) > self.capacity:
            lru_node = self._pop_tail()
            del self.cache[lru_node.key]


# === Verification ===
if __name__ == "__main__":
    # LeetCode 146 test case
    cache = LRUCache(2)
    cache.put(1, 1)           # cache: {1=1}
    cache.put(2, 2)           # cache: {1=1, 2=2}
    assert cache.get(1) == 1  # returns 1, cache: {2=2, 1=1}
    cache.put(3, 3)           # evicts key 2, cache: {1=1, 3=3}
    assert cache.get(2) == -1 # returns -1 (not found)
    cache.put(4, 4)           # evicts key 1, cache: {3=3, 4=4}
    assert cache.get(1) == -1 # returns -1 (not found)
    assert cache.get(3) == 3  # returns 3, cache: {4=4, 3=3}
    assert cache.get(4) == 4  # returns 4, cache: {3=3, 4=4}
    
    # Update existing key test
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(1, 2)          # update value
    assert cache2.get(1) == 2
    cache2.put(2, 2)
    cache2.put(3, 3)          # should evict key 1, not key 2
    assert cache2.get(1) == -1
    assert cache2.get(2) == 2
    
    # Single capacity test
    cache3 = LRUCache(1)
    cache3.put(1, 1)
    cache3.put(2, 2)          # evicts key 1
    assert cache3.get(1) == -1
    assert cache3.get(2) == 2
    
    print("All tests passed.")
