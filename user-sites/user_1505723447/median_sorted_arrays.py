"""
Median of Two Sorted Arrays
LeetCode 4. Hard

Finds the median of two sorted arrays in O(log(min(m, n))) time.
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find median of two sorted arrays in O(log(min(m, n))) time.
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
    
    Returns:
        Median value (float, even if result is integer)
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Elements needed in left partition
    
    # Binary search on nums1 (the smaller array)
    left, right = 0, m
    
    while left <= right:
        # Partition nums1: i elements from nums1 go to left half
        i = (left + right) // 2
        # Remaining elements for left half come from nums2
        j = total_left - i
        
        # Elements at partition boundaries
        # Use -inf/inf when partition is at array boundaries
        nums1_left = nums1[i - 1] if i > 0 else float('-inf')
        nums1_right = nums1[i] if i < m else float('inf')
        nums2_left = nums2[j - 1] if j > 0 else float('-inf')
        nums2_right = nums2[j] if j < n else float('inf')
        
        # Check if partition is correct
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Correct partition found
            if (m + n) % 2 == 1:
                # Odd total length: median is max of left side
                return float(max(nums1_left, nums2_left))
            else:
                # Even total length: median is average of max(left) and min(right)
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2.0
        
        elif nums1_left > nums2_right:
            # nums1's left partition too large, move left
            right = i - 1
        else:
            # nums1's left partition too small, move right
            left = i + 1
    
    # Should never reach here with valid input
    raise ValueError("Input arrays must be sorted")


# ============ TEST CASES ============

def test_basic_cases():
    """Test standard cases from LeetCode."""
    # Example 1: nums1 = [1,3], nums2 = [2]
    assert findMedianSortedArrays([1, 3], [2]) == 2.0
    
    # Example 2: nums1 = [1,2], nums2 = [3,4]
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5
    
    print("✓ Basic cases passed")


def test_edge_cases():
    """Test edge cases and boundary conditions."""
    # One empty array (odd length)
    assert findMedianSortedArrays([], [1]) == 1.0
    assert findMedianSortedArrays([2], []) == 2.0
    
    # One empty array (even length)
    assert findMedianSortedArrays([], [1, 2, 3, 4]) == 2.5
    assert findMedianSortedArrays([1, 2, 3, 4], []) == 2.5
    
    # Single element each
    assert findMedianSortedArrays([1], [2]) == 1.5
    assert findMedianSortedArrays([2], [1]) == 1.5
    
    # All elements in one array smaller
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6, 7, 8]) == 4.5
    assert findMedianSortedArrays([4, 5, 6, 7, 8], [1, 2, 3]) == 4.5
    
    # Duplicates
    assert findMedianSortedArrays([1, 2, 2], [2, 2, 3]) == 2.0
    
    # Negative numbers
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    
    print("✓ Edge cases passed")


def test_large_arrays():
    """Test with larger arrays to verify O(log n) efficiency."""
    nums1 = list(range(0, 1000, 2))  # 0, 2, 4, ..., 998
    nums2 = list(range(1, 1001, 2))  # 1, 3, 5, ..., 999
    
    # Combined: 0, 1, 2, 3, ..., 999 -> median is (499 + 500) / 2 = 499.5
    result = findMedianSortedArrays(nums1, nums2)
    assert result == 499.5
    
    print("✓ Large arrays passed")


def test_same_elements():
    """Test arrays with identical elements."""
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0
    assert findMedianSortedArrays([5, 5], [5, 5, 5, 5]) == 5.0
    
    print("✓ Same elements passed")


def run_all_tests():
    """Run all test cases."""
    print("Running tests for findMedianSortedArrays...\n")
    
    test_basic_cases()
    test_edge_cases()
    test_large_arrays()
    test_same_elements()
    
    print("\n" + "=" * 40)
    print("All tests passed! ✓")
    print("=" * 40)


if __name__ == "__main__":
    run_all_tests()
