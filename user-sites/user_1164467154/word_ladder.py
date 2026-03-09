"""
Word Ladder - Shortest Transformation Sequence Length
LeetCode 127 style implementation using BFS.
"""
from collections import deque
from typing import List


def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Returns the length of the shortest transformation sequence from beginWord to endWord.
    Only one letter can be changed at a time, and each intermediate word must exist in wordList.
    Returns 0 if no such sequence exists.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    # Edge case: beginWord == endWord
    if beginWord == endWord:
        return 1
    
    # BFS: queue of (current_word, level)
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, level = queue.popleft()
        
        # Try changing each character position to a-z
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = word[:i] + c + word[i+1:]
                
                if next_word == endWord:
                    return level + 1
                
                if next_word in wordSet and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, level + 1))
    
    return 0


# Test cases
if __name__ == "__main__":
    # Example 1: Standard case
    begin1, end1 = "hit", "cog"
    wordList1 = ["hot", "dot", "dog", "lot", "log", "cog"]
    result1 = ladder_length(begin1, end1, wordList1)
    print(f"Test 1: {begin1} -> {end1}, wordList={wordList1}")
    print(f"Result: {result1}")  # Expected: 5 (hit -> hot -> dot -> dog -> cog)
    assert result1 == 5, f"Expected 5, got {result1}"
    
    # Example 2: No valid path
    begin2, end2 = "hit", "cog"
    wordList2 = ["hot", "dot", "dog", "lot", "log"]
    result2 = ladder_length(begin2, end2, wordList2)
    print(f"\nTest 2: {begin2} -> {end2}, wordList={wordList2}")
    print(f"Result: {result2}")  # Expected: 0 (cog not in wordList)
    assert result2 == 0, f"Expected 0, got {result2}"
    
    # Example 3: Direct one-step transformation
    begin3, end3 = "hot", "dog"
    wordList3 = ["hot", "dog", "dot"]
    result3 = ladder_length(begin3, end3, wordList3)
    print(f"\nTest 3: {begin3} -> {end3}, wordList={wordList3}")
    print(f"Result: {result3}")  # Expected: 3 (hot -> dot -> dog)
    assert result3 == 3, f"Expected 3, got {result3}"
    
    # Example 4: Same word (edge case)
    result4 = ladder_length("same", "same", ["same"])
    print(f"\nTest 4: same -> same")
    print(f"Result: {result4}")  # Expected: 1 (already at target)
    assert result4 == 1, f"Expected 1, got {result4}"
    
    print("\n✓ All tests passed!")
