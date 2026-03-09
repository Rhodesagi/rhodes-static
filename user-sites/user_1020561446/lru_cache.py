class Node:
    """Doubly linked list node."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key: int, val: int):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    LRU Cache with O(1) get and put operations.
    Uses hash map + doubly linked list.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for easier list operations
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
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
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: Node) -> None:
        """Move existing node to front."""
        self._remove(node)
        self._add_to_front(node)
    
    def _evict_lru(self) -> None:
        """Remove least recently used node (before tail)."""
        lru_node = self.tail.prev
        if lru_node != self.head:  # Don't remove dummy head
            self._remove(lru_node)
            del self.cache[lru_node.key]
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks key as most recently used.
        Time: O(1)
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        Marks key as most recently used.
        Evicts LRU if over capacity.
        Time: O(1)
        """
        if self.capacity == 0:
            return
        
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_front(node)
        else:
            # Insert new
            if len(self.cache) >= self.capacity:
                self._evict_lru()
            
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_front(new_node)


# ===== COMPREHENSIVE TESTS =====
def test_basic_operations():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1
    cache.put(3, 3)  # evicts key 2
    assert cache.get(2) == -1
    assert cache.get(3) == 3
    print("✓ Basic operations")


def test_update_existing():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(1, 10)  # Update makes key 1 most recent
    cache.put(2, 2)   # Cache now full: [2, 1]
    result = cache.get(1)  # Access 1, makes it most recent: [1, 2]
    assert result == 10, f"Expected 10, got {result}"
    cache.put(3, 3)   # Evicts LRU (2), cache: [3, 1]
    assert cache.get(1) == 10  # 1 still there
    assert cache.get(2) == -1  # 2 was evicted
    print("✓ Update existing")


def test_lru_order():
    cache = LRUCache(3)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(3, 3)  # [3, 2, 1]
    cache.get(1)     # Access 1: [1, 3, 2]
    cache.put(4, 4)  # Evicts 2: [4, 1, 3]
    assert cache.get(2) == -1
    assert cache.get(1) == 1
    print("✓ LRU order")


def test_zero_capacity():
    cache = LRUCache(0)
    cache.put(1, 1)
    assert cache.get(1) == -1
    print("✓ Zero capacity")


def test_single_capacity():
    cache = LRUCache(1)
    cache.put(1, 1)
    assert cache.get(1) == 1
    cache.put(2, 2)  # Evicts 1
    assert cache.get(1) == -1
    assert cache.get(2) == 2
    print("✓ Single capacity")


def test_non_existent_key():
    cache = LRUCache(2)
    assert cache.get(999) == -1
    print("✓ Non-existent key")


def test_put_makes_most_recent():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)   # [2, 1]
    cache.put(1, 10)  # Update 1, now most recent: [1, 2]
    cache.put(3, 3)   # Evicts 2: [3, 1]
    assert cache.get(1) == 10
    assert cache.get(2) == -1
    print("✓ Put makes most recent")


def test_leetcode_example():
    """Standard LeetCode LRUCache test case."""
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
    print("✓ LeetCode example")


if __name__ == "__main__":
    test_basic_operations()
    test_update_existing()
    test_lru_order()
    test_zero_capacity()
    test_single_capacity()
    test_non_existent_key()
    test_put_makes_most_recent()
    test_leetcode_example()
    print("\n" + "="*40)
    print("All tests passed!")
    print("="*40)
