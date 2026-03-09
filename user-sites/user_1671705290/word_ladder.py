"""
Word Ladder - Shortest transformation sequence length.
LeetCode 127 variant: return length (not path), 0 if impossible.
"""

from collections import deque, defaultdict
from typing import List


def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Return length of shortest ladder from beginWord to endWord.
    Each step changes exactly one letter; all intermediate words must be in wordList.
    Return 0 if no valid sequence exists.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    if beginWord == endWord:
        return 1
    
    # Build pattern map: "h*t" -> ["hot", "hat", ...]
    L = len(beginWord)
    patterns = defaultdict(list)
    for word in wordSet:
        for i in range(L):
            pattern = word[:i] + '*' + word[i+1:]
            patterns[pattern].append(word)
    
    # BFS
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, level = queue.popleft()
        
        for i in range(L):
            pattern = word[:i] + '*' + word[i+1:]
            for neighbor in patterns[pattern]:
                if neighbor == endWord:
                    return level + 1
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, level + 1))
            # Optimization: clear pattern list to prevent reprocessing
            patterns[pattern] = []
    
    return 0


# ============ TESTS ============

def test_basic():
    """Standard LeetCode example."""
    begin = "hit"
    end = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(begin, end, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"✓ test_basic: {result}")


def test_impossible():
    """endWord not reachable."""
    begin = "hit"
    end = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log"]  # no "cog"
    result = ladder_length(begin, end, wordList)
    assert result == 0, f"Expected 0, got {result}"
    print(f"✓ test_impossible: {result}")


def test_single_step():
    """beginWord can directly reach endWord."""
    begin = "hot"
    end = "dot"
    wordList = ["dot"]
    result = ladder_length(begin, end, wordList)
    assert result == 2, f"Expected 2, got {result}"
    print(f"✓ test_single_step: {result}")


def test_same_word():
    """beginWord equals endWord."""
    begin = "hot"
    end = "hot"
    wordList = ["hot", "dot"]
    result = ladder_length(begin, end, wordList)
    assert result == 1, f"Expected 1, got {result}"
    print(f"✓ test_same_word: {result}")


def test_longer_path():
    """Longer transformation chain."""
    begin = "a"
    end = "c"
    wordList = ["a", "b", "c"]
    result = ladder_length(begin, end, wordList)
    assert result == 2, f"Expected 2, got {result}"
    print(f"✓ test_longer_path: {result}")


def test_empty_list():
    """Empty wordList, impossible."""
    begin = "hot"
    end = "dot"
    wordList = []
    result = ladder_length(begin, end, wordList)
    assert result == 0, f"Expected 0, got {result}"
    print(f"✓ test_empty_list: {result}")


def test_multiple_paths():
    """Multiple valid paths, ensure shortest is found."""
    begin = "red"
    end = "tax"
    wordList = ["ted", "tex", "red", "tax", "tad", "den", "rex", "pee"]
    result = ladder_length(begin, end, wordList)
    # red -> ted -> tex -> tax (4 steps)
    assert result == 4, f"Expected 4, got {result}"
    print(f"✓ test_multiple_paths: {result}")


def test_no_matching_length():
    """Words of different lengths from wordList."""
    begin = "hit"
    end = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog", "longerword"]
    result = ladder_length(begin, end, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"✓ test_no_matching_length: {result}")


if __name__ == "__main__":
    print("Running Word Ladder tests...\n")
    test_basic()
    test_impossible()
    test_single_step()
    test_same_word()
    test_longer_path()
    test_empty_list()
    test_multiple_paths()
    test_no_matching_length()
    print("\n✅ All tests passed!")
