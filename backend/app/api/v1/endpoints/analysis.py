from fastapi import APIRouter, Depends, Query
from app.services.analysis import (
    get_hotspots,
    get_timeseries,
    get_stats,
)
from app.services.gee_service import compute_phyto_analysis, fetch_raw_data
import ee

router = APIRouter()

from typing import List, Optional
from pydantic import BaseModel

class DataQuery(BaseModel):
    satellites: Optional[List[str]] = None
    parameters: Optional[List[str]] = None
    start: Optional[str] = None
    end: Optional[str] = None
    bbox: Optional[str] = None
    aggregation: Optional[str] = "point"

@router.post("/")
def maps(payload: dict):
    study_area = ee.Geometry.Polygon([payload["study_area"]])

    return compute_phyto_analysis(
        payload["start_date"],
        payload["end_date"],
        study_area
    )


@router.get("/data")
def get_raw_data(
    satellites: str = Query(...),      # "S2,S3"
    start: Optional[str] = None,
    end: Optional[str] = None,
    bbox: str = Query(...),
):
    return fetch_raw_data(
        satellites=satellites.split(","),
        start=start,
        end=end,
        bbox=bbox,
    )

# @router.post("/hotspots")
# def hotspots(payload: dict):
#     return get_hotspots(payload)

# @router.post("/timeseries")
# def timeseries(payload: dict):
#     return get_timeseries(payload)

# @router.post("/stats")
# def stats(payload: dict):
#     return get_stats(payload)