def findMedianSortedArrays(nums1, nums2):
    """
    Find median of two sorted arrays in O(log(min(m,n))) time.
    
    Args:
        nums1: First sorted array
        nums2: Second sorted array
    
    Returns:
        Median value as float
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    total_left = (m + n + 1) // 2  # Size of left partition
    
    lo, hi = 0, m
    
    while lo <= hi:
        i = (lo + hi) // 2  # Partition nums1: i elements go left
        j = total_left - i  # Partition nums2: j elements go left
        
        # Boundary values (use infinities for clean comparisons at edges)
        left1 = float('-inf') if i == 0 else nums1[i - 1]
        right1 = float('inf') if i == m else nums1[i]
        left2 = float('-inf') if j == 0 else nums2[j - 1]
        right2 = float('inf') if j == n else nums2[j]
        
        # Check if we found the correct partition
        # Correct partition: all left elements <= all right elements
        if left1 <= right2 and left2 <= right1:
            # Correct partition found
            if (m + n) % 2 == 1:
                # Odd total length: median is max of left side
                return float(max(left1, left2))
            else:
                # Even total length: median is average of max(left) and min(right)
                return (max(left1, left2) + min(right1, right2)) / 2
        elif left1 > right2:
            # Too far right in nums1, need to move partition left
            hi = i - 1
        else:
            # Too far left in nums1, need to move partition right
            lo = i + 1
    
    raise ValueError("Input arrays may not be sorted")


if __name__ == "__main__":
    # LeetCode examples
    assert findMedianSortedArrays([1, 3], [2]) == 2.0, "Example 1 failed"
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5, "Example 2 failed"
    
    # Edge cases
    assert findMedianSortedArrays([], [1]) == 1.0, "Empty first array failed"
    assert findMedianSortedArrays([2], []) == 2.0, "Empty second array failed"
    assert findMedianSortedArrays([2], [1]) == 1.5, "Single elements failed"
    assert findMedianSortedArrays([1, 2], [3, 4, 5, 6]) == 3.5, "All smaller in one array failed"
    assert findMedianSortedArrays([1, 1, 1], [1, 1]) == 1.0, "Duplicates failed"
    assert findMedianSortedArrays([1, 3, 5], [2, 4, 6]) == 3.5, "Interleaved failed"
    assert findMedianSortedArrays([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]) == 5.5, "Split arrays failed"
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6, 7, 8, 9]) == 5.0, "Different sizes failed"
    
    print("All tests passed.")
