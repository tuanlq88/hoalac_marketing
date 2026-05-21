"""
One-time setup: Upload documents to Gemini File Search Store.
Run: python scripts/gemini_store_setup.py

Requires: pip install google-genai
Requires: GOOGLE_API_KEY environment variable
"""
import os
import sys
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Install google-genai: pip install google-genai")
    sys.exit(1)


STORE_DISPLAY_NAME = "hoalac-knowledge"
DOCS_DIR = Path("content-system/content-refs/documents")
EXTRA_FILES = [
    Path("content-system/content-refs/facts/STATIC_LIBRARY.json"),
    Path("content-system/content_strategy.md"),
]


def main():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Set GOOGLE_API_KEY environment variable")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    print(f"Creating File Search Store: {STORE_DISPLAY_NAME}")
    store = client.file_search_stores.create(
        config={
            "display_name": STORE_DISPLAY_NAME,
            "embedding_model": "models/gemini-embedding-2",
        }
    )
    print(f"Store created: {store.name}")

    files_to_upload = list(DOCS_DIR.glob("*.md")) + EXTRA_FILES
    files_to_upload = [f for f in files_to_upload if f.exists()]

    print(f"\nUploading {len(files_to_upload)} files:")
    for filepath in files_to_upload:
        print(f"  Uploading: {filepath.name} ...", end=" ")
        try:
            client.file_search_stores.upload_to_file_search_store(
                file=str(filepath),
                file_search_store_name=store.name,
            )
            print("OK")
        except Exception as e:
            print(f"FAILED: {e}")

    print(f"\nDone. Store name: {store.name}")
    print("Save this store name — you'll need it for Gemini queries.")
    print(f"\nTo query: use FileSearch tool with store_names=['{store.name}']")


if __name__ == "__main__":
    main()
