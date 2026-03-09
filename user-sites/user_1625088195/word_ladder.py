from collections import deque

def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Returns the length of the shortest transformation sequence from beginWord to endWord,
    where each transformation changes exactly one letter and all intermediate words
    must be in wordList. Returns 0 if no such sequence exists.
    """
    word_set = set(wordList)
    
    if endWord not in word_set:
        return 0
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        current, length = queue.popleft()
        
        if current == endWord:
            return length
        
        # Generate all words one letter different from current
        for i in range(len(current)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == current[i]:
                    continue
                neighbor = current[:i] + c + current[i+1:]
                
                if neighbor in word_set and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, length + 1))
    
    return 0


# Verification tests
if __name__ == "__main__":
    # Test 1: Classic example (expected: 5)
    begin = "hit"
    end = "cog"
    word_list = ["hot", "dot", "dog", "lot", "log", "cog"]
    result = ladder_length(begin, end, word_list)
    print(f"Test 1: {begin} -> {end}")
    print(f"Word list: {word_list}")
    print(f"Result: {result} (expected: 5)")
    print(f"Path: hit -> hot -> dot -> dog -> cog (length 5)")
    print()
    
    # Test 2: endWord not in wordList (expected: 0)
    begin = "hit"
    end = "cog"
    word_list = ["hot", "dot", "dog", "lot", "log"]
    result = ladder_length(begin, end, word_list)
    print(f"Test 2: {begin} -> {end}")
    print(f"Word list: {word_list}")
    print(f"Result: {result} (expected: 0)")
    print()
    
    # Test 3: No valid path (expected: 0)
    begin = "aaa"
    end = "bbb"
    word_list = ["aab", "abb", "bbc"]
    result = ladder_length(begin, end, word_list)
    print(f"Test 3: {begin} -> {end}")
    print(f"Word list: {word_list}")
    print(f"Result: {result} (expected: 0)")
    print()
    
    # Test 4: Direct transformation (expected: 2)
    begin = "hit"
    end = "hot"
    word_list = ["hot"]
    result = ladder_length(begin, end, word_list)
    print(f"Test 4: {begin} -> {end}")
    print(f"Word list: {word_list}")
    print(f"Result: {result} (expected: 2)")
    print()
    
    # Test 5: beginWord == endWord (expected: 1)
    begin = "same"
    end = "same"
    word_list = ["same"]
    result = ladder_length(begin, end, word_list)
    print(f"Test 5: {begin} -> {end}")
    print(f"Result: {result} (expected: 1)")
