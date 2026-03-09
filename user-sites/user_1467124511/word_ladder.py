"""
Word Ladder - Shortest Transformation Sequence Length

Given two words (beginWord and endWord), and a dictionary's word list,
find the length of the shortest transformation sequence from beginWord to endWord.

Rules:
- Only one letter can be changed at a time
- Each transformed word must exist in the word list
- Return 0 if no such sequence exists
"""

from collections import deque


def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Returns the length of the shortest word ladder from beginWord to endWord.
    Returns 0 if no transformation sequence exists.
    
    Time Complexity: O(N * M * 26) where N = len(wordList), M = word length
    Space Complexity: O(N) for the set and queue
    """
    wordSet = set(wordList)
    
    # endWord must be in wordList for a valid transformation
    if endWord not in wordSet:
        return 0
    
    # BFS: queue stores (current_word, path_length)
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        current_word, length = queue.popleft()
        
        # Try changing each position to every letter a-z
        for i in range(len(current_word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = current_word[:i] + c + current_word[i+1:]
                
                # Found the target
                if next_word == endWord:
                    return length + 1
                
                # Valid transformation: in word list and not visited
                if next_word in wordSet and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    # No valid transformation sequence found
    return 0


# === TEST CASES ===
if __name__ == "__main__":
    # Test 1: Classic LeetCode example
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(beginWord, endWord, wordList)
    print(f"Test 1: {beginWord} -> {endWord}")
    print(f"Word list: {wordList}")
    print(f"Result: {result}")  # Expected: 5 (hit -> hot -> dot -> dog -> cog)
    print()
    
    # Test 2: No valid path
    beginWord2 = "hit"
    endWord2 = "cog"
    wordList2 = ["hot", "dot", "dog", "lot", "log"]
    result2 = ladder_length(beginWord2, endWord2, wordList2)
    print(f"Test 2: {beginWord2} -> {endWord2}")
    print(f"Word list: {wordList2}")
    print(f"Result: {result2}")  # Expected: 0 (cog not in list)
    print()
    
    # Test 3: Direct neighbor
    beginWord3 = "hot"
    endWord3 = "dot"
    wordList3 = ["hot", "dot", "dog"]
    result3 = ladder_length(beginWord3, endWord3, wordList3)
    print(f"Test 3: {beginWord3} -> {endWord3}")
    print(f"Result: {result3}")  # Expected: 2 (hot -> dot)
    print()
    
    # Test 4: beginWord not in wordList (valid case)
    beginWord4 = "game"
    endWord4 = "fame"
    wordList4 = ["fame", "fume", "fuse"]
    result4 = ladder_length(beginWord4, endWord4, wordList4)
    print(f"Test 4: {beginWord4} -> {endWord4}")
    print(f"Result: {result4}")  # Expected: 2 (game -> fame)
    print()
    
    # Test 5: Single letter difference but not in list
    beginWord5 = "a"
    endWord5 = "c"
    wordList5 = ["b", "c"]
    result5 = ladder_length(beginWord5, endWord5, wordList5)
    print(f"Test 5: {beginWord5} -> {endWord5}")
    print(f"Result: {result5}")  # Expected: 2 (a -> c, c is in list)
