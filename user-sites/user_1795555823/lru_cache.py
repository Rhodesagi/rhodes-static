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
    
    Uses hash map for key lookup and doubly-linked list for access ordering.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for easier edge case handling
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: Node) -> None:
        """Remove node from list."""
        prev, nxt = node.prev, node.next
        prev.next = nxt
        nxt.prev = prev
    
    def _add_to_tail(self, node: Node) -> None:
        """Add node to tail (most recently used)."""
        prev = self.tail.prev
        prev.next = node
        node.prev = prev
        node.next = self.tail
        self.tail.prev = node
    
    def _move_to_tail(self, node: Node) -> None:
        """Move existing node to tail."""
        self._remove(node)
        self._add_to_tail(node)
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found. O(1)"""
        if self.capacity == 0 or key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_tail(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key-value pair. O(1)"""
        if self.capacity == 0:
            return
        
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_tail(node)
            return
        
        # New key
        if len(self.cache) >= self.capacity:
            # Evict LRU (head.next)
            lru = self.head.next
            self._remove(lru)
            del self.cache[lru.key]
        
        # Add new node
        new_node = Node(key, val)
        self.cache[key] = new_node
        self._add_to_tail(new_node)


# ---- Verification ----
if __name__ == "__main__":
    # Test case 1: Basic operations
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Get existing key 1"
    cache.put(3, 3)  # Evicts key 2
    assert cache.get(2) == -1, "Key 2 evicted"
    assert cache.get(3) == 3, "Key 3 present"
    cache.put(4, 4)  # Evicts key 1
    assert cache.get(1) == -1, "Key 1 evicted"
    assert cache.get(3) == 3, "Key 3 still present"
    assert cache.get(4) == 4, "Key 4 present"
    
    # Test case 2: Update existing key
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(1, 10)  # Update
    assert cache2.get(1) == 10, "Updated value returned"
    
    # Test case 3: Access updates recency
    cache3 = LRUCache(2)
    cache3.put(1, 1)
    cache3.put(2, 2)
    cache3.get(1)  # 1 is now MRU
    cache3.put(3, 3)  # Should evict 2, not 1
    assert cache3.get(1) == 1, "Key 1 still present after access"
    assert cache3.get(2) == -1, "Key 2 was evicted"
    
    # Test case 4: Capacity 0
    cache4 = LRUCache(0)
    cache4.put(1, 1)
    assert cache4.get(1) == -1, "Nothing stored in 0-capacity cache"
    
    # Test case 5: Capacity 1
    cache5 = LRUCache(1)
    cache5.put(1, 1)
    cache5.put(2, 2)  # Evicts 1
    assert cache5.get(1) == -1, "Key 1 evicted from size-1 cache"
    assert cache5.get(2) == 2, "Key 2 present"
    
    print("All tests passed.")
