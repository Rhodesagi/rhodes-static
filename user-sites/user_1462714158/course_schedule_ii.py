"""
Course Schedule II - Topological Sort Implementation
LeetCode 210: https://leetcode.com/problems/course-schedule-ii/

Returns a valid ordering of courses to finish all courses, or empty list if impossible.
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Find a valid order to take all courses using topological sort.
    
    Args:
        numCourses: Total number of courses labeled 0 to numCourses-1
        prerequisites: List of [course, prereq] pairs meaning "take prereq before course"
    
    Returns:
        List of course numbers in valid order, or empty list if impossible
    """
    # Build adjacency list and calculate in-degrees
    # graph[prereq] = list of courses that require prereq
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Kahn's algorithm: start with courses having no prerequisites
    queue = deque()
    for course in range(numCourses):
        if in_degree[course] == 0:
            queue.append(course)
    
    result = []
    
    while queue:
        current = queue.popleft()
        result.append(current)
        
        # Remove current course as a prerequisite for its dependents
        for dependent in graph[current]:
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)
    
    # If we couldn't process all courses, there's a cycle
    return result if len(result) == numCourses else []


# ============ TEST CASES ============

def test_example_1():
    """Basic case with valid ordering"""
    numCourses = 2
    prerequisites = [[1, 0]]
    result = find_order(numCourses, prerequisites)
    assert result == [0, 1], f"Expected [0, 1], got {result}"
    print("✓ Example 1 passed")


def test_example_2():
    """Multiple valid orderings possible"""
    numCourses = 4
    prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result = find_order(numCourses, prerequisites)
    # Valid orders: [0,1,2,3] or [0,2,1,3]
    assert len(result) == 4
    assert result.index(0) < result.index(1)  # 0 before 1
    assert result.index(0) < result.index(2)  # 0 before 2
    assert result.index(1) < result.index(3)  # 1 before 3
    assert result.index(2) < result.index(3)  # 2 before 3
    print("✓ Example 2 passed")


def test_example_3():
    """Impossible due to cycle"""
    numCourses = 2
    prerequisites = [[1, 0], [0, 1]]
    result = find_order(numCourses, prerequisites)
    assert result == [], f"Expected [], got {result}"
    print("✓ Example 3 passed (cycle detected)")


def test_no_prerequisites():
    """No prerequisites - any order works"""
    numCourses = 3
    prerequisites = []
    result = find_order(numCourses, prerequisites)
    assert len(result) == 3
    assert set(result) == {0, 1, 2}
    print("✓ No prerequisites passed")


def test_single_course():
    """Only one course"""
    numCourses = 1
    prerequisites = []
    result = find_order(numCourses, prerequisites)
    assert result == [0], f"Expected [0], got {result}"
    print("✓ Single course passed")


def test_linear_chain():
    """Linear dependency chain"""
    numCourses = 4
    prerequisites = [[1, 0], [2, 1], [3, 2]]
    result = find_order(numCourses, prerequisites)
    assert result == [0, 1, 2, 3], f"Expected [0, 1, 2, 3], got {result}"
    print("✓ Linear chain passed")


def test_complex_cycle():
    """More complex cycle"""
    numCourses = 4
    prerequisites = [[0, 1], [1, 2], [2, 3], [3, 1]]  # 1->2->3->1 cycle
    result = find_order(numCourses, prerequisites)
    assert result == [], f"Expected [], got {result}"
    print("✓ Complex cycle passed")


def test_disconnected_components():
    """Multiple independent chains"""
    numCourses = 6
    prerequisites = [[1, 0], [2, 1], [4, 3], [5, 4]]
    result = find_order(numCourses, prerequisites)
    assert len(result) == 6
    # Chain 1: 0 -> 1 -> 2
    assert result.index(0) < result.index(1) < result.index(2)
    # Chain 2: 3 -> 4 -> 5
    assert result.index(3) < result.index(4) < result.index(5)
    print("✓ Disconnected components passed")


if __name__ == "__main__":
    test_example_1()
    test_example_2()
    test_example_3()
    test_no_prerequisites()
    test_single_course()
    test_linear_chain()
    test_complex_cycle()
    test_disconnected_components()
    print("\n" + "="*50)
    print("All tests passed! ✓")
    print("="*50)
