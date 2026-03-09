def is_match(s: str, p: str) -> bool:
    """
    Regular Expression Matching (LeetCode 10)
    
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    
    Args:
        s: input string
        p: pattern string
    
    Returns:
        True if s matches p, False otherwise
    """
    m, n = len(s), len(p)
    
    # dp[i][j] = True if s[:i] matches p[:j]
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Base case: empty string matches empty pattern
    dp[0][0] = True
    
    # Handle patterns that can match empty string (e.g., a*, a*b*)
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 2]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                # '*' can match zero of preceding char: dp[i][j-2]
                # OR match one more if preceding char matches s[i-1]
                zero_match = dp[i][j - 2]
                repeat_match = False
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    repeat_match = dp[i - 1][j]
                dp[i][j] = zero_match or repeat_match
            elif p[j - 1] == '.':
                # '.' matches any single char
                dp[i][j] = dp[i - 1][j - 1]
            else:
                # Exact character match
                dp[i][j] = dp[i - 1][j - 1] and p[j - 1] == s[i - 1]
    
    return dp[m][n]


# ============ TEST CASES ============

def test():
    """Comprehensive test suite matching LeetCode examples."""
    test_cases = [
        # (s, p, expected)
        ("aa", "a", False),           # "a" does not match entire string "aa"
        ("aa", "a*", True),           # '*' repeats 'a' zero or more times
        ("ab", ".*", True),           # ".*" matches any sequence
        ("aab", "c*a*b", True),       # "c*"=0 c's, "a*"=2 a's, "b"=1 b
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),               # empty matches empty
        ("a", "ab*", True),           # "b*" matches zero b's
        ("ab", ".*c", False),         # 'c' not in s
        ("aaa", "ab*a", False),       # can't match - need 'b' before '*'
        ("aaa", "a*a", True),         # "a*" matches "aa", final "a" matches "a"
        ("ab", ".*..", True),         # ".*" matches "a", ".." matches "ab" 
        ("aaa", "aaaa", False),       # need 4 a's, only have 3
        ("", "c*c*", True),           # zero matching works for empty string
        ("a", ".*..a*", False),       # pattern too long for single char
    ]
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "PASS" if result == expected else "FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print()
    if all_passed:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
    return all_passed


if __name__ == "__main__":
    test()
