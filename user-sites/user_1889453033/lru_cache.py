"""
LRU Cache Implementation
O(1) get and put operations using hash map + doubly-linked list.
"""


class Node:
    """Doubly-linked list node."""
    __slots__ = ('key', 'value', 'prev', 'next')
    
    def __init__(self, key: int = 0, value: int = 0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put operations.
    
    Uses a hash map for key lookup and a doubly-linked list to track
    access order (most recent at head, least recent at tail).
    """
    
    def __init__(self, capacity: int):
        """Initialize cache with given capacity."""
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for easier edge-case handling
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: Node) -> None:
        """Remove node from linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _add_to_head(self, node: Node) -> None:
        """Add node right after head (most recently used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head (mark as recently used)."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return node before tail (least recently used)."""
        lru_node = self.tail.prev
        self._remove(lru_node)
        return lru_node
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks item as most recently used.
        Time: O(1)
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_head(node)
        return node.value
    
    def put(self, key: int, value: int) -> None:
        """
        Insert or update key-value pair.
        Evicts least recently used item if over capacity.
        Time: O(1)
        """
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.value = value
            self._move_to_head(node)
        else:
            # Create new node
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            # Check capacity and evict if needed
            if len(self.cache) > self.capacity:
                lru_node = self._pop_tail()
                del self.cache[lru_node.key]


# ===== TESTS =====
if __name__ == "__main__":
    def test_basic_operations():
        cache = LRUCache(2)
        
        # Test put and get
        cache.put(1, 1)
        cache.put(2, 2)
        assert cache.get(1) == 1, "Should return 1"
        
        # Evicts key 2
        cache.put(3, 3)
        assert cache.get(2) == -1, "Should return -1 (evicted)"
        
        # Evicts key 1
        cache.put(4, 4)
        assert cache.get(1) == -1, "Should return -1 (evicted)"
        assert cache.get(3) == 3, "Should return 3"
        assert cache.get(4) == 4, "Should return 4"
        print("✓ Basic operations test passed")
    
    def test_update_existing():
        cache = LRUCache(2)
        cache.put(1, 1)
        cache.put(2, 2)
        cache.put(1, 10)  # Update key 1
        assert cache.get(1) == 10, "Should return updated value 10"
        cache.put(3, 3)   # Should evict key 2, not key 1
        assert cache.get(2) == -1, "Key 2 should be evicted"
        assert cache.get(1) == 10, "Key 1 should still exist"
        print("✓ Update existing test passed")
    
    def test_capacity_one():
        cache = LRUCache(1)
        cache.put(1, 1)
        cache.put(2, 2)
        assert cache.get(1) == -1, "Should return -1"
        assert cache.get(2) == 2, "Should return 2"
        print("✓ Capacity one test passed")
    
    def test_access_order():
        cache = LRUCache(3)
        cache.put(1, 1)
        cache.put(2, 2)
        cache.put(3, 3)
        # Access order: 1, 2, 3
        cache.get(1)  # Now 1 is most recent
        # Cache: [1, 3, 2] (2 is LRU)
        cache.put(4, 4)  # Evicts 2
        assert cache.get(2) == -1, "Key 2 should be evicted"
        assert cache.get(1) == 1, "Key 1 should exist"
        assert cache.get(3) == 3, "Key 3 should exist"
        assert cache.get(4) == 4, "Key 4 should exist"
        print("✓ Access order test passed")
    
    test_basic_operations()
    test_update_existing()
    test_capacity_one()
    test_access_order()
    print("\nAll tests passed!")
