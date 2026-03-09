"""
Find Median of Two Sorted Arrays in O(log(min(m,n))) time.

LeetCode Hard: Problem 4
Time Complexity: O(log(min(m, n)))
Space Complexity: O(1)
"""

from typing import List


def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find the median of two sorted arrays using binary search partition.
    
    The algorithm partitions both arrays such that:
    - Left partition contains half the elements (or half+1 for odd total)
    - All elements in left partition <= all elements in right partition
    - Median derived from partition boundaries
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
        
    Returns:
        The median value as a float
        
    Time: O(log(min(m, n)))
    Space: O(1)
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total = m + n
    half = (total + 1) // 2  # Elements needed in left partition
    
    # Binary search on nums1 (the smaller array)
    left, right = 0, m
    
    while left <= right:
        # Partition nums1: i elements from nums1 go to left partition
        i = (left + right) // 2
        # Remaining elements for left partition come from nums2
        j = half - i
        
        # Get partition boundary values (handle out-of-bounds with inf/-inf)
        # max_left1: largest element in left partition from nums1
        # min_right1: smallest element in right partition from nums1
        max_left1 = float('-inf') if i == 0 else nums1[i - 1]
        min_right1 = float('inf') if i == m else nums1[i]
        
        # max_left2: largest element in left partition from nums2
        # min_right2: smallest element in right partition from nums2
        max_left2 = float('-inf') if j == 0 else nums2[j - 1]
        min_right2 = float('inf') if j == n else nums2[j]
        
        # Check if we found the correct partition
        if max_left1 <= min_right2 and max_left2 <= min_right1:
            # Correct partition found
            if total % 2 == 1:
                # Odd total: median is max of left partition
                return float(max(max_left1, max_left2))
            else:
                # Even total: median is average of max(left) and min(right)
                left_max = max(max_left1, max_left2)
                right_min = min(min_right1, min_right2)
                return (left_max + right_min) / 2.0
        
        elif max_left1 > min_right2:
            # nums1 contributes too many elements to left partition
            # Need to move partition left in nums1
            right = i - 1
        else:
            # nums1 contributes too few elements to left partition
            # Need to move partition right in nums1
            left = i + 1
    
    # Should never reach here if inputs are valid sorted arrays
    raise ValueError("Input arrays are not sorted or are invalid")


# ============== TEST CASES ==============

def test_basic_cases():
    """Test basic functionality with standard cases."""
    # Example 1: nums1 = [1,3], nums2 = [2] -> median = 2.0
    assert findMedianSortedArrays([1, 3], [2]) == 2.0
    
    # Example 2: nums1 = [1,2], nums2 = [3,4] -> median = (2+3)/2 = 2.5
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5
    
    print("✓ Basic cases passed")


def test_edge_cases():
    """Test edge cases including empty arrays and single elements."""
    # One empty array
    assert findMedianSortedArrays([], [1]) == 1.0
    assert findMedianSortedArrays([2], []) == 2.0
    
    # Both single element
    assert findMedianSortedArrays([1], [2]) == 1.5
    
    # One single, one multiple
    assert findMedianSortedArrays([1], [2, 3, 4]) == 2.5
    assert findMedianSortedArrays([4], [1, 2, 3]) == 2.5
    
    # Empty first array (should still work)
    assert findMedianSortedArrays([], [1, 2, 3, 4]) == 2.5
    assert findMedianSortedArrays([], [1, 2, 3]) == 2.0
    
    print("✓ Edge cases passed")


def test_unequal_lengths():
    """Test arrays of significantly different lengths."""
    # nums1 much smaller than nums2
    # [1] + [2,3,4,5,6,7,8,9,10] = [1,2,3,4,5,6,7,8,9,10] -> median = (5+6)/2 = 5.5
    assert findMedianSortedArrays([1], [2, 3, 4, 5, 6, 7, 8, 9, 10]) == 5.5
    
    # nums2 much smaller than nums1 (swapped internally)
    # [1,2,3,4,5,6,7,8,9,10] + [1] = [1,1,2,3,4,5,6,7,8,9,10] (11 elements) -> median = 5
    assert findMedianSortedArrays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1]) == 5.0
    
    # All elements of one array smaller than other
    # [1,2,3] + [4,5,6,7,8] = [1,2,3,4,5,6,7,8] -> median = (4+5)/2 = 4.5
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6, 7, 8]) == 4.5
    assert findMedianSortedArrays([4, 5, 6, 7, 8], [1, 2, 3]) == 4.5
    
    print("✓ Unequal length cases passed")


def test_negative_numbers():
    """Test with negative numbers."""
    # [-5,-3,-1] + [-2,0,2] = [-5,-3,-2,-1,0,2] -> median = (-2+-1)/2 = -1.5
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    # [-10,-5] + [1,5,10] = [-10,-5,1,5,10] -> median = 1
    assert findMedianSortedArrays([-10, -5], [1, 5, 10]) == 1.0
    
    print("✓ Negative number cases passed")


def test_duplicates():
    """Test with duplicate values."""
    # [1,1,1] + [1,1] = [1,1,1,1,1] -> median = 1
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0
    # [1,2,2] + [2,3,4] = [1,2,2,2,3,4] -> median = (2+2)/2 = 2
    assert findMedianSortedArrays([1, 2, 2], [2, 3, 4]) == 2.0
    
    print("✓ Duplicate cases passed")


def test_large_numbers():
    """Test with large integer values."""
    assert findMedianSortedArrays([1000000], [1000001]) == 1000000.5
    assert findMedianSortedArrays([1, 3, 5], [1000000]) == 4.0
    
    print("✓ Large number cases passed")


def run_all_tests():
    """Run all test cases."""
    test_basic_cases()
    test_edge_cases()
    test_unequal_lengths()
    test_negative_numbers()
    test_duplicates()
    test_large_numbers()
    print("\n✅ All tests passed!")


if __name__ == "__main__":
    run_all_tests()
