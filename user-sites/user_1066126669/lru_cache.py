class Node:
    """Doubly-linked list node for O(1) reordering."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used cache with O(1) get and put operations.
    
    Architecture:
    - Hash map (dict): key -> Node for O(1) lookup
    - Doubly-linked list: maintains access order, head = most recent, tail = least recent
    - Dummy head/tail nodes eliminate edge cases
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for O(1) operations without edge cases
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node: Node) -> None:
        """Remove node from linked list. O(1)."""
        prev, nxt = node.prev, node.next
        prev.next = nxt
        nxt.prev = prev
    
    def _add_to_head(self, node: Node) -> None:
        """Add node right after head (most recent). O(1)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head. O(1)."""
        self._remove(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return the least recently used node. O(1)."""
        res = self.tail.prev
        self._remove(res)
        return res
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Marks key as most recently used. O(1).
        """
        node = self.cache.get(key)
        if not node:
            return -1
        # Move to head to mark as recently used
        self._move_to_head(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        Evicts least recently used if at capacity. O(1).
        """
        if key in self.cache:
            # Update existing key
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new key
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            if len(self.cache) > self.capacity:
                # Evict LRU (tail)
                tail = self._pop_tail()
                del self.cache[tail.key]


# === Test harness ===
if __name__ == "__main__":
    cache = LRUCache(2)
    
    # Basic operations
    cache.put(1, 1)      # cache = {1:1}
    cache.put(2, 2)      # cache = {1:1, 2:2}
    assert cache.get(1) == 1   # returns 1, cache = {2:2, 1:1}
    
    cache.put(3, 3)      # evicts key 2, cache = {1:1, 3:3}
    assert cache.get(2) == -1  # returns -1 (not found)
    
    cache.put(4, 4)      # evicts key 1, cache = {3:3, 4:4}
    assert cache.get(1) == -1  # returns -1 (not found)
    assert cache.get(3) == 3   # returns 3, cache = {4:4, 3:3}
    assert cache.get(4) == 4   # returns 4, cache = {3:3, 4:4}
    
    # Update existing key
    cache.put(4, 40)     # update key 4, cache = {3:3, 4:40}
    assert cache.get(4) == 40
    
    # Edge case: capacity 0
    empty_cache = LRUCache(0)
    empty_cache.put(1, 1)
    assert empty_cache.get(1) == -1
    
    print("All tests passed.")
