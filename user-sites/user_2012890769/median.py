"""
Find Median of Two Sorted Arrays - O(log(min(m,n)))
LeetCode Hard: https://leetcode.com/problems/median-of-two-sorted-arrays/
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find the median of two sorted arrays in O(log(min(m,n))) time.
    
    The algorithm uses binary search on partitions. We partition both arrays
    such that the left side contains half the elements, and all left elements
    are <= all right elements.
    
    Time: O(log(min(m,n))) - binary search on smaller array
    Space: O(1) - only using indices
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Elements needed on left side
    
    # Binary search on nums1 (the smaller array)
    left, right = 0, m
    
    while left <= right:
        # Partition nums1 at i (i elements go to left side)
        i = (left + right) // 2
        # Remaining elements for left side come from nums2
        j = total_left - i
        
        # Get boundary values (use infinity for out-of-bounds)
        nums1_left = nums1[i - 1] if i > 0 else float('-inf')
        nums1_right = nums1[i] if i < m else float('inf')
        nums2_left = nums2[j - 1] if j > 0 else float('-inf')
        nums2_right = nums2[j] if j < n else float('inf')
        
        # Check if we found the correct partition
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Correct partition found - compute median
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
            right = i - 1
        else:
            # nums2's left is too big (nums1's right is too small), move right
            left = i + 1
    
    # Should never reach here if inputs are valid
    raise ValueError("Input arrays may not be sorted")


# ==================== TEST CASES ====================

if __name__ == "__main__":
    def test():
        # Test 1: Basic case - even total
        # nums1: [1, 3], nums2: [2, 4] -> merged: [1, 2, 3, 4] -> median: (2+3)/2 = 2.5
        assert findMedianSortedArrays([1, 3], [2, 4]) == 2.5
        print("✓ Test 1 passed: even total, interleaved")
        
        # Test 2: Basic case - odd total
        # nums1: [1, 3], nums2: [2] -> merged: [1, 2, 3] -> median: 2
        assert findMedianSortedArrays([1, 3], [2]) == 2.0
        print("✓ Test 2 passed: odd total")
        
        # Test 3: One empty array
        assert findMedianSortedArrays([], [1]) == 1.0
        print("✓ Test 3 passed: one empty array")
        
        # Test 4: One empty array, even elements
        assert findMedianSortedArrays([], [1, 2, 3, 4]) == 2.5
        print("✓ Test 4 passed: one empty array, even count")
        
        # Test 5: No overlap - nums1 entirely less than nums2
        assert findMedianSortedArrays([1, 2], [3, 4, 5, 6]) == 3.5
        print("✓ Test 5 passed: no overlap, nums1 < nums2")
        
        # Test 6: No overlap - nums1 entirely greater than nums2
        assert findMedianSortedArrays([5, 6, 7], [1, 2, 3, 4]) == 4.0
        print("✓ Test 6 passed: no overlap, nums1 > nums2")
        
        # Test 7: Single element each
        assert findMedianSortedArrays([1], [2]) == 1.5
        print("✓ Test 7 passed: single element each")
        
        # Test 8: Large arrays
        nums1 = list(range(0, 1000000, 2))  # Even numbers: 0, 2, 4...
        nums2 = list(range(1, 1000001, 2))  # Odd numbers: 1, 3, 5...
        # Merged: 0, 1, 2, 3, ... 999999 -> median = 499999.5
        result = findMedianSortedArrays(nums1, nums2)
        assert result == 499999.5, f"Expected 499999.5, got {result}"
        print("✓ Test 8 passed: large arrays (1M elements)")
        
        # Test 9: All same elements
        assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0
        print("✓ Test 9 passed: all same elements")
        
        # Test 10: Duplicates with different values
        assert findMedianSortedArrays([1, 2, 2], [2, 3, 4]) == 2.0
        print("✓ Test 10 passed: duplicates with different values")
        
        print("\n" + "="*50)
        print("All tests passed! ✓")
        print("="*50)
    
    test()
