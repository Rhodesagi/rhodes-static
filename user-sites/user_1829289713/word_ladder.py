"""
Word Ladder - Shortest transformation sequence length.

Each transformation changes exactly one letter.
All intermediate words must be in wordList.
Returns the number of words in the sequence (including beginWord and endWord),
or 0 if no transformation sequence exists.
"""

from collections import defaultdict, deque
from typing import List


def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Returns the length of the shortest word ladder from beginWord to endWord.
    
    Time Complexity: O(N * M * 26) where N = len(wordList), M = len(word)
    Space Complexity: O(N * M) for the pattern map and BFS queues
    """
    word_set = set(wordList)
    
    # Edge case: endWord must be in wordList
    if endWord not in word_set:
        return 0
    
    # Edge case: same word
    if beginWord == endWord:
        return 1
    
    # Build pattern -> words map for O(1) neighbor lookup
    # Pattern "h*t" matches "hot", "hat", "hit", etc.
    pattern_map = defaultdict(list)
    for word in word_set:
        for i in range(len(word)):
            pattern = word[:i] + '*' + word[i+1:]
            pattern_map[pattern].append(word)
    
    # Bidirectional BFS for optimal performance
    begin_queue = deque([(beginWord, 1)])
    end_queue = deque([(endWord, 1)])
    
    begin_visited = {beginWord: 1}
    end_visited = {endWord: 1}
    
    while begin_queue and end_queue:
        # Expand the smaller frontier first
        if len(begin_queue) <= len(end_queue):
            result = _expand_frontier(
                begin_queue, begin_visited, end_visited, pattern_map
            )
        else:
            result = _expand_frontier(
                end_queue, end_visited, begin_visited, pattern_map
            )
        
        if result:
            return result
    
    return 0


def _expand_frontier(queue, visited, other_visited, pattern_map):
    """Expand one level of BFS and check for intersection with other frontier."""
    word, level = queue.popleft()
    
    for i in range(len(word)):
        pattern = word[:i] + '*' + word[i+1:]
        
        for neighbor in pattern_map.get(pattern, []):
            # Check if we've reached the other frontier
            if neighbor in other_visited:
                return level + other_visited[neighbor]
            
            # Add to current frontier if not visited
            if neighbor not in visited:
                visited[neighbor] = level + 1
                queue.append((neighbor, level + 1))
    
    return None


# Alternative: Standard BFS (simpler, acceptable for smaller inputs)
def ladder_length_bfs(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """Standard BFS implementation - simpler but slower for large inputs."""
    word_set = set(wordList)
    
    if endWord not in word_set:
        return 0
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, level = queue.popleft()
        
        if word == endWord:
            return level
        
        # Generate all single-letter transformations
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = word[:i] + c + word[i+1:]
                
                if next_word in word_set and next_word not in visited:
                    if next_word == endWord:
                        return level + 1
                    visited.add(next_word)
                    queue.append((next_word, level + 1))
    
    return 0


# Test cases
if __name__ == "__main__":
    # LeetCode Example 1: hit -> hot -> dot -> dog -> cog = 5
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"]) == 5
    
    # LeetCode Example 2: endWord not in wordList
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log"]) == 0
    
    # Edge cases
    assert ladder_length("a", "a", ["a"]) == 1
    assert ladder_length("a", "b", ["b"]) == 2
    assert ladder_length("hot", "dog", ["hot","dog"]) == 0  # No single-step path
    
    # Verify both implementations match
    test_cases = [
        ("hit", "cog", ["hot","dot","dog","lot","log","cog"]),
        ("hit", "cog", ["hot","dot","dog","lot","log"]),
        ("a", "c", ["a","b","c"]),
        ("lost", "cost", ["lost","cost","most","post"]),
    ]
    
    for begin, end, words in test_cases:
        bidirectional = ladder_length(begin, end, words)
        standard = ladder_length_bfs(begin, end, words)
        assert bidirectional == standard, f"Mismatch: {begin}->{end}"
        print(f"{begin} -> {end}: {bidirectional}")
    
    print("All tests passed!")
