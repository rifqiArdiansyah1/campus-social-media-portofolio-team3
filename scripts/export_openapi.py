import json
import os
import sys

# Ensure backend directory is in sys.path
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(repo_root, "src", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

def export_openapi():
    output_path = os.path.join(repo_root, "docs", "openapi.json")
    print(f"Generating OpenAPI schema from FastAPI app...")
    schema = app.openapi()
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
        f.write("\n")
        
    print(f"[SUCCESS] OpenAPI schema exported to {output_path}")

if __name__ == "__main__":
    export_openapi()
