from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid topological ordering of courses, or [] if impossible.
    
    prerequisites[i] = [course, prereq] means "to take course, you must first take prereq"
    """
    # Build adjacency list and in-degree counts
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Start with courses that have no prerequisites
    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
    result = []
    
    while queue:
        course = queue.popleft()
        result.append(course)
        
        # For each course that depends on the current one
        for next_course in graph[course]:
            in_degree[next_course] -= 1
            if in_degree[next_course] == 0:
                queue.append(next_course)
    
    # If we couldn't process all courses, there's a cycle
    return result if len(result) == numCourses else []


# === Test cases ===
if __name__ == "__main__":
    # Example 1: Valid order exists
    assert find_order(2, [[1, 0]]) == [0, 1]
    
    # Example 2: Cycle exists
    assert find_order(2, [[1, 0], [0, 1]]) == []
    
    # Example 3: Multiple valid orders possible
    result = find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    assert len(result) == 4
    assert set(result) == {0, 1, 2, 3}
    # Verify prerequisites are respected
    pos = {c: i for i, c in enumerate(result)}
    assert pos[0] < pos[1]
    assert pos[0] < pos[2]
    assert pos[1] < pos[3]
    assert pos[2] < pos[3]
    
    # Example 4: No prerequisites
    result = find_order(3, [])
    assert len(result) == 3 and set(result) == {0, 1, 2}
    
    # Example 5: Empty graph
    assert find_order(0, []) == []
    
    # Example 6: Single course
    assert find_order(1, []) == [0]
    
    # Example 7: Long chain
    assert find_order(4, [[1, 0], [2, 1], [3, 2]]) == [0, 1, 2, 3]
    
    print("All tests passed!")
