"""
Word Ladder - Shortest transformation sequence length.
Each step changes exactly one letter. All intermediate words must be in wordList.
Returns the number of words in the sequence, or 0 if no path exists.
"""

from collections import deque


def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Returns the length of the shortest word ladder from beginWord to endWord.
    Each transformation changes exactly one letter.
    All intermediate words must be in wordList.
    
    Time: O(N * M * 26) where N = len(wordList), M = len(word)
    Space: O(N) for the visited set and queue
    """
    wordSet = set(wordList)
    
    # Edge case: endWord must be in wordList
    if endWord not in wordSet:
        return 0
    
    # BFS: queue holds (current_word, path_length)
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        
        # Try changing each character position
        for i in range(len(word)):
            # Try all 26 letters
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                    
                # Form new word
                next_word = word[:i] + c + word[i+1:]
                
                # Found the target
                if next_word == endWord:
                    return length + 1
                
                # Valid next step
                if next_word in wordSet and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    # No path found
    return 0


# ===== Test Cases =====
if __name__ == "__main__":
    # Test 1: Classic LeetCode example
    begin1, end1 = "hit", "cog"
    wordList1 = ["hot", "dot", "dog", "lot", "log", "cog"]
    result1 = ladder_length(begin1, end1, wordList1)
    print(f"Test 1: {begin1} → {end1}")
    print(f"  wordList: {wordList1}")
    print(f"  Result: {result1} (expected: 5)")
    print(f"  ✓ PASS" if result1 == 5 else "  ✗ FAIL")
    print()
    
    # Test 2: No path exists
    begin2, end2 = "hit", "cog"
    wordList2 = ["hot", "dot", "dog", "lot", "log"]  # no "cog"
    result2 = ladder_length(begin2, end2, wordList2)
    print(f"Test 2: {begin2} → {end2} (no 'cog' in list)")
    print(f"  Result: {result2} (expected: 0)")
    print(f"  ✓ PASS" if result2 == 0 else "  ✗ FAIL")
    print()
    
    # Test 3: Direct neighbor
    begin3, end3 = "hot", "dot"
    wordList3 = ["dot"]
    result3 = ladder_length(begin3, end3, wordList3)
    print(f"Test 3: {begin3} → {end3} (direct neighbor)")
    print(f"  Result: {result3} (expected: 2)")
    print(f"  ✓ PASS" if result3 == 2 else "  ✗ FAIL")
    print()
    
    # Test 4: Longer path
    begin4, end4 = "a", "c"
    wordList4 = ["a", "b", "c"]
    result4 = ladder_length(begin4, end4, wordList4)
    print(f"Test 4: {begin4} → {end4}")
    print(f"  Result: {result4} (expected: 2, a→c or a→b→c)")
    print(f"  ✓ PASS" if result4 == 2 else "  ✗ FAIL")
    print()
    
    # Test 5: beginWord not in wordList, needs to reach it first
    begin5, end5 = "hit", "cog"
    wordList5 = ["hot", "dot", "dog", "lot", "log", "cog"]
    result5 = ladder_length(begin5, end5, wordList5)
    print(f"Test 5: {begin5} → {end5} (beginWord not in wordList)")
    print(f"  Result: {result5} (expected: 5: hit→hot→dot→dog→cog)")
    print(f"  ✓ PASS" if result5 == 5 else "  ✗ FAIL")
    print()
    
    print("All tests completed!")
