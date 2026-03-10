from typing import List

def parse_nested_parens(paren_string: str) -> List[int]:
    """ Input to this function is a string represented multiple groups for nested parentheses separated by spaces.
    For each of the group, output the deepest level of nesting of parentheses.
    E.g. (()()) has maximum two levels of nesting while ((())) has three.

    >>> parse_nested_parens('(()()) ((())) () ((())()())')
    [2, 3, 1, 3]
    """
    if not paren_string:
        return []
    
    groups = paren_string.split()
    result = []
    
    for group in groups:
        current_depth = 0
        max_depth = 0
        for char in group:
            if char == '(':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == ')':
                current_depth -= 1
        result.append(max_depth)
    
    return result


if __name__ == "__main__":
    # Test with the provided example
    test_input = '(()()) ((())) () ((())()())'
    expected = [2, 3, 1, 3]
    result = parse_nested_parens(test_input)
    print(f"Input: {test_input}")
    print(f"Result: {result}")
    print(f"Expected: {expected}")
    print(f"Match: {result == expected}")
