"""
Course Schedule II - Topological Sort (Kahn's Algorithm)
LeetCode 210: Find a valid order to take courses given prerequisites.

Time: O(V + E) where V = numCourses, E = len(prerequisites)
Space: O(V + E)
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Args:
        numCourses: Total number of courses labeled 0 to numCourses-1
        prerequisites: List of [course, prereq] pairs — to take 'course', 
                      must first take 'prereq'
    
    Returns:
        List of course IDs in valid order, or empty list if no valid order exists
    """
    # Build adjacency list and in-degree count
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)  # prereq -> course
        in_degree[course] += 1
    
    # Start with courses having no prerequisites
    queue = deque()
    for course in range(numCourses):
        if in_degree[course] == 0:
            queue.append(course)
    
    # Process courses in topological order
    order = []
    while queue:
        current = queue.popleft()
        order.append(current)
        
        # Reduce in-degree for each dependent course
        for next_course in graph[current]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # Valid order exists only if all courses were processed
    return order if len(order) == numCourses else []


# ============== TEST CASES ==============

if __name__ == "__main__":
    # Test 1: Basic case with valid order
    numCourses1 = 3
    prereqs1 = [[0, 1], [1, 2]]
    result1 = find_order(numCourses1, prereqs1)
    print(f"Test 1: {result1}")
    assert len(result1) == 3
    assert result1.index(2) < result1.index(1)
    assert result1.index(1) < result1.index(0)
    
    # Test 2: Cycle detection — impossible
    numCourses2 = 2
    prereqs2 = [[0, 1], [1, 0]]
    result2 = find_order(numCourses2, prereqs2)
    print(f"Test 2 (cycle): {result2}")
    assert result2 == []
    
    # Test 3: No prerequisites
    numCourses3 = 3
    prereqs3 = []
    result3 = find_order(numCourses3, prereqs3)
    print(f"Test 3 (no prereqs): {result3}")
    assert len(result3) == 3
    assert set(result3) == {0, 1, 2}
    
    # Test 4: Complex graph with multiple valid orders
    numCourses4 = 4
    prereqs4 = [[0, 1], [0, 2], [1, 3], [2, 3]]
    result4 = find_order(numCourses4, prereqs4)
    print(f"Test 4: {result4}")
    assert len(result4) == 4
    assert result4.index(3) < result4.index(1)
    assert result4.index(3) < result4.index(2)
    assert result4.index(1) < result4.index(0)
    assert result4.index(2) < result4.index(0)
    
    # Test 5: Single course, no prerequisites
    numCourses5 = 1
    prereqs5 = []
    result5 = find_order(numCourses5, prereqs5)
    print(f"Test 5 (single): {result5}")
    assert result5 == [0]
    
    # Test 6: Self-loop (course requires itself)
    numCourses6 = 2
    prereqs6 = [[0, 0]]
    result6 = find_order(numCourses6, prereqs6)
    print(f"Test 6 (self-loop): {result6}")
    assert result6 == []
    
    print("\nAll tests passed!")
