from functools import lru_cache

def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with support for '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    """
    @lru_cache(maxsize=None)
    def dp(i: int, j: int) -> bool:
        # Base case: both string and pattern exhausted
        if j == len(p):
            return i == len(s)
        
        # Check if next character in pattern is '*'
        if j + 1 < len(p) and p[j + 1] == '*':
            # Two choices when we have x*:
            # 1. Skip x* entirely (zero occurrences)
            # 2. Use x* to match s[i] if it matches, then stay at same pattern position
            skip_star = dp(i, j + 2)  # zero occurrences
            
            # Can we use the star? Check if current chars match
            if i < len(s) and (p[j] == '.' or p[j] == s[i]):
                use_star = dp(i + 1, j)  # consume s[i], stay at pattern (can use more)
                return skip_star or use_star
            
            return skip_star
        
        # No star: must match current character
        if i < len(s) and (p[j] == '.' or p[j] == s[i]):
            return dp(i + 1, j + 1)
        
        return False
    
    return dp(0, 0)


# Test cases from LeetCode
if __name__ == "__main__":
    test_cases = [
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),
        ("a", ".*..", False),
        ("aaa", "ab*a", False),
        ("aaa", "ab*a*c*a", True),
        ("a", "ab*", True),
        ("bbbba", ".*a*a", True),
        ("ab", ".*c", False),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False),
    ]
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓" if result == expected else "✗"
        if result != expected:
            all_passed = False
        print(f"{status} is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print(f"\n{'All tests passed!' if all_passed else 'Some tests failed!'}")
