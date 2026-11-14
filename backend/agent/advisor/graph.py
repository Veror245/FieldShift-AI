from uuid import uuid4

from .state import AdvisorState
from .state import AdvisorOutput
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from .context import build_context
from .llm import get_llm   # provider wrapper — see below
from ..supervisor.state import Task
from .parser import titanium_parse_advisor


async def advisor_node(state: AdvisorState) -> dict:
    print("[advisor] entered")
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
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_prompt},
    ]

    llm = get_llm()

    # ─── Single attempt: raw invoke + titanium parse ───────────────────
    try:
        raw = await llm.ainvoke(messages)
    except Exception as e:
        print(f"[advisor] invoke failed: {type(e).__name__}: {e}")
        return {
            "advisor": None,
            "tasks": [Task(task_id=task_id, agent="advisor", status="failed",
                           error=f"llm invoke failed: {str(e)[:300]}")],
        }

    # Extract text content (Groq returns AIMessage with .content: str)
    content = raw.content if hasattr(raw, "content") else str(raw)
    if isinstance(content, list):
        content = "".join(
            b.get("text", "") if isinstance(b, dict) else str(b)
            for b in content
        )

    print(f"[advisor] response length: {len(content)} chars")
    print(f"[advisor] first 600 chars of response:\n{content[:600]}\n---end---")


    # ─── Parse ─────────────────────────────────────────────────────────
    result: AdvisorOutput | None = titanium_parse_advisor(content)

    # ─── Reject empty/incomplete output ────────────────────────────────
    if result is None:
        print("[advisor] titanium returned None")
        return {
            "advisor": None,
            "tasks": [Task(task_id=task_id, agent="advisor", status="failed",
                           error="titanium parser could not extract AdvisorOutput",
                           )],
        }

    if not result.overview or not result.strategy_explanations:
        print(f"[advisor] incomplete — overview_len={len(result.overview or '')}, "
              f"strategies={len(result.strategy_explanations or [])}")
        return {
            "advisor": None,
            "tasks": [Task(task_id=task_id, agent="advisor", status="failed",
                           error=f"incomplete output: overview={'yes' if result.overview else 'no'}, "
                                 f"strategies={len(result.strategy_explanations or [])}")],
        }

    print(f"[advisor] success — {len(result.strategy_explanations)} strategies explained")
    return {
        "advisor": result.model_dump(mode="json"),
        "tasks": [Task(task_id=task_id, agent="advisor", status="complete")],
    }
