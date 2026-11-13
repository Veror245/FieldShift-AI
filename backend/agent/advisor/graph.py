from uuid import uuid4

from .state import AdvisorState
from .state import AdvisorOutput
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from .context import build_context
from .llm import get_llm   # provider wrapper — see below
from ..supervisor.state import Task


async def advisor_node(state: AdvisorState) -> dict:
    task_id = f"advisor:{uuid4()}"
    rotation = state.get("rotation") or {}

    # Nothing to explain → clean failure
    if not rotation.get("strategies"):
        return {
            "advisor": None,
            "tasks": [Task(task_id=task_id, agent="advisor",
                           status="failed", error="no strategies to explain")],
        }

    ctx = build_context(state)
    user_prompt = USER_PROMPT_TEMPLATE.format(**ctx)

    llm = get_llm().with_structured_output(AdvisorOutput)

    try:
        result: AdvisorOutput = await llm.ainvoke([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ]) # type: ignore
    except Exception as e:
        return {
            "advisor": None,
            "tasks": [Task(task_id=task_id, agent="advisor",
                           status="failed", error=f"llm error: {e}")],
        }

    return {
        "advisor": result.model_dump(mode="json"),
        "tasks": [Task(task_id=task_id, agent="advisor", status="complete")],
    }