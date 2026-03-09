"""
LRU Cache Implementation - O(1) get and put operations.
Uses hash map + doubly-linked list.
"""


class Node:
    """Doubly-linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) operations.
    
    Methods:
        __init__(capacity): Initialize cache with fixed capacity.
        get(key): Return value or -1. Marks key as recently used.
        put(key, val): Insert or update. Evicts LRU if at capacity.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head (most recent) and tail (least recent)
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
        """Add node right after head (most recent)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: Node) -> None:
        """Move existing node to front."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return node before tail (LRU)."""
        node = self.tail.prev
        self._remove(node)
        return node
    
    def get(self, key: int) -> int:
        """
        Return value for key, or -1 if not found.
        Accessing a key marks it as recently used.
        Time: O(1)
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key->val.
        If at capacity, evicts least recently used item.
        Time: O(1)
        """
        if self.capacity <= 0:
            return
        
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


# ============ TESTS ============

def test_basic_operations():
    """Test basic get/put."""
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return 1"
    assert cache.get(2) == 2, "Should return 2"
    print("✓ Basic operations pass")


def test_eviction():
    """Test LRU eviction when capacity exceeded."""
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(3, 3)  # Evicts key 1 (LRU)
    assert cache.get(1) == -1, "Key 1 should be evicted"
    assert cache.get(2) == 2, "Key 2 should still exist"
    assert cache.get(3) == 3, "Key 3 should exist"
    print("✓ Eviction passes")


def test_access_updates_recency():
    """Test that get() updates recency."""
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.get(1)  # Key 1 becomes most recent
    cache.put(3, 3)  # Should evict key 2, not key 1
    assert cache.get(1) == 1, "Key 1 should still exist"
    assert cache.get(2) == -1, "Key 2 should be evicted"
    assert cache.get(3) == 3, "Key 3 should exist"
    print("✓ Access updates recency passes")


def test_update_value():
    """Test updating existing key refreshes position."""
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(1, 10)  # Update key 1, should become most recent
    cache.put(3, 3)   # Should evict key 2
    assert cache.get(1) == 10, "Key 1 should have updated value"
    assert cache.get(2) == -1, "Key 2 should be evicted"
    print("✓ Update value passes")


def test_capacity_zero():
    """Test cache with capacity 0."""
    cache = LRUCache(0)
    cache.put(1, 1)
    assert cache.get(1) == -1, "Should not store anything"
    print("✓ Capacity zero passes")


def test_single_capacity():
    """Test cache with capacity 1."""
    cache = LRUCache(1)
    cache.put(1, 1)
    cache.put(2, 2)  # Evicts 1
    assert cache.get(1) == -1
    assert cache.get(2) == 2
    print("✓ Single capacity passes")


def test_leetcode_example():
    """Test the classic LeetCode example."""
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1    # returns 1
    cache.put(3, 3)             # evicts key 2
    assert cache.get(2) == -1   # returns -1 (not found)
    cache.put(4, 4)             # evicts key 1
    assert cache.get(1) == -1   # returns -1 (not found)
    assert cache.get(3) == 3    # returns 3
    assert cache.get(4) == 4    # returns 4
    print("✓ LeetCode example passes")


def run_all_tests():
    """Run all test cases."""
    print("Running LRUCache tests...\n")
    test_basic_operations()
    test_eviction()
    test_access_updates_recency()
    test_update_value()
    test_capacity_zero()
    test_single_capacity()
    test_leetcode_example()
    print("\nAll tests passed!")


if __name__ == "__main__":
    run_all_tests()
