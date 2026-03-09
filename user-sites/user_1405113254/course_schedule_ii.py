from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Uses Kahn's algorithm for topological sort.
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
    
    while queue:
        curr = queue.popleft()
        result.append(curr)
        
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, return result; else cycle exists
    return result if len(result) == numCourses else []


# Test cases
if __name__ == "__main__":
    # Test 1: Valid order (LeetCode example 1)
    numCourses1 = 4
    prerequisites1 = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result1 = find_order(numCourses1, prerequisites1)
    print(f"Test 1: {result1}")
    assert len(result1) == 4
    # Verify prerequisites are satisfied
    pos = {c: i for i, c in enumerate(result1)}
    for c, p in prerequisites1:
        assert pos[p] < pos[c], f"Prereq {p} not before {c}"
    print("✓ Test 1 passed")
    
    # Test 2: Cycle (LeetCode example 2)
    numCourses2 = 2
    prerequisites2 = [[1, 0], [0, 1]]
    result2 = find_order(numCourses2, prerequisites2)
    print(f"Test 2: {result2}")
    assert result2 == []
    print("✓ Test 2 passed")
    
    # Test 3: Single course
    numCourses3 = 1
    prerequisites3 = []
    result3 = find_order(numCourses3, prerequisites3)
    print(f"Test 3: {result3}")
    assert result3 == [0]
    print("✓ Test 3 passed")
    
    # Test 4: No prerequisites
    numCourses4 = 3
    prerequisites4 = []
    result4 = find_order(numCourses4, prerequisites4)
    print(f"Test 4: {result4}")
    assert len(result4) == 3
    print("✓ Test 4 passed")
    
    # Test 5: Linear chain
    numCourses5 = 4
    prerequisites5 = [[1, 0], [2, 1], [3, 2]]
    result5 = find_order(numCourses5, prerequisites5)
    print(f"Test 5: {result5}")
    assert result5 == [0, 1, 2, 3]
    print("✓ Test 5 passed")
    
    print("\nAll tests passed!")
