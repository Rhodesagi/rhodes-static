def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with support for '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    
    Dynamic Programming approach: O(m*n) time, O(m*n) space.
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
                
                # Or '*' can match one or more if preceding matches current char
                preceding = p[j - 2]
                if preceding == '.' or preceding == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
                    
            elif p[j - 1] == '.':
                # '.' matches any single character
                dp[i][j] = dp[i - 1][j - 1]
                
            else:
                # Exact character match required
                if p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


# ============ TEST CASES ============

def test_is_match():
    """Comprehensive test suite for regex matching."""
    test_cases = [
        # (s, p, expected, description)
        ("aa", "a", False, "single char doesn't match longer string"),
        ("aa", "a*", True, "* matches zero or more"),
        ("ab", ".*", True, ".* matches anything"),
        ("aab", "c*a*b", True, "complex pattern with multiple *"),
        ("mississippi", "mis*is*p*.", False, "no match"),
        ("mississippi", "mis*is*ip*.", True, "match with multiple *"),
        ("", "", True, "empty matches empty"),
        ("a", "", False, "non-empty doesn't match empty"),
        ("", "a*", True, "* can match zero occurrences"),
        ("", ".*", True, ".* matches empty"),
        ("aaa", "a*a", True, "* matches multiple then single"),
        ("aaa", "ab*a", False, "b* matches zero b's but needs a"),
        ("aaa", "ab*ac*a", True, "complex with multiple * and different chars"),
        ("a", "ab*", True, "* matches zero b's"),
        ("bbba", ".*a*a", True, ".* consumes bbb, a* matches final a"),
        ("ab", ".*c", False, "pattern expects c at end"),
        ("abc", "...", True, "three dots match three chars"),
        ("abcd", "...", False, "three dots don't match four chars"),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False, "long pattern no match"),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*b", True, "long pattern with match"),
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
    
    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"Success rate: {100*passed/(passed+failed):.1f}%")
    
    return failed == 0


if __name__ == "__main__":
    test_is_match()
