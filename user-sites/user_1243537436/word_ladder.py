"""
Word Ladder - Shortest Transformation Sequence Length

Returns the length of the shortest transformation sequence from beginWord to endWord,
such that only one letter can be changed at a time and each intermediate word
must exist in wordList. Returns 0 if no such sequence exists.
"""

from collections import deque


def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Find shortest Word Ladder length using bidirectional BFS.
    
    Args:
        beginWord: Starting word
        endWord: Target word  
        wordList: List of valid intermediate words
        
    Returns:
        Length of shortest transformation sequence (including beginWord and endWord),
        or 0 if no valid sequence exists.
        
    Time Complexity: O(N * 26 * L) where N = len(wordList), L = word length
    Space Complexity: O(N) for the word set and BFS queues
    """
    # Edge case: same word - ladder of length 1
    if beginWord == endWord:
        return 1
    
    word_set = set(wordList)
    
    # Edge case: endWord not in wordList
    if endWord not in word_set:
        return 0
    
    # Add beginWord to word_set if not present (it's allowed as starting point)
    word_set.add(beginWord)
    
    # Bidirectional BFS initialization
    begin_visited = {beginWord: 1}
    end_visited = {endWord: 1}
    
    begin_queue = deque([(beginWord, 1)])
    end_queue = deque([(endWord, 1)])
    
    while begin_queue and end_queue:
        # Always expand the smaller frontier for efficiency
        if len(begin_queue) <= len(end_queue):
            result = _expand_frontier(begin_queue, begin_visited, end_visited, word_set)
        else:
            result = _expand_frontier(end_queue, end_visited, begin_visited, word_set)
        
        if result:
            return result
    
    return 0


def _expand_frontier(queue: deque, visited: dict, other_visited: dict, word_set: set) -> int:
    """
    Expand one level of BFS from the current frontier.
    Returns the total path length if frontiers meet, else 0.
    """
    word, length = queue.popleft()
    
    # Generate all possible one-letter transformations
    word_chars = list(word)
    
    for i in range(len(word)):
        original_char = word_chars[i]
        
        for c in 'abcdefghijklmnopqrstuvwxyz':
            if c == original_char:
                continue
                
            word_chars[i] = c
            next_word = ''.join(word_chars)
            
            # Check if valid word
            if next_word not in word_set:
                continue
                
            # Check if already visited from this direction
            if next_word in visited:
                continue
                
            new_length = length + 1
            
            # Check if frontiers meet
            if next_word in other_visited:
                return new_length + other_visited[next_word] - 1
            
            visited[next_word] = new_length
            queue.append((next_word, new_length))
        
        word_chars[i] = original_char
    
    return 0


# ============== TEST CASES ==============

def test_word_ladder():
    """Test cases for ladder_length function."""
    
    # Test 1: Classic example - hit -> hot -> dot -> dog -> cog (5 words)
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"Test 1 PASSED: {beginWord} -> {endWord} = {result}")
    
    # Test 2: No valid transformation (endWord not in wordList)
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log"]  # "cog" missing
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 0, f"Expected 0, got {result}"
    print(f"Test 2 PASSED: {beginWord} -> {endWord} = {result} (no path)")
    
    # Test 3: Direct one-step transformation
    beginWord = "hot"
    endWord = "dot"
    wordList = ["dot", "hot"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 2, f"Expected 2, got {result}"  # hot -> dot
    print(f"Test 3 PASSED: {beginWord} -> {endWord} = {result}")
    
    # Test 4: Same word
    beginWord = "same"
    endWord = "same"
    wordList = []
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 1, f"Expected 1, got {result}"
    print(f"Test 4 PASSED: same word = {result}")
    
    # Test 5: Adjacent words (one letter different)
    beginWord = "hit"
    endWord = "hot"
    wordList = ["hot"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 2, f"Expected 2, got {result}"  # hit -> hot
    print(f"Test 5 PASSED: {beginWord} -> {endWord} = {result}")
    
    # Test 6: No connection possible
    beginWord = "aaa"
    endWord = "bbb"
    wordList = ["aab", "abb"]  # Can't reach bbb
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 0, f"Expected 0, got {result}"
    print(f"Test 6 PASSED: {beginWord} -> {endWord} = {result} (disconnected)")
    
    # Test 7: Path with multiple valid routes (shortest is 3)
    # game -> gate -> mate = 3 words
    beginWord = "game"
    endWord = "mate"
    wordList = ["gale", "gaze", "gate", "maze", "mare", "mage", "mate", "late", "rate"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 3, f"Expected 3, got {result}"
    print(f"Test 7 PASSED: {beginWord} -> {endWord} = {result}")
    
    # Test 8: LeetCode classic example
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot","dot","dog","lot","log","cog"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"Test 8 PASSED: LeetCode classic = {result}")
    
    # Test 9: Single letter words
    beginWord = "a"
    endWord = "c"
    wordList = ["a", "b", "c"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 2, f"Expected 2, got {result}"  # a -> c (or a -> b -> c, but a->c is shorter)
    print(f"Test 9 PASSED: single letter: {beginWord} -> {endWord} = {result}")
    
    print("\nAll tests passed!")


if __name__ == "__main__":
    test_word_ladder()
