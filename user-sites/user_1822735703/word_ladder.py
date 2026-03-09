"""
Word Ladder - Shortest transformation sequence length.
LeetCode 127: https://leetcode.com/problems/word-ladder/
"""

from collections import deque
from typing import List


def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Return the length of the shortest word ladder from beginWord to endWord.
    Each transformation changes exactly one letter.
    All intermediate words must be in wordList.
    Return 0 if no such sequence exists.
    """
    word_set = set(wordList)
    
    if endWord not in word_set:
        return 0
    
    if beginWord == endWord:
        return 1
    
    # Bidirectional BFS
    begin_visited = {beginWord: 1}
    end_visited = {endWord: 1}
    begin_queue = deque([(beginWord, 1)])
    end_queue = deque([(endWord, 1)])
    
    while begin_queue and end_queue:
        # Expand smaller frontier for efficiency
        if len(begin_queue) <= len(end_queue):
            result = _expand(begin_queue, begin_visited, end_visited, word_set)
        else:
            result = _expand(end_queue, end_visited, begin_visited, word_set)
        
        if result:
            return result
    
    return 0


def _expand(queue: deque, visited: dict, other_visited: dict, word_set: set) -> int:
    """Expand one level of BFS. Return path length if frontiers meet."""
    word, length = queue.popleft()
    
    for i in range(len(word)):
        for c in 'abcdefghijklmnopqrstuvwxyz':
            if c == word[i]:
                continue
            
            next_word = word[:i] + c + word[i+1:]
            
            if next_word not in word_set:
                continue
            
            if next_word in other_visited:
                # Frontiers meet
                return length + other_visited[next_word]
            
            if next_word not in visited:
                visited[next_word] = length + 1
                queue.append((next_word, length + 1))
    
    return 0


# === Test Cases ===
if __name__ == "__main__":
    # Example 1: Expected 5 (hit -> hot -> dot -> dog -> cog)
    begin1, end1 = "hit", "cog"
    word_list1 = ["hot", "dot", "dog", "lot", "log", "cog"]
    result1 = ladder_length(begin1, end1, word_list1)
    print(f"Example 1: {result1} (expected 5)")
    assert result1 == 5, f"Failed: got {result1}"
    
    # Example 2: Expected 0 (endWord not in wordList)
    begin2, end2 = "hit", "cog"
    word_list2 = ["hot", "dot", "dog", "lot", "log"]
    result2 = ladder_length(begin2, end2, word_list2)
    print(f"Example 2: {result2} (expected 0)")
    assert result2 == 0, f"Failed: got {result2}"
    
    # Edge: beginWord == endWord
    result3 = ladder_length("hit", "hit", ["hit"])
    print(f"Edge case: {result3} (expected 1)")
    assert result3 == 1, f"Failed: got {result3}"
    
    # Edge: single step
    result4 = ladder_length("hot", "dot", ["dot"])
    print(f"Single step: {result4} (expected 2)")
    assert result4 == 2, f"Failed: got {result4}"
    
    print("\nAll tests passed!")
