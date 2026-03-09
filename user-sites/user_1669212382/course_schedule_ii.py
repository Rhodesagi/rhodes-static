from collections import deque
from typing import List

def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Uses Kahn's algorithm (BFS topological sort).
    Time: O(V + E), Space: O(V + E)
    """
    # Build adjacency list and in-degree counts
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
    
    # Process courses
    while queue:
        curr = queue.popleft()
        result.append(curr)
        
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, return result; else cycle exists
    return result if len(result) == numCourses else []


# === TESTS ===
if __name__ == "__main__":
    def test(name: str, got: List[int], expected_len: int, valid_check=None):
        status = "PASS" if len(got) == expected_len and (valid_check is None or valid_check(got)) else "FAIL"
        print(f"[{status}] {name}: {got}")
    
    # Test 1: Example from LeetCode
    # numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]
    # Valid orders: [0,1,2,3] or [0,2,1,3]
    def check_valid_order1(order):
        pos = {c: i for i, c in enumerate(order)}
        return pos[1] > pos[0] and pos[2] > pos[0] and pos[3] > pos[1] and pos[3] > pos[2]
    
    r1 = find_order(4, [[1,0],[2,0],[3,1],[3,2]])
    test("Example 1", r1, 4, check_valid_order1)
    
    # Test 2: Cycle detection
    # 0 -> 1 -> 0 (cycle)
    r2 = find_order(2, [[1,0],[0,1]])
    test("Cycle detection", r2, 0)
    
    # Test 3: No prerequisites
    r3 = find_order(3, [])
    test("No prerequisites", r3, 3)
    
    # Test 4: Single course
    r4 = find_order(1, [])
    test("Single course", r4, 1)
    
    # Test 5: Linear chain
    # 0 -> 1 -> 2 -> 3 (must be [0,1,2,3])
    r5 = find_order(4, [[1,0],[2,1],[3,2]])
    test("Linear chain", r5, 4, lambda o: o == [0,1,2,3])
    
    # Test 6: Multiple disconnected components
    # Component 1: 0 -> 1, Component 2: 2 -> 3
    def check_valid_order6(order):
        pos = {c: i for i, c in enumerate(order)}
        return pos[1] > pos[0] and pos[3] > pos[2]
    
    r6 = find_order(4, [[1,0],[3,2]])
    test("Disconnected components", r6, 4, check_valid_order6)
    
    # Test 7: Course with multiple prerequisites
    # 0 -> 2, 1 -> 2 (2 needs both 0 and 1)
    def check_valid_order7(order):
        pos = {c: i for i, c in enumerate(order)}
        return pos[2] > pos[0] and pos[2] > pos[1]
    
    r7 = find_order(3, [[2,0],[2,1]])
    test("Multiple prereqs", r7, 3, check_valid_order7)
    
    print("\n--- All tests complete ---")
