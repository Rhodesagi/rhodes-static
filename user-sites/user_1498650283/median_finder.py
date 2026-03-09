"""
Median of Two Sorted Arrays - O(log(min(m,n))) solution.

LeetCode 4. Find Median of Two Sorted Arrays.
Time: O(log(min(m, n)))
Space: O(1)
"""


def findMedianSortedArrays(nums1: list[int], nums2: list[int]) -> float:
    """
    Find the median of two sorted arrays in logarithmic time.
    
    Uses binary search on partitions rather than merging.
    The key insight: we need to partition both arrays such that
    the left half has exactly (m+n+1)//2 elements, and all elements
    in left half <= all elements in right half.
    """
    # Ensure nums1 is the smaller array for O(log(min(m,n)))
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    left, right = 0, m
    
    while left <= right:
        # Partition nums1: i elements go to left half
        i = (left + right) // 2
        # Remaining elements for left half come from nums2
        j = total_left - i
        
        # Edge values (handle boundaries with infinities)
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
                return (left_max + right_min) / 2.0
        
        elif nums1_left > nums2_right:
            # nums1's left partition is too big, move left
            right = i - 1
        else:
            # nums1's left partition is too small, move right
            left = i + 1
    
    raise ValueError("Input arrays are not sorted or invalid")


# ============ COMPREHENSIVE TESTS ============

def test_basic_cases():
    """Test standard cases from LeetCode."""
    # Example 1: merged = [1,2,3] -> median = 2
    assert findMedianSortedArrays([1, 3], [2]) == 2.0
    
    # Example 2: merged = [1,2,3,4] -> median = (2+3)/2 = 2.5
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5
    
    print("✓ Basic cases passed")


def test_edge_cases():
    """Test edge cases: empty arrays, single elements."""
    # One empty array
    assert findMedianSortedArrays([], [1]) == 1.0
    assert findMedianSortedArrays([2], []) == 2.0
    
    # Both single element
    assert findMedianSortedArrays([1], [2]) == 1.5
    
    # First array empty, second has multiple
    assert findMedianSortedArrays([], [1, 2, 3, 4, 5]) == 3.0
    assert findMedianSortedArrays([], [1, 2, 3, 4]) == 2.5
    
    # Second array empty, first has multiple
    assert findMedianSortedArrays([1, 2, 3], []) == 2.0
    
    print("✓ Edge cases passed")


def test_large_arrays():
    """Test with larger arrays to verify O(log n) efficiency."""
    # Large sorted arrays
    nums1 = list(range(0, 1000000, 2))  # Even numbers: 0, 2, 4, ...
    nums2 = list(range(1, 1000000, 2))  # Odd numbers: 1, 3, 5, ...
    
    # Merged would be 0,1,2,3,...999999, median is around 499999.5
    result = findMedianSortedArrays(nums1, nums2)
    assert result == 499999.5, f"Expected 499999.5, got {result}"
    
    print("✓ Large arrays passed")


def test_negative_numbers():
    """Test with negative numbers."""
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    assert findMedianSortedArrays([-10, -5], [-3, 0, 5]) == -3.0
    
    print("✓ Negative numbers passed")


def test_duplicates():
    """Test with duplicate values."""
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0
    assert findMedianSortedArrays([1, 2, 2], [2, 3, 4]) == 2.0
    
    print("✓ Duplicates passed")


def test_different_sizes():
    """Test arrays of very different sizes."""
    # One large, one small
    assert findMedianSortedArrays([1], [2, 3, 4, 5, 6, 7, 8, 9, 10]) == 5.5
    
    # One element each, various combinations
    assert findMedianSortedArrays([1, 2, 3, 4, 5], [6]) == 3.5
    assert findMedianSortedArrays([1], [2, 3, 4]) == 2.5
    
    print("✓ Different sizes passed")


if __name__ == "__main__":
    test_basic_cases()
    test_edge_cases()
    test_negative_numbers()
    test_duplicates()
    test_different_sizes()
    test_large_arrays()
    
    print("\n" + "="*50)
    print("All tests passed! ✓")
    print("="*50)
