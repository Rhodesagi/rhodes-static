"""
Regular Expression Matching (LeetCode 10)

Implement regular expression matching with support for '.' and '*'.
- '.' matches any single character
- '*' matches zero or more of the preceding element

The matching should cover the entire input string (not partial).
"""


def is_match(s: str, p: str) -> bool:
    """
    Determine if string s matches pattern p.
    
    Args:
        s: Input string containing only lowercase letters
        p: Pattern containing lowercase letters, '.', and '*'
    
    Returns:
        True if s matches p, False otherwise
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
            if p[j - 1] == '.':
                # '.' matches any single character
                dp[i][j] = dp[i - 1][j - 1]
            elif p[j - 1] == '*':
                # '*' matches zero or more of preceding element
                # Option 1: Zero occurrences - skip the preceding char and '*'
                dp[i][j] = dp[i][j - 2]
                
                # Option 2: One or more occurrences
                # Check if preceding char matches current char in s
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                # Exact character match required
                if p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


# ============ TEST CASES ============

def test_is_match():
    """Run all test cases against the implementation."""
    test_cases = [
        # (s, p, expected)
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),
        ("a", "ab*", True),
        ("a", "a", True),
        ("a", ".", True),
        ("a", "a*", True),
        ("aaa", "aa", False),
        ("aaa", "a*a", True),
        ("aaa", "ab*a", False),
        ("aaa", "ab*ac*a", True),
        ("aaab", "a*a*a*b", True),
        ("aaab", ".*b", True),
        ("abc", "a.c", True),
        ("abc", "...", True),
        ("abcdef", "a.c.*f", True),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False),
    ]
    
    print("Testing is_match (DP solution):")
    print("-" * 50)
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "PASS" if result == expected else "FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match('{s}', '{p}') = {result}, expected {expected}")
    
    print("\n" + "=" * 50)
    if all_passed:
        print("ALL TESTS PASSED!")
    else:
        print("SOME TESTS FAILED!")
    
    return all_passed


if __name__ == "__main__":
    test_is_match()
