from typing import Optional, Generic, TypeVar

T = TypeVar('T')
V = TypeVar('V')

class _Node(Generic[T, V]):
    """Doubly linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key: T, val: V):
        self.key = key
        self.val = val
        self.prev: Optional['_Node'] = None
        self.next: Optional['_Node'] = None


class LRUCache(Generic[T, V]):
    """
    Least Recently Used Cache with O(1) get and put operations.
    
    Uses hash map + doubly linked list.
    """
    
    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("Capacity must be positive")
        self._capacity = capacity
        self._cache: dict[T, _Node[T, V]] = {}
        # Dummy head and tail for O(1) operations without edge cases
        self._head = _Node(None, None)  # type: ignore
        self._tail = _Node(None, None)  # type: ignore
        self._head.next = self._tail
        self._tail.prev = self._head
    
    def _remove(self, node: _Node[T, V]) -> None:
        """Remove node from linked list."""
        node.prev.next = node.next  # type: ignore
        node.next.prev = node.prev  # type: ignore
    
    def _add_to_front(self, node: _Node[T, V]) -> None:
        """Add node right after head (most recent)."""
        node.prev = self._head
        node.next = self._head.next
        self._head.next.prev = node  # type: ignore
        self._head.next = node
    
    def _move_to_front(self, node: _Node[T, V]) -> None:
        """Move existing node to front."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_tail(self) -> _Node[T, V]:
        """Remove and return least recently used node (before tail)."""
        node = self._tail.prev
        self._remove(node)  # type: ignore
        return node  # type: ignore
    
    def get(self, key: T) -> Optional[V]:
        """Get value by key. Returns None if not found. Updates recency."""
        node = self._cache.get(key)
        if node is None:
            return None
        self._move_to_front(node)
        return node.val
    
    def put(self, key: T, val: V) -> None:
        """Insert or update key-value pair. Evicts LRU if over capacity."""
        node = self._cache.get(key)
        if node:
            # Update existing
            node.val = val
            self._move_to_front(node)
        else:
            # Create new node
            new_node = _Node(key, val)
            self._cache[key] = new_node
            self._add_to_front(new_node)
            
            if len(self._cache) > self._capacity:
                # Evict LRU
                lru = self._pop_tail()
                del self._cache[lru.key]  # type: ignore
    
    def __len__(self) -> int:
        return len(self._cache)
    
    def __contains__(self, key: T) -> bool:
        return key in self._cache


# === VERIFICATION ===
if __name__ == "__main__":
    cache = LRUCache(2)
    
    # Test basic operations
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "Should get key 1"
    
    # Key 1 is now most recent, key 2 is LRU
    # Adding key 3 should evict key 2
    cache.put(3, 3)
    assert cache.get(2) is None, "Key 2 should be evicted"
    assert cache.get(3) == 3, "Should get key 3"
    
    # Access key 1, making key 3 LRU
    cache.get(1)
    cache.put(4, 4)  # Should evict key 3
    assert cache.get(3) is None, "Key 3 should be evicted"
    assert cache.get(1) == 1, "Key 1 should still exist"
    assert cache.get(4) == 4, "Key 4 should exist"
    
    # Test update
    cache.put(1, 100)
    assert cache.get(1) == 100, "Value should be updated"
    
    # Test capacity 1 edge case
    cache1 = LRUCache(1)
    cache1.put(1, 1)
    cache1.put(2, 2)
    assert cache1.get(1) is None, "Key 1 should be evicted with capacity 1"
    assert cache1.get(2) == 2, "Key 2 should exist"
    
    print("All tests passed ✓")
