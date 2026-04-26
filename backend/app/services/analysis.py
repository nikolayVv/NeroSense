import ee
from app.services.gee_service import get_hotspot_mask, extract_hotspots, \
    enrich_hotspots, extract_timeseries, extract_stats, compute_phyto_analysis
from app.services.sentinel_2 import get_s2_image, process_phyto_image_s2

def parse_payload(payload):
    return {
        "start_date": ee.Date(payload["start_date"]),
        "end_date": ee.Date(payload["end_date"]),
        "study_area": ee.Geometry.BBox(*payload["bbox"])
    }


def get_hotspots(payload):
    p = parse_payload(payload)

    data = compute_phyto_analysis(
        p["start_date"],
        p["end_date"],
        p["study_area"]
    )

    strategy = data["maps"]["strategy"]

    mask = get_hotspot_mask(strategy)
    hotspots = extract_hotspots(mask, p["study_area"])
    hotspots = enrich_hotspots(hotspots, strategy)

    return hotspots.getInfo()


def get_timeseries(payload):
    p = parse_payload(payload)

    s2 = get_s2_image(
        p["start_date"],
        p["end_date"],
        p["study_area"],
        process_phyto_image_s2
    )

    return {
        "chla": extract_timeseries(s2, "chla", p["study_area"]).getInfo(),
        "fai": extract_timeseries(s2, "fai", p["study_area"]).getInfo()
    }


def get_stats(payload):
    p = parse_payload(payload)

    data = compute_phyto_analysis(
        p["start_date"],
        p["end_date"],
        p["study_area"]
    )

    recent = data["recent"]
    risk = data["risk"]

    return {
        "chla": extract_stats(recent, "chla", p["study_area"]).getInfo(),
        "risk": extract_stats(risk, "risk", p["study_area"]).getInfo()
    }


