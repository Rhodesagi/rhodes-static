from typing import Optional

class Node:
    """Doubly-linked list node."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev: Optional['Node'] = None
        self.next: Optional['Node'] = None


class LRUCache:
    """
    LRU Cache with O(1) get and put operations.
    
    Uses a hash map for key lookup and a doubly-linked list
    to maintain access order. Most recently used at head,
    least recently used at tail.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: dict[int, Node] = {}
        
        # Sentinel head and tail nodes (never removed)
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
        """Move existing node to head."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return the LRU node (before tail sentinel)."""
        node = self.tail.prev
        self._remove(node)
        return node
    
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
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            # Evict if over capacity
            if len(self.cache) > self.capacity:
                lru_node = self._pop_tail()
                del self.cache[lru_node.key]


# === Verification ===
if __name__ == "__main__":
    print("Testing LRU Cache...")
    
    # Test case 1: Basic operations
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return 1"
    
    # Eviction test: 3 evicts 2 (LRU)
    cache.put(3, 3)
    assert cache.get(2) == -1, "2 should be evicted"
    assert cache.get(3) == 3, "Should return 3"
    
    # Eviction test: 4 evicts 1 (now LRU)
    cache.put(4, 4)
    assert cache.get(1) == -1, "1 should be evicted"
    assert cache.get(3) == 3, "Should return 3"
    assert cache.get(4) == 4, "Should return 4"
    
    # Test case 2: Update existing key
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(1, 10)  # Update
    assert cache2.get(1) == 10, "Should return updated value 10"
    
    # Test case 3: Access updates recency
    cache3 = LRUCache(2)
    cache3.put(1, 1)
    cache3.put(2, 2)
    cache3.get(1)  # 1 is now most recently used
    cache3.put(3, 3)  # Should evict 2, not 1
    assert cache3.get(1) == 1, "1 should still exist"
    assert cache3.get(2) == -1, "2 should be evicted"
    
    # Test case 4: Edge cases
    cache4 = LRUCache(1)
    cache4.put(1, 1)
    cache4.put(2, 2)  # Evicts 1 immediately
    assert cache4.get(1) == -1
    assert cache4.get(2) == 2
    
    print("All tests passed!")
    print(f"\nFile saved to: ~/public_html/lru_cache.py")
