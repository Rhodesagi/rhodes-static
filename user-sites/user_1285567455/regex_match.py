def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with support for '.' and '*'.
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
                # '*' can match zero of the preceding char
                dp[i][j] = dp[i][j - 2]
                # Or '*' can match one or more if preceding matches current char
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            elif p[j - 1] == '.':
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = dp[i - 1][j - 1] and p[j - 1] == s[i - 1]
    
    return dp[m][n]


# Test harness
if __name__ == "__main__":
    test_cases = [
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),
        ("a", ".*", True),
        ("aaa", "a*a", True),
        ("aaa", "ab*a", False),
        ("a", "ab*", True),
        ("aaa", "a*a*a", True),
        ("ab", ".*c", False),
        ("bbbba", ".*a*a", True),
    ]
    
    passed = 0
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "PASS" if result == expected else "FAIL"
        if result == expected:
            passed += 1
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print(f"\n{passed}/{len(test_cases)} tests passed")
