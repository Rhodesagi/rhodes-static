"""
Median of Two Sorted Arrays

Finds the median of two sorted arrays in O(log(min(m, n))) time using binary search
on the smaller array to find the correct partition point.
"""
from typing import List, Union


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find the median of two sorted arrays in O(log(min(m, n))) time.
    
    Algorithm: Binary search partition on the smaller array.
    We partition both arrays such that:
    - left side has (m + n + 1) // 2 elements
    - all elements in left <= all elements in right
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
        
    Returns:
        The median value as a float
        
    Raises:
        ValueError: If both arrays are empty
        
    Time Complexity: O(log(min(m, n)))
    Space Complexity: O(1)
    """
    # Ensure nums1 is the smaller array to minimize binary search steps
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    
    if m == 0 and n == 0:
        raise ValueError("Both arrays cannot be empty")
    
    # Binary search on the smaller array (nums1)
    left, right = 0, m
    total_left = (m + n + 1) // 2  # Size of left partition
    
    while left <= right:
        # Partition nums1 at position i (i elements in left part)
        i = (left + right) // 2
        # Corresponding partition in nums2
        j = total_left - i
        
        # Get boundary values (handle empty partitions with -inf/+inf)
        nums1_left = nums1[i - 1] if i > 0 else float('-inf')
        nums1_right = nums1[i] if i < m else float('inf')
        nums2_left = nums2[j - 1] if j > 0 else float('-inf')
        nums2_right = nums2[j] if j < n else float('inf')
        
        # Check if we found the correct partition
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Correct partition found
            if (m + n) % 2 == 1:
                # Odd total: median is max of left side
                return float(max(nums1_left, nums2_left))
            else:
                # Even total: median is average of max(left) and min(right)
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2.0
        
        elif nums1_left > nums2_right:
            # nums1's left partition too big, move left
            right = i - 1
        else:
            # nums1's left partition too small, move right
            left = i + 1
    
    # Should never reach here if inputs are valid sorted arrays
    raise RuntimeError("Failed to find median - ensure arrays are sorted")


def test_findMedianSortedArrays():
    """Comprehensive test cases for findMedianSortedArrays."""
    
    # Test 1: Basic case - odd total (Example 1 from LeetCode)
    assert findMedianSortedArrays([1, 3], [2]) == 2.0, "Test 1 failed"
    
    # Test 2: Basic case - even total (Example 2 from LeetCode)
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5, "Test 2 failed"
    
    # Test 3: One array empty
    assert findMedianSortedArrays([], [1]) == 1.0, "Test 3 failed"
    assert findMedianSortedArrays([2], []) == 2.0, "Test 4 failed"
    
    # Test 4: Both arrays single element
    assert findMedianSortedArrays([1], [2]) == 1.5, "Test 5 failed"
    
    # Test 5: All elements in one array smaller (even total: 8 elements)
    # Combined: [1, 2, 3, 4, 5, 6, 7, 8], median = (4 + 5) / 2 = 4.5
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6, 7, 8]) == 4.5, "Test 6 failed"
    assert findMedianSortedArrays([4, 5, 6, 7, 8], [1, 2, 3]) == 4.5, "Test 7 failed"
    
    # Test 6: Interleaved arrays (even total: 6 elements)
    # Combined: [1, 2, 3, 4, 5, 6], median = (3 + 4) / 2 = 3.5
    assert findMedianSortedArrays([1, 3, 5], [2, 4, 6]) == 3.5, "Test 8 failed"
    
    # Test 7: Large arrays (1 million elements total)
    nums1 = list(range(0, 1000000, 2))  # Even numbers: 0, 2, 4, ..., 999998
    nums2 = list(range(1, 1000000, 2))  # Odd numbers: 1, 3, 5, ..., 999999
    result = findMedianSortedArrays(nums1, nums2)
    expected = 499999.5  # Median of 0..999999
    assert result == expected, f"Test 9 failed: got {result}, expected {expected}"
    
    # Test 8: Duplicate elements
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0, "Test 10 failed"
    
    # Test 9: Negative numbers
    # Combined: [-5, -3, -2, -1, 0, 2], median = (-2 + -1) / 2 = -1.5
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5, "Test 11 failed"
    
    # Test 10: nums1 much smaller than nums2
    # Combined: [1, 2, 3, 4, 5, 6], median = (3 + 4) / 2 = 3.5
    assert findMedianSortedArrays([2], [1, 3, 4, 5, 6]) == 3.5, "Test 12 failed"
    
    # Test 11: nums2 much smaller than nums1
    assert findMedianSortedArrays([1, 3, 4, 5, 6], [2]) == 3.5, "Test 13 failed"
    
    # Test 12: Arrays with same elements
    assert findMedianSortedArrays([1, 2, 3], [1, 2, 3]) == 2.0, "Test 14 failed"
    
    # Test 13: Single element arrays
    assert findMedianSortedArrays([1], [1]) == 1.0, "Test 15 failed"
    
    # Test 14: One single element, one multi-element
    assert findMedianSortedArrays([2], [1, 3, 4]) == 2.5, "Test 16 failed"
    
    # Test 15: Large value ranges
    assert findMedianSortedArrays([1000000], [1000001]) == 1000000.5, "Test 17 failed"
    
    print("All tests passed!")


if __name__ == "__main__":
    test_findMedianSortedArrays()
