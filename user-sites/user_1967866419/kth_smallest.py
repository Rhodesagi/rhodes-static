"""
Find kth smallest element in union of two sorted lists with linear complexity.
"""

def find_kth_smallest(arr1, arr2, k):
    """
    Return the kth smallest element (1-indexed) in the union of two sorted lists.
    
    Parameters:
    arr1, arr2: sorted lists of numbers (ascending)
    k: integer >= 1 and <= len(arr1) + len(arr2)
    
    Returns:
    The kth smallest element
    
    Raises:
    ValueError if k is out of bounds or arrays are not sorted ascending
    """
    if not isinstance(k, int) or k < 1:
        raise ValueError("k must be a positive integer")
    
    m, n = len(arr1), len(arr2)
    if k > m + n:
        raise ValueError(f"k={k} exceeds total length of arrays ({m}+{n}={m+n})")
    
    # Verify arrays are sorted ascending
    for i in range(1, m):
        if arr1[i] < arr1[i-1]:
            raise ValueError("arr1 is not sorted ascending")
    for i in range(1, n):
        if arr2[i] < arr2[i-1]:
            raise ValueError("arr2 is not sorted ascending")
    
    i = j = 0
    count = 0
    while i < m and j < n:
        if arr1[i] <= arr2[j]:
            candidate = arr1[i]
            i += 1
        else:
            candidate = arr2[j]
            j += 1
        count += 1
        if count == k:
            return candidate
    
    # If we exhausted one array, continue with the other
    while i < m:
        candidate = arr1[i]
        i += 1
        count += 1
        if count == k:
            return candidate
    
    while j < n:
        candidate = arr2[j]
        j += 1
        count += 1
        if count == k:
            return candidate
    
    # Should never reach here if k is within bounds
    raise RuntimeError("Algorithm error: k not found")

def test_find_kth_smallest():
    """Test suite for find_kth_smallest."""
    print("Running tests...")
    
    # Test 1: Basic case
    a = [1, 3, 5]
    b = [2, 4, 6]
    assert find_kth_smallest(a, b, 1) == 1
    assert find_kth_smallest(a, b, 2) == 2
    assert find_kth_smallest(a, b, 3) == 3
    assert find_kth_smallest(a, b, 4) == 4
    assert find_kth_smallest(a, b, 5) == 5
    assert find_kth_smallest(a, b, 6) == 6
    print("✓ Basic case passed")
    
    # Test 2: One array empty
    c = []
    d = [1, 2, 3]
    assert find_kth_smallest(c, d, 1) == 1
    assert find_kth_smallest(c, d, 3) == 3
    print("✓ Empty array case passed")
    
    # Test 3: Duplicates across arrays
    e = [1, 2, 2, 3]
    f = [2, 4, 5]
    assert find_kth_smallest(e, f, 1) == 1
    assert find_kth_smallest(e, f, 2) == 2
    assert find_kth_smallest(e, f, 3) == 2
    assert find_kth_smallest(e, f, 4) == 2
    assert find_kth_smallest(e, f, 5) == 3
    assert find_kth_smallest(e, f, 6) == 4
    assert find_kth_smallest(e, f, 7) == 5
    print("✓ Duplicates case passed")
    
    # Test 4: Larger random sorted arrays
    import random
    random.seed(42)
    g = sorted(random.sample(range(100), 30))
    h = sorted(random.sample(range(100), 40))
    merged = sorted(g + h)
    for idx, expected in enumerate(merged, start=1):
        result = find_kth_smallest(g, h, idx)
        if result != expected:
            print(f"Failed at k={idx}: expected {expected}, got {result}")
            return False
    print("✓ Random arrays (70 elements) passed")
    
    # Test 5: Error handling
    try:
        find_kth_smallest([1,2], [3,4], 5)
        print("✗ Should have raised ValueError for k > total length")
        return False
    except ValueError as e:
        assert "exceeds total length" in str(e)
    
    try:
        find_kth_smallest([1,2], [3,4], 0)
        print("✗ Should have raised ValueError for k < 1")
        return False
    except ValueError:
        pass
    
    try:
        find_kth_smallest([2,1], [3,4], 1)
        print("✗ Should have raised ValueError for unsorted array")
        return False
    except ValueError as e:
        assert "not sorted ascending" in str(e)
    
    print("✓ Error handling passed")
    print("All tests passed!")
    return True

if __name__ == "__main__":
    test_find_kth_smallest()
