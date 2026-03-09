def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with support for '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    """
    m, n = len(s), len(p)
    # dp[i][j] = True if s[:i] matches p[:j]
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Empty string matches empty pattern
    dp[0][0] = True
    
    # Handle patterns like a*, a*b*, etc. matching empty string
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 2]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                # * can match zero of the preceding element
                # OR (if preceding matches current char) consume one and stay
                zero_match = dp[i][j - 2]  # Skip the 'x*' entirely
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    one_or_more = dp[i - 1][j]  # Use this char, keep the '*'
                    dp[i][j] = zero_match or one_or_more
                else:
                    dp[i][j] = zero_match
            elif p[j - 1] == '.':
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = dp[i - 1][j - 1] and p[j - 1] == s[i - 1]
    
    return dp[m][n]


# ============ TEST CASES ============
def test_is_match():
    # LeetCode examples
    assert is_match("aa", "a") == False, "Example 1 failed"
    assert is_match("aa", "a*") == True, "Example 2 failed"
    assert is_match("ab", ".*") == True, "Example 3 failed"
    
    # Additional edge cases
    assert is_match("", "") == True, "Empty both"
    assert is_match("a", "") == False, "Empty pattern"
    assert is_match("", "a*") == True, "Star matches empty"
    assert is_match("", ".*") == True, "Dot-star matches empty"
    assert is_match("aab", "c*a*b") == True, "Complex pattern"
    assert is_match("mississippi", "mis*is*p*.") == False, "Complex false"
    assert is_match("aaa", "a*a") == True, "Multiple matches"
    assert is_match("aaa", "ab*a") == False, "No match"
    assert is_match("a", "ab*") == True, "Star zero times"
    assert is_match("aaa", "a*aaa") == True, "Star + literal"
    assert is_match("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c") == False, "Long false"
    assert is_match("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*b") == True, "Long true"
    
    print("✓ All tests passed!")


if __name__ == "__main__":
    test_is_match()
