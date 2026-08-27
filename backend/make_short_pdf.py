"""
Utility: create a short version of any PDF for fast testing.

Usage:
    python make_short_pdf.py path/to/full.pdf [num_pages]

If num_pages is omitted, defaults to 10.
Output is saved alongside the original, with "-short" added to the filename.
"""

import sys
import pikepdf


def make_short_pdf(input_path: str, num_pages: int = 10) -> str:
    pdf = pikepdf.open(input_path)
    short = pikepdf.new()

    for page in pdf.pages[:num_pages]:
        short.pages.append(page)

    if input_path.endswith(".pdf"):
        output_path = input_path[:-4] + "-short.pdf"
    else:
        output_path = input_path + "-short.pdf"

    short.save(output_path)
    return output_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python make_short_pdf.py path/to/full.pdf [num_pages]")
        sys.exit(1)

    input_path = sys.argv[1]
    num_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    output_path = make_short_pdf(input_path, num_pages)
    print(f"✅ Saved {num_pages}-page test version to: {output_path}")


if __name__ == "__main__":
    main()
