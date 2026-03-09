"""
Word Ladder: Shortest transformation sequence length.

Transform beginWord to endWord by changing one letter at a time,
with each intermediate word in wordList. Return the length of the
shortest sequence, or 0 if no valid sequence exists.
"""

from collections import deque


def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Return the length of the shortest word ladder from beginWord to endWord.
    
    Each transformation changes exactly one letter.
    All intermediate words must be in wordList.
    Returns 0 if no transformation sequence exists.
    
    Time Complexity: O(N * M^2) where N = len(wordList), M = word length
    Space Complexity: O(N * M)
    """
    # Edge case: same word
    if beginWord == endWord:
        return 1
    
    word_set = set(wordList)
    
    # Edge case: endWord not in dictionary
    if endWord not in word_set:
        return 0
    
    # BFS: queue stores (current_word, path_length)
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        current, length = queue.popleft()
        
        # Try changing each character position
        for i in range(len(current)):
            # Try all 26 letters
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == current[i]:
                    continue
                    
                # Form new word by changing char at position i
                next_word = current[:i] + c + current[i+1:]
                
                # Found the target
                if next_word == endWord:
                    return length + 1
                
                # Valid next step: in wordList and not visited
                if next_word in word_set and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    # Exhausted all possibilities
    return 0


# === Test Cases ===
if __name__ == "__main__":
    # Classic example: "hit" -> "cog"
    # hit -> hot -> dot -> dog -> cog (length 5)
    test1_begin = "hit"
    test1_end = "cog"
    test1_list = ["hot", "dot", "dog", "lot", "log", "cog"]
    result1 = ladder_length(test1_begin, test1_end, test1_list)
    print(f"Test 1: {test1_begin} -> {test1_end}")
    print(f"Word list: {test1_list}")
    print(f"Result: {result1} (expected: 5)")
    assert result1 == 5, f"Expected 5, got {result1}"
    
    # No valid transformation
    test2_begin = "hit"
    test2_end = "cog"
    test2_list = ["hot", "dot", "dog", "lot", "log"]  # no "cog"
    result2 = ladder_length(test2_begin, test2_end, test2_list)
    print(f"\nTest 2: {test2_begin} -> {test2_end}")
    print(f"Word list: {test2_list}")
    print(f"Result: {result2} (expected: 0)")
    assert result2 == 0, f"Expected 0, got {result2}"
    
    # Single step
    test3_begin = "a"
    test3_end = "c"
    test3_list = ["b", "c"]
    result3 = ladder_length(test3_begin, test3_end, test3_list)
    print(f"\nTest 3: {test3_begin} -> {test3_end}")
    print(f"Word list: {test3_list}")
    print(f"Result: {result3} (expected: 2)")
    assert result3 == 2, f"Expected 2, got {result3}"
    
    # Same word
    test4_begin = "same"
    test4_end = "same"
    test4_list = []
    result4 = ladder_length(test4_begin, test4_end, test4_list)
    print(f"\nTest 4: {test4_begin} -> {test4_end}")
    print(f"Result: {result4} (expected: 1)")
    assert result4 == 1, f"Expected 1, got {result4}"
    
    print("\n✓ All tests passed!")
