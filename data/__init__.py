import json
from pathlib import Path

_CROPS_PATH = Path(__file__).parent / "crops.json"
_crops_cache = None

def load_crops() -> dict:
    global _crops_cache
    if _crops_cache is None:
        _crops_cache = json.loads(_CROPS_PATH.read_text())
    return _crops_cache