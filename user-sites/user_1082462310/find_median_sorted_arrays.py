"""
Find Median of Two Sorted Arrays
LeetCode 4 - Hard
Time Complexity: O(log(min(m, n)))
Space Complexity: O(1)
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find the median of two sorted arrays.
    
    Algorithm: Binary search on the smaller array to find the correct partition.
    The partition ensures all elements on the left are <= all elements on the right.
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
    
    Returns:
        The median value
    """
    # Ensure nums1 is the smaller array for efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    left, right = 0, m
    
    # Total elements in left partition should be half (rounded up for odd)
    total_left = (m + n + 1) // 2
    
    while left <= right:
        # Partition nums1 at position i (i elements go to left)
        i = (left + right) // 2
        # Remaining elements for left partition come from nums2
        j = total_left - i
        
        # Elements at partition boundaries
        # Use -inf/inf when partition is at array boundary
        nums1_left = float('-inf') if i == 0 else nums1[i - 1]
        nums1_right = float('inf') if i == m else nums1[i]
        nums2_left = float('-inf') if j == 0 else nums2[j - 1]
        nums2_right = float('inf') if j == n else nums2[j]
        
        # Check if partition is correct
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Correct partition found
            # Calculate median based on total length
            if (m + n) % 2 == 1:
                # Odd total length: median is max of left side
                return max(nums1_left, nums2_left)
            else:
                # Even total length: median is average of max(left) and min(right)
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2.0
        
        elif nums1_left > nums2_right:
            # Too far right in nums1, move left
            right = i - 1
        else:
            # Too far left in nums1, move right
            left = i + 1
    
    # Should never reach here if inputs are valid
    raise ValueError("Input arrays must be sorted")


# ============== TEST HARNESS ==============

def test_find_median():
    """Test cases for findMedianSortedArrays"""
    test_cases = [
        # (nums1, nums2, expected_median)
        ([1, 3], [2], 2.0),
        ([1, 2], [3, 4], 2.5),
        ([], [1], 1.0),
        ([], [1, 2], 1.5),
        ([1, 2, 3], [4, 5, 6], 3.5),
        ([1, 3, 5], [2, 4, 6], 3.5),
        ([1], [2], 1.5),
        ([1, 2, 3, 4, 5], [6, 7, 8, 9, 10], 5.5),
        ([1, 1, 1], [1, 1, 1], 1.0),
        ([1, 2, 3, 4, 5], [6], 3.5),
        ([6], [1, 2, 3, 4, 5], 3.5),
        ([-5, -3, -1], [-2, 0, 2], -1.5),
        ([1, 2, 3], [4], 2.5),
        ([1, 2], [3, 4, 5, 6], 3.5),
    ]
    
    print("=" * 60)
    print("Testing findMedianSortedArrays")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for nums1, nums2, expected in test_cases:
        result = findMedianSortedArrays(nums1, nums2)
        status = "PASS" if abs(result - expected) < 1e-9 else "FAIL"
        
        if status == "PASS":
            passed += 1
            print(f"{status}: nums1={nums1}, nums2={nums2}")
            print(f"       Expected: {expected}, Got: {result}")
        else:
            failed += 1
            print(f"{status}: nums1={nums1}, nums2={nums2}")
            print(f"       Expected: {expected}, Got: {result}")
        print()
    
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    test_find_median()
