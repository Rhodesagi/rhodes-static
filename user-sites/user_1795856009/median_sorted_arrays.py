"""
Find Median of Two Sorted Arrays in O(log(m+n)) time.

Algorithm: Binary search on partitions of the smaller array.
We partition both arrays such that the left half contains half the elements
(or one more for odd total), and all elements in left <= all elements in right.
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find the median of two sorted arrays in O(log(min(m, n))) time.
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
    
    Returns:
        The median value as a float
    """
    # Ensure nums1 is the smaller array to minimize binary search range
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    # Binary search on nums1 partition point
    left, right = 0, m
    
    while left <= right:
        # i = number of elements from nums1 in left partition
        # j = number of elements from nums2 in left partition
        i = (left + right) // 2
        j = total_left - i
        
        # Elements at the partition boundaries
        # Use infinity for out-of-bounds to simplify comparisons
        nums1_left = float('-inf') if i == 0 else nums1[i - 1]
        nums1_right = float('inf') if i == m else nums1[i]
        nums2_left = float('-inf') if j == 0 else nums2[j - 1]
        nums2_right = float('inf') if j == n else nums2[j]
        
        # Check if we found the correct partition
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
            # nums1's left partition is too large, move left
            right = i - 1
        else:
            # nums1's left partition is too small, move right
            left = i + 1
    
    # Should never reach here with valid input
    raise ValueError("Input arrays must be sorted")


# ============ TEST CASES ============

def test_findMedianSortedArrays():
    """Run comprehensive test cases."""
    test_cases = [
        # (nums1, nums2, expected_median, description)
        ([1, 3], [2], 2.0, "Basic odd case"),
        ([1, 2], [3, 4], 2.5, "Basic even case"),
        ([], [1], 1.0, "One empty array, single element"),
        ([], [1, 2, 3, 4], 2.5, "One empty array, multiple elements"),
        ([1], [2], 1.5, "Single elements each"),
        ([1, 2, 3], [4, 5, 6], 3.5, "Equal length, interleaved"),
        ([1, 2], [1, 2, 3], 2.0, "Different lengths with duplicates"),
        ([1, 3, 5, 7], [2, 4, 6, 8], 4.5, "Perfect interleaving"),
        ([1, 2, 3, 4, 5], [6, 7, 8, 9, 10], 5.5, "All of nums1 < all of nums2"),
        ([6, 7, 8, 9, 10], [1, 2, 3, 4, 5], 5.5, "All of nums2 < all of nums1"),
        ([1, 1, 1], [1, 1], 1.0, "All same elements"),
        ([-5, -3, -1], [-2, 0, 2], -1.5, "Negative numbers"),
        ([1, 1, 1, 1], [1, 1, 1, 1], 1.0, "All identical elements"),
        ([1, 2, 3, 4], [], 2.5, "Second array empty"),
    ]
    
    print("Running test cases...\n")
    all_passed = True
    
    for nums1, nums2, expected, description in test_cases:
        result = findMedianSortedArrays(nums1, nums2)
        passed = abs(result - expected) < 1e-9
        status = "✓ PASS" if passed else "✗ FAIL"
        
        print(f"{status} | {description}")
        print(f"       nums1={nums1}, nums2={nums2}")
        print(f"       Expected: {expected}, Got: {result}\n")
        
        if not passed:
            all_passed = False
    
    print("=" * 50)
    if all_passed:
        print("All tests PASSED ✓")
    else:
        print("Some tests FAILED ✗")
    
    return all_passed


if __name__ == "__main__":
    test_findMedianSortedArrays()
