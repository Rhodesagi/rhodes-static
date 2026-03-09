from collections import deque, defaultdict
from typing import List

def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Returns the length of the shortest word ladder from beginWord to endWord.
    Each step changes exactly one letter. Returns 0 if no path exists.
    """
    if endWord not in wordList:
        return 0
    
    pattern_map = defaultdict(list)
    word_length = len(beginWord)
    
    for word in wordList:
        for i in range(word_length):
            pattern = word[:i] + '*' + word[i+1:]
            pattern_map[pattern].append(word)
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        current, length = queue.popleft()
        
        if current == endWord:
            return length
        
        for i in range(word_length):
            pattern = current[:i] + '*' + current[i+1:]
            for neighbor in pattern_map[pattern]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, length + 1))
            pattern_map[pattern] = []
    
    return 0


if __name__ == "__main__":
    # Standard case: 5 steps
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"]) == 5
    print("✓ hit -> cog = 5")
    
    # No valid path
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log"]) == 0
    print("✓ no path = 0")
    
    # Same word
    assert ladder_length("hit", "hit", ["hit"]) == 1
    print("✓ same word = 1")
    
    # One step
    assert ladder_length("hot", "dot", ["hot", "dot"]) == 2
    print("✓ one step = 2")
    
    # Empty list
    assert ladder_length("hit", "cog", []) == 0
    print("✓ empty list = 0")
    
    # Direct change (single letter diff)
    assert ladder_length("a", "c", ["a", "b", "c"]) == 2
    print("✓ direct single-letter change = 2")
    
    # Two-step path (ab -> ac -> ec, changing one letter at a time)
    assert ladder_length("ab", "ec", ["ab", "ac", "ec"]) == 3
    print("✓ two-step path = 3")
    
    # Longer word test
    assert ladder_length("sand", "acne", ["sand", "sane", "sine", "pine", "piny", "puny", "auny", "aune", "acne"]) == 9
    print("✓ longer path = 9")
    
    print("\n✅ All tests passed!")
