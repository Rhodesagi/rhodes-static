def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
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
                # Two choices:
                # 1. Ignore x* (zero occurrences of x)
                dp[i][j] = dp[i][j - 2]
                # 2. Use x* if current char matches pattern char before *
                if not dp[i][j]:  # Only check if not already True
                    if p[j - 2] == '.' or s[i - 1] == p[j - 2]:
                        dp[i][j] = dp[i - 1][j]
            elif p[j - 1] == '.':
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = dp[i - 1][j - 1] and s[i - 1] == p[j - 1]
    
    return dp[m][n]


# Test cases from LeetCode
def test_is_match():
    test_cases = [
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        # Additional edge cases
        ("", "", True),
        ("", "a*", True),
        ("", ".*", True),
        ("a", ".*..a*", False),
        ("aaa", "a*a", True),
        ("aaa", "ab*a", False),
        ("a", "ab*", True),  # b* matches zero b's
        ("bbbba", ".*a*a", True),
        ("abcd", "d*", False),
    ]
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match({s!r}, {p!r}) = {result}, expected {expected}")
    
    print()
    if all_passed:
        print("All tests passed!")
    else:
        print("Some tests failed!")
    return all_passed


if __name__ == "__main__":
    test_is_match()
