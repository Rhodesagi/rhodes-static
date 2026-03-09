from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Uses Kahn's algorithm (BFS topological sort).
    Time: O(V + E), Space: O(V + E)
    """
    # Build adjacency list and in-degree count
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Queue all courses with no prerequisites
    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
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


# Test cases
if __name__ == "__main__":
    # Example 1: numCourses = 2, prerequisites = [[1,0]]
    print(find_order(2, [[1, 0]]))  # Expected: [0, 1]
    
    # Example 2: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
    result = find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    print(result)  # Expected: [0, 1, 2, 3] or [0, 2, 1, 3]
    
    # Example 3: Cycle detection
    print(find_order(2, [[1, 0], [0, 1]]))  # Expected: []
    
    # Edge cases
    print(find_order(3, []))  # Expected: [0, 1, 2] (any order)
    print(find_order(1, []))  # Expected: [0]
