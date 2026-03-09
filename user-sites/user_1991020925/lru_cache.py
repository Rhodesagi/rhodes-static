"""
LRU Cache implementations with O(1) get and put operations.

Two implementations provided:
1. OrderedDictLRU - Clean, production-ready using Python's OrderedDict
2. LRUCache - Manual doubly-linked list + hash map (interview/learning version)
"""

from collections import OrderedDict
from typing import Optional, Generic, TypeVar

K = TypeVar('K')
V = TypeVar('V')


class OrderedDictLRU(Generic[K, V]):
    """
    LRU Cache using OrderedDict.
    O(1) get/put via move_to_end() and popitem(last=False).
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict[K, V] = OrderedDict()
    
    def get(self, key: K) -> Optional[V]:
        """Get value by key. Returns None if key not found."""
        if key not in self.cache:
            return None
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: K, value: V) -> None:
        """Insert or update key-value pair."""
        if key in self.cache:
            # Update existing and move to end
            self.cache[key] = value
            self.cache.move_to_end(key)
        else:
            # Insert new
            self.cache[key] = value
            # Evict LRU if over capacity
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)


class Node:
    """Doubly linked list node for LRUCache."""
    __slots__ = ['key', 'value', 'prev', 'next']
    
    def __init__(self, key: int = 0, value: int = 0):
        self.key = key
        self.value = value
        self.prev: Optional['Node'] = None
        self.next: Optional['Node'] = None


class LRUCache:
    """
    LRU Cache using hash map + doubly linked list.
    O(1) get/put without relying on OrderedDict.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: dict[int, Node] = {}
        
        # Dummy head and tail for easier edge case handling
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: Node) -> None:
        """Remove node from doubly linked list."""
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
        """Remove and return the LRU node (before tail)."""
        node = self.tail.prev
        self._remove(node)
        return node
    
    def get(self, key: int) -> int:
        """
        Get value by key.
        Returns -1 if key not found (LeetCode convention).
        """
        node = self.cache.get(key)
        if not node:
            return -1
        self._move_to_head(node)
        return node.value
    
    def put(self, key: int, value: int) -> None:
        """Insert or update key-value pair."""
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.value = value
            self._move_to_head(node)
        else:
            # Create new node
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            # Evict if over capacity
            if len(self.cache) > self.capacity:
                lru_node = self._pop_tail()
                del self.cache[lru_node.key]


def test_lru_cache():
    """Comprehensive tests for LRUCache."""
    print("Testing LRUCache (manual doubly-linked list version)...")
    print("=" * 60)
    
    # Test 1: Basic operations
    print("\nTest 1: Basic get/put")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return 1"
    print("✓ get(1) = 1")
    
    # Test 2: Eviction
    print("\nTest 2: Eviction when over capacity")
    cache.put(3, 3)  # Should evict key 2 (LRU)
    assert cache.get(2) == -1, "Key 2 should be evicted"
    print("✓ get(2) = -1 (evicted)")
    assert cache.get(3) == 3, "Should return 3"
    print("✓ get(3) = 3")
    
    # Test 3: Update existing key
    print("\nTest 3: Update existing key")
    cache.put(1, 10)  # Update key 1, make it MRU
    assert cache.get(1) == 10, "Should return updated value 10"
    print("✓ get(1) = 10 (updated)")
    
    # Test 4: Order verification
    print("\nTest 4: LRU order verification")
    cache = LRUCache(3)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(3, 3)
    cache.get(1)  # Make 1 MRU, order: 2,3,1
    cache.put(4, 4)  # Evict 2
    assert cache.get(2) == -1, "Key 2 should be evicted"
    print("✓ get(2) = -1 (evicted after access pattern)")
    assert cache.get(1) == 1, "Key 1 should exist"
    print("✓ get(1) = 1 (still exists)")
    
    # Test 5: Edge cases
    print("\nTest 5: Edge cases")
    cache = LRUCache(1)
    cache.put(1, 1)
    cache.put(2, 2)  # Evict 1
    assert cache.get(1) == -1, "Single capacity: old key evicted"
    print("✓ Capacity 1: old key evicted correctly")
    
    # Test 6: Put same key multiple times
    print("\nTest 6: Same key multiple puts")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(1, 2)
    cache.put(1, 3)
    assert cache.get(1) == 3, "Should return last value"
    print("✓ Multiple puts: get(1) = 3")
    
    # Test 7: Mixed operations
    print("\nTest 7: Mixed operations (LeetCode style)")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1
    cache.put(3, 3)
    assert cache.get(2) == -1
    cache.put(4, 4)
    assert cache.get(1) == -1
    assert cache.get(3) == 3
    assert cache.get(4) == 4
    print("✓ All mixed operations correct")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    
    # Demonstrate OrderedDict version
    print("\n\nOrderedDictLRU demonstration:")
    print("=" * 60)
    od_cache = OrderedDictLRU[int, int](2)
    od_cache.put(1, 10)
    od_cache.put(2, 20)
    print(f"get(1) = {od_cache.get(1)}")
    od_cache.put(3, 30)
    print(f"After adding 3, get(2) = {od_cache.get(2)} (evicted)")
    print(f"get(3) = {od_cache.get(3)}")
    print("✓ OrderedDictLRU working correctly")


if __name__ == "__main__":
    test_lru_cache()
