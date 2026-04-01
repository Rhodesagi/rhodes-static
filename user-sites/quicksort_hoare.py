from typing import TypeVar, List, Optional

T = TypeVar('T', bound='Comparable')

class Comparable:
    """Type constraint for comparable types."""
    def __lt__(self, other: object) -> bool: ...
    def __le__(self, other: object) -> bool: ...

def quicksort_hoare(arr: List[T], left: Optional[int] = None, right: Optional[int] = None) -> None:
    """
    Sort arr[left:right+1] in-place using quicksort with Hoare partition scheme.
    
    Args:
        arr: List of comparable elements
        left: Starting index (default 0)
        right: Ending index (default len(arr)-1)
    """
    if left is None:
        left = 0
    if right is None:
        right = len(arr) - 1
    
    if left >= right:
        return
    
    pivot_index = _hoare_partition(arr, left, right)
    
    # Recursively sort the two partitions
    quicksort_hoare(arr, left, pivot_index)
    quicksort_hoare(arr, pivot_index + 1, right)

def _hoare_partition(arr: List[T], left: int, right: int) -> int:
    """
    Hoare partition scheme for quicksort.
    
    Returns:
        Index j such that all elements in arr[left:j] <= pivot
        and all elements in arr[j+1:right+1] >= pivot.
    """
    pivot = arr[left]
    i = left - 1
    j = right + 1
    
    while True:
        # Find element on left >= pivot
        i += 1
        while arr[i] < pivot:
            i += 1
        
        # Find element on right <= pivot
        j -= 1
        while arr[j] > pivot:
            j -= 1
        
        if i >= j:
            return j
        
        # Swap arr[i] and arr[j]
        arr[i], arr[j] = arr[j], arr[i]

if __name__ == "__main__":
    # Test cases
    test_cases = [
        [],
        [1],
        [5, 2, 8, 1, 9],
        [9, 8, 7, 6, 5],
        [3, 1, 4, 1, 5, 9, 2, 6],
        [-5, 0, 3, -2, 7],
        ["banana", "apple", "cherry", "date"],
    ]
    
    for i, arr in enumerate(test_cases):
        original = arr.copy()
        quicksort_hoare(arr)
        expected = sorted(original)
        assert arr == expected, f"Test {i+1} failed: {original} -> {arr}, expected {expected}"
        print(f"Test {i+1} passed: {original} -> {arr}")
    
    print("All tests passed!")