class Node:
    """Doubly-linked list node."""
    def __init__(self, key=None, val=None):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    """LRU Cache with O(1) get and put operations."""
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head (MRU) and tail (LRU)
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
        """Add node right after head (MRU position)."""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node
    
    def _move_to_front(self, node: Node) -> None:
        """Move existing node to front (MRU)."""
        self._remove(node)
        self._add_to_front(node)
    
    def _pop_tail(self) -> Node:
        """Remove and return LRU node (before tail)."""
        lru_node = self.tail.prev
        self._remove(lru_node)
        return lru_node
    
    def get(self, key: int) -> int:
        """Get value by key. Returns -1 if key not found."""
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_front(node)
        return node.val
    
    def put(self, key: int, val: int) -> None:
        """Insert or update key-value pair."""
        if key in self.cache:
            # Update existing
            node = self.cache[key]
            node.val = val
            self._move_to_front(node)
        else:
            # Insert new
            new_node = Node(key, val)
            self.cache[key] = new_node
            self._add_to_front(new_node)
            
            if len(self.cache) > self.capacity:
                # Evict LRU
                lru_node = self._pop_tail()
                del self.cache[lru_node.key]
