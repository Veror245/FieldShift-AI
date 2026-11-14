import json
from pathlib import Path

_CROPS_PATH = Path(__file__).parent / "cropsnew.json"
_crops_cache = None

def load_crops() -> dict:
    global _crops_cache
    if _crops_cache is None:
        raw = json.loads(_CROPS_PATH.read_text())
        _crops_cache = raw["crops"]   # ← unwrap the _meta wrapper
    return _crops_cache