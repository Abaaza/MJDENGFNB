# Item matcher script for mapping descriptions to price list entries
# Uses basic fuzzy matching and token similarity (Jaccard)

import csv
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path


def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def jaccard(a: str, b: str) -> float:
    set_a = set(a.split())
    set_b = set(b.split())
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def load_price_list(path: str):
    items = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            desc = (
                row.get("description")
                or row.get("Description")
                or row.get("desc")
                or row.get("Desc")
                or ""
            )
            code = row.get("code") or row.get("Code") or ""
            rate = (
                row.get("rate")
                or row.get("Rate")
                or row.get("unit_price")
                or row.get("Unit Price")
                or row.get("Unit Rate")
                or row.get("unit_rate")
                or row.get("price")
                or row.get("Price")
            )
            items.append(
                {
                    "code": code.strip(),
                    "description": desc.strip(),
                    "desc_clean": preprocess(desc),
                    "rate": float(rate) if rate not in (None, "") else None,
                }
            )
    return items


def load_input_items(path: str):
    items = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            desc = row.get("description") or row.get("Description") or ""
            qty = row.get("quantity") or row.get("Quantity") or ""
            qty_val = float(qty) if qty not in (None, "") else 0.0
            items.append(
                {
                    "description": desc.strip(),
                    "qty": qty_val,
                    "desc_clean": preprocess(desc),
                }
            )
    return items


def match_item(desc_clean: str, price_items: list) -> tuple:
    best = None
    best_score = 0.0
    for item in price_items:
        f = ratio(desc_clean, item["desc_clean"])
        j = jaccard(desc_clean, item["desc_clean"])
        score = 0.6 * f + 0.4 * j
        if score > best_score:
            best_score = score
            best = item
    return best, best_score


def match_all(price_file: str, input_file: str) -> list:
    price_items = load_price_list(price_file)
    input_items = load_input_items(input_file)
    results = []
    for item in input_items:
        best, score = match_item(item["desc_clean"], price_items)
        matched_code = best["code"] if best else ""
        matched_desc = best["description"] if best else ""
        rate = best["rate"] if best else None
        total = rate * item["qty"] if rate is not None else None
        results.append(
            {
                "input_description": item["description"],
                "matched_code": matched_code,
                "matched_description": matched_desc,
                "quantity": item["qty"],
                "unit_rate": rate,
                "total": total,
                "confidence": round(score, 3),
            }
        )
    return results


def main() -> None:
    if len(sys.argv) < 3:
        print(
            "Usage: python item_matcher.py <price_list.csv> <input_items.csv> [output.csv]"
        )
        sys.exit(1)

    price_file = sys.argv[1]
    input_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else None

    results = match_all(price_file, input_file)

    fieldnames = [
        "input_description",
        "matched_code",
        "matched_description",
        "quantity",
        "unit_rate",
        "total",
        "confidence",
    ]
    if output_file:
        with open(output_file, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
    else:
        writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)


if __name__ == "__main__":
    main()
