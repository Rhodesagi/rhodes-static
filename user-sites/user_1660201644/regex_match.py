"""
LeetCode 10: Regular Expression Matching
'.' matches any single character
'*' matches zero or more of the preceding element
"""


def is_match(s: str, p: str) -> bool:
    """
    Dynamic programming solution for regex matching.
    dp[i][j] = True if s[:i] matches p[:j]
    """
    m, n = len(s), len(p)
    # dp[i][j] = does s[0:i] match p[0:j]?
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
                # Check if p[j-2] (the char before *) matches s[i-1]
                if not dp[i][j]:  # Only check if zero-match didn't work
                    if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                        dp[i][j] = dp[i - 1][j]
            
            elif p[j - 1] == '.':
                # '.' matches any single character
                dp[i][j] = dp[i - 1][j - 1]
            
            else:
                # Exact character match required
                if p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
    
    return dp[m][n]


def test():
    """Comprehensive test suite matching LeetCode examples and edge cases."""
    test_cases = [
        # (s, p, expected)
        ("aa", "a", False),           # Example 1: "a" does not match "aa"
        ("aa", "a*", True),           # Example 2: "a*" matches "aa"
        ("ab", ".*", True),           # Example 3: ".*" matches "ab"
        ("aab", "c*a*b", True),       # Example 4: "c*a*b" matches "aab"
        ("mississippi", "mis*is*p*.", False),  # Example 5
        ("", "", True),               # Empty strings
        ("a", "", False),             # Pattern empty, string not
        ("", "a*", True),             # Star can match zero
        ("", ".*", True),             # .* matches empty
        ("aaa", "a*a", True),         # Multiple matches
        ("aaa", "ab*a", False),       # No match
        ("aaa", "ab*ac*a", True),     # Complex pattern
        ("ab", ".*c", False),         # Pattern too long
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False),  # Long no-match
        ("a", ".*..a*", False),       # Pattern requires more chars
        ("abc", "a*b*c*", True),      # All stars match zero
        ("aaa", "aaaa", False),       # Not enough stars
        ("aaa", ".a", False),         # Pattern too short
        ("aab", "c*a*b*", False),     # b* matches zero b's, need b at end
        ("aabc", "a*abc", True),      # Star matches some, not all
        ("aaa", "ab*a*c*a", True),    # Multiple stars interleaved
        ("aaba", "ab*a*c*a", False),  # Doesn't match
        ("bbbba", ".*a*a", True),     # .* consumes, stars handle rest
        ("bc", ".*c", True),          # .* matches "b", c matches "c"
        ("abc", "abc", True),         # Exact match, no wildcards
        ("abc", "abd", False),        # Exact mismatch
        ("ab", ".*c", False),         # Need c at end
        ("abc", "a.c", True),         # Dot in middle
        ("abc", "a.*c", True),        # Dot-star in middle
        ("ac", "a.*c", True),         # Dot-star matches nothing between
        ("adc", "a.*c", True),        # Dot-star matches "d"
        ("abbbbc", "ab*c", True),     # Star matches multiple b's
        ("ac", "ab*c", True),         # Star matches zero b's
    ]
    
    passed = 0
    failed = []
    
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "PASS" if result == expected else "FAIL"
        
        if result == expected:
            passed += 1
        else:
            failed.append((s, p, expected, result))
        
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
    
    print(f"\n{passed}/{len(test_cases)} tests passed")
    
    if failed:
        print("\nFailed cases:")
        for s, p, expected, got in failed:
            print(f"  is_match({s!r}, {p!r}): got {got}, expected {expected}")
        return False
    return True


if __name__ == "__main__":
    test()
