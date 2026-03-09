"""LRU Cache implementation with O(1) get and put operations."""


class Node:
    """Doubly linked list node for LRU tracking."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put operations.
    
    Uses a hash map (dict) for O(1) key lookup and a doubly linked list
    for O(1) move-to-front and eviction operations.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for easier edge case handling
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
        """Add node right after head (most recent)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head (mark as recently used)."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return the least recently used node (before tail)."""
        node = self.tail.prev
        self._remove(node)
        return node
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Accessing a key marks it as recently used.
        Time: O(1)
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_head(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        If key exists, updates value and marks as recently used.
        If at capacity, evicts least recently used item.
        Time: O(1)
        """
        if self.capacity == 0:
            return
        
        if key in self.cache:
            # Update existing key
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new key
            if len(self.cache) >= self.capacity:
                # Evict least recently used
                lru = self._pop_tail()
                del self.cache[lru.key]
            
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)


# === TESTS ===
if __name__ == "__main__":
    # Test 1: Basic operations
    print("Test 1: Basic get/put")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should return 1"
    print(f"  get(1) = {cache.get(1)}")
    
    # Test 2: Eviction
    print("\nTest 2: LRU eviction")
    cache.put(3, 3)  # Evicts key 2
    assert cache.get(2) == -1, "Should return -1 (evicted)"
    print(f"  get(2) after put(3,3) = {cache.get(2)} (evicted)")
    assert cache.get(3) == 3, "Should return 3"
    print(f"  get(3) = {cache.get(3)}")
    
    # Test 3: Update existing key
    print("\nTest 3: Update existing key")
    cache.put(4, 4)  # Evicts key 1
    assert cache.get(1) == -1, "Should return -1 (evicted)"
    print(f"  get(1) after put(4,4) = {cache.get(1)} (evicted)")
    assert cache.get(3) == 3, "Should return 3"
    print(f"  get(3) = {cache.get(3)}")
    assert cache.get(4) == 4, "Should return 4"
    print(f"  get(4) = {cache.get(4)}")
    
    # Test 4: Access updates recency
    print("\nTest 4: Access updates recency")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.get(1)  # 1 is now most recent
    cache.put(3, 3)  # Should evict 2, not 1
    assert cache.get(1) == 1, "Should return 1 (not evicted)"
    print(f"  get(1) after access + put(3,3) = {cache.get(1)} (not evicted)")
    assert cache.get(2) == -1, "Should return -1 (evicted)"
    print(f"  get(2) = {cache.get(2)} (evicted)")
    
    # Test 5: Update value marks as recent
    print("\nTest 5: Update marks as recent")
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(1, 10)  # Update 1, marks as recent
    cache.put(3, 3)  # Should evict 2
    assert cache.get(1) == 10, "Should return updated value 10"
    print(f"  get(1) after update = {cache.get(1)}")
    assert cache.get(2) == -1, "Should return -1 (evicted)"
    print(f"  get(2) = {cache.get(2)} (evicted)")
    
    # Test 6: Capacity 0
    print("\nTest 6: Zero capacity")
    cache = LRUCache(0)
    cache.put(1, 1)
    assert cache.get(1) == -1, "Should return -1 (capacity 0)"
    print(f"  get(1) with capacity 0 = {cache.get(1)}")
    
    # Test 7: Single capacity
    print("\nTest 7: Single capacity")
    cache = LRUCache(1)
    cache.put(1, 1)
    cache.put(2, 2)  # Evicts 1
    assert cache.get(1) == -1, "Should return -1"
    print(f"  get(1) after eviction = {cache.get(1)}")
    assert cache.get(2) == 2, "Should return 2"
    print(f"  get(2) = {cache.get(2)}")
    
    print("\n" + "="*40)
    print("All tests passed!")
