"""
Find Median of Two Sorted Arrays in O(log(min(m,n))) time.

LeetCode 4. Median of Two Sorted Arrays
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find the median of two sorted arrays using binary search.
    Time Complexity: O(log(min(m, n)))
    Space Complexity: O(1)
    """
    # Ensure nums1 is the smaller array for efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    # Binary search on the smaller array (nums1)
    left, right = 0, m
    
    while left <= right:
        # Partition nums1: i elements from nums1 go to left half
        i = (left + right) // 2
        # Remaining elements for left half come from nums2
        j = total_left - i
        
        # Elements at the partition boundaries
        nums1_left = nums1[i - 1] if i > 0 else float('-inf')
        nums1_right = nums1[i] if i < m else float('inf')
        nums2_left = nums2[j - 1] if j > 0 else float('-inf')
        nums2_right = nums2[j] if j < n else float('inf')
        
        # Check if we found the correct partition
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Found the correct partition
            if (m + n) % 2 == 1:
                # Odd total: median is max of left side
                return max(nums1_left, nums2_left)
            else:
                # Even total: median is average of max(left) and min(right)
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2.0
        
        elif nums1_left > nums2_right:
            # Too many elements from nums1 in left partition, move left
            right = i - 1
        else:
            # Too few elements from nums1 in left partition, move right
            left = i + 1
    
    # Should never reach here if inputs are valid sorted arrays
    raise ValueError("Input arrays must be sorted")


# ==================== TEST CASES ====================

def test_basic_cases():
    """Test standard cases."""
    # Example 1: nums1 = [1,3], nums2 = [2] -> median = 2.0
    assert findMedianSortedArrays([1, 3], [2]) == 2.0
    
    # Example 2: nums1 = [1,2], nums2 = [3,4] -> median = (2+3)/2 = 2.5
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5
    
    print("✓ Basic cases passed")


def test_edge_cases():
    """Test edge cases."""
    # One empty array
    assert findMedianSortedArrays([], [1]) == 1.0
    assert findMedianSortedArrays([2], []) == 2.0
    
    # Both single element
    assert findMedianSortedArrays([1], [2]) == 1.5
    
    # One array much larger
    assert findMedianSortedArrays([1], [2, 3, 4, 5, 6]) == 3.5
    assert findMedianSortedArrays([2, 3, 4, 5, 6], [1]) == 3.5
    
    # All elements in one array smaller than other
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6, 7, 8]) == 4.5
    assert findMedianSortedArrays([4, 5, 6, 7, 8], [1, 2, 3]) == 4.5
    
    print("✓ Edge cases passed")


def test_duplicate_values():
    """Test arrays with duplicates."""
    assert findMedianSortedArrays([1, 2, 2], [2, 3, 4]) == 2.0
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0
    assert findMedianSortedArrays([1, 2, 3, 4], [2, 3, 4, 5]) == 3.0
    
    print("✓ Duplicate values cases passed")


def test_negative_numbers():
    """Test with negative numbers."""
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    assert findMedianSortedArrays([-10, -5], [1, 2, 3]) == 1.0
    
    print("✓ Negative numbers cases passed")


def test_large_arrays():
    """Test with larger arrays to verify efficiency."""
    nums1 = list(range(0, 10000, 2))  # Even numbers: 0, 2, 4, ..., 9998
    nums2 = list(range(1, 10001, 2))  # Odd numbers: 1, 3, 5, ..., 9999
    
    # Combined: 0, 1, 2, 3, ..., 9999 -> median = (4999 + 5000) / 2 = 4999.5
    result = findMedianSortedArrays(nums1, nums2)
    assert result == 4999.5, f"Expected 4999.5, got {result}"
    
    print("✓ Large arrays case passed")


def run_all_tests():
    """Run all test cases."""
    print("Running tests for findMedianSortedArrays...\n")
    
    test_basic_cases()
    test_edge_cases()
    test_duplicate_values()
    test_negative_numbers()
    test_large_arrays()
    
    print("\n✅ All tests passed!")


if __name__ == "__main__":
    run_all_tests()
