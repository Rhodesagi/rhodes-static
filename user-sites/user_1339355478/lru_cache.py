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
    
    Uses a hash map for key lookup and a doubly-linked list
    to track access order (most recent at head, least at tail).
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for O(1) operations without edge cases
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
    
    def _add_to_front(self, node: Node) -> None:
        """Add node right after head (most recently used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: Node) -> None:
        """Move existing node to front."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return the least recently used node."""
        lru = self.tail.prev
        self._remove(lru)
        return lru
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found. O(1)"""
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key-value pair. O(1)"""
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_front(node)
        else:
            # Insert new
            if len(self.cache) >= self.capacity:
                # Evict LRU
                lru = self._pop_tail()
                del self.cache[lru.key]
            
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_front(new_node)


# === Verification ===
if __name__ == "__main__":
    # Test case from standard LRU cache problem
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
    
    # Test update existing key
    cache.put(3, 30)
    assert cache.get(3) == 30, "Should return updated value 30"
    
    # Test capacity 1 edge case
    cache1 = LRUCache(1)
    cache1.put(1, 1)
    cache1.put(2, 2)
    assert cache1.get(1) == -1, "Should be evicted"
    assert cache1.get(2) == 2, "Should return 2"
    
    print("All tests passed!")
