"""
Course Schedule II - Topological Sort Implementation
LeetCode 210: Return the ordering of courses to finish all courses.
If impossible (cycle exists), return empty list.
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to take.
    
    Args:
        numCourses: Total number of courses labeled 0 to numCourses-1
        prerequisites: List of [course, prerequisite] pairs
        
    Returns:
        List of course IDs in valid order, or empty list if impossible
        
    Time: O(V + E) where V = numCourses, E = len(prerequisites)
    Space: O(V + E)
    """
    # Build adjacency list and calculate in-degrees
    # prereq[0] depends on prereq[1], so edge: prereq[1] -> prereq[0]
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Start with courses that have no prerequisites
    queue = deque()
    for course in range(numCourses):
        if in_degree[course] == 0:
            queue.append(course)
    
    # Process courses in BFS order
    order = []
    while queue:
        current = queue.popleft()
        order.append(current)
        
        # For each course that depends on current, reduce its in-degree
        for next_course in graph[current]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # If we couldn't process all courses, there's a cycle
    return order if len(order) == numCourses else []


# ===== TESTS =====
if __name__ == "__main__":
    # Test 1: Basic valid case
    # Course 0 depends on course 1
    # Valid orders: [1, 0]
    result = find_order(2, [[1, 0]])
    assert result == [0, 1], f"Test 1 failed: got {result}"
    print(f"Test 1 passed: {result}")
    
    # Test 2: Multiple valid orders possible
    # 0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3
    result = find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    # Valid: [0, 1, 2, 3] or [0, 2, 1, 3]
    assert len(result) == 4, f"Test 2 failed: wrong length {result}"
    # Verify it's a valid topological order
    pos = {c: i for i, c in enumerate(result)}
    assert pos[0] < pos[1] and pos[0] < pos[2], "Invalid order: 0 must come before 1 and 2"
    assert pos[1] < pos[3] and pos[2] < pos[3], "Invalid order: 3 must come after 1 and 2"
    print(f"Test 2 passed: {result}")
    
    # Test 3: Cycle detection (impossible)
    # 1 -> 0, 0 -> 1 (cycle)
    result = find_order(2, [[1, 0], [0, 1]])
    assert result == [], f"Test 3 failed: expected [], got {result}"
    print(f"Test 3 passed: cycle correctly detected")
    
    # Test 4: No prerequisites
    result = find_order(3, [])
    assert len(result) == 3 and set(result) == {0, 1, 2}, f"Test 4 failed: {result}"
    print(f"Test 4 passed: {result}")
    
    # Test 5: Single course
    result = find_order(1, [])
    assert result == [0], f"Test 5 failed: {result}"
    print(f"Test 5 passed: {result}")
    
    # Test 6: Long chain
    # 0 -> 1 -> 2 -> 3 -> 4
    result = find_order(5, [[1, 0], [2, 1], [3, 2], [4, 3]])
    assert result == [0, 1, 2, 3, 4], f"Test 6 failed: got {result}"
    print(f"Test 6 passed: {result}")
    
    print("\nAll tests passed!")
