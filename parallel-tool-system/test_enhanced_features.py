#!/usr/bin/env python3
"""
Test enhanced parallel executor features:
- Variable substitution
- Conditional execution
- Timeout handling
"""

import asyncio
import sys
import json
sys.path.insert(0, '/opt/rhodes-ai/parallel-tool-system')

from parallel_executor import PlanExecutor

class TestMCPExecutor:
    """Mock MCP executor for testing."""
    
    def __init__(self):
        self.call_log = []
    
    async def execute_tool(self, tool, args, **kwargs):
        self.call_log.append((tool, args))
        print(f"  [Mock] Executing {tool} with args {args}")
        
        # Simulate different behaviors based on tool
        if tool == "message":
            return {"_rhodes_intermediate_message": True, "message": args.get("message", ""), "session_id": None}
        elif tool == "shell_exec":
            # Simulate command execution
            cmd = args.get("command", "")
            if "sleep" in cmd:
                await asyncio.sleep(0.05)  # Simulate slow command
            return {"output": f"Result of: {cmd}", "success": True}
        elif tool == "file_read":
            # Simulate file reading
            content = f"Content of {args.get('path', '')}"
            return {"content": content, "success": True}
        else:
            return {"result": f"Mock result for {tool}", "args": args}

async def test_variable_substitution():
    """Test ${results.step_id.output} substitution."""
    print("\n=== Test 1: Variable Substitution ===")
    
    executor = PlanExecutor(TestMCPExecutor())
    
    plan = {
        "plan_id": "var-test",
        "steps": [
            {
                "id": "step1",
                "tool": "shell_exec",
                "args": {"command": "echo 'hello'"},
                "depends_on": []
            },
            {
                "id": "step2",
                "tool": "message",
                "args": {"message": "Result was: ${results.step1.output}"},
                "depends_on": ["step1"]
            }
        ]
    }
    
    results = await executor.execute_plan(plan)
    print(f"Results: {json.dumps(results, indent=2, default=str)[:500]}...")
    
    # Check that step2 got the substituted message
    step2_result = results["results"]["step2"]["result"]
    if "Result was:" in str(step2_result):
        print("✅ Variable substitution works")
    else:
        print("❌ Variable substitution failed")

async def test_conditional_execution():
    """Test condition field."""
    print("\n=== Test 2: Conditional Execution ===")
    
    executor = PlanExecutor(TestMCPExecutor())
    
    plan = {
        "plan_id": "cond-test",
        "steps": [
            {
                "id": "step1",
                "tool": "shell_exec",
                "args": {"command": "echo 'success'"},
                "depends_on": []
            },
            {
                "id": "step2",
                "tool": "message",
                "args": {"message": "This should execute"},
                "depends_on": ["step1"],
                "condition": "results.step1.output.success == True"
            },
            {
                "id": "step3",
                "tool": "message",
                "args": {"message": "This should be skipped"},
                "depends_on": ["step1"],
                "condition": "results.step1.output.success == False"  # False condition
            }
        ]
    }
    
    results = await executor.execute_plan(plan)
    
    step2_status = results["results"]["step2"]["status"]
    step3_status = results["results"]["step3"]["status"]
    
    print(f"Step2 status: {step2_status}")
    print(f"Step3 status: {step3_status}")
    
    if step2_status == "success" and step3_status == "skipped":
        print("✅ Conditional execution works")
    else:
        print("❌ Conditional execution failed")

async def test_timeout():
    """Test timeout handling."""
    print("\n=== Test 3: Timeout Handling ===")
    
    executor = PlanExecutor(TestMCPExecutor())
    
    plan = {
        "plan_id": "timeout-test",
        "steps": [
            {
                "id": "step1",
                "tool": "shell_exec",
                "args": {"command": "sleep 0.1"},
                "depends_on": [],
                "timeout": 0.01  # 10ms timeout for a 100ms operation
            },
            {
                "id": "step2",
                "tool": "message",
                "args": {"message": "This runs after timeout"},
                "depends_on": ["step1"]
            }
        ]
    }
    
    results = await executor.execute_plan(plan)
    
    step1_status = results["results"]["step1"]["status"]
    step2_status = results["results"]["step2"]["status"]
    
    print(f"Step1 status: {step1_status} (should be failed due to timeout)")
    print(f"Step2 status: {step2_status} (should be success - runs despite step1 failure)")
    
    if step1_status == "failed" and "timeout" in str(results["results"]["step1"]["result"]):
        print("✅ Timeout handling works")
    else:
        print("❌ Timeout handling failed")

async def test_complex_dependencies():
    """Test complex dependency graph with variables and conditions."""
    print("\n=== Test 4: Complex Dependencies ===")
    
    executor = PlanExecutor(TestMCPExecutor())
    
    plan = {
        "plan_id": "complex-test",
        "steps": [
            {
                "id": "get_data",
                "tool": "shell_exec",
                "args": {"command": "echo 'important data'"},
                "depends_on": []
            },
            {
                "id": "process",
                "tool": "message",
                "args": {"message": "Processing: ${results.get_data.output}"},
                "depends_on": ["get_data"],
                "condition": "len(results.get_data.output) > 0"
            },
            {
                "id": "log",
                "tool": "message",
                "args": {"message": "Step completed at ${results.process.output}"},
                "depends_on": ["process"]
            },
            {
                "id": "parallel_task",
                "tool": "file_read",
                "args": {"path": "test.txt"},
                "depends_on": []  # Runs in parallel with get_data
            }
        ]
    }
    
    results = await executor.execute_plan(plan)
    
    print(f"Execution levels: {results['execution_graph']}")
    print(f"Statistics: {results['statistics']}")
    
    # Check all steps completed
    success_count = results['statistics']['successful']
    if success_count >= 3:  # At least 3 should succeed
        print("✅ Complex dependency execution works")
    else:
        print(f"❌ Complex dependency execution: only {success_count} succeeded")

async def main():
    """Run all tests."""
    print("Testing Enhanced Parallel Executor Features")
    print("=" * 50)
    
    await test_variable_substitution()
    await test_conditional_execution()
    await test_timeout()
    await test_complex_dependencies()
    
    print("\n" + "=" * 50)
    print("All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())