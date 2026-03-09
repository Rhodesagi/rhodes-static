def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    """
    m, n = len(s), len(p)
    # dp[i][j] = True if s[0:i] matches p[0:j]
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
                # '*' can match zero of the preceding element
                dp[i][j] = dp[i][j - 2]
                # Or '*' can match one or more if preceding element matches s[i-1]
                if matches(s[i - 1], p[j - 2]):
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                # Direct character match or '.' wildcard
                if matches(s[i - 1], p[j - 1]):
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


def matches(s_char: str, p_char: str) -> bool:
    """Check if a pattern character matches a string character."""
    return p_char == '.' or s_char == p_char


# Test cases from LeetCode
if __name__ == "__main__":
    test_cases = [
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),
        ("a", "ab*", True),
        ("ab", ".*c", False),
        ("aaa", "a*a", True),
        ("aaa", "ab*a", False),
        ("a", ".*..a*", False),
        ("aasdfasdfasdfasdfas", "aasdf.*asdf.*asdf.*asdf.*s", True),
    ]
    
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓" if result == expected else "✗"
        print(f"{status} is_match({s!r}, {p!r}) = {result} (expected {expected})")
