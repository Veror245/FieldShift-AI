Good question to ask now — because the Climate agent is the one piece where **your job and the ML person's job need a clear boundary**. Here's how it breaks down.

## What the Climate agent does (recap)

Reads `earth_obs` (daily temperature + rainfall time series), runs ML on it, and outputs:

| Output | What it is | Used by |
|---|---|---|
| **Seasonal clusters** | KMeans groups historical seasons into types ("hot-dry", "wet-humid", "unusual-warm") | Rotation scoring, Strategy C generation |
| **Anomalies** | Isolation Forest flags unusual years/months | Rotation scoring (risk penalty) |
| **Historical baseline** | "How does recent rainfall compare to 2018–2023 average?" | Rotation scoring |
| **Climate fingerprint** | Which historical seasons resemble the current one | Rotation scoring |
| **Crop-stress predictions** | (optional) classify stress level from climate features | Rotation scoring |

## The critical boundary: you vs. ML person

**ML person builds:** the models + their inputs/outputs.
**You build:** the node that calls the models + the integration.

### What the ML person delivers (interface contract)

They give you a Python module (or HTTP service) that takes:

```python
analyze_climate(
    daily_df,          # DataFrame from your earth_obs CSV
    lat: float,
    lon: float,
) -> dict
```

And returns:

```python
{
    "season_clusters": [
        {"cluster_id": 0, "label": "hot_dry", "size": 3,
         "centroid": {"mean_temp": 32.1, "total_precip": 420.0, ...}},
        {"cluster_id": 1, "label": "wet_humid", "size": 4, ...},
    ],
    "current_season": {
        "year": 2023,
        "cluster_id": 0,
        "label": "hot_dry",
        "distance_to_centroid": 0.82,
    },
    "anomalies": [
        {"date_range": ["2023-07-15", "2023-08-20"],
         "score": 0.87, "features": ["precip_mm", "t2m_max_c"]},
    ],
    "baseline_comparison": {
        "recent_precip_mm": 320.0,
        "historical_avg_mm": 520.0,
        "deviation_pct": -38.5,
    },
    "crop_stress_level": None,   # if no labelled data yet
}
```

**That's the whole contract.** Whatever ML approach they use, if it returns this shape, your node works.

### What you build

`climate/graph.py`:

```python
async def climate_node(state):
    # 1. Load earth_obs CSV
    csv_path = state["earth_obs"]["csv_file_path"]
    df = pd.read_csv(csv_path, index_col="date", parse_dates=True)

    # 2. Call the ML service
    from ...ml.climate import analyze_climate   # their module
    result = analyze_climate(df, state["lat"], state["lon"])

    # 3. Store in state
    return {
        "climate": result,
        "tasks": [Task(..., status="complete")],
    }
```

**~20 lines total.** That's your entire Climate agent. The heavy lifting lives in the ML module.

## What changes downstream when Climate is real

This is the part worth understanding now, because it affects how you shape Rotation scoring.

### `score_climate_compatibility` — currently trivial

```python
# Right now: just checks mean temp
def score_climate_compatibility(seq, crops, earth_obs):
    obs_temp = earth_obs.get("temperature_c")
    fitting = sum(1 for s in seq if crop_temp_fits(crops[s["crop_id"]], obs_temp))
    return fitting / len(seq)
```

### After Climate agent lands

```python
def score_climate_compatibility(seq, crops, climate):
    if not climate:
        return 0.5

    score = 0.0

    # 1. How well do crops fit the CURRENT cluster?
    cluster_label = climate["current_season"]["label"]  # "hot_dry"
    for s in seq:
        crop = crops[s["crop_id"]]
        if cluster_label == "hot_dry" and crop.get("water_requirement") == "low":
            score += 0.25
        elif cluster_label == "wet_humid" and crop.get("water_requirement") == "high":
            score += 0.2

    # 2. Penalize if forecast anomaly is severe
    if climate["anomalies"]:
        score *= 0.8    # unknown conditions = less confidence

    # 3. Bonus if strategy matches historical cluster with best outcomes
    if climate["baseline_comparison"]["deviation_pct"] < -20:
        # Drier than usual → reward drought-tolerant strategies
        low_water_crops = sum(1 for s in seq
                              if crops[s["crop_id"]].get("water_requirement") == "low")
        score += low_water_crops / len(seq) * 0.2

    return min(1.0, score)
```

**Same function signature — different logic.** The point is that Rotation Planner already has the hook; you swap in a smarter scorer when Climate data is available.

### `generate_climate_resilience` — currently shallow

```python
# Right now: just sort by water use
def generate_climate_resilience(pool):
    def key(c):
        water_mid = sum(c["water_use_mm"]) / 2
        return water_mid
    return _build_sequence(pool, key)
```

### After Climate lands

```python
def generate_climate_resilience(pool, climate):
    # Get the historical cluster pattern
    # Strategy C should match what the climate is ACTUALLY doing here
    current_label = climate["current_season"]["label"]
    deviations = climate["baseline_comparison"]["deviation_pct"]

    def key(c):
        water = sum(c["water_use_mm"]) / 2
        heat_tolerance = c.get("temp_range_c", [20, 30])[1]  # max temp

        if current_label == "hot_dry":
            # Prioritize heat + drought tolerance
            return (water, -heat_tolerance)
        elif current_label == "wet_humid":
            # Prioritize drainage / disease tolerance
            return (water, -heat_tolerance)
        else:
            return (water,)

    return _build_sequence(pool, key)
```

Now Strategy C is **actually climate-informed** — it adapts to what the field's climate is doing. That's the spec's "Climate Resilience Rotation" (§7, Strategy C).

## What you should do right now

**Nothing on Climate.** Keep the stub.

But do these three things so Climate slots in cleanly later:

### 1. Add `climate` to state schema (if not there)

```python
class InvestigationState(TypedDict, total=False):
    ...
    climate: dict | None
```

You probably already have this — verify.

### 2. Note the boundary in `rotation/graph.py`

Add a comment on `score_climate_compatibility`:

```python
def score_climate_compatibility(seq, crops, earth_obs):
    """
    v1: uses only earth_obs.temperature_c.
    v2: replace with climate.cluster_match + climate.anomaly_penalty
    when Climate agent lands.
    """
```

Same on `generate_climate_resilience`. This way future-you knows exactly what to touch.

### 3. Define the input contract **now** (5 min)

Write this file so the ML person knows what to build against:

`backend/ml/CONTRACT.md`:

```markdown
# Climate Agent — ML Contract

Input: pandas DataFrame with columns:
  - date (index, daily)
  - t2m_c (mean temp °C)
  - t2m_max_c, t2m_min_c
  - precip_mm (mm/day)
  - solar_mj
  - humidity_pct
  - wind_speed_ms

Output: dict with keys:
  - season_clusters: list of {cluster_id, label, size, centroid, features}
  - current_season: {year, cluster_id, label, distance_to_centroid}
  - anomalies: list of {date_range, score, features}
  - baseline_comparison: {recent_precip_mm, historical_avg_mm, deviation_pct}
  - crop_stress_level: "low" | "medium" | "high" | null

Model: KMeans (seasonal clusters) + Isolation Forest (anomalies).
Labels: assigned post-hoc from cluster centroid inspection.
Crop-stress: RandomForest optional, requires labelled data.

Wrapper signature:
  analyze_climate(df: pd.DataFrame, lat: float, lon: float) -> dict
```

Hand this to them. Now you both know the interface, and integration day is trivial.

## TL;DR

| Question | Answer |
|---|---|
| What does Climate do? | Runs ML on `earth_obs` daily data → clusters, anomalies, baseline |
| What do I build? | 20-line node that calls their ML module, returns the dict |
| What does ML person build? | The `analyze_climate()` function + models |
| What changes downstream? | `score_climate_compatibility` and `generate_climate_resilience` in Rotation get smarter |
| What to do now? | Nothing on Climate. Write the contract doc. Keep stub. |
| When ML is ready? | Swap stub, update 2 scoring functions, re-run pipeline |

You're not blocked on Climate. Ship v1 without it. The stub returns `{"stub": True}` which satisfies the supervisor gate, and Rotation runs on `earth_obs.temperature_c` alone. When the ML person delivers, integration is ~1 hour of work (node + 2 scoring function updates).