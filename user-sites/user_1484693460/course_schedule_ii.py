"""
Course Schedule II - Topological Sort (Kahn's Algorithm)
LeetCode 210
"""
from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Time: O(V + E) where V = numCourses, E = len(prerequisites)
    Space: O(V + E)
    """
    # Build adjacency list and in-degree array
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    
    # Start with courses that have no prerequisites
    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
    result = []
    
    while queue:
        current = queue.popleft()
        result.append(current)
        
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, return the order
    # Otherwise, there's a cycle
    return result if len(result) == numCourses else []


# Test cases
if __name__ == "__main__":
    # Example 1: Normal case
    print(find_order(2, [[1, 0]]))  # [0, 1]
    
    # Example 2: Multiple valid orders possible
    print(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))  # [0, 1, 2, 3] or [0, 2, 1, 3]
    
    # Example 3: Cycle - impossible
    print(find_order(2, [[1, 0], [0, 1]]))  # []
    
    # Edge case: No prerequisites
    print(find_order(3, []))  # [0, 1, 2] (any order)
    
    # Edge case: Single course
    print(find_order(1, []))  # [0]
