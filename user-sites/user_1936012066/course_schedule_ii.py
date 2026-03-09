from collections import deque
from typing import List


def find_order(numCourses: int, prerequisites: List[List[int]]) -> List[int]:
    """
    Return a valid ordering of courses to finish all courses.
    If impossible (cycle exists), return empty list.
    
    Args:
        numCourses: Total number of courses labeled 0 to numCourses-1
        prerequisites: List of [course, prereq] pairs where prereq must be taken before course
    
    Returns:
        List of course IDs in valid order, or empty list if impossible
    """
    # Build adjacency list and in-degree count
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    
    for course, prereq in prerequisites:
        graph[prereq].append(course)  # prereq -> course
        in_degree[course] += 1
    
    # Queue all courses with no prerequisites
    queue = deque()
    for i in range(numCourses):
        if in_degree[i] == 0:
            queue.append(i)
    
    # Process courses
    result = []
    while queue:
        current = queue.popleft()
        result.append(current)
        
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If we processed all courses, valid order exists
    return result if len(result) == numCourses else []


# === TEST CASES ===
if __name__ == "__main__":
    def test(name: str, numCourses: int, prerequisites: List[List[int]], expected_valid: bool = True):
        result = find_order(numCourses, prerequisites)
        is_valid = len(result) == numCourses if expected_valid else len(result) == 0
        status = "✓ PASS" if is_valid else "✗ FAIL"
        print(f"{status}: {name}")
        print(f"  Input: numCourses={numCourses}, prerequisites={prerequisites}")
        print(f"  Output: {result}")
        if expected_valid and len(result) == numCourses:
            # Verify the order is valid
            position = {c: i for i, c in enumerate(result)}
            valid_order = all(position[course] > position[prereq] for course, prereq in prerequisites)
            print(f"  Order valid: {valid_order}")
        print()
        return is_valid
    
    all_passed = True
    
    # Test 1: Basic case from LeetCode
    all_passed &= test("Basic valid case", 4, [[1,0],[2,0],[3,1],[3,2]])
    
    # Test 2: Simple cycle
    all_passed &= test("Simple cycle (impossible)", 2, [[1,0],[0,1]], expected_valid=False)
    
    # Test 3: Self-loop
    all_passed &= test("Self-loop (impossible)", 1, [[0,0]], expected_valid=False)
    
    # Test 4: No prerequisites
    all_passed &= test("No prerequisites", 3, [], expected_valid=True)
    
    # Test 5: Linear chain
    all_passed &= test("Linear chain", 4, [[1,0],[2,1],[3,2]])
    
    # Test 6: Single course, no prereqs
    all_passed &= test("Single course", 1, [])
    
    # Test 7: Complex cycle
    all_passed &= test("Complex cycle (impossible)", 4, [[1,0],[2,1],[3,2],[1,3]], expected_valid=False)
    
    # Test 8: Multiple independent chains
    all_passed &= test("Multiple chains", 6, [[1,0],[2,1],[4,3],[5,4]])
    
    # Test 9: Diamond pattern
    all_passed &= test("Diamond pattern", 4, [[1,0],[2,0],[3,1],[3,2]])
    
    print("=" * 50)
    print("ALL TESTS PASSED" if all_passed else "SOME TESTS FAILED")
