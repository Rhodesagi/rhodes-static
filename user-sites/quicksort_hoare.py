"""
Quicksort with Hoare partition scheme implementation.
Includes proper type hints for generic comparable types.
"""

from typing import TypeVar, Protocol, List, Any

# Define a comparable protocol for type hints
class Comparable(Protocol):
    """Protocol for types that support comparison operators."""
    def __lt__(self, other: Any) -> bool: ...
    def __le__(self, other: Any) -> bool: ...
    def __gt__(self, other: Any) -> bool: ...
    def __ge__(self, other: Any) -> bool: ...

T = TypeVar('T', bound=Comparable)


def _partition_hoare(arr: List[T], low: int, high: int) -> int:
    """
    Hoare partition scheme.
    
    Args:
        arr: The list to partition
        low: Starting index (inclusive)
        high: Ending index (inclusive)
    
    Returns:
        The partition index j where:
        - All elements in arr[low..j] are <= pivot
        - All elements in arr[j+1..high] are >= pivot
    """
    # Choose middle element as pivot (Hoare's original scheme)
    pivot = arr[(low + high) // 2]
    i = low - 1
    j = high + 1
    
    while True:
        # Move i right until arr[i] >= pivot
        i += 1
        while arr[i] < pivot:
            i += 1
        
        # Move j left until arr[j] <= pivot
        j -= 1
        while arr[j] > pivot:
            j -= 1
        
        # If pointers crossed, partition is complete
        if i >= j:
            return j
        
        # Swap arr[i] and arr[j]
        arr[i], arr[j] = arr[j], arr[i]


def _quicksort_hoare_inplace(arr: List[T], low: int, high: int) -> None:
    """
    Recursive in-place quicksort using Hoare partition.
    
    Args:
        arr: The list to sort
        low: Starting index (inclusive)
        high: Ending index (inclusive)
    """
    if low < high:
        # Partition the array and get the partition index
        partition_idx = _partition_hoare(arr, low, high)
        
        # Recursively sort the two partitions
        # Note: Hoare partition returns j where elements low..j are <= pivot
        # and elements j+1..high are >= pivot
        _quicksort_hoare_inplace(arr, low, partition_idx)
        _quicksort_hoare_inplace(arr, partition_idx + 1, high)


def quicksort_hoare(arr: List[T]) -> List[T]:
    """
    Quicksort using Hoare partition scheme.
    
    This is a wrapper that preserves the input list and returns a sorted copy.
    
    Args:
        arr: The list to sort
    
    Returns:
        A new sorted list containing all elements from arr
    
    Examples:
        >>> quicksort_hoare([3, 1, 4, 1, 5, 9, 2, 6])
        [1, 1, 2, 3, 4, 5, 6, 9]
        
        >>> quicksort_hoare(['banana', 'apple', 'cherry'])
        ['apple', 'banana', 'cherry']
    """
    # Create a copy to avoid modifying the input
    arr_copy = arr.copy()
    
    if len(arr_copy) <= 1:
        return arr_copy
    
    _quicksort_hoare_inplace(arr_copy, 0, len(arr_copy) - 1)
    return arr_copy


if __name__ == "__main__":
    # Test the implementation
    import random
    
    # Test with integers
    test_cases = [
        [],
        [1],
        [1, 2, 3],
        [3, 2, 1],
        [5, 3, 8, 1, 2, 7, 4, 6],
        [3, 1, 4, 1, 5, 9, 2, 6],
        [random.randint(-100, 100) for _ in range(100)],
        [random.randint(-100, 100) for _ in range(1000)],
    ]
    
    # Test with strings
    test_cases.append(['banana', 'apple', 'cherry', 'date'])
    test_cases.append(['z', 'y', 'x', 'w', 'v'])
    
    all_passed = True
    for i, test_arr in enumerate(test_cases):
        sorted_result = quicksort_hoare(test_arr)
        expected = sorted(test_arr)
        
        if sorted_result == expected:
            print(f"Test {i + 1} passed: length {len(test_arr)}")
        else:
            print(f"Test {i + 1} FAILED!")
            print(f"  Input:    {test_arr[:20]}{'...' if len(test_arr) > 20 else ''}")
            print(f"  Got:      {sorted_result[:20]}{'...' if len(sorted_result) > 20 else ''}")
            print(f"  Expected: {expected[:20]}{'...' if len(expected) > 20 else ''}")
            all_passed = False
    
    if all_passed:
        print("\nAll tests passed!")
    else:
        print("\nSome tests failed.")