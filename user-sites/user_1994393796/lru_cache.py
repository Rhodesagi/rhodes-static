"""
LRU Cache Implementation - O(1) get and put operations.
Uses hash map for key lookup + doubly-linked list for order tracking.
"""


class _Node:
    """Doubly-linked list node."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev: '_Node' = None
        self.next: '_Node' = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put.
    
    Args:
        capacity: Maximum number of items to store
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: dict[int, _Node] = {}
        
        # Dummy head and tail for easier edge case handling
        self.head = _Node()
        self.tail = _Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: _Node) -> None:
        """Remove node from its current position."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _add_to_head(self, node: _Node) -> None:
        """Add node right after head (most recently used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_head(self, node: _Node) -> None:
        """Move existing node to head (mark as recently used)."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> _Node:
        """Remove and return the least recently used node."""
        node = self.tail.prev
        self._remove(node)
        return node
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks item as recently used.
        
        Time: O(1)
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_head(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        If at capacity, evicts least recently used item.
        
        Time: O(1)
        """
        if self.capacity <= 0:
            return
        
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new
            if len(self.cache) >= self.capacity:
                # Evict LRU
                lru = self._pop_tail()
                del self.cache[lru.key]
            
            new_node = _Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)


# === Verification ===
if __name__ == "__main__":
    # Test case from LeetCode
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
    
    # Edge case: capacity 0
    empty_cache = LRUCache(0)
    empty_cache.put(1, 1)
    assert empty_cache.get(1) == -1
    
    # Edge case: update existing key
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(1, 10)  # update
    assert cache2.get(1) == 10
    cache2.put(2, 2)
    cache2.put(3, 3)   # should evict key 1 (LRU)
    assert cache2.get(1) == -1
    assert cache2.get(2) == 2
    
    print("All tests passed!")
