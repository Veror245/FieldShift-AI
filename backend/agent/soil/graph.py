from uuid import uuid4
from .state import SoilState
from ..supervisor.state import Task
from ...data import load_crops

def _assess_soil(soil: dict) -> dict:
    result = {}

    ph = soil.get("ph")
    if ph is not None:
        if ph < 6.0:       status = "acidic"
        elif ph < 7.5:     status = "neutral"
        elif ph <= 8.5:    status = "slightly_alkaline"
        else:              status = "alkaline"
        result["ph"] = {"value": ph, "status": status}

    oc = soil.get("organic_carbon_pct")
    if oc is not None:
        if oc < 0.5:       status = "low"
        elif oc < 0.75:    status = "medium"
        else:              status = "high"
        result["organic_carbon_pct"] = {"value": oc, "status": status}

    tex = soil.get("texture")
    if tex: result["texture"] = {"value": tex}

    n = soil.get("nitrogen_ppm")
    if n is not None:
        if n < 150:        status = "low"
        elif n < 300:      status = "medium"
        else:              status = "high"
        result["nitrogen_ppm"] = {"value": n, "status": status}

    return result

def _families_in_rotation(rotation, crops):
    return {crops[r["crop_id"]]["family"]
            for r in rotation if r.get("crop_id") in crops}
    

def _evaluate_crop(crop_id, crop, soil, current_families):
    family_ok = crop["family"] not in current_families
    n_fixing = crop.get("nitrogen_fixing", False)

    # environmental fit
    env_ok = True
    reasons = []
    ph = soil.get("ph")
    if ph is not None and crop.get("ph_range"):
        lo, hi = crop["ph_range"]
        if not (lo <= ph <= hi):
            env_ok = False
            reasons.append(f"pH {ph} outside range {lo}-{hi}")

    return {
        "crop_id": crop_id,
        "family": crop["family"],
        "family_compatible": family_ok,
        "nitrogen_fixing": n_fixing,
        "water_requirement": crop.get("water_requirement", "unknown"),
        "env_compatible": env_ok,
        "notes": reasons,
    }


def _find_window_conflicts(rotation, crops):
    conflicts = []
    if len(rotation) < 2:
        return conflicts
    for prev, curr in zip(rotation, rotation[1:]):
        prev_crop = crops.get(prev["crop_id"])
        curr_crop = crops.get(curr["crop_id"])
        if not prev_crop or not curr_crop: continue

        prev_harvest = prev_crop.get("harvest_window", {}).get(prev["season"])
        curr_plant = curr_crop.get("planting_window", {}).get(curr["season"])
        if not prev_harvest or not curr_plant: continue

        if prev_harvest[1] > curr_plant[0]:
            conflicts.append(
                f"{prev['crop_id']} harvest (month {prev_harvest[1]}) "
                f"overlaps {curr['crop_id']} planting (month {curr_plant[0]})"
            )
    return conflicts


def _expert_validation_flags(soil, assessment):
    flags = []
    if not soil.get("texture"):
        flags.append("Soil texture missing — using regional default")
    if not soil.get("ph"):
        flags.append("Soil pH missing — using regional default")
    if not soil.get("sampled_at"):
        flags.append("Soil sample date unknown — verify recency")
    return flags


def soil_node(state: SoilState) -> dict:
    print(f"Entereted Soil")
    task_id = f"soil:{uuid4()}"
    crops = load_crops()
    soil = state.get("soil_inputs") or {}
    rotation = state.get("current_rotation") or []

    soil_assessment = _assess_soil(soil)
    current_families = _families_in_rotation(rotation, crops)
    compatibility = [
        _evaluate_crop(cid, crop, soil, current_families)
        for cid, crop in crops.items()
    ]
    conflicts = _find_window_conflicts(rotation, crops)
    expert = _expert_validation_flags(soil, soil_assessment)

    return {
        "agronomy": {
            "soil_assessment": soil_assessment,
            "crop_compatibility": compatibility,
            "planting_window_conflicts": conflicts,
            "expert_validation_needed": expert,
        },
        "tasks": [Task(task_id=task_id, agent="soil", status="complete")],
    }