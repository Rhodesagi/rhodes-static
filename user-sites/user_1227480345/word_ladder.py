from collections import deque
from typing import List, Set

def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Return the length of the shortest word ladder from beginWord to endWord.
    Each transformation changes exactly one letter.
    Returns 0 if no valid sequence exists.
    """
    word_set: Set[str] = set(wordList)
    
    if endWord not in word_set:
        return 0
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        
        if word == endWord:
            return length
        
        # Generate all possible one-letter transformations
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = word[:i] + c + word[i+1:]
                
                if next_word in word_set and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    return 0


# === TEST CASES ===
if __name__ == "__main__":
    # LeetCode Example 1
    begin1, end1 = "hit", "cog"
    wordList1 = ["hot", "dot", "dog", "lot", "log", "cog"]
    result1 = ladder_length(begin1, end1, wordList1)
    print(f"Test 1: {result1} (expected: 5)")  # hit -> hot -> dot -> dog -> cog
    assert result1 == 5, f"Failed: got {result1}, expected 5"
    
    # LeetCode Example 2 - no valid path
    begin2, end2 = "hit", "cog"
    wordList2 = ["hot", "dot", "dog", "lot", "log"]
    result2 = ladder_length(begin2, end2, wordList2)
    print(f"Test 2: {result2} (expected: 0)")
    assert result2 == 0, f"Failed: got {result2}, expected 0"
    
    # Edge case: beginWord == endWord
    result3 = ladder_length("hot", "hot", ["hot"])
    print(f"Test 3: {result3} (expected: 1)")
    assert result3 == 1, f"Failed: got {result3}, expected 1"
    
    # Edge case: direct one-step transformation
    result4 = ladder_length("hot", "dot", ["dot"])
    print(f"Test 4: {result4} (expected: 2)")
    assert result4 == 2, f"Failed: got {result4}, expected 2"
    
    # Longer path
    begin5, end5 = "a", "c"
    wordList5 = ["a", "b", "c"]
    result5 = ladder_length(begin5, end5, wordList5)
    print(f"Test 5: {result5} (expected: 2)")  # a -> c (one letter change)
    
    print("\nAll tests passed!")
