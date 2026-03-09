class _Node:
    """Doubly-linked list node for LRU tracking."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key=None, val=None):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put operations.
    
    Uses a hash map for key lookup and a doubly-linked list
    to track access order.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> _Node
        
        # Sentinel nodes: head = most recent, tail = least recent
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
        """Remove and return the least recently used node."""
        lru = self.tail.prev
        self._remove(lru)
        return lru
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks key as recently used.
        O(1) time complexity.
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        Evicts least recently used if at capacity.
        O(1) time complexity.
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
            lru = self._pop_tail()
            del self.cache[lru.key]


# === Test Suite ===
if __name__ == "__main__":
    # LeetCode 146 style test
    print("Test 1: Basic operations")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Expected 1"
    cache.put(3, 3)  # Evicts key 2
    assert cache.get(2) == -1, "Expected -1 (evicted)"
    cache.put(4, 4)  # Evicts key 1
    assert cache.get(1) == -1, "Expected -1 (evicted)"
    assert cache.get(3) == 3, "Expected 3"
    assert cache.get(4) == 4, "Expected 4"
    print("✓ Test 1 passed")
    
    print("\nTest 2: Update existing key")
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(1, 10)  # Update, moves to front
    assert cache2.get(1) == 10, "Expected 10"
    cache2.put(2, 2)  # [2, 1] - 2 is MRU, 1 is LRU
    cache2.put(3, 3)  # Evicts 1 (LRU), [3, 2]
    assert cache2.get(1) == -1, "Expected -1 (evicted)"
    assert cache2.get(2) == 2, "Expected 2"
    assert cache2.get(3) == 3, "Expected 3"
    print("✓ Test 2 passed")
    
    print("\nTest 3: Single capacity")
    cache3 = LRUCache(1)
    cache3.put(1, 1)
    cache3.put(2, 2)  # Evicts 1
    assert cache3.get(1) == -1, "Expected -1"
    assert cache3.get(2) == 2, "Expected 2"
    print("✓ Test 3 passed")
    
    print("\nTest 4: Access updates recency")
    cache4 = LRUCache(2)
    cache4.put(1, 1)
    cache4.put(2, 2)
    cache4.get(1)  # 1 is now most recent
    cache4.put(3, 3)  # Should evict 2
    assert cache4.get(1) == 1, "Expected 1"
    assert cache4.get(2) == -1, "Expected -1 (evicted)"
    assert cache4.get(3) == 3, "Expected 3"
    print("✓ Test 4 passed")
    
    print("\nTest 5: Zero capacity edge case")
    cache5 = LRUCache(0)
    cache5.put(1, 1)
    assert cache5.get(1) == -1, "Expected -1"
    print("✓ Test 5 passed")
    
    print("\n=== All tests passed ===")
