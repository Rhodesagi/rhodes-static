class Node:
    """Doubly-linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put operations.
    
    Uses a hash map for key lookup and a doubly-linked list
    to maintain access order. Most recently used at head,
    least recently used at tail.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Sentinel nodes for easier edge case handling
        self.head = Node()  # MRU side
        self.tail = Node()  # LRU side
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: Node) -> None:
        """Remove node from linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _add_to_head(self, node: Node) -> None:
        """Add node right after head (MRU position)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head (mark as recently used)."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return LRU node (before tail sentinel)."""
        lru_node = self.tail.prev
        self._remove(lru_node)
        return lru_node
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks key as recently used.
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
        If at capacity, evicts LRU item.
        Time: O(1)
        """
        if self.capacity <= 0:
            return
        
        if key in self.cache:
            # Update existing key
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new key
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            if len(self.cache) > self.capacity:
                # Evict LRU
                lru_node = self._pop_tail()
                del self.cache[lru_node.key]


# === TEST HARNESS ===
if __name__ == "__main__":
    def test_basic_operations():
        """Test basic get/put operations."""
        cache = LRUCache(2)
        
        cache.put(1, 1)
        cache.put(2, 2)
        assert cache.get(1) == 1, "Should return 1"
        
        cache.put(3, 3)  # Evicts key 2
        assert cache.get(2) == -1, "Should return -1 (evicted)"
        
        cache.put(4, 4)  # Evicts key 1
        assert cache.get(1) == -1, "Should return -1 (evicted)"
        assert cache.get(3) == 3, "Should return 3"
        assert cache.get(4) == 4, "Should return 4"
        print("✓ Basic operations test passed")
    
    def test_update_existing():
        """Test updating existing key moves it to front."""
        cache = LRUCache(2)
        cache.put(1, 1)
        cache.put(2, 2)
        cache.put(1, 10)  # Update key 1, should become MRU
        cache.put(3, 3)   # Should evict key 2, not key 1
        
        assert cache.get(1) == 10, "Should return updated value 10"
        assert cache.get(2) == -1, "Key 2 should be evicted"
        assert cache.get(3) == 3, "Should return 3"
        print("✓ Update existing test passed")
    
    def test_capacity_one():
        """Test cache with capacity 1."""
        cache = LRUCache(1)
        cache.put(1, 1)
        cache.put(2, 2)  # Evicts 1
        
        assert cache.get(1) == -1, "Should return -1"
        assert cache.get(2) == 2, "Should return 2"
        print("✓ Capacity one test passed")
    
    def test_capacity_zero():
        """Test cache with capacity 0."""
        cache = LRUCache(0)
        cache.put(1, 1)
        assert cache.get(1) == -1, "Should return -1"
        print("✓ Capacity zero test passed")
    
    def test_large_scale():
        """Test with many operations to verify O(1) behavior."""
        import time
        cache = LRUCache(1000)
        
        start = time.time()
        for i in range(10000):
            cache.put(i % 2000, i)  # Constant churn
        for i in range(10000):
            cache.get(i % 2000)
        elapsed = time.time() - start
        
        assert elapsed < 1.0, f"Should be fast (O(1)), took {elapsed:.3f}s"
        print(f"✓ Large scale test passed ({elapsed:.3f}s for 20k ops)")
    
    # Run all tests
    test_basic_operations()
    test_update_existing()
    test_capacity_one()
    test_capacity_zero()
    test_large_scale()
    print("\nAll tests passed! ✓")
