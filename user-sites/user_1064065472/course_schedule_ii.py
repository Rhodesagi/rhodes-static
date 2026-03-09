"""
Course Schedule II - Topological Sort Implementation
LeetCode 210: Find a valid ordering of courses to finish all courses.
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Args:
        numCourses: Total number of courses (labeled 0 to numCourses-1)
        prerequisites: List of [course, prerequisite] pairs
    
    Returns:
        List of course numbers in valid completion order
    """
    # Build adjacency list and calculate in-degrees
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)  # prereq -> course
        in_degree[course] += 1
    
    # Initialize queue with courses having no prerequisites
    queue = deque()
    for course in range(numCourses):
        if in_degree[course] == 0:
            queue.append(course)
    
    # Kahn's algorithm: process courses with in-degree 0
    order = []
    while queue:
        current = queue.popleft()
        order.append(current)
        
        # Reduce in-degree for all courses that depend on current
        for next_course in graph[current]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # If we processed all courses, return the order; else cycle exists
    return order if len(order) == numCourses else []


# ============== TEST CASES ==============

def test_find_order():
    """Run test cases to verify correctness."""
    
    # Test 1: Basic case from LeetCode
    numCourses1 = 2
    prerequisites1 = [[1, 0]]
    result1 = find_order(numCourses1, prerequisites1)
    assert result1 == [0, 1], f"Test 1 failed: expected [0, 1], got {result1}"
    print("✓ Test 1 passed: Basic case [0, 1]")
    
    # Test 2: Multiple prerequisites
    numCourses2 = 4
    prerequisites2 = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result2 = find_order(numCourses2, prerequisites2)
    assert len(result2) == 4
    assert result2[0] == 0
    assert result2.index(1) < result2.index(3)
    assert result2.index(2) < result2.index(3)
    print(f"✓ Test 2 passed: Multiple prerequisites -> {result2}")
    
    # Test 3: Cycle detection (impossible)
    numCourses3 = 2
    prerequisites3 = [[1, 0], [0, 1]]
    result3 = find_order(numCourses3, prerequisites3)
    assert result3 == [], f"Test 3 failed: expected [], got {result3}"
    print("✓ Test 3 passed: Cycle detected, returns []")
    
    # Test 4: No prerequisites
    numCourses4 = 3
    prerequisites4 = []
    result4 = find_order(numCourses4, prerequisites4)
    assert len(result4) == 3
    assert set(result4) == {0, 1, 2}
    print(f"✓ Test 4 passed: No prerequisites -> {result4}")
    
    # Test 5: Single course
    numCourses5 = 1
    prerequisites5 = []
    result5 = find_order(numCourses5, prerequisites5)
    assert result5 == [0], f"Test 5 failed: expected [0], got {result5}"
    print("✓ Test 5 passed: Single course [0]")
    
    # Test 6: Linear chain
    numCourses6 = 4
    prerequisites6 = [[1, 0], [2, 1], [3, 2]]
    result6 = find_order(numCourses6, prerequisites6)
    assert result6 == [0, 1, 2, 3], f"Test 6 failed: expected [0, 1, 2, 3], got {result6}"
    print("✓ Test 6 passed: Linear chain [0, 1, 2, 3]")
    
    # Test 7: Complex graph
    numCourses7 = 3
    prerequisites7 = [[2, 0], [2, 1]]
    result7 = find_order(numCourses7, prerequisites7)
    assert len(result7) == 3
    assert result7.index(2) > result7.index(0)
    assert result7.index(2) > result7.index(1)
    print(f"✓ Test 7 passed: Complex graph -> {result7}")
    
    print("\n" + "=" * 50)
    print("All tests passed! ✓")
    print("=" * 50)


if __name__ == "__main__":
    test_find_order()
