from __future__ import annotations

import json
import urllib.request
from pathlib import Path


BASE_URL = "https://data.nazarenolecis.com/crisi-abitativa/eurostat"
OUT_DIR = Path("data/crisi-abitativa/eurostat")

PERIODS = [
    ("before_1919", "Prima del 1919", "estat_dwellings_built_before_1919_2021"),
    ("1919_1945", "1919-1945", "estat_dwellings_built_1919_1945_2021"),
    ("1946_1960", "1946-1960", "estat_dwellings_built_1946_1960_2021"),
    ("1961_1980", "1961-1980", "estat_dwellings_built_1961_1980_2021"),
    ("1981_2000", "1981-2000", "estat_dwellings_built_1981_2000_2021"),
    ("2001_2010", "2001-2010", "estat_dwellings_built_2001_2010_2021"),
    ("2011_2015", "2011-2015", "estat_dwellings_built_2011_2015_2021"),
    ("after_2016", "Dal 2016", "estat_dwellings_built_after_2016_2021"),
    ("unknown", "Non indicato", "estat_dwellings_built_unknown_2021"),
]

ABSOLUTE_IDS = {
    "estat_private_households_total_a",
    "estat_population_total_a",
    "estat_dwellings_total_2021",
    "estat_dwellings_occupied_2021",
    "estat_dwellings_unoccupied_2021",
}

EU_AGGREGATE_LINE_IDS = {
    "estat_private_households_total_a",
    "estat_population_total_a",
}

ONE_POINT_STOCK_IDS = {
    "estat_dwellings_total_2021",
    "estat_dwellings_occupied_2021",
    "estat_dwellings_unoccupied_2021",
}


def fetch_json(name: str) -> dict:
    request = urllib.request.Request(
        f"{BASE_URL}/{name}",
        headers={"User-Agent": "Mozilla/5.0 static-dashboard-builder"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def load_index() -> dict:
    remote_index = fetch_json("index.json")
    local_path = OUT_DIR / "index.json"
    if not local_path.exists():
        return remote_index

    local_index = json.loads(local_path.read_text(encoding="utf-8-sig"))
    local_count = len(local_index.get("indicators", []))
    remote_count = len(remote_index.get("indicators", []))
    return local_index if local_count > remote_count else remote_index


def is_absolute_indicator(indicator: dict) -> bool:
    unit = str(indicator.get("unit", "")).lower()
    return (
        indicator.get("id") in ABSOLUTE_IDS
        or "abitazioni" in unit
        or "famiglie" in unit
        or "persone" in unit
        or "m2" in unit
        or "m²" in unit
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    combined_indicator = {
        "id": "estat_dwellings_by_construction_period_2021",
        "label": "Abitazioni per periodo di costruzione",
        "shortLabel": "Stock per periodo di costruzione",
        "unit": "abitazioni",
        "file": "estat_dwellings_by_construction_period_2021.json",
        "absolute_count": True,
        "show_eu_aggregate": False,
        "note": "Il grafico combina in un solo bar chart gli stock abitativi Eurostat per periodo di costruzione nel 2021.",
    }

    records = []
    for bucket, bucket_label, source_id in PERIODS:
        payload = fetch_json(f"{source_id}.json")
        for record in payload.get("records", []):
            records.append(
                {
                    "geo": record.get("geo"),
                    "geo_label": record.get("geo_label"),
                    "year": 2021,
                    "period": "2021",
                    "bucket": bucket,
                    "bucket_label": bucket_label,
                    "value": record.get("value"),
                    "share_pct": None,
                    "geo_total": None,
                }
            )
    totals = {}
    for record in records:
        value = record.get("value")
        if isinstance(value, (int, float)):
            totals[record["geo"]] = totals.get(record["geo"], 0) + value
    for record in records:
        total = totals.get(record["geo"])
        value = record.get("value")
        if total and isinstance(value, (int, float)):
            record["geo_total"] = total
            record["share_pct"] = value / total * 100

    combined = {
        "indicator": combined_indicator,
        "buckets": [
            {"id": bucket, "label": label, "source_indicator": source}
            for bucket, label, source in PERIODS
        ],
        "records": records,
    }

    source_ids = {source for _, _, source in PERIODS}
    removed_stock_ids = source_ids | ONE_POINT_STOCK_IDS
    index = load_index()
    indicators = []
    removed_count = 0
    for indicator in index.get("indicators", []):
        if indicator.get("id") in removed_stock_ids:
            removed_count += 1
            continue

        indicator = dict(indicator)
        if indicator.get("id") in EU_AGGREGATE_LINE_IDS:
            indicator["absolute_count"] = True
            indicator["show_eu_aggregate"] = True
            indicator["eu_average_from_countries"] = True
        elif is_absolute_indicator(indicator):
            indicator["absolute_count"] = True
            indicator["show_eu_aggregate"] = False
        indicators.append(indicator)

    index["indicators"] = indicators

    (OUT_DIR / "estat_dwellings_by_construction_period_2021.json").write_text(
        json.dumps(combined, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(records)} construction-period records")
    print(f"Removed {removed_count} construction-period/one-point stock indicators from index")
    print(f"Wrote {len(indicators)} index indicators")


if __name__ == "__main__":
    main()
