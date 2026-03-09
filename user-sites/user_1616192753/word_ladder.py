from collections import deque, defaultdict

def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Return length of shortest transformation sequence from beginWord to endWord.
    Only one letter can change at a time. Each word must exist in wordList.
    Return 0 if no valid sequence.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    # Build pattern map: "h*t" -> ["hot", "hit", "hut"]
    pattern_map = defaultdict(list)
    for word in wordSet:
        for i in range(len(word)):
            pattern = word[:i] + '*' + word[i+1:]
            pattern_map[pattern].append(word)
    
    # BFS
    queue = deque([(beginWord, 1)])  # (current_word, path_length)
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        
        if word == endWord:
            return length
        
        # Generate all neighbors via patterns
        for i in range(len(word)):
            pattern = word[:i] + '*' + word[i+1:]
            for neighbor in pattern_map[pattern]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, length + 1))
    
    return 0  # No valid sequence found


# Tests
if __name__ == "__main__":
    # Example 1: Standard case
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot","dot","dog","lot","log","cog"]
    result = ladder_length(beginWord, endWord, wordList)
    print(f"Test 1: {beginWord} -> {endWord}")
    print(f"Word list: {wordList}")
    print(f"Result: {result}")  # Expected: 5 (hit -> hot -> dot -> dog -> cog)
    print()
    
    # Example 2: No valid sequence
    beginWord2 = "hit"
    endWord2 = "cog"
    wordList2 = ["hot","dot","dog","lot","log"]
    result2 = ladder_length(beginWord2, endWord2, wordList2)
    print(f"Test 2: {beginWord2} -> {endWord2}")
    print(f"Word list: {wordList2}")
    print(f"Result: {result2}")  # Expected: 0 (cog not in wordList)
    print()
    
    # Example 3: Single transformation
    beginWord3 = "hot"
    endWord3 = "dot"
    wordList3 = ["hot","dot","dog"]
    result3 = ladder_length(beginWord3, endWord3, wordList3)
    print(f"Test 3: {beginWord3} -> {endWord3}")
    print(f"Result: {result3}")  # Expected: 2 (hot -> dot)
    print()
    
    # Example 4: beginWord not in wordList
    beginWord4 = "aaa"
    endWord4 = "bbb"
    wordList4 = ["aab", "abb", "bbb"]
    result4 = ladder_length(beginWord4, endWord4, wordList4)
    print(f"Test 4: {beginWord4} -> {endWord4}")
    print(f"Word list: {wordList4}")
    print(f"Result: {result4}")  # Expected: 4 (aaa -> aab -> abb -> bbb)
    print()
    
    # All assertions
    assert result == 5, f"Test 1 failed: expected 5, got {result}"
    assert result2 == 0, f"Test 2 failed: expected 0, got {result2}"
    assert result3 == 2, f"Test 3 failed: expected 2, got {result3}"
    assert result4 == 4, f"Test 4 failed: expected 4, got {result4}"
    print("All tests passed!")
