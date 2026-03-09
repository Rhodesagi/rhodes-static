"""
LRU Cache implementation with O(1) get and put operations.

Uses a hash map for key lookup and a doubly linked list to track usage order.
"""


class Node:
    """Doubly linked list node."""
    __slots__ = ('key', 'val', 'prev', 'next')
    
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """
    Least Recently Used Cache with O(1) get and put.
    
    Args:
        capacity: Maximum number of items to store.
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail for O(1) operations without edge cases
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
        self.size = 0
    
    def _remove(self, node: Node) -> None:
        """Remove node from linked list."""
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
        """Remove and return node before tail (least recently used)."""
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
        If at capacity, evicts least recently used item.
        
        Time: O(1)
        """
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_head(node)
        else:
            # Insert new
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_head(new_node)
            self.size += 1
            
            # Evict if over capacity
            if self.size > self.capacity:
                tail_node = self._pop_tail()
                del self.cache[tail_node.key]
                self.size -= 1


# Verification
if __name__ == "__main__":
    # LeetCode 146 test case
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    assert cache.get(1) == 1, "get(1) should return 1"
    cache.put(3, 3)  # evicts key 2
    assert cache.get(2) == -1, "get(2) should return -1 (evicted)"
    cache.put(4, 4)  # evicts key 1
    assert cache.get(1) == -1, "get(1) should return -1 (evicted)"
    assert cache.get(3) == 3, "get(3) should return 3"
    assert cache.get(4) == 4, "get(4) should return 4"
    
    # Update test
    cache2 = LRUCache(2)
    cache2.put(1, 1)
    cache2.put(1, 10)  # update
    assert cache2.get(1) == 10, "update should change value"
    
    print("All tests passed.")
