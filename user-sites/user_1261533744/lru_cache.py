from collections import OrderedDict

class LRUCache:
    """
    LRU Cache with O(1) get and put operations.
    
    Uses OrderedDict to maintain access order:
    - Most recently used items are at the end
    - Least recently used items are at the beginning
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found. O(1)"""
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        """Insert or update key-value. Evicts LRU if at capacity. O(1)"""
        if key in self.cache:
            # Update existing key and move to end
            self.cache.move_to_end(key)
        self.cache[key] = value
        
        # Evict LRU if over capacity
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)


# Test cases
if __name__ == "__main__":
    print("Testing LRUCache...")
    
    # Test 1: Basic operations
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Test 1a failed"
    print("✓ Test 1a: Basic get works")
    
    # Test 2: Eviction (3 evicts key 2, leaving 1 and 3)
    cache.put(3, 3)  # Evicts key 2
    assert cache.get(2) == -1, "Test 2a failed - key 2 should be evicted"
    assert cache.get(3) == 3, "Test 2b failed"
    print("✓ Test 2: LRU eviction works")
    
    # Test 3: Access makes key recently used
    cache.put(4, 4)  # Evicts key 1 (LRU), leaving 3 and 4
    assert cache.get(1) == -1, "Test 3a failed - key 1 should be evicted"
    assert cache.get(3) == 3, "Test 3b failed"
    assert cache.get(4) == 4, "Test 3c failed"
    print("✓ Test 3: Access updates recency correctly")
    
    # Test 4: Update existing key
    cache.put(3, 30)
    assert cache.get(3) == 30, "Test 4 failed - update should change value"
    print("✓ Test 4: Update existing key works")
    
    # Test 5: Edge case - capacity 1
    cache1 = LRUCache(1)
    cache1.put(1, 1)
    cache1.put(2, 2)
    assert cache1.get(1) == -1, "Test 5a failed"
    assert cache1.get(2) == 2, "Test 5b failed"
    print("✓ Test 5: Capacity 1 edge case works")
    
    # Test 6: Non-existent key
    assert cache.get(999) == -1, "Test 6 failed"
    print("✓ Test 6: Non-existent key returns -1")
    
    print("\nAll tests passed! ✓")
