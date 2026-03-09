"""
Course Schedule II - Topological Sort
LeetCode 210: Return valid ordering or empty list if impossible.
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible, return empty list.
    
    Uses Kahn's algorithm (BFS topological sort).
    Time: O(V + E), Space: O(V + E)
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
        curr = queue.popleft()
        order.append(curr)
        
        for neighbor in graph[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, return order; else cycle exists
    return order if len(order) == numCourses else []


# === Tests ===
if __name__ == "__main__":
    # Example 1: Valid order exists
    numCourses1 = 2
    prerequisites1 = [[1, 0]]
    result1 = find_order(numCourses1, prerequisites1)
    print(f"Test 1: {result1}")  # Expected: [0, 1]
    assert result1 == [0, 1], f"Expected [0, 1], got {result1}"
    
    # Example 2: Cycle - impossible
    numCourses2 = 2
    prerequisites2 = [[1, 0], [0, 1]]
    result2 = find_order(numCourses2, prerequisites2)
    print(f"Test 2: {result2}")  # Expected: []
    assert result2 == [], f"Expected [], got {result2}"
    
    # Example 3: Multiple valid orders
    numCourses3 = 4
    prerequisites3 = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result3 = find_order(numCourses3, prerequisites3)
    print(f"Test 3: {result3}")  # Expected: [0,1,2,3] or [0,2,1,3]
    assert len(result3) == 4, f"Expected length 4, got {len(result3)}"
    # Verify it's a valid topological order
    pos = {c: i for i, c in enumerate(result3)}
    for course, prereq in prerequisites3:
        assert pos[prereq] < pos[course], f"Invalid order: {prereq} not before {course}"
    
    # Example 4: No prerequisites
    numCourses4 = 3
    prerequisites4 = []
    result4 = find_order(numCourses4, prerequisites4)
    print(f"Test 4: {result4}")  # Expected: [0, 1, 2] (any order)
    assert len(result4) == 3, f"Expected length 3, got {len(result4)}"
    
    # Example 5: Single course
    numCourses5 = 1
    prerequisites5 = []
    result5 = find_order(numCourses5, prerequisites5)
    print(f"Test 5: {result5}")  # Expected: [0]
    assert result5 == [0], f"Expected [0], got {result5}"
    
    # Example 6: Chain dependency
    numCourses6 = 4
    prerequisites6 = [[1, 0], [2, 1], [3, 2]]
    result6 = find_order(numCourses6, prerequisites6)
    print(f"Test 6: {result6}")  # Expected: [0, 1, 2, 3]
    assert result6 == [0, 1, 2, 3], f"Expected [0, 1, 2, 3], got {result6}"
    
    print("\nAll tests passed!")
