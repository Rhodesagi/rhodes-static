"""
Word Ladder: Shortest transformation sequence length.
Transform beginWord to endWord, changing one letter at a time,
with each intermediate word in wordList.
"""
from collections import deque


def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Returns the number of words in the shortest transformation sequence,
    or 0 if no such sequence exists.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    if beginWord == endWord:
        return 1
    
    queue = deque([(beginWord, 1)])  # (current_word, path_length)
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        
        # Try changing each character position
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                    
                next_word = word[:i] + c + word[i+1:]
                
                if next_word == endWord:
                    return length + 1
                
                if next_word in wordSet and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    return 0


# ========== TEST CASES ==========

def test_basic_case():
    """Classic example from LeetCode."""
    begin = "hit"
    end = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(begin, end, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"✓ Basic case: {result} (hit -> hot -> dot -> dog -> cog)")


def test_no_path():
    """End word unreachable."""
    begin = "hit"
    end = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log"]  # cog missing
    result = ladder_length(begin, end, wordList)
    assert result == 0, f"Expected 0, got {result}"
    print(f"✓ No path case: {result}")


def test_same_word():
    """Begin equals end - only valid if in wordList."""
    result = ladder_length("same", "same", ["same", "other", "words"])
    assert result == 1, f"Expected 1, got {result}"
    print(f"✓ Same word case: {result}")


def test_single_step():
    """Direct one-letter change."""
    result = ladder_length("hot", "dot", ["dot"])
    assert result == 2, f"Expected 2, got {result}"
    print(f"✓ Single step case: {result}")


def test_complex_path():
    """Multiple branches, need shortest."""
    begin = "red"
    end = "tax"
    wordList = ["ted", "tex", "tax", "tad", "den", "rex", "pee"]
    result = ladder_length(begin, end, wordList)
    # red -> ted -> tex -> tax (4 words)
    assert result == 4, f"Expected 4, got {result}"
    print(f"✓ Complex path case: {result}")


def test_empty_list():
    """Empty word list."""
    result = ladder_length("start", "end", [])
    assert result == 0, f"Expected 0, got {result}"
    print(f"✓ Empty list case: {result}")


def test_begin_in_list():
    """Begin word in wordList should still work."""
    result = ladder_length("hot", "cog", ["hot", "dot", "dog", "cog"])
    assert result == 4, f"Expected 4, got {result}"
    print(f"✓ Begin in list case: {result}")


if __name__ == "__main__":
    test_basic_case()
    test_no_path()
    test_same_word()
    test_single_step()
    test_complex_path()
    test_empty_list()
    test_begin_in_list()
    print("\n✅ All tests passed!")
