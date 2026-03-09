def findMedianSortedArrays(nums1, nums2):
    """
    Find median of two sorted arrays in O(log(m+n)) time.
    Uses binary search on partitions.
    """
    # Ensure nums1 is the smaller array for O(log(min(m,n)))
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    lo, hi = 0, m
    
    while lo <= hi:
        # Partition nums1 at i (i elements go to left)
        i = (lo + hi) // 2
        # Remaining elements for left partition come from nums2
        j = total_left - i
        
        # Elements at partition boundaries
        nums1_left = nums1[i - 1] if i > 0 else float('-inf')
        nums1_right = nums1[i] if i < m else float('inf')
        nums2_left = nums2[j - 1] if j > 0 else float('-inf')
        nums2_right = nums2[j] if j < n else float('inf')
        
        # Check if partition is correct
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Found correct partition
            if (m + n) % 2 == 1:
                # Odd: median is max of left side
                return max(nums1_left, nums2_left)
            else:
                # Even: median is average of max(left) and min(right)
                left_max = max(nums1_left, nums2_left)
                right_min = min(nums1_right, nums2_right)
                return (left_max + right_min) / 2
        elif nums1_left > nums2_right:
            # Too many elements from nums1 in left, move left
            hi = i - 1
        else:
            # Too few elements from nums1 in left, move right
            lo = i + 1
    
    raise ValueError("Input arrays are not sorted")


# Test cases
def test():
    # Test 1: Basic case
    assert findMedianSortedArrays([1, 3], [2]) == 2.0
    
    # Test 2: Even total length
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5
    
    # Test 3: One array empty
    assert findMedianSortedArrays([], [1]) == 1.0
    assert findMedianSortedArrays([], [1, 2, 3, 4]) == 2.5
    
    # Test 4: All elements in one array smaller
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6]) == 3.5
    assert findMedianSortedArrays([4, 5, 6], [1, 2, 3]) == 3.5
    
    # Test 5: Single elements
    assert findMedianSortedArrays([1], [2]) == 1.5
    
    # Test 6: Larger arrays
    assert findMedianSortedArrays([1, 3, 5, 7, 9], [2, 4, 6, 8, 10]) == 5.5
    
    # Test 7: Duplicates
    assert findMedianSortedArrays([1, 2, 2], [2, 3, 4]) == 2.0
    
    # Test 8: Negative numbers
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5
    
    print("All tests passed!")


if __name__ == "__main__":
    test()
