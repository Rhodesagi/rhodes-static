def is_palindrome(s: str) -> bool:
    """
    Return True if s is a palindrome ignoring non-alphanumeric characters and case.
    
    Examples:
    >>> is_palindrome("A man, a plan, a canal: Panama")
    True
    >>> is_palindrome("race a car")
    False
    >>> is_palindrome("")
    True
    >>> is_palindrome("Madam, I'm Adam")
    True
    """
    # Build cleaned string: alphanumeric characters only, lowercased
    cleaned = ''.join(ch.lower() for ch in s if ch.isalnum())
    # Palindrome check
    return cleaned == cleaned[::-1]


if __name__ == "__main__":
    # Quick self‑test
    tests = [
        ("A man, a plan, a canal: Panama", True),
        ("race a car", False),
        ("", True),
        ("Madam, I'm Adam", True),
        ("12321", True),
        ("123abc", False),
        ("A", True),
        ("   ", True),          # only spaces -> empty cleaned -> True
        ("a." , True),          # dot filtered out, 'a' remains
        ("No 'x' in Nixon", True),
    ]
    
    all_pass = True
    for s, expected in tests:
        result = is_palindrome(s)
        if result == expected:
            print(f"✓ '{s}' -> {result}")
        else:
            print(f"✗ '{s}' -> expected {expected}, got {result}")
            all_pass = False
    
    if all_pass:
        print("\nAll tests passed.")
    else:
        print("\nSome tests failed.")
