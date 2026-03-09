def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    
    Returns True if the entire string s matches the pattern p.
    """
    m, n = len(s), len(p)
    # dp[i][j] = True if s[:i] matches p[:j]
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
                if not dp[i][j]:  # Only check if zero-match failed
                    if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                        dp[i][j] = dp[i - 1][j]
            else:
                # Direct character match or '.' wildcard
                if p[j - 1] == '.' or p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


# ========== TEST CASES ==========

def test_is_match():
    """Comprehensive test suite for regex matching."""
    test_cases = [
        # LeetCode examples
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        
        # Additional edge cases
        ("", "", True),
        ("a", "", False),
        ("", "a*", True),
        ("", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("aaa", "a*a", True),
        ("aaa", "ab*a", False),
        ("aaa", "ab*ac*a", True),
        ("ab", ".*c", False),
        ("aaa", "a*a*a", True),
        ("abcd", "d*", False),
        ("aaa", "aaaa", False),
        ("a", ".*..a*", False),
        ("aasdfasdfasdfasdfas", "aasdf.*asdf.*asdf.*asdf.*s", True),
    ]
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print(f"\n{'All tests passed!' if all_passed else 'Some tests failed!'}")
    return all_passed


if __name__ == "__main__":
    test_is_match()
