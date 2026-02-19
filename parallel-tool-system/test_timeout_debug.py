import asyncio
import sys
sys.path.insert(0, '/opt/rhodes-ai/parallel-tool-system')

from parallel_executor import PlanExecutor

class MockExecutor:
    async def execute_tool(self, tool, args, **kwargs):
        print(f"  execute_tool called with timeout={kwargs.get('timeout')}")
        if tool == "shell_exec" and "sleep" in args.get("command", ""):
            print("  Starting sleep simulation")
            await asyncio.sleep(0.1)  # Longer than timeout
            print("  Sleep completed")
        return {"output": "normal result"}

async def test():
    executor = PlanExecutor(MockExecutor())
    
    plan = {
        "steps": [
            {
                "id": "step1",
                "tool": "shell_exec",
                "args": {"command": "sleep 1"},
                "timeout": 0.01,
                "depends_on": []
            }
        ]
    }
    
    print("Executing plan...")
    results = await executor.execute_plan(plan)
    print(f"Results: {results}")

if __name__ == "__main__":
    asyncio.run(test())