"""
LRU Cache Implementation
O(1) get and put operations using OrderedDict.
"""

from collections import OrderedDict


class LRUCache:
    """
    Least Recently Used Cache with O(1) operations.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict[int, int] = OrderedDict()
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Accessing a key marks it as recently used.
        """
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        """
        Insert or update key-value pair.
        If at capacity, evicts least recently used item.
        """
        if self.capacity <= 0:
            return
        
        if key in self.cache:
            # Update existing key
            self.cache[key] = value
            self.cache.move_to_end(key)
        else:
            # Insert new key
            if len(self.cache) >= self.capacity:
                # Evict LRU (first item)
                self.cache.popitem(last=False)
            self.cache[key] = value


# ===== TESTS =====

def test_basic_operations():
    """Test basic get and put operations."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return value for existing key"
    assert cache.get(2) == 2, "Should return value for existing key"
    assert cache.get(3) == -1, "Should return -1 for missing key"
    print("✓ Basic operations pass")


def test_lru_eviction():
    """Test that LRU item is evicted when capacity exceeded."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(3, 3)  # Evicts key 1
    
    assert cache.get(1) == -1, "LRU item should be evicted"
    assert cache.get(2) == 2, "Recent item should remain"
    assert cache.get(3) == 3, "New item should be present"
    print("✓ LRU eviction passes")


def test_get_updates_lru():
    """Test that get() marks item as recently used."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    cache.get(1)       # Access 1, making 2 the LRU
    cache.put(3, 3)    # Evicts key 2 (not key 1)
    
    assert cache.get(1) == 1, "Accessed item should not be evicted"
    assert cache.get(2) == -1, "Unaccessed item should be evicted"
    assert cache.get(3) == 3, "New item should be present"
    print("✓ Get updates LRU order passes")


def test_update_existing():
    """Test updating existing key preserves LRU order correctly."""
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(1, 10)   # Update key 1, should become most recent
    cache.put(3, 3)    # Evicts key 2
    
    assert cache.get(1) == 10, "Updated value should be stored"
    assert cache.get(2) == -1, "Key 2 should be evicted"
    assert cache.get(3) == 3, "Key 3 should be present"
    print("✓ Update existing key passes")


def test_capacity_zero():
    """Test cache with zero capacity."""
    cache = LRUCache(0)
    cache.put(1, 1)
    assert cache.get(1) == -1, "Zero capacity cache should not store anything"
    print("✓ Zero capacity passes")


def test_capacity_one():
    """Test cache with capacity of one."""
    cache = LRUCache(1)
    
    cache.put(1, 1)
    assert cache.get(1) == 1
    
    cache.put(2, 2)
    assert cache.get(1) == -1, "Should evict when at capacity"
    assert cache.get(2) == 2
    print("✓ Capacity one passes")


if __name__ == "__main__":
    test_basic_operations()
    test_lru_eviction()
    test_get_updates_lru()
    test_update_existing()
    test_capacity_zero()
    test_capacity_one()
    print("\nAll tests passed!")
