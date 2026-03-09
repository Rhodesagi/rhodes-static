from typing import Optional, Dict

class Node:
    """Doubly-linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev: Optional['Node'] = None
        self.next: Optional['Node'] = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put.
    
    Uses hash map for key lookup + doubly-linked list for recency tracking.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: Dict[int, Node] = {}
        
        # Dummy head (MRU) and tail (LRU) — simplifies edge cases
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
        """Add node right after head (mark as most recently used)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: Node) -> None:
        """Move existing node to front."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return LRU node (before tail dummy)."""
        lru_node = self.tail.prev
        self._remove(lru_node)
        return lru_node
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if not found."""
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key-value pair."""
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_front(node)
        else:
            # Insert new
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_front(new_node)
            
            # Evict if over capacity
            if len(self.cache) > self.capacity:
                lru_node = self._pop_tail()
                del self.cache[lru_node.key]


def test_lru_cache():
    """Comprehensive test suite."""
    print("Testing LRU Cache...")
    
    # Test 1: Basic operations
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return 1"
    print("✓ Basic get/put")
    
    # Test 2: Eviction (3 exceeds capacity 2)
    cache.put(3, 3)  # Evicts key 2
    assert cache.get(2) == -1, "Key 2 should be evicted"
    assert cache.get(3) == 3, "Key 3 should exist"
    print("✓ LRU eviction works")
    
    # Test 3: Access updates recency
    cache.put(4, 4)  # Evicts key 1 (3 is now MRU)
    assert cache.get(1) == -1, "Key 1 should be evicted"
    assert cache.get(3) == 3, "Key 3 should exist"
    assert cache.get(4) == 4, "Key 4 should exist"
    print("✓ Access updates recency")
    
    # Test 4: Update existing key
    cache.put(3, 30)
    assert cache.get(3) == 30, "Value should be updated"
    print("✓ Update existing key")
    
    # Test 5: Single capacity
    cache1 = LRUCache(1)
    cache1.put(1, 1)
    cache1.put(2, 2)
    assert cache1.get(1) == -1, "Key 1 evicted from capacity-1 cache"
    assert cache1.get(2) == 2, "Key 2 present"
    print("✓ Single capacity edge case")
    
    # Test 6: Non-existent keys
    assert cache.get(999) == -1, "Non-existent key returns -1"
    print("✓ Non-existent key handling")
    
    # Test 7: Update makes key MRU
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(2, 2)
    cache2.put(1, 10)  # Update 1, makes it MRU
    cache2.put(3, 3)   # Should evict 2, not 1
    assert cache2.get(1) == 10, "Updated key 1 should exist"
    assert cache2.get(2) == -1, "Key 2 should be evicted"
    print("✓ Update promotes to MRU")
    
    print("\n" + "="*40)
    print("All tests passed! LRU Cache is O(1) get/put.")
    print("="*40)


if __name__ == "__main__":
    test_lru_cache()
