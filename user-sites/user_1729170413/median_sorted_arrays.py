def findMedianSortedArrays(nums1, nums2):
    """
    Find median of two sorted arrays in O(log(min(m,n))) time.
    Uses binary search on the smaller array to find correct partition.
    """
    # Ensure nums1 is the smaller array for binary search efficiency
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    left, right = 0, m
    
    # Total elements on left side of partition
    total_left = (m + n + 1) // 2
    
    while left <= right:
        # Partition nums1 at position i (i elements on left)
        i = (left + right) // 2
        # Remaining elements for left partition come from nums2
        j = total_left - i
        
        # Get boundary values (handle empty partitions with -inf/+inf)
        nums1_left = float('-inf') if i == 0 else nums1[i - 1]
        nums1_right = float('inf') if i == m else nums1[i]
        nums2_left = float('-inf') if j == 0 else nums2[j - 1]
        nums2_right = float('inf') if j == n else nums2[j]
        
        # Check if partition is correct
        if nums1_left <= nums2_right and nums2_left <= nums1_right:
            # Correct partition found
            if (m + n) % 2 == 1:
                # Odd total length: median is max of left side
                return max(nums1_left, nums2_left)
            else:
                # Even total length: average of max(left) and min(right)
                return (max(nums1_left, nums2_left) + min(nums1_right, nums2_right)) / 2
        
        elif nums1_left > nums2_right:
            # nums1's left partition too big, move left
            right = i - 1
        else:
            # nums1's left partition too small, move right
            left = i + 1
    
    raise ValueError("Input arrays were not sorted or valid")


# Test harness
def run_tests():
    test_cases = [
        # (nums1, nums2, expected_median)
        ([1, 3], [2], 2.0),
        ([1, 2], [3, 4], 2.5),
        ([], [1], 1.0),
        ([2], [], 2.0),
        ([1, 2, 3], [4, 5, 6], 3.5),
        ([1, 3, 5], [2, 4, 6], 3.5),
        ([1, 2], [3, 4, 5], 3.0),
        ([1, 2, 3, 4, 5], [6, 7, 8, 9, 10], 5.5),
        ([1, 1, 1], [1, 1], 1.0),
        ([1, 2, 3, 4, 5, 6], [7, 8, 9, 10], 5.5),
        ([1, 3, 8, 9, 15], [7, 11, 18, 19, 21, 25], 11.0),
        ([1, 2], [1, 2, 3], 2.0),
        ([100000], [100001], 100000.5),
    ]
    
    passed = 0
    for i, (nums1, nums2, expected) in enumerate(test_cases, 1):
        result = findMedianSortedArrays(nums1.copy(), nums2.copy())
        status = "PASS" if result == expected else "FAIL"
        if status == "PASS":
            passed += 1
        print(f"Test {i}: {status} | nums1={nums1}, nums2={nums2} | expected={expected}, got={result}")
    
    print(f"\n{passed}/{len(test_cases)} tests passed")
    return passed == len(test_cases)


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
