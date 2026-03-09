from typing import List

def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float:
    """
    Find median of two sorted arrays in O(log(min(m,n))) time.
    Uses binary search on the smaller array to find correct partition.
    """
    # Ensure nums1 is the smaller array for O(log(min(m,n)))
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    left, right = 0, m
    
    # Total elements in left partition should be (m + n + 1) // 2
    half_len = (m + n + 1) // 2
    
    while left <= right:
        # Partition nums1 at position i
        i = (left + right) // 2
        # Corresponding partition in nums2
        j = half_len - i
        
        # Elements at partition boundaries
        nums1_left = float('-inf') if i == 0 else nums1[i - 1]
        nums1_right = float('inf') if i == m else nums1[i]
        nums2_left = float('-inf') if j == 0 else nums2[j - 1]
        nums2_right = float('inf') if j == n else nums2[j]
        
        # Check if partition is correct
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
            # nums1's left is too big, move partition left
            right = i - 1
        else:
            # nums2's left is too big (nums1_right too small), move partition right
            left = i + 1
    
    raise ValueError("Input arrays are not sorted")


# Test cases
def test_findMedianSortedArrays():
    # Test 1: Basic case - even total
    assert findMedianSortedArrays([1, 3], [2]) == 2.0, "Test 1 failed"
    
    # Test 2: Basic case - even total
    assert findMedianSortedArrays([1, 2], [3, 4]) == 2.5, "Test 2 failed"
    
    # Test 3: One empty array
    assert findMedianSortedArrays([], [1]) == 1.0, "Test 3 failed"
    
    # Test 4: One empty array with even length
    assert findMedianSortedArrays([], [2, 3]) == 2.5, "Test 4 failed"
    
    # Test 5: Arrays of different sizes
    assert findMedianSortedArrays([1, 3, 5, 7], [2, 4, 6, 8]) == 4.5, "Test 5 failed"
    
    # Test 6: All elements in one array smaller
    assert findMedianSortedArrays([1, 2, 3], [4, 5, 6, 7, 8]) == 4.5, "Test 6 failed"
    
    # Test 7: Duplicates
    assert findMedianSortedArrays([1, 2, 2], [2, 2, 3]) == 2.0, "Test 7 failed"
    
    # Test 8: Negative numbers
    assert findMedianSortedArrays([-5, -3, -1], [-2, 0, 2]) == -1.5, "Test 8 failed"
    
    # Test 9: Single element arrays
    assert findMedianSortedArrays([1], [2]) == 1.5, "Test 9 failed"
    
    # Test 10: Large arrays
    nums1 = list(range(0, 1000000, 2))  # Even numbers: 0, 2, 4, ...
    nums2 = list(range(1, 1000001, 2))  # Odd numbers: 1, 3, 5, ...
    assert findMedianSortedArrays(nums1, nums2) == 499999.5, "Test 10 failed"
    
    print("All tests passed!")


if __name__ == "__main__":
    test_findMedianSortedArrays()
