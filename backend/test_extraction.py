"""
Standalone test harness for the Script Reader agent.

Usage:
    python test_extraction.py path/to/screenplay.pdf
"""

import asyncio
import json
import os
import sys

from dotenv import load_dotenv

load_dotenv("script_reader_agent/.env")

from google.adk.runners import InMemoryRunner
from google.genai import types
from pypdf import PdfReader

from script_reader_agent.agent import root_agent


def read_pdf_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)

    if len(text.strip()) < 100:
        print("Normal text extraction returned almost nothing — running OCR instead...")
        from pdf2image import convert_from_path
        import pytesseract

        images = convert_from_path(pdf_path)
        ocr_text = ""
        for i, image in enumerate(images):
            print(f"  OCR processing page {i+1}/{len(images)}...")
            ocr_text += pytesseract.image_to_string(image) + "\n"
        return ocr_text

    return text


async def run_extraction(script_text: str) -> dict:
    runner = InMemoryRunner(agent=root_agent, app_name="continuity_copilot")
    session = await runner.session_service.create_session(
        app_name="continuity_copilot", user_id="local_test"
    )

    final_text = ""
    async for event in runner.run_async(
        user_id="local_test",
        session_id=session.id,
        new_message=types.Content(
            role="user", parts=[types.Part(text=script_text)]
        ),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text

    return json.loads(final_text)


def main():
    if len(sys.argv) != 2:
        print("Usage: python test_extraction.py path/to/screenplay.pdf")
        sys.exit(1)

    pdf_path = sys.argv[1]
    page_count = len(PdfReader(pdf_path).pages)
    print(f"Reading {pdf_path} ({page_count} pages)...")

    script_text = read_pdf_text(pdf_path)
    print(f"Extracted {len(script_text)} characters of raw text. Sending to agent...")

    result = asyncio.run(run_extraction(script_text))

    with open("extraction_output.json", "w") as f:
        json.dump(result, f, indent=2)

    scene_count = len(result.get("scenes", []))
    title = result.get("title", "Unknown")
    print(f"\n✅ Done.")
    print(f"  Title detected : {title}")
    print(f"  Pages          : {page_count}")
    print(f"  Scenes         : {scene_count}")
    print("Full output saved to extraction_output.json")
    print("\nFirst scene preview:")
    print(json.dumps(result["scenes"][0], indent=2) if scene_count else "(no scenes found)")


if __name__ == "__main__":
    main()
