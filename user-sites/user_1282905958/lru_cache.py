class LRUCache:
    """
    O(1) LRU Cache using hash map + doubly-linked list.
    Dict provides key→node lookup. Linked list maintains access order.
    """
    
    class _Node:
        __slots__ = ['key', 'val', 'prev', 'next']
        def __init__(self, key=0, val=0):
            self.key = key
            self.val = val
            self.prev = None
            self.next = None
    
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}  # key -> _Node
        
        # Dummy head (MRU) and tail (LRU) for O(1) edge cases
        self.head = self._Node()
        self.tail = self._Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: '_Node') -> None:
        """Unlink node from list."""
        prev, nxt = node.prev, node.next
        prev.next = nxt
        nxt.prev = prev
    
    def _add_to_front(self, node: '_Node') -> None:
        """Insert node at head (most recently used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: '_Node') -> None:
        """Remove and re-add at front."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_lru(self) -> '_Node':
        """Remove and return node before tail (least recently used)."""
        lru = self.tail.prev
        self._remove(lru)
        return lru
    
    def get(self, key: int) -> int:
        """Return value if key exists, else -1. Makes key most-recently-used."""
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key→val. Evicts LRU if at capacity."""
        if key in self.cache:
            node = self.cache[key]
            node.val = val
            self._move_to_front(node)
            return
        
        if self.cap <= 0:
            return
        
        new_node = self._Node(key, val)
        self.cache[key] = new_node
        self._add_to_front(new_node)
        
        if len(self.cache) > self.cap:
            lru = self._pop_lru()
            del self.cache[lru.key]


# ===== TEST HARNESS =====
if __name__ == "__main__":
    def test_basic():
        cache = LRUCache(2)
        cache.put(1, 1)  # cache: {1:1}
        cache.put(2, 2)  # cache: {2:2, 1:1} (1 is LRU)
        assert cache.get(1) == 1, "get(1) should return 1"
        cache.put(3, 3)  # evicts 2, cache: {3:3, 1:1}
        assert cache.get(2) == -1, "get(2) should return -1 (evicted)"
        cache.put(4, 4)  # evicts 1, cache: {4:4, 3:3}
        assert cache.get(1) == -1, "get(1) should return -1 (evicted)"
        assert cache.get(3) == 3, "get(3) should return 3"
        assert cache.get(4) == 4, "get(4) should return 4"
        print("✓ Basic eviction test passed")
    
    def test_update_existing():
        cache = LRUCache(2)
        cache.put(1, 1)
        cache.put(2, 2)
        cache.put(1, 10)  # update existing, make MRU
        cache.put(3, 3)   # should evict 2, not 1
        assert cache.get(1) == 10, "get(1) should return updated value 10"
        assert cache.get(2) == -1, "get(2) should be evicted"
        assert cache.get(3) == 3
        print("✓ Update existing key test passed")
    
    def test_capacity_zero():
        cache = LRUCache(0)
        cache.put(1, 1)
        assert cache.get(1) == -1, "Zero capacity should not store anything"
        print("✓ Zero capacity test passed")
    
    def test_single_element():
        cache = LRUCache(1)
        cache.put(1, 1)
        cache.put(2, 2)  # evicts 1
        assert cache.get(1) == -1
        assert cache.get(2) == 2
        cache.put(2, 20)  # update
        assert cache.get(2) == 20
        print("✓ Single element test passed")
    
    def test_order_preserved():
        cache = LRUCache(3)
        for i in range(1, 4):
            cache.put(i, i)
        # Access order: 1,2,3. 1 is LRU
        cache.get(1)  # 1 becomes MRU
        cache.put(4, 4)  # evicts 2
        assert cache.get(2) == -1
        assert cache.get(1) == 1
        assert cache.get(3) == 3
        assert cache.get(4) == 4
        print("✓ Order preservation test passed")
    
    test_basic()
    test_update_existing()
    test_capacity_zero()
    test_single_element()
    test_order_preserved()
    print("\n✅ All tests passed")
