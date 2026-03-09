def is_match(s: str, p: str) -> bool:
    """
    Regex matching with '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    """
    m, n = len(s), len(p)
    # dp[i][j] = does s[0:i] match p[0:j]?
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Empty string matches empty pattern
    dp[0][0] = True
    
    # Handle patterns like a*, a*b*, a*b*c* matching empty string
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 2]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                # * can match zero of the preceding char
                dp[i][j] = dp[i][j - 2]
                # * can match one or more if preceding char matches s[i-1]
                if matches(s, p, i - 1, j - 2):
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                # Direct match or '.' match
                if matches(s, p, i - 1, j - 1):
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


def matches(s: str, p: str, i: int, j: int) -> bool:
    """Check if s[i] matches p[j] (p[j] can be '.')."""
    if p[j] == '.':
        return True
    return s[i] == p[j]


# Test cases from LeetCode 10
if __name__ == "__main__":
    test_cases = [
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("aaa", "ab*a", False),
        ("", "", True),
        ("a", "ab*", True),
        ("ab", ".*c", False),
        ("aaa", "a*a", True),
        ("bbbba", ".*a*a", True),
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
