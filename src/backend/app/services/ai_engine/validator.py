import json
import logging
from pathlib import Path
from typing import Any, Dict

import jsonschema

logger = logging.getLogger(__name__)

# Base directory for schemas
SCHEMAS_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent / "ai" / "schemas"


def _load_schema(schema_name: str) -> Dict[str, Any]:
    schema_path = SCHEMAS_DIR / schema_name
    if not schema_path.exists():
        raise FileNotFoundError(f"JSON Schema {schema_name} tidak ditemukan di {schema_path}")
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


try:
    RECOMMENDATION_OUTPUT_SCHEMA = _load_schema("recommendation-output.schema.json")
    MODERATION_OUTPUT_SCHEMA = _load_schema("moderation-output.schema.json")
except Exception as e:
    logger.warning(f"Gagal memuat JSON schema formal saat inisialisasi: {e}")
    RECOMMENDATION_OUTPUT_SCHEMA = {}
    MODERATION_OUTPUT_SCHEMA = {}


def validate_recommendation_output(data: Dict[str, Any]) -> bool:
    """
    Memvalidasi data luaran rekomendasi kolaborator terhadap recommendation-output.schema.json.
    Mengembalikan True jika valid, melempar ValidationError jika tidak valid.
    """
    if not RECOMMENDATION_OUTPUT_SCHEMA:
        return True
    jsonschema.validate(instance=data, schema=RECOMMENDATION_OUTPUT_SCHEMA)
    return True


def validate_moderation_output(data: Dict[str, Any]) -> bool:
    """
    Memvalidasi data luaran moderasi teks feed terhadap moderation-output.schema.json.
    Mengembalikan True jika valid, melempar ValidationError jika tidak valid.
    """
    if not MODERATION_OUTPUT_SCHEMA:
        return True
    jsonschema.validate(instance=data, schema=MODERATION_OUTPUT_SCHEMA)
    return True
