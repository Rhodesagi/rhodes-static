from collections import OrderedDict
from typing import Optional

class LRUCache:
    """
    Least Recently Used (LRU) Cache with O(1) get and put operations.
    
    Uses OrderedDict to maintain access order:
    - Most recently used items at the end (right side)
    - Least recently used items at the front (left side)
    """
    
    def __init__(self, capacity: int):
        if capacity < 0:
            raise ValueError("Capacity must be non-negative")
        self.capacity: int = capacity
        self.cache: OrderedDict[int, int] = OrderedDict()
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found. O(1)"""
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        """Insert or update key-value pair. O(1)"""
        if key in self.cache:
            # Update existing: refresh position
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            # Insert new
            if len(self.cache) >= self.capacity:
                # Evict LRU (leftmost item)
                if self.capacity > 0:
                    self.cache.popitem(last=False)
            if self.capacity > 0:
                self.cache[key] = value


# === TESTS ===
if __name__ == "__main__":
    print("Testing LRU Cache...")
    
    # Test 1: Basic operations
    cache = LRUCache(2)
    cache.put(1, 10)
    cache.put(2, 20)
    assert cache.get(1) == 10, "Should return 10"
    
    # Test 2: Eviction
    cache.put(3, 30)  # Evicts key 2 (LRU)
    assert cache.get(2) == -1, "Key 2 should be evicted"
    assert cache.get(3) == 30, "Key 3 should exist"
    
    # Test 3: Access refreshes position
    cache.put(4, 40)  # Evicts key 1 (LRU, since 3 was accessed)
    assert cache.get(1) == -1, "Key 1 should be evicted"
    assert cache.get(3) == 30, "Key 3 should still exist"
    
    # Test 4: Update refreshes position
    cache.put(3, 300)  # Update key 3, becomes MRU
    cache.put(5, 50)   # Evicts key 4
    assert cache.get(3) == 300, "Key 3 should have new value"
    assert cache.get(4) == -1, "Key 4 should be evicted"
    
    # Test 5: Zero capacity
    zero_cache = LRUCache(0)
    zero_cache.put(1, 100)
    assert zero_cache.get(1) == -1, "Zero capacity cache should not store"
    
    print("All tests passed!")
