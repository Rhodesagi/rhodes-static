from collections import deque
from typing import List

def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Returns the length of the shortest transformation sequence from beginWord to endWord,
    changing one letter at a time, with each intermediate word in wordList.
    Returns 0 if no such sequence exists.
    """
    word_set = set(wordList)
    
    if endWord not in word_set:
        return 0
    
    queue = deque([(beginWord, 1)])
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
                
                if next_word in word_set and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    return 0


# ============ TEST CASES ============

def test_word_ladder():
    # Test 1: Classic LeetCode example
    # "hit" -> "hot" -> "dot" -> "dog" -> "cog" (length 5)
    result = ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"])
    assert result == 5, f"Expected 5, got {result}"
    print("✓ Test 1 passed: hit -> cog = 5")
    
    # Test 2: No valid transformation (endWord not in list)
    result = ladder_length("hit", "cog", ["hot","dot","dog","lot","log"])
    assert result == 0, f"Expected 0, got {result}"
    print("✓ Test 2 passed: endWord not in list = 0")
    
    # Test 3: Direct one-step transformation
    result = ladder_length("hot", "dot", ["hot","dot","dog"])
    assert result == 2, f"Expected 2, got {result}"
    print("✓ Test 3 passed: hot -> dot = 2")
    
    # Test 4: Same word (beginWord == endWord)
    result = ladder_length("same", "same", ["same"])
    assert result == 1, f"Expected 1, got {result}"
    print("✓ Test 4 passed: same word = 1")
    
    # Test 5: Empty word list
    result = ladder_length("start", "end", [])
    assert result == 0, f"Expected 0, got {result}"
    print("✓ Test 5 passed: empty list = 0")
    
    # Test 6: Single char - direct change (a->c is 1 step, so length 2)
    result = ladder_length("a", "c", ["a","b","c"])
    assert result == 2, f"Expected 2 (direct a->c), got {result}"
    print("✓ Test 6 passed: a -> c (direct) = 2")
    
    # Test 7: LeetCode Example 2 - no transformation
    result = ladder_length("hit", "cog", ["hot","dot","dog","lot","log"])
    assert result == 0, f"Expected 0, got {result}"
    print("✓ Test 7 passed: no valid path = 0")
    
    # Test 8: beginWord not in wordList (valid per problem)
    result = ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"])
    assert result == 5, f"Expected 5, got {result}"
    print("✓ Test 8 passed: beginWord not required in wordList")
    
    # Test 9: Longer word example
    # leet -> lest -> lost -> lose -> lode -> code (6 words)
    result = ladder_length("leet", "code", ["lest","leet","lose","code","lode","robe","lost"])
    assert result == 6, f"Expected 6, got {result}"
    print("✓ Test 9 passed: leet -> code = 6")
    
    # Test 10: Two-step path (3-letter word)
    # "aaa" -> "aac" -> "ccc" (need intermediate where only 1 char differs)
    result = ladder_length("aaa", "ccc", ["aaa","aac","acc","ccc"])
    # aaa -> aac (1 change), aac -> acc (1 change), acc -> ccc (1 change)
    assert result == 4, f"Expected 4 (aaa->aac->acc->ccc), got {result}"
    print("✓ Test 10 passed: aaa -> ccc = 4")
    
    # Test 11: No connection possible
    result = ladder_length("abc", "def", ["abc","ghi","def"])
    assert result == 0, f"Expected 0, got {result}"
    print("✓ Test 11 passed: no connection = 0")
    
    print("\n✅ All tests passed!")


if __name__ == "__main__":
    test_word_ladder()
