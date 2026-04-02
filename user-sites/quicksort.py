from typing import TypeVar, List

T = TypeVar("T", bound="Comparable")


class Comparable:
    """Protocol for types that support comparison."""

    def __lt__(self, other: "Comparable") -> bool:
        ...


def hoare_partition(arr: List[T], low: int, high: int) -> int:
    """
    Hoare partition scheme for quicksort.
    Returns the index where the partition splits.
    """
    pivot = arr[low]
    i = low - 1
    j = high + 1

    while True:
        i += 1
        while arr[i] < pivot:
            i += 1

        j -= 1
        while arr[j] > pivot:
            j -= 1

        if i >= j:
            return j

        arr[i], arr[j] = arr[j], arr[i]


def quicksort_hoare(arr: List[T], low: int = 0, high: int | None = None) -> None:
    """
    In‑place quicksort using Hoare partition scheme.
    Sorts arr[low:high+1] (inclusive).
    """
    if high is None:
        high = len(arr) - 1

    if low < high:
        pivot_idx = hoare_partition(arr, low, high)
        quicksort_hoare(arr, low, pivot_idx)
        quicksort_hoare(arr, pivot_idx + 1, high)


if __name__ == "__main__":
    # Test cases
    import random

    def test_sort(arr):
        expected = sorted(arr)
        quicksort_hoare(arr)
        assert arr == expected, f"Failed: {arr} != {expected}"
        print(f"✓ Sorted: {arr[:10]}{'...' if len(arr) > 10 else ''}")

    # Random lists
    test_sort([3, 6, 8, 10, 1, 2, 1])
    test_sort([random.randint(-100, 100) for _ in range(100)])
    test_sort([random.random() for _ in range(50)])
    test_sort([1])
    test_sort([])

    # Already sorted / reverse sorted
    test_sort(list(range(10)))
    test_sort(list(range(9, -1, -1)))

    print("All tests passed.")