from collections import deque
from typing import List

def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid topological ordering of courses, or [] if impossible.
    prerequisite [a, b] means: to take course a, you must first take course b.
    """
    # Build graph and calculate indegrees
    graph = [[] for _ in range(numCourses)]
    indegree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)  # prereq -> course
        indegree[course] += 1
    
    # Start with courses having no prerequisites
    queue = deque([i for i in range(numCourses) if indegree[i] == 0])
    order = []
    
    while queue:
        current = queue.popleft()
        order.append(current)
        
        for neighbor in graph[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, return order; else there's a cycle
    return order if len(order) == numCourses else []


# ============ TEST CASES ============
if __name__ == "__main__":
    # Test 1: Basic case from LeetCode
    assert find_order(2, [[1, 0]]) == [0, 1], "Test 1 failed"
    
    # Test 2: Multiple valid orders possible
    result = find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    assert len(result) == 4, "Test 2 length failed"
    # Verify it's a valid topological order
    pos = {c: i for i, c in enumerate(result)}
    assert pos[0] < pos[1], "Test 2: 0 before 1"
    assert pos[0] < pos[2], "Test 2: 0 before 2"
    assert pos[1] < pos[3], "Test 2: 1 before 3"
    assert pos[2] < pos[3], "Test 2: 2 before 3"
    
    # Test 3: Cycle detection
    assert find_order(2, [[1, 0], [0, 1]]) == [], "Test 3 cycle failed"
    
    # Test 4: No prerequisites
    result = find_order(3, [])
    assert len(result) == 3 and set(result) == {0, 1, 2}, "Test 4 failed"
    
    # Test 5: Single course
    assert find_order(1, []) == [0], "Test 5 failed"
    
    # Test 6: Self-loop (cycle)
    assert find_order(1, [[0, 0]]) == [], "Test 6 self-loop failed"
    
    # Test 7: Larger cycle
    assert find_order(3, [[0, 1], [1, 2], [2, 0]]) == [], "Test 7 cycle failed"
    
    # Test 8: Chain of prerequisites
    result = find_order(4, [[1, 0], [2, 1], [3, 2]])
    assert result == [0, 1, 2, 3], f"Test 8 failed: {result}"
    
    print("All tests passed!")
    print(f"\nExample: find_order(4, [[1,0],[2,0],[3,1],[3,2]]) = {find_order(4, [[1,0],[2,0],[3,1],[3,2]])}")
