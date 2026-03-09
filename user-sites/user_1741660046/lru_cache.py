"""
LRU Cache Implementation
O(1) average time complexity for get and put operations.
"""

class Node:
    """Doubly linked list node."""
    __slots__ = ['key', 'value', 'prev', 'next']
    
    def __init__(self, key: int = 0, value: int = 0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used (LRU) Cache.
    
    Uses hash map + doubly linked list for O(1) operations.
    - Dictionary provides O(1) key lookup
    - Doubly linked list maintains access order (MRU at head, LRU at tail)
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for easier edge case handling
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found."""
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_front(node)
        return node.value
    
    def put(self, key: int, value: int) -> None:
        """Insert or update key-value pair."""
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.value = value
            self._move_to_front(node)
        else:
            # Insert new
            if len(self.cache) >= self.capacity:
                self._evict_lru()
            
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_to_front(new_node)
    
    def _add_to_front(self, node: Node) -> None:
        """Add node right after head (most recently used position)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _remove_node(self, node: Node) -> None:
        """Remove node from linked list."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _move_to_front(self, node: Node) -> None:
        """Move existing node to front (mark as recently used)."""
        self._remove_node(node)
        self._add_to_front(node)
    
    def _evict_lru(self) -> None:
        """Remove least recently used item (node before tail)."""
        lru_node = self.tail.prev
        if lru_node == self.head:
            return  # Cache is empty
        
        self._remove_node(lru_node)
        del self.cache[lru_node.key]


# === Test ===
if __name__ == "__main__":
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1    # returns 1
    cache.put(3, 3)              # evicts key 2
    assert cache.get(2) == -1   # returns -1 (not found)
    cache.put(4, 4)              # evicts key 1
    assert cache.get(1) == -1   # returns -1 (not found)
    assert cache.get(3) == 3    # returns 3
    assert cache.get(4) == 4    # returns 4
    
    print("All tests passed!")
