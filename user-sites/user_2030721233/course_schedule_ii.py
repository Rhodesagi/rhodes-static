"""
Course Schedule II - Topological Sort (Kahn's Algorithm)
LeetCode 210

Returns a valid ordering of courses to take, or empty list if impossible.
"""

from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Find valid course order using topological sort.
    
    Args:
        numCourses: Total number of courses (0 to numCourses-1)
        prerequisites: List of [course, prerequisite] pairs
    
    Returns:
        List of course IDs in valid order, or empty list if cycle exists
    """
    # Build adjacency list and in-degree count
    adj = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        adj[prereq].append(course)
        in_degree[course] += 1
    
    # Start with courses having no prerequisites
    queue = deque()
    for i in range(numCourses):
        if in_degree[i] == 0:
            queue.append(i)
    
    result = []
    
    # Process courses in topological order
    while queue:
        course = queue.popleft()
        result.append(course)
        
        # Reduce in-degree for all courses that depend on current course
        for next_course in adj[course]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # If we processed all courses, return order; else cycle exists
    return result if len(result) == numCourses else []


# Test cases
if __name__ == "__main__":
    # Example 1: numCourses = 2, prerequisites = [[1,0]]
    result1 = find_order(2, [[1, 0]])
    print(f"Example 1: {result1}")
    assert result1 == [0, 1]
    
    # Example 2: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
    result2 = find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    print(f"Example 2: {result2}")
    assert result2[0] == 0
    assert result2.index(1) < result2.index(3)
    assert result2.index(2) < result2.index(3)
    
    # Example 3: Cycle detection
    result3 = find_order(2, [[1, 0], [0, 1]])
    print(f"Example 3 (cycle): {result3}")
    assert result3 == []
    
    # Edge case: No prerequisites
    result4 = find_order(3, [])
    print(f"No prerequisites: {result4}")
    assert len(result4) == 3 and set(result4) == {0, 1, 2}
    
    # Edge case: Single course
    result5 = find_order(1, [])
    print(f"Single course: {result5}")
    assert result5 == [0]
    
    print("\nAll tests passed!")
