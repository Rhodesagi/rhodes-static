from collections import deque

def ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int:
    word_set = set(wordList)
    if endWord not in word_set:
        return 0
    if beginWord == endWord:
        return 1
    
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    
    while queue:
        word, length = queue.popleft()
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                next_word = word[:i] + c + word[i+1:]
                if next_word == endWord:
                    return length + 1
                if next_word in word_set and next_word not in visited:
                    visited.add(next_word)
                    queue.append((next_word, length + 1))
    return 0

# Tests
if __name__ == "__main__":
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log","cog"]) == 5
    assert ladder_length("hit", "cog", ["hot","dot","dog","lot","log"]) == 0
    assert ladder_length("hot", "dot", ["hot","dot","dog"]) == 2
    assert ladder_length("same", "same", ["same"]) == 1
    assert ladder_length("a", "b", []) == 0
    print("All tests passed!")
