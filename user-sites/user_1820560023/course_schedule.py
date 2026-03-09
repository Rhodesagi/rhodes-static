from collections import deque
from typing import List

def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid order to take all courses, or empty list if impossible.
    
    prerequisites[i] = [course, prereq] means prereq must be taken before course.
    """
    # Build adjacency list and in-degree count
    adj = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        adj[prereq].append(course)
        in_degree[course] += 1
    
    # Queue all courses with no prerequisites (in-degree 0)
    queue = deque()
    for i in range(numCourses):
        if in_degree[i] == 0:
            queue.append(i)
    
    # Process courses
    result = []
    while queue:
        curr = queue.popleft()
        result.append(curr)
        
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we couldn't process all courses, there's a cycle
    return result if len(result) == numCourses else []


# ========== TEST CASES ==========

def test_example_1():
    """Example from LeetCode: 4 courses, [[1,0],[2,0],[3,1],[3,2]]"""
    numCourses = 4
    prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]
    result = find_order(numCourses, prerequisites)
    assert len(result) == 4, f"Expected 4 courses, got {len(result)}"
    # Verify ordering constraints
    pos = {c: i for i, c in enumerate(result)}
    assert pos[0] < pos[1], "0 must come before 1"
    assert pos[0] < pos[2], "0 must come before 2"
    assert pos[1] < pos[3], "1 must come before 3"
    assert pos[2] < pos[3], "2 must come before 3"
    print(f"✓ Example 1 passed: {result}")

def test_example_2():
    """Example with cycle: 2 courses, [[1,0],[0,1]]"""
    numCourses = 2
    prerequisites = [[1, 0], [0, 1]]
    result = find_order(numCourses, prerequisites)
    assert result == [], f"Expected empty list (cycle), got {result}"
    print("✓ Example 2 passed: cycle detected correctly")

def test_no_prerequisites():
    """No prerequisites - any order works"""
    numCourses = 3
    prerequisites = []
    result = find_order(numCourses, prerequisites)
    assert len(result) == 3 and set(result) == {0, 1, 2}
    print(f"✓ No prerequisites passed: {result}")

def test_single_course():
    """Single course with no prerequisites"""
    numCourses = 1
    prerequisites = []
    result = find_order(numCourses, prerequisites)
    assert result == [0]
    print("✓ Single course passed")

def test_linear_chain():
    """Linear prerequisite chain: 0 -> 1 -> 2 -> 3"""
    numCourses = 4
    prerequisites = [[1, 0], [2, 1], [3, 2]]
    result = find_order(numCourses, prerequisites)
    assert result == [0, 1, 2, 3], f"Expected [0,1,2,3], got {result}"
    print("✓ Linear chain passed")

def test_self_loop():
    """Self-loop is a cycle"""
    numCourses = 2
    prerequisites = [[0, 0]]
    result = find_order(numCourses, prerequisites)
    assert result == [], f"Expected empty list (self-loop), got {result}"
    print("✓ Self-loop cycle passed")

def test_complex_dag():
    """Complex DAG with multiple valid orderings"""
    numCourses = 6
    prerequisites = [[3, 0], [3, 1], [4, 1], [4, 2], [5, 3], [5, 4]]
    result = find_order(numCourses, prerequisites)
    assert len(result) == 6
    pos = {c: i for i, c in enumerate(result)}
    assert pos[0] < pos[3], "0 before 3"
    assert pos[1] < pos[3], "1 before 3"
    assert pos[1] < pos[4], "1 before 4"
    assert pos[2] < pos[4], "2 before 4"
    assert pos[3] < pos[5], "3 before 5"
    assert pos[4] < pos[5], "4 before 5"
    print(f"✓ Complex DAG passed: {result}")

if __name__ == "__main__":
    test_example_1()
    test_example_2()
    test_no_prerequisites()
    test_single_course()
    test_linear_chain()
    test_self_loop()
    test_complex_dag()
    print("\n✅ All tests passed!")
