"""
Median of Two Sorted Arrays - O(log(m+n)) Solution

Problem: Find the median of two sorted arrays nums1 and nums2.
Time Complexity: O(log(min(m, n))) where m, n are array lengths
Space Complexity: O(1)
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find median of two sorted arrays using binary search on partitions.
    
    The key insight: we need to partition both arrays such that:
    - Left half contains half (or half+1) of total elements
    - Every element in left half <= every element in right half
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    # Binary search on partition point in nums1
    left, right = 0, m
    
    while left <= right:
        # Partition nums1 at position i (i elements go to left)
        i = (left + right) // 2
        # Remaining elements for left partition come from nums2
        j = total_left - i
        
        # Get border elements (handle boundaries with infinities)
        nums1_left = float('-inf') if i == 0 else nums1[i - 1]
        nums1_right = float('inf') if i == m else nums1[i]
        nums2_left = float('-inf') if j == 0 else nums2[j - 1]
        nums2_right = float('inf') if j == n else nums2[j]
        
        # Check if we found the correct partition
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
            # nums1's left partition is too big, move left
            right = i - 1
        else:
            # nums1's left partition is too small, move right
            left = i + 1
    
    # Should never reach here if inputs are valid sorted arrays
    raise ValueError("Input arrays must be sorted")


# ============ TEST CASES ============

def run_tests():
    """Run comprehensive test cases."""
    test_cases = [
        # (nums1, nums2, expected_median)
        ([1, 3], [2], 2.0),                    # Basic odd case
        ([1, 2], [3, 4], 2.5),                 # Basic even case
        ([], [1], 1.0),                        # One empty array
        ([], [1, 2], 1.5),                     # One empty array, even
        ([1], [], 1.0),                        # Other empty array
        ([1, 3], [2, 4], 2.5),                 # Equal length arrays
        ([1, 2, 3], [4, 5, 6, 7, 8], 4.5),     # Different lengths
        ([1, 2, 3, 4, 5], [6, 7, 8, 9, 10], 5.5),  # All nums1 < nums2
        ([6, 7, 8, 9, 10], [1, 2, 3, 4, 5], 5.5),  # All nums1 > nums2
        ([-5, 3, 6, 12, 15], [-12, -10, 6, 20], 6.0),  # With negatives
        ([1, 1, 1, 1], [1, 1, 1, 1], 1.0),     # All same elements
        ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 10.5),  # Large arrays
        ([1, 2], [-1, 3], 1.5),                # Mixed positive/negative
        ([100000], [-100000], 0.0),            # Large range
        ([1, 5, 9, 13], [2, 6, 10, 14], 7.5),  # Interleaved
    ]
    
    print("Running tests...")
    print("=" * 50)
    
    all_passed = True
    for i, (nums1, nums2, expected) in enumerate(test_cases, 1):
        result = findMedianSortedArrays(nums1, nums2)
        passed = abs(result - expected) < 1e-9
        status = "PASS" if passed else "FAIL"
        
        print(f"Test {i:2d}: {status}")
        print(f"  nums1: {nums1}")
        print(f"  nums2: {nums2}")
        print(f"  Expected: {expected}, Got: {result}")
        print()
        
        if not passed:
            all_passed = False
    
    print("=" * 50)
    if all_passed:
        print("All tests PASSED!")
    else:
        print("Some tests FAILED!")
    
    return all_passed


if __name__ == "__main__":
    run_tests()
