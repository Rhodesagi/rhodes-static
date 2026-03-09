"""
LeetCode 10: Regular Expression Matching
Implements is_match(s, p) supporting '.' and '*'
"""


def is_match(s: str, p: str) -> bool:
    """
    Determines if string s matches pattern p.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    """
    m, n = len(s), len(p)
    # dp[i][j] = True if s[0:i] matches p[0:j]
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Base case: empty string matches empty pattern
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
                # Check if p[j-2] (preceding element) matches s[i-1]
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
                    
            elif p[j - 1] == '.':
                # '.' matches any single character
                dp[i][j] = dp[i - 1][j - 1]
                
            else:
                # Regular character match
                dp[i][j] = dp[i - 1][j - 1] and p[j - 1] == s[i - 1]
    
    return dp[m][n]


def test():
    """Run all test cases including LeetCode examples."""
    test_cases = [
        # (s, p, expected, description)
        ("aa", "a", False, "Example 1: 'a' does not match 'aa'"),
        ("aa", "a*", True, "Example 2: 'a*' matches 'aa' (zero or more a)"),
        ("ab", ".*", True, "Example 3: '.*' matches 'ab' (any char sequence)"),
        ("aab", "c*a*b", True, "Multiple *: c* matches 0 c's, a* matches 'aa'"),
        ("mississippi", "mis*is*p*.", False, "Complex pattern with multiple *"),
        ("", "", True, "Empty string and pattern"),
        ("", "a*", True, "Empty string matches a*"),
        ("", ".*", True, "Empty string matches .*"),
        ("a", "ab*", True, "b* matches zero b's"),
        ("aaa", "ab*a", False, "b* cannot produce enough a's"),
        ("aaa", "a*a", True, "First a* matches 'aa', second a matches 'a'"),
        ("abcd", "d*", False, "d* only matches d's, not other chars"),
        ("aaa", "a*", True, "a* matches any number of a's"),
        ("ab", ".*c", False, ".* matches 'ab' but no c at end"),
        ("abc", "a.c", True, ". matches 'b'"),
        ("abc", "a.*c", True, ".* matches 'b'"),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False, "Long string, pattern ends with c"),
        ("aaa", "ab*a*c*a", True, "Multiple * in pattern"),
    ]
    
    passed = 0
    failed = 0
    
    for s, p, expected, desc in test_cases:
        result = is_match(s, p)
        status = "PASS" if result == expected else "FAIL"
        if result == expected:
            passed += 1
            print(f"✓ {status}: {desc}")
        else:
            failed += 1
            print(f"✗ {status}: {desc}")
            print(f"  Input: s='{s}', p='{p}'")
            print(f"  Expected: {expected}, Got: {result}")
    
    print(f"\n{passed}/{len(test_cases)} tests passed")
    if failed > 0:
        print(f"{failed} tests failed")
    return failed == 0


if __name__ == "__main__":
    success = test()
    exit(0 if success else 1)
