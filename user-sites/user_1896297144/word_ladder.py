"""
Word Ladder (LeetCode 127)

Returns the length of the shortest transformation sequence from beginWord to endWord,
such that only one letter can be changed at a time, and each transformed word must
exist in wordList. Return 0 if no such sequence exists.
"""

from collections import defaultdict, deque
from typing import List


def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Find the shortest word ladder path length using BFS.
    
    Args:
        beginWord: Starting word
        endWord: Target word
        wordList: List of valid intermediate words
        
    Returns:
        Length of shortest transformation sequence, or 0 if impossible
        
    Time: O(N * M^2) where N = len(wordList), M = len(word)
    Space: O(N * M) for pattern map and visited set
    """
    if endWord not in wordList:
        return 0
    
    wordSet = set(wordList)
    if beginWord not in wordSet:
        wordSet.add(beginWord)
    
    # Build pattern map: "h*t" -> [hot, hat, hit]
    pattern_map = defaultdict(list)
    word_length = len(beginWord)
    
    for word in wordSet:
        for i in range(word_length):
            pattern = word[:i] + '*' + word[i+1:]
            pattern_map[pattern].append(word)
    
    # BFS
    queue = deque([(beginWord, 1)])  # (current_word, path_length)
    visited = {beginWord}
    
    while queue:
        current, length = queue.popleft()
        
        if current == endWord:
            return length
        
        # Generate all one-letter-different neighbors
        for i in range(word_length):
            pattern = current[:i] + '*' + current[i+1:]
            for neighbor in pattern_map[pattern]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, length + 1))
    
    return 0


# ========== TEST CASES ==========

if __name__ == "__main__":
    # Test 1: Standard case
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"]) == 5
    # hit -> hot -> dot -> dog -> cog
    
    # Test 2: No valid path
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log"]) == 0
    # "cog" not in wordList
    
    # Test 3: Single step
    assert ladder_length("a", "b", ["b"]) == 2
    # a -> b
    
    # Test 4: Same word (edge case)
    assert ladder_length("same", "same", ["same"]) == 1
    
    # Test 5: Longer path
    assert ladder_length("red", "tax", ["ted","tex","red","tax","tad","den","rex","pee"]) == 4
    # red -> ted -> tad -> tax (or red -> rex -> tex -> tax)
    
    # Test 6: Empty wordList
    assert ladder_length("start", "end", []) == 0
    
    # Test 7: beginWord needs to be added to pattern map
    assert ladder_length("lost", "cost", ["most","fost","cost","host"]) == 2
    # lost -> cost
    
    print("All tests passed!")
