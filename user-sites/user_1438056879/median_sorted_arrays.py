"""
Find Median of Two Sorted Arrays
Time Complexity: O(log(min(m, n)))
Space Complexity: O(1)

Problem: Given two sorted arrays nums1 and nums2 of size m and n respectively,
return the median of the two sorted arrays.
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find median of two sorted arrays using binary search.
    
    The key insight is to partition both arrays such that:
    - Left half contains exactly half the total elements
    - All elements in left half <= all elements in right half
    
    Then median is:
    - If total is odd: max of left half
    - If total is even: (max of left + min of right) / 2
    """
    # Ensure nums1 is the smaller array to minimize binary search range
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    # Binary search on the smaller array (nums1)
    left, right = 0, m
    
    while left <= right:
        # Partition nums1 at position i (i elements go to left half)
        i = (left + right) // 2
        # Remaining elements for left half come from nums2
        j = total_left - i
        
        # Get boundary elements (handle edge cases with infinities)
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
                # Even total: median is average of max left and min right
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2
        
        elif nums1_left > nums2_right:
            # nums1's left is too big, move partition left
            right = i - 1
        else:
            # nums2's left is too big, move partition right
            left = i + 1
    
    raise ValueError("Input arrays must be sorted")


# ==================== TEST CASES ====================

def test_basic_cases():
    """Test basic functionality"""
    # Example 1: merged = [1, 2, 3, 4, 5, 6], median = (3+4)/2 = 3.5
    assert findMedianSortedArrays([1, 3, 5], [2, 4, 6]) == 3.5
    
    # Example 2: merged = [1, 2, 3, 4, 5], median = 3
    assert findMedianSortedArrays([1, 2, 3], [4, 5]) == 3.0
    
    print("✓ Basic cases passed")


def test_edge_cases():
    """Test edge cases"""
    # One empty array
    assert findMedianSortedArrays([], [1]) == 1.0
    assert findMedianSortedArrays([2], []) == 2.0
    
    # Both arrays single element
    assert findMedianSortedArrays([1], [2]) == 1.5
    
    # All elements in one array smaller
    assert findMedianSortedArrays([1, 2], [3, 4, 5, 6]) == 3.5
    assert findMedianSortedArrays([5, 6, 7], [1, 2, 3, 4]) == 4.0
    
    print("✓ Edge cases passed")


def test_duplicate_values():
    """Test arrays with duplicate values"""
    assert findMedianSortedArrays([1, 2, 2], [2, 3, 4]) == 2.0
    assert findMedianSortedArrays([1, 1, 1], [1, 1, 1, 1]) == 1.0
    
    print("✓ Duplicate values passed")


def test_negative_numbers():
    """Test with negative numbers"""
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    
    print("✓ Negative numbers passed")


def test_large_arrays():
    """Test with larger arrays"""
    nums1 = list(range(0, 10000, 2))  # Even numbers: 0, 2, 4, ...
    nums2 = list(range(1, 10001, 2))  # Odd numbers: 1, 3, 5, ...
    # Merged: 0, 1, 2, 3, ... 9999, median = (4999 + 5000) / 2 = 4999.5
    result = findMedianSortedArrays(nums1, nums2)
    assert result == 4999.5, f"Expected 4999.5, got {result}"
    
    print("✓ Large arrays passed")


if __name__ == "__main__":
    test_basic_cases()
    test_edge_cases()
    test_duplicate_values()
    test_negative_numbers()
    test_large_arrays()
    print("\n✅ All tests passed!")
