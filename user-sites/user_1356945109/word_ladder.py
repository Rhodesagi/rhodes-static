from collections import deque

def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    """
    Returns the length of the shortest transformation sequence from beginWord to endWord.
    Each transformation changes exactly one letter.
    All intermediate words must be in wordList.
    Returns 0 if no such sequence exists.
    """
    wordSet = set(wordList)
    
    if endWord not in wordSet:
        return 0
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        
        if word == endWord:
            return length
        
        # Generate all possible one-letter transformations
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                next_word = word[:i] + c + word[i+1:]
                
                if next_word in wordSet and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    
    return 0


# Test cases
if __name__ == "__main__":
    # Example 1: Expected 5 (hit -> hot -> dot -> dog -> cog)
    print(ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"]))
    
    # Example 2: Expected 0 (endWord not in wordList)
    print(ladder_length("hit", "cog", ["hot","dot","dog","lot","log"]))
    
    # Example 3: Single step
    print(ladder_length("hot", "dot", ["hot","dot","dog"]))
    
    # Example 4: No path exists
    print(ladder_length("leet", "code", ["lest","leet","lose","code","lode","robe","lost"]))
