def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    
    Full match required: entire string s must match pattern p.
    """
    m, n = len(s), len(p)
    
    # dp[i][j] = True if s[i:] matches p[j:]
    # Extra row/col for empty string/pattern cases
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Empty string matches empty pattern
    dp[m][n] = True
    
    # Fill bottom-up, right-to-left
    for i in range(m, -1, -1):
        for j in range(n - 1, -1, -1):
            # Check if first characters match
            first_match = i < m and (p[j] == s[i] or p[j] == '.')
            
            if j + 1 < n and p[j + 1] == '*':
                # '*' present: two choices:
                # 1. Skip the 'x*' entirely (zero matches): dp[i][j+2]
                # 2. Use the pattern to match s[i], stay on same pattern: first_match and dp[i+1][j]
                dp[i][j] = dp[i][j + 2] or (first_match and dp[i + 1][j])
            else:
                # No '*': must match first char, then rest
                dp[i][j] = first_match and dp[i + 1][j + 1]
    
    return dp[0][0]


# === TEST CASES ===

if __name__ == "__main__":
    test_cases = [
        # (s, p, expected)
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),
        ("", "a*", True),
        ("a", "ab*", True),
        ("aaa", "ab*a", False),
        ("aaa", "a*a", True),
        ("ab", ".*c", False),
        ("aaa", "aaaa", False),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False),
    ]
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print()
    print("All tests passed!" if all_passed else "Some tests failed.")
