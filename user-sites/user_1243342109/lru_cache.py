"""LRU Cache implementation with O(1) get/put operations."""

from collections import OrderedDict


class LRUCache:
    """Least Recently Used cache with O(1) operations."""
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
    
    def get(self, key: int) -> int:
        """Return value if key exists, -1 otherwise."""
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        """Insert or update key with value. Evict LRU if over capacity."""
        if key in self.cache:
            # Update value and refresh recency
            self.cache[key] = value
            self.cache.move_to_end(key)
            return
        
        if self.capacity <= 0:
            return
        
        # Add new key
        self.cache[key] = value
        
        # Evict if over capacity
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)


if __name__ == "__main__":
    # Test cases
    print("Test 1: Basic operations")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    print(f"get(1) = {cache.get(1)}")  # Expected: 1
    cache.put(3, 3)  # Evicts key 2
    print(f"get(2) = {cache.get(2)}")  # Expected: -1
    cache.put(4, 4)  # Evicts key 1
    print(f"get(1) = {cache.get(1)}")  # Expected: -1
    print(f"get(3) = {cache.get(3)}")  # Expected: 3
    print(f"get(4) = {cache.get(4)}")  # Expected: 4
    
    print("\nTest 2: Update existing key refreshes recency")
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(2, 2)
    cache2.put(1, 10)  # Update key 1, makes it most recent
    cache2.put(3, 3)   # Should evict key 2, not key 1
    print(f"get(1) = {cache2.get(1)}")  # Expected: 10
    print(f"get(2) = {cache2.get(2)}")  # Expected: -1
    print(f"get(3) = {cache2.get(3)}")  # Expected: 3
    
    print("\nTest 3: Zero capacity")
    cache3 = LRUCache(0)
    cache3.put(1, 1)
    print(f"get(1) = {cache3.get(1)}")  # Expected: -1
    
    print("\nAll tests completed.")
