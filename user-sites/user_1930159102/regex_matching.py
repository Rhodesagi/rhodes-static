"""
Regular Expression Matching (LeetCode 10)

Implement regular expression matching with support for '.' and '*' where:
- '.' matches any single character
- '*' matches zero or more of the preceding element

The matching should cover the entire input string (not partial).
"""


def is_match(s: str, p: str) -> bool:
    """
    Determine if string s matches pattern p.
    
    Args:
        s: Input string containing only lowercase English letters
        p: Pattern containing lowercase English letters, '.', and '*'
    
    Returns:
        True if s matches p, False otherwise
    """
    m, n = len(s), len(p)
    
    # dp[i][j] = True if s[0:i] matches p[0:j]
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Empty string matches empty pattern
    dp[0][0] = True
    
    # Handle patterns like a*, a*b*, a*b*c* matching empty string
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            # '*' can eliminate the preceding char, so dp[0][j] depends on dp[0][j-2]
            dp[0][j] = dp[0][j - 2]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                # '*' can match zero of the preceding element
                # Check dp[i][j-2] (skip the 'x*' entirely)
                dp[i][j] = dp[i][j - 2]
                
                # Or '*' can match one or more if preceding element matches s[i-1]
                # Check if p[j-2] (the char before '*') matches s[i-1]
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    # dp[i-1][j] means we consumed s[i-1] but pattern stays (can match more)
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
                    
            elif p[j - 1] == '.':
                # '.' matches any single character
                dp[i][j] = dp[i - 1][j - 1]
                
            else:
                # Regular character must match exactly
                if p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


def test():
    """Run standard LeetCode test cases."""
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
        ("abcd", "d*", False),
        ("aaa", "ab*a*c*a", True),
        ("aabcbcbcaccbcaabc", "a*ab*bc*.*c*a*a*b*c", True),
    ]
    
    passed = 0
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result != expected:
            print(f"{status}: is_match('{s}', '{p}') = {result}, expected {expected}")
        else:
            print(f"{status}: is_match('{s}', '{p}') = {result}")
            passed += 1
    
    print(f"\n{passed}/{len(test_cases)} tests passed")
    return passed == len(test_cases)


if __name__ == "__main__":
    test()
