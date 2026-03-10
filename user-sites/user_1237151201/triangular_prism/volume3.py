import math
from typing import Union

def find_Volume(
    base: Union[int, float],
    triangle_height: Union[int, float],
    prism_length: Union[int, float]
) -> float:
    """Calculate volume of a triangular prism.
    
    Volume = (1/2) * base * triangle_height * prism_length
    
    Args:
        base: length of the triangle's base (positive real number)
        triangle_height: height of the triangle (altitude from base to opposite vertex)
        prism_length: length of the prism (depth along the third dimension)
    
    Returns:
        Volume as float.
    
    Raises:
        TypeError: if any argument is not int or float, or is bool
        ValueError: if any dimension is not positive finite (≤0, NaN, infinity)
    """
    # Reject bool explicitly (bool is subclass of int but not a numeric dimension)
    if isinstance(base, bool) or isinstance(triangle_height, bool) or isinstance(prism_length, bool):
        raise TypeError("Boolean values are not accepted as dimensions")
    
    # Ensure numeric types (int or float, not bool)
    if not (isinstance(base, (int, float)) and isinstance(triangle_height, (int, float)) and isinstance(prism_length, (int, float))):
        raise TypeError("All arguments must be int or float")
    
    # Convert to float for uniform handling
    base_f = float(base)
    tri_f = float(triangle_height)
    prism_f = float(prism_length)
    
    # Validate dimensions are positive finite numbers
    for name, val in [("base", base_f), ("triangle_height", tri_f), ("prism_length", prism_f)]:
        if math.isnan(val) or math.isinf(val):
            raise ValueError(f"Dimension {name} must be a finite number, got {val}")
        if val <= 0:
            raise ValueError(f"Dimension {name} must be positive, got {val}")
    
    # Compute volume
    return 0.5 * base_f * tri_f * prism_f

if __name__ == "__main__":
    # Provided test cases
    assert find_Volume(10, 8, 6) == 240
    assert find_Volume(3, 2, 2) == 6
    assert find_Volume(1, 2, 1) == 1
    
    # Edge cases that should raise ValueError
    # Zero dimension
    try:
        find_Volume(0, 5, 5)
        raise AssertionError("Expected ValueError for zero base")
    except ValueError as e:
        assert "must be positive" in str(e)
    # Negative dimension
    try:
        find_Volume(-1, 2, 3)
        raise AssertionError("Expected ValueError for negative base")
    except ValueError as e:
        assert "must be positive" in str(e)
    # NaN
    try:
        find_Volume(float('nan'), 2, 3)
        raise AssertionError("Expected ValueError for NaN")
    except ValueError as e:
        assert "finite number" in str(e)
    # Infinity
    try:
        find_Volume(float('inf'), 2, 3)
        raise AssertionError("Expected ValueError for infinity")
    except ValueError as e:
        assert "finite number" in str(e)
    # Boolean
    try:
        find_Volume(True, True, True)
        raise AssertionError("Expected TypeError for boolean")
    except TypeError as e:
        assert "Boolean values" in str(e)
    # Non-numeric
    try:
        find_Volume("a", 2, 3)
        raise AssertionError("Expected TypeError for non-numeric")
    except TypeError as e:
        assert "must be int or float" in str(e)
    
    print("All tests passed")
