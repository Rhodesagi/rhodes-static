class Node:
    """Doubly-linked list node."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key=None, val=None):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    LRU Cache with O(1) get and put operations.
    
    Uses a hash map for key lookups and a doubly-linked list
    to maintain access order (most recent at head, least at tail).
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for O(1) operations without edge cases
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found."""
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_head(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key-value pair."""
        if key in self.cache:
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            if len(self.cache) > self.capacity:
                lru = self._pop_tail()
                del self.cache[lru.key]
    
    def _add_to_head(self, node: Node) -> None:
        """Add node right after dummy head."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _remove(self, node: Node) -> None:
        """Remove node from linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head (most recently used)."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return the LRU node (before dummy tail)."""
        lru = self.tail.prev
        self._remove(lru)
        return lru


# ============ TESTS ============
def test_basic_operations():
    """Test basic get/put functionality."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return value for existing key"
    
    cache.put(3, 3)  # Evicts key 2 (LRU, since 1 was just accessed)
    assert cache.get(2) == -1, "Key 2 should be evicted"
    assert cache.get(3) == 3, "Key 3 should exist"
    
    cache.put(4, 4)  # Evicts key 1 (now LRU)
    assert cache.get(1) == -1, "Key 1 should be evicted"
    assert cache.get(3) == 3, "Key 3 should still exist"
    assert cache.get(4) == 4, "Key 4 should exist"
    print("✓ Basic operations test passed")


def test_update_existing():
    """Test updating existing keys moves them to front."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    # Order: [2, 1] (2 is most recent)
    
    cache.put(1, 10)  # Update key 1, moves to head
    # Order: [1, 2] (1 is now most recent)
    assert cache.get(1) == 10, "Value should be updated"
    
    cache.put(3, 3)  # Should evict key 2 (now LRU), not key 1
    assert cache.get(1) == 10, "Key 1 should still exist (recently updated)"
    assert cache.get(2) == -1, "Key 2 should be evicted"
    assert cache.get(3) == 3, "Key 3 should exist"
    print("✓ Update existing test passed")


def test_access_updates_order():
    """Test that get() updates LRU order."""
    cache = LRUCache(3)
    
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(3, 3)
    
    # Access key 1, making it most recently used
    cache.get(1)
    
    # Add key 4, should evict key 2 (now LRU, since order is [1,3,2])
    cache.put(4, 4)
    assert cache.get(1) == 1, "Key 1 should exist"
    assert cache.get(2) == -1, "Key 2 should be evicted (LRU)"
    assert cache.get(3) == 3, "Key 3 should exist"
    assert cache.get(4) == 4, "Key 4 should exist"
    print("✓ Access order test passed")


def test_capacity_one():
    """Test edge case: capacity of 1."""
    cache = LRUCache(1)
    
    cache.put(1, 1)
    assert cache.get(1) == 1
    
    cache.put(2, 2)  # Evicts key 1
    assert cache.get(1) == -1
    assert cache.get(2) == 2
    print("✓ Capacity one test passed")


def test_nonexistent_key():
    """Test getting non-existent keys."""
    cache = LRUCache(2)
    assert cache.get(999) == -1, "Non-existent key should return -1"
    print("✓ Nonexistent key test passed")


def test_large_capacity():
    """Test with larger capacity."""
    cache = LRUCache(1000)
    
    for i in range(1000):
        cache.put(i, i * 2)
    
    for i in range(1000):
        assert cache.get(i) == i * 2, f"Key {i} should exist"
    
    # Add one more, should evict key 0
    cache.put(1000, 2000)
    assert cache.get(0) == -1, "Key 0 should be evicted"
    assert cache.get(1000) == 2000, "Key 1000 should exist"
    print("✓ Large capacity test passed")


def test_put_same_key_no_eviction():
    """Test that updating same key doesn't cause spurious eviction."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(1, 100)  # Update key 1, should NOT evict key 2
    
    assert cache.get(1) == 100
    assert cache.get(2) == 2  # Key 2 should still be there
    print("✓ Same key update test passed")


if __name__ == "__main__":
    test_basic_operations()
    test_update_existing()
    test_access_updates_order()
    test_capacity_one()
    test_nonexistent_key()
    test_large_capacity()
    test_put_same_key_no_eviction()
    print("\n✅ All tests passed!")
