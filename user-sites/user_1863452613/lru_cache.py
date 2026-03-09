"""
LRU Cache Implementation
O(1) get and put operations using hash map + doubly-linked list.
"""


class Node:
    """Doubly-linked list node."""
    __slots__ = ['key', 'val', 'prev', 'next']
    
    def __init__(self, key: int, val: int):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) operations.
    
    Uses a hash map for key lookup and a doubly-linked list
    to maintain usage order (most recent at head, least at tail).
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for easier edge case handling
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _add_to_head(self, node: Node) -> None:
        """Add node right after dummy head."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _remove_node(self, node: Node) -> None:
        """Remove node from its current position."""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node
    
    def _move_to_head(self, node: Node) -> None:
        """Move existing node to head (most recent)."""
        self._remove_node(node)
        self._add_to_head(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return the least recently used node (before dummy tail)."""
        lru = self.tail.prev
        self._remove_node(lru)
        return lru
    
    def get(self, key: int) -> int:
        """
        Get value by key. Returns -1 if key not found.
        Accessing a key makes it most recently used.
        """
        if key not in self.cache:
            return -1
        
        node = self.cache[key]
        self._move_to_head(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """
        Insert or update key-value pair.
        If at capacity, evicts least recently used item.
        """
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Create new node
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            
            # Check capacity
            if len(self.cache) > self.capacity:
                # Evict LRU
                lru = self._pop_tail()
                del self.cache[lru.key]


# Example usage and basic test
if __name__ == "__main__":
    cache = LRUCache(2)
    
    cache.put(1, 1)
    cache.put(2, 2)
    print(cache.get(1))       # returns 1
    cache.put(3, 3)           # evicts key 2
    print(cache.get(2))       # returns -1 (not found)
    cache.put(4, 4)           # evicts key 1
    print(cache.get(1))       # returns -1 (not found)
    print(cache.get(3))       # returns 3
    print(cache.get(4))       # returns 4
