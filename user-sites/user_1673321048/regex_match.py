"""
LeetCode 10: Regular Expression Matching
Implements is_match(s, p) supporting '.' and '*'.
"""


def is_match(s: str, p: str) -> bool:
    """
    Returns True if string s matches pattern p.
    '.' matches any single character.
    '*' matches zero or more of the preceding element.
    """
    m, n = len(s), len(p)
    # dp[i][j] = True if s[0:i] matches p[0:j]
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    
    # Empty string matches empty pattern
    dp[0][0] = True
    
    # Pattern matching empty string: a*b*c* can match empty
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 2]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                # Zero occurrences of preceding element
                dp[i][j] = dp[i][j - 2]
                # One or more occurrences if preceding matches s[i-1]
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    dp[i][j] = dp[i][j] or dp[i - 1][j]
            elif p[j - 1] == '.':
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = dp[i - 1][j - 1] and p[j - 1] == s[i - 1]
    
    return dp[m][n]


def is_match_optimized(s: str, p: str) -> bool:
    """
    Space-optimized version using O(n) space.
    Only keeps previous row of DP table.
    """
    m, n = len(s), len(p)
    prev = [False] * (n + 1)
    curr = [False] * (n + 1)
    
    prev[0] = True
    for j in range(2, n + 1):
        if p[j - 1] == '*':
            prev[j] = prev[j - 2]
    
    for i in range(1, m + 1):
        curr[0] = False
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                curr[j] = curr[j - 2]
                if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                    curr[j] = curr[j] or prev[j]
            elif p[j - 1] == '.':
                curr[j] = prev[j - 1]
            else:
                curr[j] = prev[j - 1] and p[j - 1] == s[i - 1]
        prev, curr = curr, prev
    
    return prev[n]


# ===== TEST CASES =====
if __name__ == "__main__":
    test_cases = [
        # (s, p, expected)
        ("aa", "a", False),
        ("aa", "a*", True),
        ("ab", ".*", True),
        ("aab", "c*a*b", True),
        ("mississippi", "mis*is*p*.", False),
        ("", "", True),
        ("a", ".", True),
        ("a", "..", False),
        ("aaa", "a*a", True),
        ("aaa", "ab*a", False),
        ("aaa", "ab*ac*a", True),
        ("aaab", "a*aab", True),
        ("a", "ab*", True),
        ("bbbba", ".*a*a", True),
        ("ab", ".*c", False),
        ("aaaaaaaaaaaaab", "a*a*a*a*a*a*a*a*a*a*c", False),
    ]
    
    print("Running test cases...")
    all_passed = True
    
    for s, p, expected in test_cases:
        result = is_match(s, p)
        status = "PASS" if result == expected else "FAIL"
        if result != expected:
            all_passed = False
        print(f"{status}: is_match({s!r}, {p!r}) = {result} (expected {expected})")
        
        # Verify optimized version matches
        result_opt = is_match_optimized(s, p)
        if result_opt != expected:
            print(f"  OPTIMIZED FAIL: is_match_optimized returned {result_opt}")
            all_passed = False
    
    print()
    if all_passed:
        print("All test cases passed!")
    else:
        print("Some test cases failed.")
