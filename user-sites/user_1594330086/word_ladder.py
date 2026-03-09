from collections import deque
from typing import List

def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Return the length of the shortest word ladder from beginWord to endWord.
    Each step changes exactly one letter. All intermediate words must be in wordList.
    Return 0 if no path exists.
    """
    word_set = set(wordList)
    
    if endWord not in word_set:
        return 0
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        current, length = queue.popleft()
        
        if current == endWord:
            return length
        
        # Generate all possible one-letter variations
        for i in range(len(current)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == current[i]:
                    continue
                neighbor = current[:i] + c + current[i+1:]
                
                if neighbor in word_set and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, length + 1))
    
    return 0


# Test cases
if __name__ == "__main__":
    # Example 1: hit -> cog via hot->dot->dog or hot->lot->log
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"]) == 5
    
    # Example 2: endWord not in list
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log"]) == 0
    
    # Single step
    assert ladder_length("a", "b", ["b"]) == 2
    
    # No path possible
    assert ladder_length("abc", "def", ["abf", "aef"]) == 0
    
    # Same word (edge case, though constraints usually forbid)
    assert ladder_length("same", "same", ["same"]) == 1
    
    # Empty list
    assert ladder_length("start", "end", []) == 0
    
    print("All tests passed!")
