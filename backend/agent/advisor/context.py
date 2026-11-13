def build_context(state) -> dict:
    agronomy = state.get("agronomy") or {}
    earth_obs = state.get("earth_obs") or {}
    rotation = state.get("rotation") or {}
    priorities = state.get("priorities") or {}
    constraints = state.get("constraints") or {}
    climate = state.get("climate") or {}

    return {
        "objectives": state.get("objectives", ""),
        "priorities_block": _format_priorities(priorities),
        "constraints_block": _format_constraints(constraints),
        "soil_block": _format_soil(agronomy.get("soil_assessment", {})),
        "conflicts_block": "\n".join(f"- {c}" for c in agronomy.get("planting_window_conflicts", [])) or "(none detected)",
        "climate_block": _format_climate(earth_obs, climate),
        "strategies_block": _format_strategies(rotation.get("strategies", [])),
        "pareto_block": ", ".join(rotation.get("pareto_front", [])) or "(none)",
        "recommended_block": ", ".join(rotation.get("recommended_order", [])) or "(none)",
    }


def _format_priorities(p: dict) -> str:
    if not p:
        return "(defaults — all weighted equally)"
    return "\n".join(f"- {k}: {v:.2f}" for k, v in sorted(p.items(), key=lambda x: -x[1]))


def _format_constraints(c: dict) -> str:
    lines = []
    if c.get("forbidden_crops"): lines.append(f"- Forbidden: {', '.join(c['forbidden_crops'])}")
    if c.get("required_crops"):  lines.append(f"- Required: {', '.join(c['required_crops'])}")
    if c.get("max_water_requirement"): lines.append(f"- Max water requirement: {c['max_water_requirement']}")
    return "\n".join(lines) or "(none)"


def _format_soil(soil: dict) -> str:
    if not soil:
        return "(no soil data)"
    lines = []
    for k, v in soil.items():
        if isinstance(v, dict):
            status = v.get("status", "")
            value = v.get("value", "")
            lines.append(f"- {k}: {value} ({status})")
        else:
            lines.append(f"- {k}: {v}")
    return "\n".join(lines)


def _format_climate(earth_obs: dict, climate: dict) -> str:
    if not earth_obs:
        return "(no environmental data)"
    lines = [
        f"- Mean temperature: {earth_obs.get('temperature_c', '?')}°C",
        f"- Total precipitation: {earth_obs.get('precipitation_mm', '?')} mm over {earth_obs.get('n_days', '?')} days",
        f"- Grid resolution: {earth_obs.get('grid_resolution_deg', '?')}° (coarse — NOT field-level precise)",
        f"- Missing days: {earth_obs.get('missing_days', '?')}",
    ]
    if climate.get("stub"):
        lines.append("- NOTE: ML climate analysis not yet available; figures are raw NASA POWER averages")
    return "\n".join(lines)


def _format_strategies(strategies: list[dict]) -> str:
    lines = []
    for s in strategies:
        seq = " → ".join(f"{e['crop_id']} ({e['season']})" for e in s["sequence"])
        lines.append(f"\n[{s['strategy_id']}] {s['label']}")
        lines.append(f"  Sequence: {seq}")
        lines.append(f"  Hard constraint status: {s['hard_constraint_status']}")
        if s["hard_constraint_reasons"]:
            lines.append(f"  Constraint violations: {'; '.join(s['hard_constraint_reasons'])}")
        lines.append(f"  Scores:")
        for k, v in s["scores"].items():
            lines.append(f"    {k}: {v:.2f}")
        lines.append(f"  Weighted score: {s['weighted_score']:.3f}")
    return "\n".join(lines)