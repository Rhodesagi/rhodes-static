"""
Course Schedule II - Topological Sort Implementation
LeetCode 210: Find a valid order to take all courses given prerequisites.
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Args:
        numCourses: Total number of courses labeled 0 to numCourses-1
        prerequisites: List of [course, prerequisite] pairs
    
    Returns:
        List of course IDs in valid completion order
    """
    # Build adjacency list and calculate in-degrees
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
    
    # Process courses in topological order
    order = []
    
    while queue:
        course = queue.popleft()
        order.append(course)
        
        # For each course that depends on current course
        for next_course in graph[course]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # If we couldn't process all courses, there's a cycle
    return order if len(order) == numCourses else []


# === Test Cases ===
if __name__ == "__main__":
    # Test 1: Basic case from LeetCode
    numCourses1 = 2
    prerequisites1 = [[1, 0]]
    result1 = find_order(numCourses1, prerequisites1)
    print(f"Test 1: numCourses=2, prereqs=[[1,0]]")
    print(f"Result: {result1}")
    assert result1 == [0, 1], f"Expected [0, 1], got {result1}"
    print("✓ PASSED\n")
    
    # Test 2: Multiple prerequisites
    numCourses2 = 4
    prerequisites2 = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result2 = find_order(numCourses2, prerequisites2)
    print(f"Test 2: numCourses=4, prereqs=[[1,0],[2,0],[3,1],[3,2]]")
    print(f"Result: {result2}")
    assert len(result2) == 4
    assert result2.index(0) < result2.index(1)
    assert result2.index(0) < result2.index(2)
    assert result2.index(1) < result2.index(3)
    assert result2.index(2) < result2.index(3)
    print("✓ PASSED\n")
    
    # Test 3: Cycle detection (impossible)
    numCourses3 = 2
    prerequisites3 = [[1, 0], [0, 1]]
    result3 = find_order(numCourses3, prerequisites3)
    print(f"Test 3: Cycle detection - numCourses=2, prereqs=[[1,0],[0,1]]")
    print(f"Result: {result3}")
    assert result3 == [], f"Expected [] (cycle), got {result3}"
    print("✓ PASSED\n")
    
    # Test 4: No prerequisites
    numCourses4 = 3
    prerequisites4 = []
    result4 = find_order(numCourses4, prerequisites4)
    print(f"Test 4: No prerequisites - numCourses=3, prereqs=[]")
    print(f"Result: {result4}")
    assert len(result4) == 3
    assert set(result4) == {0, 1, 2}
    print("✓ PASSED\n")
    
    # Test 5: Single course
    numCourses5 = 1
    prerequisites5 = []
    result5 = find_order(numCourses5, prerequisites5)
    print(f"Test 5: Single course - numCourses=1, prereqs=[]")
    print(f"Result: {result5}")
    assert result5 == [0]
    print("✓ PASSED\n")
    
    # Test 6: Self-loop (cycle)
    numCourses6 = 2
    prerequisites6 = [[0, 0]]
    result6 = find_order(numCourses6, prerequisites6)
    print(f"Test 6: Self-loop - numCourses=2, prereqs=[[0,0]]")
    print(f"Result: {result6}")
    assert result6 == [], f"Expected [] (self-loop), got {result6}"
    print("✓ PASSED\n")
    
    print("=" * 50)
    print("All tests passed!")
