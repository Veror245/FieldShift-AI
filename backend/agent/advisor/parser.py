import json
import logging
import re

from pydantic import ValidationError

from .state import AdvisorOutput
from .state import StrategyExplanation


logger = logging.getLogger(__name__)


def titanium_parse_advisor(raw_content: str) -> AdvisorOutput | None:
    """
    5-level fallback parser for AdvisorOutput.

    Levels:
      0. Gemini XML tool-call format (the actual failure mode)
      1. Direct Pydantic parse (if the LLM behaved)
      2. Bracket extraction (strip surrounding prose)
      3. Raw JSON load + per-field validation
      4. Individual strategy extraction (best-effort)
    """
    content = _clean(raw_content)

    # ─── Level 0: Gemini XML tool-call ─────────────────────────────────
    parsed = _try_xml_tool_call(content)
    if parsed is not None:
        logger.info("[titanium] Level 0 (XML tool-call) succeeded")
        return parsed

    # ─── Level 1: direct Pydantic ───────────────────────────────────────
    try:
        parsed = AdvisorOutput.model_validate_json(content)
        logger.info("[titanium] Level 1 (direct pydantic) succeeded")
        return parsed
    except Exception as e:
        logger.debug(f"Level 1 failed: {e}")

    # ─── Level 2: bracket extraction ────────────────────────────────────
    json_str = _extract_json_object(content)
    if json_str:
        try:
            parsed = AdvisorOutput.model_validate_json(json_str)
            logger.info("[titanium] Level 2 (bracket extraction) succeeded")
            return parsed
        except Exception as e:
            logger.debug(f"Level 2 failed: {e}")

    # ─── Level 3: raw load + manual validation ─────────────────────────
    if json_str:
        try:
            raw = json.loads(json_str)
            parsed = _validate_partial(raw)
            if parsed is not None:
                logger.info("[titanium] Level 3 (partial raw load) succeeded")
                return parsed
        except Exception as e:
            logger.warning(f"Level 3 failed: {e}")

    # ─── Level 4: per-strategy salvage ─────────────────────────────────
    parsed = _salvage_strategies(content)
    if parsed is not None:
        logger.warning("[titanium] Level 4 (salvage) succeeded — data loss likely")
        return parsed

    logger.error("[titanium] All levels failed")
    return None


# ─────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────

def _clean(raw: str) -> str:
    return (raw or "").replace("```json", "").replace("```", "").strip()


def _extract_json_object(content: str) -> str | None:
    """Find the outermost { ... } containing our fields."""
    start = content.find("{")
    if start == -1:
        # Maybe it's a bare array — wrap it as {"strategy_explanations": [...]}
        arr_start = content.find("[")
        if arr_start == -1:
            return None
        arr_end = content.rfind("]")
        if arr_end <= arr_start:
            return None
        return '{"strategy_explanations": ' + content[arr_start:arr_end + 1] + "}"

    # Bracket matching (handles nested braces inside strings/arrays)
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(content)):
        ch = content[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return content[start:i + 1]
    return None


def _try_xml_tool_call(content: str) -> AdvisorOutput | None:
    """
    Handle Gemini's `<tool_call><function=X><parameter=Y>...</parameter>`
    format that shows up when `with_structured_output` uses tool-calling.
    """
    if "<parameter=" not in content:
        return None

    # Extract each parameter block
    pattern = r"<parameter=(\w+)>\s*(.*?)\s*</parameter>"
    matches = re.findall(pattern, content, re.DOTALL)
    if not matches:
        return None

    fields: dict = {}
    for name, value in matches:
        value = value.strip()
        # If it looks like JSON, parse it (strategy_explanations, next_steps, etc.)
        if value and value[0] in "[{":
            try:
                fields[name] = json.loads(value)
                continue
            except json.JSONDecodeError:
                pass
        fields[name] = value

    try:
        return AdvisorOutput(**fields)
    except ValidationError as e:
        logger.debug(f"XML parse built invalid model: {e}")
        # Try partial validation
        return _validate_partial(fields)


def _validate_partial(raw: dict) -> AdvisorOutput | None:
    """Validate as much as possible; return None if nothing recognizable."""
    if not raw:
        return None

    defaults = {
        "overview": "",
        "strategy_explanations": [],
        "comparison": "",
        "recommendation_note": "",
        "next_steps": [],
        "overall_uncertainties": [],
    }
    recognized = {k: v for k, v in raw.items() if k in defaults}
    if not recognized:
        print(f"[titanium] _validate_partial: NO recognized keys. Got: {list(raw.keys())}")
        return None   # ← THE FIX

    merged = {**defaults, **recognized}

    valid_strategies = []
    for item in merged.get("strategy_explanations", []):
        if not isinstance(item, dict):
            continue
        try:
            valid_strategies.append(StrategyExplanation(**item))
        except ValidationError as e:
            print(f"[titanium] dropping invalid strategy: {e}")
    merged["strategy_explanations"] = valid_strategies

    try:
        return AdvisorOutput(**merged)
    except ValidationError as e:
        print(f"[titanium] _validate_partial final failed: {e}")
        return None


def _salvage_strategies(content: str) -> AdvisorOutput | None:
    """
    Last-ditch: find any individual strategy objects in the raw content.
    Useful if the LLM broke structure but individual strategy dicts are intact.
    """
    from .state import StrategyExplanation

    valid = []
    # Greedy search for strategy-shaped objects
    for match in re.finditer(r'\{[^{}]*"strategy_id"[^{}]*\}', content):
        try:
            data = json.loads(match.group(0))
            valid.append(StrategyExplanation(**data))
        except Exception:
            continue

    if not valid:
        return None

    return AdvisorOutput(
        overview="(partial parse — see uncertainties)",
        strategy_explanations=valid,
        comparison="",
        recommendation_note="",
        next_steps=[],
        overall_uncertainties=["Advisor output was partially parsed due to malformed LLM response."],
    )