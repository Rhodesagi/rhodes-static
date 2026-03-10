"""
Find kth smallest element in union of two sorted lists with linear complexity.
"""

def kth_smallest(arr1, arr2, k):
    """
    Return the kth smallest element (1-indexed) in the union of two sorted lists.
    
    Args:
        arr1: sorted list of numbers
        arr2: sorted list of numbers
        k: integer >= 1 and <= len(arr1) + len(arr2)
    
    Returns:
        The kth smallest element.
    
    Raises:
        ValueError: if k is out of range.
        IndexError: if both arrays are empty.
    """
    m, n = len(arr1), len(arr2)
    total = m + n
    if k < 1 or k > total:
        raise ValueError(f"k must be between 1 and {total}, got {k}")
    
    i = j = 0  # pointers in arr1 and arr2
    count = 0  # number of elements processed
    
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
    
    # If we reach here, one array is exhausted
    # Continue with the remaining array
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
    
    # Should never reach here if k is valid
    raise RuntimeError("Algorithm invariant violated")

def kth_smallest_0index(arr1, arr2, k):
    """0-indexed version (k from 0 to total-1)."""
    return kth_smallest(arr1, arr2, k + 1)

if __name__ == "__main__":
    # Test suite
    import sys
    
    def test_basic():
        arr1 = [1, 3, 5, 7]
        arr2 = [2, 4, 6, 8]
        # union: [1,2,3,4,5,6,7,8]
        for k in range(1, 9):
            expected = k
            result = kth_smallest(arr1, arr2, k)
            assert result == expected, f"k={k}: got {result}, expected {expected}"
        print("✓ Basic test passed")
    
    def test_duplicates():
        arr1 = [1, 2, 2, 3]
        arr2 = [2, 3, 4, 5]
        # union sorted: [1,2,2,2,3,3,4,5]
        expected = [1,2,2,2,3,3,4,5]
        for k, exp in enumerate(expected, start=1):
            result = kth_smallest(arr1, arr2, k)
            assert result == exp, f"k={k}: got {result}, expected {exp}"
        print("✓ Duplicates test passed")
    
    def test_empty():
        # one empty array
        arr1 = []
        arr2 = [1, 3, 5]
        for k in range(1, 4):
            result = kth_smallest(arr1, arr2, k)
            assert result == arr2[k-1], f"k={k}: got {result}, expected {arr2[k-1]}"
        # other empty
        arr1 = [2, 4, 6]
        arr2 = []
        for k in range(1, 4):
            result = kth_smallest(arr1, arr2, k)
            assert result == arr1[k-1], f"k={k}: got {result}, expected {arr1[k-1]}"
        print("✓ Empty array test passed")
    
    def test_single():
        arr1 = [42]
        arr2 = [17]
        assert kth_smallest(arr1, arr2, 1) == 17
        assert kth_smallest(arr1, arr2, 2) == 42
        print("✓ Single element test passed")
    
    def test_error_handling():
        arr1 = [1, 2]
        arr2 = [3, 4]
        try:
            kth_smallest(arr1, arr2, 0)
            assert False, "Should have raised ValueError"
        except ValueError:
            pass
        try:
            kth_smallest(arr1, arr2, 5)
            assert False, "Should have raised ValueError"
        except ValueError:
            pass
        print("✓ Error handling test passed")
    
    def test_large():
        import random
        m, n = 1000, 2000
        arr1 = sorted(random.randint(0, 10000) for _ in range(m))
        arr2 = sorted(random.randint(0, 10000) for _ in range(n))
        merged = sorted(arr1 + arr2)
        for k in [1, 10, 100, 1000, 2000, 2999, 3000]:
            result = kth_smallest(arr1, arr2, k)
            expected = merged[k-1]
            assert result == expected, f"k={k}: mismatch"
        print("✓ Large random test passed")
    
    try:
        test_basic()
        test_duplicates()
        test_empty()
        test_single()
        test_error_handling()
        test_large()
        print("\nAll tests passed!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
