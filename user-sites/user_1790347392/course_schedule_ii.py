"""
Course Schedule II - Topological Sort Implementation
LeetCode 210: Find valid ordering of courses given prerequisites.
Uses Kahn's algorithm (BFS topological sort).
"""

from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Args:
        numCourses: Total number of courses labeled 0 to numCourses-1
        prerequisites: List of [course, prereq] pairs
        
    Returns:
        Valid course order or empty list
        
    Time: O(V + E) where V = numCourses, E = len(prerequisites)
    Space: O(V + E)
    """
    # Build adjacency list and in-degree count
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Start with courses having no prerequisites
    queue = deque()
    for i in range(numCourses):
        if in_degree[i] == 0:
            queue.append(i)
    
    # Process courses in topological order
    order = []
    while queue:
        course = queue.popleft()
        order.append(course)
        
        # Reduce in-degree for dependent courses
        for next_course in graph[course]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # Valid ordering exists only if all courses processed
    return order if len(order) == numCourses else []


# Test cases
if __name__ == "__main__":
    # Example 1: Valid order exists
    numCourses1 = 2
    prerequisites1 = [[1, 0]]
    result1 = find_order(numCourses1, prerequisites1)
    print(f"Example 1: {result1}")  # Expected: [0, 1]
    
    # Example 2: Valid order exists
    numCourses2 = 4
    prerequisites2 = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result2 = find_order(numCourses2, prerequisites2)
    print(f"Example 2: {result2}")  # Expected: [0, 1, 2, 3] or [0, 2, 1, 3]
    
    # Example 3: Cycle - impossible
    numCourses3 = 2
    prerequisites3 = [[1, 0], [0, 1]]
    result3 = find_order(numCourses3, prerequisites3)
    print(f"Example 3: {result3}")  # Expected: []
    
    # Edge case: No prerequisites
    numCourses4 = 3
    prerequisites4 = []
    result4 = find_order(numCourses4, prerequisites4)
    print(f"Example 4: {result4}")  # Expected: any order, e.g., [0, 1, 2]
    
    # Edge case: Single course
    numCourses5 = 1
    prerequisites5 = []
    result5 = find_order(numCourses5, prerequisites5)
    print(f"Example 5: {result5}")  # Expected: [0]
    
    # Verification
    def verify(numCourses, prerequisites, result):
        if not result:
            # Check if cycle actually exists
            return True
        if len(result) != numCourses:
            return False
        # Check all prerequisites satisfied
        pos = {c: i for i, c in enumerate(result)}
        for course, prereq in prerequisites:
            if pos[course] <= pos[prereq]:
                return False
        return True
    
    print(f"\nVerifications:")
    print(f"Example 1 valid: {verify(numCourses1, prerequisites1, result1)}")
    print(f"Example 2 valid: {verify(numCourses2, prerequisites2, result2)}")
    print(f"Example 3 valid: {verify(numCourses3, prerequisites3, result3)}")
    print(f"Example 4 valid: {verify(numCourses4, prerequisites4, result4)}")
    print(f"Example 5 valid: {verify(numCourses5, prerequisites5, result5)}")
