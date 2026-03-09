from collections import defaultdict, deque
from typing import List

def ladder_length(beginWord: str, endWord: str, wordList: List[str]) -> int:
    """
    Returns the length of the shortest transformation sequence from beginWord to endWord.
    Returns 0 if no such sequence exists.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    if beginWord == endWord:
        return 1
    
    # Build adjacency map: pattern -> words matching that pattern
    # Pattern is word with one char replaced by '*', e.g., "hot" -> "*ot", "h*t", "ho*"
    L = len(beginWord)
    all_words = wordSet | {beginWord}
    pattern_map = defaultdict(list)
    
    for word in all_words:
        for i in range(L):
            pattern = word[:i] + '*' + word[i+1:]
            pattern_map[pattern].append(word)
    
    # Bidirectional BFS
    begin_visited = {beginWord: 1}
    end_visited = {endWord: 1}
    begin_queue = deque([(beginWord, 1)])
    end_queue = deque([(endWord, 1)])
    
    def get_neighbors(word):
        neighbors = []
        for i in range(L):
            pattern = word[:i] + '*' + word[i+1:]
            neighbors.extend(pattern_map[pattern])
        return neighbors
    
    while begin_queue and end_queue:
        # Expand the frontier with fewer nodes
        if len(begin_queue) > len(end_queue):
            begin_queue, end_queue = end_queue, begin_queue
            begin_visited, end_visited = end_visited, begin_visited
        
        for _ in range(len(begin_queue)):
            word, depth = begin_queue.popleft()
            
            for neighbor in get_neighbors(word):
                if neighbor not in begin_visited:
                    if neighbor in end_visited:
                        return depth + end_visited[neighbor]
                    begin_visited[neighbor] = depth + 1
                    begin_queue.append((neighbor, depth + 1))
    
    return 0


# === Test cases ===
if __name__ == "__main__":
    # Example 1: Expected 5
    result1 = ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"])
    print(f"Example 1: {result1}")  # 5: hit -> hot -> dot -> dog -> cog
    
    # Example 2: Expected 0 (endWord not in wordList)
    result2 = ladder_length("hit", "cog", ["hot","dot","dog","lot","log"])
    print(f"Example 2: {result2}")  # 0
    
    # Example 3: Same word
    result3 = ladder_length("hit", "hit", ["hit"])
    print(f"Example 3: {result3}")  # 1
    
    # Example 4: Direct neighbor
    result4 = ladder_length("hit", "hot", ["hot"])
    print(f"Example 4: {result4}")  # 2
    
    # Large test
    result5 = ladder_length("red", "tax", ["ted","tex","red","tax","tad","den","rex","pee"])
    print(f"Example 5: {result5}")  # 4: red -> ted -> tad -> tax
    
    # Verify all
    assert result1 == 5, f"Expected 5, got {result1}"
    assert result2 == 0, f"Expected 0, got {result2}"
    assert result3 == 1, f"Expected 1, got {result3}"
    assert result4 == 2, f"Expected 2, got {result4}"
    assert result5 == 4, f"Expected 4, got {result5}"
    print("\nAll tests passed!")
