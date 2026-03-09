"""
Word Ladder - Shortest transformation sequence length.
Each transformation changes exactly one letter.
All intermediate words must be in wordList.
"""

from collections import deque


def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Returns the length of the shortest word ladder from beginWord to endWord.
    Returns 0 if no transformation sequence exists.
    
    Each step changes exactly one letter. All intermediate words must be in wordList.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    queue = deque([(beginWord, 1)])  # (current_word, path_length)
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        
        if word == endWord:
            return length
        
        # Try changing each character position
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                    
                next_word = word[:i] + c + word[i+1:]
                
                if next_word in wordSet and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    return 0


# === TEST CASES ===
if __name__ == "__main__":
    # Example 1: Standard case
    begin1, end1 = "hit", "cog"
    wordList1 = ["hot", "dot", "dog", "lot", "log", "cog"]
    result1 = ladder_length(begin1, end1, wordList1)
    print(f"Test 1: {begin1} -> {end1}")
    print(f"  Word list: {wordList1}")
    print(f"  Result: {result1}")  # Expected: 5 (hit->hot->dot->dog->cog)
    assert result1 == 5, f"Expected 5, got {result1}"
    
    # Example 2: endWord not in wordList
    begin2, end2 = "hit", "cog"
    wordList2 = ["hot", "dot", "dog", "lot", "log"]
    result2 = ladder_length(begin2, end2, wordList2)
    print(f"\nTest 2: {begin2} -> {end2}")
    print(f"  Word list: {wordList2}")
    print(f"  Result: {result2}")  # Expected: 0
    assert result2 == 0, f"Expected 0, got {result2}"
    
    # Example 3: Direct neighbor
    begin3, end3 = "hot", "dot"
    wordList3 = ["hot", "dot", "dog"]
    result3 = ladder_length(begin3, end3, wordList3)
    print(f"\nTest 3: {begin3} -> {end3}")
    print(f"  Word list: {wordList3}")
    print(f"  Result: {result3}")  # Expected: 2
    assert result3 == 2, f"Expected 2, got {result3}"
    
    # Example 4: Single letter difference from beginWord
    begin4, end4 = "a", "c"
    wordList4 = ["a", "b", "c"]
    result4 = ladder_length(begin4, end4, wordList4)
    print(f"\nTest 4: {begin4} -> {end4}")
    print(f"  Word list: {wordList4}")
    print(f"  Result: {result4}")  # Expected: 2 (a->c, single change)
    assert result4 == 2, f"Expected 2, got {result4}"
    
    # Example 5: No path exists
    begin5, end5 = "hit", "cog"
    wordList5 = ["hot", "dot", "dog", "lot", "log"]  # cog missing
    result5 = ladder_length(begin5, end5, wordList5)
    print(f"\nTest 5: {begin5} -> {end5}")
    print(f"  Word list: {wordList5}")
    print(f"  Result: {result5}")  # Expected: 0
    assert result5 == 0, f"Expected 0, got {result5}"
    
    print("\n✅ All tests passed!")
