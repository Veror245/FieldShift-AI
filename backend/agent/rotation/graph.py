from uuid import uuid4

from .state import RotationState
from ..supervisor.state import Task
from ...data import load_crops


DIMENSIONS = [
    "water_efficiency",
    "climate_compatibility",
    "soil_improvement",
    "nitrogen_cycling",
    "erosion_protection",
    "crop_diversity",
    "economic_potential",
    "feasibility",
]

SEASONS = ["kharif", "rabi"]
START_YEAR = 2024          

RESIDUE_SCORE = {"low": 0.3, "medium": 0.6, "high": 1.0}
COVER_SCORE   = {"low": 0.3, "medium": 0.6, "high": 1.0}
COST_PENALTY  = {"low": 0.0, "medium": 0.05, "high": 0.10}

def build_viable_pool(agronomy: dict, crops: dict) -> dict:
    pool = {}
    for compat in agronomy.get("crop_compatibility", []):
        cid = compat.get("crop_id")
        if compat.get("family_compatible") and cid in crops:
            pool[cid] = crops[cid]
    return pool


def _pick_for_slot(pool: dict, season: str, last_family: str | None,
                   sort_key, year: int) -> dict | None:
    """Pick best crop"""
    candidates = [
        (cid, c) for cid, c in pool.items()
        if season in c.get("planting_window", {})
    ]
    if not candidates:
        return None

    diverse = [(cid, c) for cid, c in candidates if c["family"] != last_family]
    pick_from = diverse if diverse else candidates

    cid = sorted(pick_from, key=lambda x: sort_key(x[1]))[0][0]
    return {"crop_id": cid, "season": season, "year": year}


def _build_sequence(pool: dict, sort_key) -> list[dict]:
    seq = []
    last_family = None
    for year in [START_YEAR, START_YEAR + 1]:
        for season in SEASONS:
            entry = _pick_for_slot(pool, season, last_family, sort_key, year)
            if entry is None:
                return []
            seq.append(entry)
            last_family = pool[entry["crop_id"]]["family"]
    return seq

def generate_existing(current_rotation: list[dict]) -> list[dict]:
    """Copy farmer's current rotation, extended to 2 years."""
    if not current_rotation:
        return []

    latest_year = max(e.get("year", 0) for e in current_rotation)
    one_year = [
        e for e in current_rotation
        if e.get("year") == latest_year and e.get("season") in SEASONS
    ]
    if not one_year:
        return []

    season_order = {"kharif": 0, "rabi": 1}
    one_year = sorted(one_year, key=lambda e: season_order.get(e["season"], 99))

    seq = []
    for year in [START_YEAR, START_YEAR + 1]:
        for entry in one_year:
            seq.append({
                "crop_id": entry["crop_id"],
                "season": entry["season"],
                "year": year,
            })
    return seq


def generate_soil_restoration(pool: dict) -> list[dict]:
    
    def key(c):
        n_fix = 0 if c.get("nitrogen_fixing") else 1
        residue = -RESIDUE_SCORE.get(c.get("residue_contribution") or "low", 0.3)
        cover = -COVER_SCORE.get(c.get("ground_cover") or "low", 0.3)
        return (n_fix, residue + cover)
    return _build_sequence(pool, key)


def generate_climate_resilience(pool: dict, climate=None) -> list[dict]:
  
    if not climate or climate.get("stub"):
        return _build_sequence(pool, lambda c: sum(c["water_use_mm"]) / 2)

    label = climate["current_season"]["label"]
    deviation = climate["baseline_comparison"]["deviation_pct"]


    FORAGE_SCORE = {"none": 0.0, "low": 0.3, "medium": 0.6, "high": 1.0}
    
    if label == "Zaid-like" or deviation < -15:
        # Hot + dry → strict low-water priority
        key = lambda c: (
            {"low": 0, "medium": 1, "high": 2}.get(
                c.get("water_requirement", "medium"), 1),
            sum(c.get("water_use_mm", [500, 800])) / 2,
        )

    elif label == "Rabi-like":
        # Cool + dry → medium water ideal, high residue protects topsoil
        key = lambda c: (
            {"medium": 0, "low": 1, "high": 2}.get(
                c.get("water_requirement", "medium"), 1),
            -RESIDUE_SCORE.get(c.get("residue_contribution") or "low", 0.3),
            sum(c.get("water_use_mm", [500, 800])) / 2,
        )

    else:
        # Kharif-like (wet monsoon) or deviation > +15 →
        # Can afford water, prioritize heat tolerance + soil building
        key = lambda c: (
            -(c.get("temp_range_c", [15, 30])[1]),
            -RESIDUE_SCORE.get(c.get("residue_contribution") or "low", 0.3),
            -FORAGE_SCORE.get(c.get("forage_potential") or "none", 0.0),    # ← add
            sum(c.get("water_use_mm", [500, 800])) / 2,
        )

    return _build_sequence(pool, key)


def generate_farmer_prioritized(pool: dict, priorities: dict) -> list[dict]:
   
    def key(c):
        n_fix = 1.0 if c.get("nitrogen_fixing") else 0.0
        water_mid = sum(c.get("water_use_mm", [500, 800])) / 2
        water_score = max(0.0, 1.0 - water_mid / 3000)
        residue = RESIDUE_SCORE.get(c.get("residue_contribution") or "low", 0.3)
        cover = COVER_SCORE.get(c.get("ground_cover") or "low", 0.3)
        soil_score = (residue + cover) / 2

        mid_yield = sum(c.get("expected_yield_kg_per_ha", [1000, 2000])) / 2
        mid_price = sum(c.get("market_price_inr_per_kg", [20, 30])) / 2
        econ_score = min((mid_yield * mid_price) / 200_000, 1.0)

        score = (
            priorities.get("water_efficiency", 0.5) * water_score +
            priorities.get("nitrogen_cycling", 0.5) * n_fix +
            priorities.get("soil_improvement", 0.5) * soil_score +
            priorities.get("economic_potential", 0.5) * econ_score
        )
        return -score   
    return _build_sequence(pool, key)

def score_water_efficiency(seq: list[dict], crops: dict) -> float:
    total = 0.0
    for s in seq:
        c = crops.get(s["crop_id"])
        if not c:
            continue
        total += sum(c.get("water_use_mm", [500, 800])) / 2
    # 6000 mm worst, 1000 mm best
    return max(0.0, min(1.0, (6000 - total) / 5000))


def score_climate_compatibility(seq: list[dict], crops: dict,
                                earth_obs: dict | None, climate) -> float:
    if not climate or climate.get("stub"):
        if not earth_obs:
            return 0.5
        obs_temp = earth_obs.get("temperature_c")
        if obs_temp is None:
            return 0.5
        fitting = total = 0
        for s in seq:
            c = crops.get(s["crop_id"])
            if not c:
                continue
            total += 1
            lo, hi = c.get("temp_range_c", [0, 50])
            if lo <= obs_temp <= hi:
                fitting += 1
        return fitting / total if total else 0.5

    if not seq:
        return 0.5

    label = climate["current_season"]["label"]

    # Per-cluster water-fit weights.
    # Kharif-like  = wet monsoon → high-water crops do well
    # Rabi-like    = cool + dry  → medium water is ideal, high is wasteful
    # Zaid-like    = hot + dry   → only low-water crops thrive
    weights = {
        "Kharif-like": {"high": 0.25, "medium": 0.22, "low": 0.15},
        "Rabi-like":   {"medium": 0.25, "low": 0.22, "high": 0.08},
        "Zaid-like":   {"low": 0.25, "medium": 0.15, "high": 0.05},
    }.get(label, {"low": 0.20, "medium": 0.20, "high": 0.20})

    total = 0.0
    for s in seq:
        c = crops.get(s["crop_id"])
        if not c:
            continue
        req = c.get("water_requirement", "medium")
        total += weights.get(req, 0.20)

    base = total / len(seq)

    # Only penalize for SIGNIFICANT anomalies (>0.6). Your 0.52 was
    # borderline — do not penalize near-typical seasons.
    significant = [a for a in climate.get("anomalies", [])
                   if a.get("score", 0) > 0.6]
    if significant:
        base *= 0.90

    return min(1.0, max(0.0, base))


def score_soil_improvement(seq: list[dict], crops: dict) -> float:
    if not seq:
        return 0.0
    total = 0.0
    for s in seq:
        c = crops.get(s["crop_id"])
        if not c:
            continue
        n_fix = 1.0 if c.get("nitrogen_fixing") else 0.0
        residue = RESIDUE_SCORE.get(c.get("residue_contribution") or "low", 0.3)
        cover = COVER_SCORE.get(c.get("ground_cover") or "low", 0.3)
        total += (n_fix + residue + cover) / 3
    return total / len(seq)


def score_nitrogen_cycling(seq: list[dict], crops: dict) -> float:
    if not seq:
        return 0.0
    n_fix = sum(1 for s in seq if crops.get(s["crop_id"], {}).get("nitrogen_fixing"))
    return n_fix / len(seq)


def score_erosion_protection(seq: list[dict], crops: dict) -> float:
    if not seq:
        return 0.0
    total = 0.0
    for s in seq:
        c = crops.get(s["crop_id"])
        if not c:
            continue
        cover = COVER_SCORE.get(c.get("ground_cover") or "low", 0.3)
        depth = min(c.get("rooting_depth_cm", 50) / 120, 1.0)
        total += (cover + depth) / 2
    return total / len(seq)


def score_crop_diversity(seq: list[dict], crops: dict) -> float:
    if not seq:
        return 0.0
    families = {
        crops[s["crop_id"]]["family"]
        for s in seq if s["crop_id"] in crops
    }
    return len(families) / len(seq)


def score_economic_potential(seq: list[dict], crops: dict) -> float:
    total_rev = 0.0
    for s in seq:
        c = crops.get(s["crop_id"])
        if not c:
            continue
        mid_yield = sum(c.get("expected_yield_kg_per_ha", [1000, 2000])) / 2
        mid_price = sum(c.get("market_price_inr_per_kg", [20, 30])) / 2
        total_rev += mid_yield * mid_price
    # 200k INR low, 1M INR high (across 4 crops, 2 years)
    return max(0.0, min(1.0, (total_rev - 200_000) / 800_000))


def score_feasibility(seq: list[dict], crops: dict,
                      constraints: dict) -> float:
    if not seq:
        return 0.0
    total_penalty = 0.0
    for s in seq:
        c = crops.get(s["crop_id"])
        if not c:
            continue
        total_penalty += COST_PENALTY.get(c.get("input_cost_level") or "medium", 0.05)
    avg_penalty = total_penalty / len(seq)
    return max(0.0, min(1.0, 1.0 - avg_penalty / 0.10))


def check_constraints(seq: list[dict],
                      constraints: dict, agronomy = None) -> tuple[bool, list[str]]:
    if not seq:
        return False, ["empty sequence"]

    reasons = []
    forbidden = set(constraints.get("forbidden_crops", []))
    required = set(constraints.get("required_crops", []))
    used = {s["crop_id"] for s in seq}

    if forbidden & used:
        reasons.append(f"uses forbidden crops: {sorted(forbidden & used)}")
    if required - used:
        reasons.append(f"missing required crops: {sorted(required - used)}")
    
    if agronomy:
        conflicts = agronomy.get("planting_window_conflicts", [])
        for c in conflicts:
            # crude: check if the conflicting crops are adjacent in our seq
            for a, b in zip(seq, seq[1:]):
                if a["crop_id"] in c and b["crop_id"] in c:
                    reasons.append(f"planting conflict: {c}")
                    break

    return (len(reasons) == 0, reasons)


def is_dominated(s: dict, others: list[dict]) -> bool:
    for o in others:
        if o is s:
            continue
        if all(o["scores"][k] >= s["scores"][k] for k in DIMENSIONS) \
           and any(o["scores"][k] > s["scores"][k] for k in DIMENSIONS):
            return True
    return False


def pareto_front(strategies: list[dict]) -> list[str]:
    return [
        s["strategy_id"]
        for s in strategies
        if not is_dominated(s, strategies)
    ]
    

def _normalize_weights(priorities: dict) -> dict:
    total = sum(priorities.values())
    if total <= 0:
        return {k: 1 / len(DIMENSIONS) for k in DIMENSIONS}
    return {k: v / total for k, v in priorities.items()}


def _build_strategy(sid: str, label: str, seq: list[dict],
                    crops: dict, earth_obs: dict | None, climate,
                    constraints: dict, priorities: dict, agronomy: dict | None = None) -> dict:
    passed, reasons = check_constraints(seq, constraints, agronomy)
    scores = {
        "water_efficiency":      score_water_efficiency(seq, crops),
        "climate_compatibility": score_climate_compatibility(seq, crops, earth_obs, climate),
        "soil_improvement":      score_soil_improvement(seq, crops),
        "nitrogen_cycling":      score_nitrogen_cycling(seq, crops),
        "erosion_protection":    score_erosion_protection(seq, crops),
        "crop_diversity":        score_crop_diversity(seq, crops),
        "economic_potential":    score_economic_potential(seq, crops),
        "feasibility":           score_feasibility(seq, crops, constraints),
    }
    weighted = sum(priorities.get(k, 0.5) * scores[k] for k in DIMENSIONS)

    return {
        "strategy_id": sid,
        "label": label,
        "sequence": seq,
        "scores": scores,
        "weighted_score": round(weighted, 4),
        "hard_constraint_status": "pass" if passed else "fail",
        "hard_constraint_reasons": reasons,
        "assumptions": [],
        "benefits": [],
        "drawbacks": [],
        "missing_data": [],
        "expert_validation_needed": [],
    }

def _seq_signature(seq: list[dict]) -> tuple:
    return tuple((s["crop_id"], s["season"]) for s in seq)


def rotation_node(state: RotationState) -> dict:
    task_id = f"rotation:{uuid4()}"
    crops = load_crops()
    agronomy = state.get("agronomy") or {}
    current = state.get("current_rotation") or []
    priorities = _normalize_weights(state.get("priorities") or {})
    constraints = state.get("constraints") or {}
    earth_obs = state.get("earth_obs")
    climate = state.get("climate")

    viable = build_viable_pool(agronomy, crops)
    if not viable:
        return {
            "rotation": {"strategies": [], "pareto_front": [], "recommended_order": []},
            "tasks": [Task(task_id=task_id, agent="rotation",
                           status="failed", error="no viable crops")],
        }

    # Generate 4 candidate sequences
    sequences = [
        ("strategy_a", "existing",           generate_existing(current)),
        ("strategy_b", "soil_restoration",   generate_soil_restoration(viable)),
        ("strategy_c", "climate_resilience", generate_climate_resilience(viable, climate)),
        ("strategy_d", "farmer_prioritized", generate_farmer_prioritized(viable, priorities)),
    ]

    # Build + score strategies
    strategies = []
    for sid, label, seq in sequences:
        if not seq:
            continue
        strategies.append(
            _build_strategy(sid, label, seq, crops, earth_obs, climate, constraints, priorities, agronomy) # type: ignore
        )
    
    LABEL_PRIORITY = {
        "existing": 0,
        "farmer_prioritized": 1,   
        "soil_restoration": 2,
        "climate_resilience": 3,
    }
            
    #dedpuing same strategies
    seen = set()
    deduped = []
    for s in strategies:
        sig = _seq_signature(s["sequence"])
        if sig in seen:
            continue
        seen.add(sig)
        deduped.append(s)
    strategies = deduped

    # Filter to constraint-passing, compute Pareto front
    valid = [s for s in strategies if s["hard_constraint_status"] == "pass"]
    front = pareto_front(valid) if valid else []

    # Rank the Pareto front by weighted score
    ranked = sorted(
        [s for s in valid if s["strategy_id"] in front],
        key=lambda s: -s["weighted_score"],
    )
    

    return {
        "rotation": {
            "strategies": strategies,
            "pareto_front": front,
            "recommended_order": [s["strategy_id"] for s in ranked],
        },
        "tasks": [Task(task_id=task_id, agent="rotation", status="complete")],
    }