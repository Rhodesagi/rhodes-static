class Node:
    """Doubly-linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key=None, val=None):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put.
    
    Uses hash map for key lookup + doubly-linked list for recency order.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Sentinel nodes (empty list initialization)
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
        """Add node right after head (most recent)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return least recent node (before tail sentinel)."""
        node = self.tail.prev
        self._remove(node)
        return node
    
    def get(self, key: int) -> int:
        """Return value or -1 if key not found."""
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_head(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key with value. Evicts LRU if at capacity."""
        if self.capacity <= 0:
            return
            
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            if len(self.cache) > self.capacity:
                # Evict LRU
                lru = self._pop_tail()
                del self.cache[lru.key]


# === TESTS ===
if __name__ == "__main__":
    # LeetCode-style verification
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "get(1) should return 1"
    
    cache.put(3, 3)  # evicts key 2
    assert cache.get(2) == -1, "get(2) should return -1 (evicted)"
    
    cache.put(4, 4)  # evicts key 1
    assert cache.get(1) == -1, "get(1) should return -1 (evicted)"
    assert cache.get(3) == 3, "get(3) should return 3"
    assert cache.get(4) == 4, "get(4) should return 4"
    
    # Update refreshes position
    cache.put(3, 30)
    assert cache.get(3) == 30, "updated value should be 30"
    cache.put(5, 5)  # should evict 4, not 3
    assert cache.get(4) == -1, "get(4) should be -1 (evicted)"
    assert cache.get(3) == 30, "get(3) should still return 30"
    
    # Zero capacity edge case
    empty_cache = LRUCache(0)
    empty_cache.put(1, 1)
    assert empty_cache.get(1) == -1, "zero capacity should not store anything"
    
    print("All tests passed.")
