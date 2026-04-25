from app.services.data_service import build_map
from loguru import logger


def compute_hotspots():
    logger.info("Computing hotspots from map")

    grid = build_map()

    # rank by chlorophyll
    sorted_points = sorted(grid, key=lambda x: x["chlorophyll"], reverse=True)

    top = sorted_points[:10]

    return [
        {
            "lat": p["lat"],
            "lon": p["lon"],
            "score": p["chlorophyll"]
        }
        for p in top
    ]