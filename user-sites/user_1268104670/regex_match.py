def is_match(s: str, p: str) -> bool:
    """
    Regular expression matching with '.' and '*'.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    Full string match required.
    """
    m, n = len(s), len(p)
    
    # dp[i][j] = True if s[0:i] matches p[0:j]
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
                dp[i][j] = dp[i][j - 2]
                
                # Or * can match one or more if preceding matches current char
                preceding = p[j - 2]
                if preceding == '.' or preceding == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            else:
                # Direct match or '.' wildcard
                if p[j - 1] == '.' or p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


# ============ TEST CASES ============

def test():
    # LeetCode 10 standard test cases
    test_cases = [
        ("aa", "a", False),           # a doesn't match aa
        ("aa", "a*", True),           # a* matches aa
        ("ab", ".*", True),           # .* matches anything
        ("aab", "c*a*b", True),       # c* (zero c) + a* (two a) + b = aab
        ("mississippi", "mis*is*p*.", False),  # complex non-match
        ("", "", True),               # empty matches empty
        ("a", "ab*", True),           # b* matches zero b's
        ("aaa", "ab*a", False),       # b* can't produce aaa
        ("aaa", "a*a", True),         # a* matches two a's, last a matches
        ("ab", ".*c", False),         # no c at end
        ("aaa", "a*", True),          # a* matches any number of a's
        ("aaab", "a*aab", True),      # a* matches aa, then aab
        ("aasdfasdfasdfasdfas", "aasdf.*asdf.*asdf.*asdf.*s", True),  # long pattern
    ]
    
    all_passed = True
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print()
    if all_passed:
        print("All test cases passed!")
    else:
        print("Some test cases failed!")
    return all_passed


if __name__ == "__main__":
    test()
