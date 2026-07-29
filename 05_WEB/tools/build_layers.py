#!/usr/bin/env python3
"""Build Karben WebGIS GeoJSON layers from local GPKG and KMZ sources."""

from __future__ import annotations

import json
import math
import sqlite3
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from pyproj import Transformer
from shapely import wkb
from shapely.geometry import LineString, Point, Polygon, mapping
from shapely.ops import transform


ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = ROOT.parent
DATA_DIR = ROOT / "05_WEB" / "data"

GPKG_LAYERS = [
    ("../01_Datos_Proyecto/Leitung.gpkg", "leitung", "leitung.geojson"),
    ("../01_Datos_Proyecto/TORRES.gpkg", "tragwerk", "masten.geojson"),
    ("../01_Datos_Proyecto/Seilzugflächen.gpkg", "Seilzugflächen", "arbeitsflaechen.geojson"),
    ("../01_Datos_Proyecto/Arbeitsflaechen_Zusatz.gpkg", "Gerüste", "gerueste.geojson"),
    ("../01_Datos_Proyecto/Arbeitsflaechen_Zusatz.gpkg", "Netz", "netz.geojson"),
    ("../01_Datos_Proyecto/Arbeitsflaechen_Zusatz.gpkg", "Sperrungen", "sperrungen.geojson"),
    ("../01_Datos_Proyecto/Zuwegung_temporär.gpkg", "Zuwegung_temporär", "zuwegung_vorhanden.geojson"),
    ("../01_Datos_Proyecto/Zuwegung_temporär_empty_metadata.gpkg", "Zuwegung_temporär_empty_metadata", "zuwegung_temporaer.geojson"),
    ("../01_Datos_Proyecto/Beschilderung.gpkg", "Beschilderung_Punkte", "beschilderung.geojson"),
    ("../01_Datos_Proyecto/buffer_leitung_800m.gpkg", "buffer_leitung_800m", "buffer_leitung_800m.geojson"),
]

KMZ_LAYERS = [
    ("02_CAD/Leitung.kmz", "leitung_kmz.geojson"),
    ("02_CAD/Tragwerk.kmz", "masten_kmz.geojson"),
]


def gpkg_wkb(blob: bytes) -> bytes:
    if blob[:2] != b"GP":
        return blob
    flags = blob[3]
    envelope_code = (flags >> 1) & 0b111
    envelope_sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    return blob[8 + envelope_sizes.get(envelope_code, 0):]


def transformer_for_srs(srs_id: int):
    if srs_id == 4326:
        return None
    return Transformer.from_crs(f"EPSG:{srs_id}", "EPSG:4326", always_xy=True)


def convert_gpkg(gpkg_path: Path, table: str, output_name: str) -> int:
    con = sqlite3.connect(gpkg_path)
    con.row_factory = sqlite3.Row
    geom_row = con.execute(
        "select column_name, srs_id from gpkg_geometry_columns where table_name = ?",
        (table,),
    ).fetchone()
    if not geom_row:
        raise ValueError(f"No geometry column found for {gpkg_path}:{table}")

    geom_col = geom_row["column_name"]
    transformer = transformer_for_srs(int(geom_row["srs_id"]))
    cols = [row["name"] for row in con.execute(f'pragma table_info("{table}")')]
    attr_cols = [col for col in cols if col != geom_col]
    select_cols = ", ".join([f'"{geom_col}"'] + [f'"{col}"' for col in attr_cols])
    rows = con.execute(f'select {select_cols} from "{table}"').fetchall()

    features = []
    for row in rows:
        geom_blob = row[geom_col]
        if not geom_blob:
            continue
        geom = wkb.loads(gpkg_wkb(geom_blob))
        if geom.is_empty:
            continue
        if transformer:
            geom = transform(transformer.transform, geom)
        props = {}
        for col in attr_cols:
            value = row[col]
            if isinstance(value, bytes):
                value = value.hex()
            props[col] = value
        features.append({"type": "Feature", "properties": props, "geometry": mapping(geom)})

    con.close()
    out = DATA_DIR / output_name
    out.write_text(json.dumps({
        "type": "FeatureCollection",
        "name": Path(output_name).stem,
        "source": str(gpkg_path),
        "features": features,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return len(features)


def parse_coord_text(text: str):
    coords = []
    for raw in text.split():
        parts = raw.split(",")
        if len(parts) >= 2:
            coords.append([float(parts[0]), float(parts[1])])
    return coords


def properties_from_placemark(pm, ns):
    props = {}
    name = pm.findtext("k:name", default="", namespaces=ns)
    if name:
        props["name"] = name
    description = pm.findtext("k:description", default="", namespaces=ns)
    if description:
        props["description"] = description
    for data in pm.findall(".//k:Data", ns):
        key = data.attrib.get("name")
        value = data.findtext("k:value", default="", namespaces=ns)
        if key:
            props[key] = value
    return props


def kmz_geometry(pm, ns):
    point = pm.find(".//k:Point/k:coordinates", ns)
    if point is not None and point.text:
        coords = parse_coord_text(point.text)
        return Point(coords[0]) if coords else None
    line = pm.find(".//k:LineString/k:coordinates", ns)
    if line is not None and line.text:
        coords = parse_coord_text(line.text)
        return LineString(coords) if len(coords) >= 2 else None
    poly = pm.find(".//k:Polygon//k:outerBoundaryIs/k:LinearRing/k:coordinates", ns)
    if poly is not None and poly.text:
        coords = parse_coord_text(poly.text)
        return Polygon(coords) if len(coords) >= 4 else None
    return None


def convert_kmz(kmz_path: Path, output_name: str) -> int:
    with zipfile.ZipFile(kmz_path) as zf:
        kml_name = next(name for name in zf.namelist() if name.lower().endswith(".kml"))
        root = ET.fromstring(zf.read(kml_name))
    ns = {"k": "http://www.opengis.net/kml/2.2"}
    features = []
    for pm in root.findall(".//k:Placemark", ns):
        geom = kmz_geometry(pm, ns)
        if geom is None or geom.is_empty:
            continue
        features.append({
            "type": "Feature",
            "properties": properties_from_placemark(pm, ns),
            "geometry": mapping(geom),
        })
    out = DATA_DIR / output_name
    out.write_text(json.dumps({
        "type": "FeatureCollection",
        "name": Path(output_name).stem,
        "source": str(kmz_path),
        "features": features,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return len(features)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    counts = {}
    for source, table, output in GPKG_LAYERS:
        path = (ROOT / source).resolve()
        counts[output] = convert_gpkg(path, table, output)
    for source, output in KMZ_LAYERS:
        path = (ROOT / source).resolve()
        counts[output] = convert_kmz(path, output)
    (DATA_DIR / "layers_manifest.json").write_text(
        json.dumps(counts, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    for name, count in counts.items():
        print(f"{name}\t{count}")


if __name__ == "__main__":
    main()
