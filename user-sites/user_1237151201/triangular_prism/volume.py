def find_Volume(base, triangle_height, prism_length):
    """Calculate volume of a triangular prism.
    
    Volume = (1/2) * base * triangle_height * prism_length
    
    Args:
        base: length of the triangle's base
        triangle_height: height of the triangle (altitude from base to opposite vertex)
        prism_length: length of the prism (depth along the third dimension)
    
    Returns:
        Volume as float.
    
    Raises:
        TypeError: if any argument is not numeric
        ValueError: if any dimension is negative
    """
    # Ensure numeric types
    try:
        base = float(base)
        triangle_height = float(triangle_height)
        prism_length = float(prism_length)
    except (TypeError, ValueError):
        raise TypeError("All arguments must be numeric")
    
    # Validate dimensions are non-negative
    if base < 0 or triangle_height < 0 or prism_length < 0:
        raise ValueError("Dimensions must be non-negative")
    
    # Compute volume
    return 0.5 * base * triangle_height * prism_length

if __name__ == "__main__":
    # Provided test cases
    assert find_Volume(10, 8, 6) == 240
    assert find_Volume(3, 2, 2) == 6
    assert find_Volume(1, 2, 1) == 1
    # Edge cases
    assert find_Volume(0, 5, 5) == 0
    assert find_Volume(2.5, 4, 2) == 10.0
    # Negative input should raise ValueError
    try:
        find_Volume(-1, 2, 3)
        raise AssertionError("Expected ValueError for negative base")
    except ValueError:
        pass
    # Non-numeric input should raise TypeError
    try:
        find_Volume("a", 2, 3)
        raise AssertionError("Expected TypeError for non-numeric")
    except TypeError:
        pass
    print("All tests passed")
