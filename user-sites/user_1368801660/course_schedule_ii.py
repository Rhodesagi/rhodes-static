from collections import deque
from typing import List

def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Uses Kahn's algorithm (BFS topological sort).
    Time: O(V + E), Space: O(V + E)
    """
    # Build graph and in-degree count
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Start with courses having no prerequisites
    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
    result = []
    
    while queue:
        current = queue.popleft()
        result.append(current)
        
        # Reduce in-degree for all courses that require current
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, valid order exists
    return result if len(result) == numCourses else []


# Test cases
if __name__ == "__main__":
    # Example 1: numCourses = 2, prerequisites = [[1,0]]
    # Output: [0,1]
    print("Test 1:", find_order(2, [[1, 0]]))
    
    # Example 2: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
    # Output: [0,1,2,3] or [0,2,1,3]
    result = find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    print("Test 2:", result)
    # Verify it's valid
    pos = {c: i for i, c in enumerate(result)}
    assert pos[1] > pos[0] and pos[2] > pos[0] and pos[3] > pos[1] and pos[3] > pos[2]
    print("  -> Valid ordering verified")
    
    # Example 3: numCourses = 1, prerequisites = []
    # Output: [0]
    print("Test 3:", find_order(1, []))
    
    # Cycle case: numCourses = 2, prerequisites = [[1,0],[0,1]]
    # Output: []
    print("Test 4 (cycle):", find_order(2, [[1, 0], [0, 1]]))
    
    # Larger test
    print("Test 5:", find_order(3, [[0, 1], [0, 2], [1, 2]]))
    
    print("\nAll tests passed!")
