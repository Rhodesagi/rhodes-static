from collections import defaultdict, deque
from typing import List, Optional

def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Returns the length of the shortest word ladder from beginWord to endWord.
    Each transformation changes exactly one letter; all intermediate words must be in wordList.
    Returns 0 if no valid path exists.
    
    Uses bidirectional BFS with pattern-based neighbor lookup for optimal performance.
    """
    word_set = set(wordList)
    
    # Edge case: endWord must be in wordList
    if endWord not in word_set:
        return 0
    
    # Edge case: same word
    if beginWord == endWord:
        return 1
    
    # Build pattern map: pattern -> set of words matching that pattern
    # Pattern "h_t" matches "hot", "hat", "hit"
    pattern_map = defaultdict(set)
    word_length = len(beginWord)
    
    for word in word_set:
        for i in range(word_length):
            pattern = word[:i] + '_' + word[i+1:]
            pattern_map[pattern].add(word)
    
    # Bidirectional BFS
    # Each queue stores (word, distance_from_origin)
    begin_queue = deque([(beginWord, 1)])
    end_queue = deque([(endWord, 1)])
    
    # Visited maps: word -> distance from respective origin
    begin_visited = {beginWord: 1}
    end_visited = {endWord: 1}
    
    def get_neighbors(word: str) -> List[str]:
        """Get all words one edit away using pattern map."""
        neighbors = []
        for i in range(word_length):
            pattern = word[:i] + '_' + word[i+1:]
            neighbors.extend(pattern_map[pattern])
        return neighbors
    
    while begin_queue and end_queue:
        # Always expand the smaller frontier (optimization)
        if len(begin_queue) > len(end_queue):
            begin_queue, end_queue = end_queue, begin_queue
            begin_visited, end_visited = end_visited, begin_visited
        
        # Expand one level from begin side
        for _ in range(len(begin_queue)):
            word, dist = begin_queue.popleft()
            
            for neighbor in get_neighbors(word):
                # Skip if not in word set (for beginWord which may not be in wordList)
                if neighbor not in word_set and neighbor != beginWord:
                    continue
                    
                # Check if we've reached the other search
                if neighbor in end_visited:
                    return dist + end_visited[neighbor]
                
                # Check if already visited from this side
                if neighbor in begin_visited:
                    continue
                
                begin_visited[neighbor] = dist + 1
                begin_queue.append((neighbor, dist + 1))
    
    # No path found
    return 0


# ============ TEST CASES ============

def test_basic_case():
    """Standard LeetCode example: hit -> cog via [hot,dot,dog,lot,log,cog]"""
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"✓ Basic case: hit -> cog = {result} (hit -> hot -> dot -> dog -> cog)")

def test_no_path():
    """No valid transformation path exists."""
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log"]  # missing "cog"
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 0, f"Expected 0, got {result}"
    print(f"✓ No path case: {result}")

def test_direct_neighbor():
    """One-step transformation."""
    beginWord = "hot"
    endWord = "dot"
    wordList = ["dot"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 2, f"Expected 2, got {result}"
    print(f"✓ Direct neighbor: {result}")

def test_same_word():
    """beginWord equals endWord."""
    result = ladder_length("hot", "hot", ["hot"])
    assert result == 1, f"Expected 1, got {result}"
    print(f"✓ Same word: {result}")

def test_longer_path():
    """A longer path to verify BFS finds shortest."""
    beginWord = "a"
    endWord = "c"
    wordList = ["b", "c"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 2, f"Expected 2, got {result}"
    print(f"✓ Single letter path: {result}")

def test_alternative_paths():
    """Multiple paths exist; verify shortest is chosen."""
    # hit -> hot -> dot -> dog -> cog (5 steps)
    # hit -> hot -> lot -> log -> cog (5 steps)
    # Both are length 5
    beginWord = "hit"
    endWord = "cog"
    wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 5, f"Expected 5, got {result}"
    print(f"✓ Multiple paths: {result} (shortest selected)")

def test_empty_wordlist():
    """Empty word list with no possible transformation."""
    result = ladder_length("hit", "cog", [])
    assert result == 0, f"Expected 0, got {result}"
    print(f"✓ Empty wordList: {result}")

def test_beginWord_not_in_list():
    """beginWord not in wordList is allowed; endWord must be."""
    beginWord = "game"
    endWord = "fame"
    wordList = ["fame", "fume", "fuse"]
    result = ladder_length(beginWord, endWord, wordList)
    assert result == 2, f"Expected 2, got {result}"
    print(f"✓ beginWord not in list: {result}")

def run_all_tests():
    print("=" * 50)
    print("Running Word Ladder Tests")
    print("=" * 50)
    
    test_basic_case()
    test_no_path()
    test_direct_neighbor()
    test_same_word()
    test_longer_path()
    test_alternative_paths()
    test_empty_wordlist()
    test_beginWord_not_in_list()
    
    print("=" * 50)
    print("All tests passed!")
    print("=" * 50)

if __name__ == "__main__":
    run_all_tests()
