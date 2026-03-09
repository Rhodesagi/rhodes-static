"""
Find Median of Two Sorted Arrays in O(log(min(m,n)))

LeetCode 4 - Hard
Time: O(log(min(m,n)))
Space: O(1)
"""

def findMedianSortedArrays(nums1: list[int], nums2: list[int]) -> float:
    """
    Find median of two sorted arrays using binary search partition.
    
    The key insight: we need to partition both arrays such that
    all elements in left half <= all elements in right half.
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    lo, hi = 0, m  # Binary search range in nums1
    
    while lo <= hi:
        # Partition nums1: i elements go to left
        i = (lo + hi) // 2
        # Remaining elements for left partition come from nums2
        j = total_left - i
        
        # Edge values (handle boundaries with -inf/inf)
        nums1_left = float('-inf') if i == 0 else nums1[i - 1]
        nums1_right = float('inf') if i == m else nums1[i]
        nums2_left = float('-inf') if j == 0 else nums2[j - 1]
        nums2_right = float('inf') if j == n else nums2[j]
        
        # Check if partition is correct
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Correct partition found
            if (m + n) % 2 == 1:
                # Odd total: median is max of left side
                return max(nums1_left, nums2_left)
            else:
                # Even total: median is average of max(left) and min(right)
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2
        
        elif nums1_left > nums2_right:
            # nums1's left is too big, move partition left
            hi = i - 1
        else:
            # nums2's left is too big, move partition right
            lo = i + 1
    
    raise ValueError("Arrays were not sorted or input was invalid")


# ============ TEST CASES ============

def test_findMedianSortedArrays():
    """Comprehensive test suite."""
    
    # Test 1: Basic case - even total
    assert findMedianSortedArrays([1, 3], [2]) == 2.0
    print("✓ Test 1: [1,3] + [2] = 2.0")
    
    # Test 2: Basic case - even total
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5
    print("✓ Test 2: [1,2] + [3,4] = 2.5")
    
    # Test 3: One empty array
    assert findMedianSortedArrays([], [1]) == 1.0
    print("✓ Test 3: [] + [1] = 1.0")
    
    # Test 4: One empty array with even elements
    assert findMedianSortedArrays([], [2, 3]) == 2.5
    print("✓ Test 4: [] + [2,3] = 2.5")
    
    # Test 5: All elements in one array smaller
    assert findMedianSortedArrays([1, 2], [3, 4, 5, 6]) == 3.5
    print("✓ Test 5: [1,2] + [3,4,5,6] = 3.5")
    
    # Test 6: All elements in one array larger
    assert findMedianSortedArrays([5, 6, 7], [1, 2, 3, 4]) == 4.0
    print("✓ Test 6: [5,6,7] + [1,2,3,4] = 4.0")
    
    # Test 7: Single element each - odd total
    assert findMedianSortedArrays([1], [2]) == 1.5
    print("✓ Test 7: [1] + [2] = 1.5")
    
    # Test 8: Single element each - different values
    assert findMedianSortedArrays([2], [1]) == 1.5
    print("✓ Test 8: [2] + [1] = 1.5")
    
    # Test 9: Large arrays - stress test
    nums1 = list(range(0, 1000000, 2))  # Even numbers
    nums2 = list(range(1, 1000001, 2))  # Odd numbers
    result = findMedianSortedArrays(nums1, nums2)
    expected = 499999.5  # Median of 0..999999
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 9: Large arrays (1M elements total) = 499999.5")
    
    # Test 10: Duplicates
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0
    print("✓ Test 10: Duplicates [1,1,1] + [1,1] = 1.0")
    
    # Test 11: Negative numbers
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    print("✓ Test 11: Negatives [-5,-3,-1] + [-2,0,2] = -1.5")
    
    print("\n✅ All tests passed!")


if __name__ == "__main__":
    test_findMedianSortedArrays()
