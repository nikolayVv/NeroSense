from fastapi import APIRouter
import ee

router = APIRouter()


@router.get("/status")
def gee_status():
    try:
        info = ee.Number(1).getInfo()
        return {"status": "connected", "test": info}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

@router.get("/image")
def get_image():
    point = ee.Geometry.Point([23.3, 42.5])

    image = (
        ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(point)
        .filterDate("2023-06-01", "2023-09-01")
        .sort("CLOUDY_PIXEL_PERCENTAGE")
        .first()
    )

    return image.getInfo()


@router.get("/ndci")
def get_ndci():
    point = ee.Geometry.Point([23.3, 42.5])

    image = (
        ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(point)
        .filterDate("2023-06-01", "2023-09-01")
        .sort("CLOUDY_PIXEL_PERCENTAGE")
        .first()
    )

    red = image.select("B4")
    nir = image.select("B8")

    ndci = nir.subtract(red).divide(nir.add(red)).rename("ndci")

    region = point.buffer(1000)

    value = ndci.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    return value.getInfo()


@router.get("/grid")
def get_grid():
    center_lat = 42.5
    center_lon = 23.3

    results = []

    for i in range(-2, 3):
        for j in range(-2, 3):
            lat = center_lat + i * 0.01
            lon = center_lon + j * 0.01

            point = ee.Geometry.Point([lon, lat])

            image = (
                ee.ImageCollection("COPERNICUS/S2_SR")
                .filterBounds(point)
                .filterDate("2023-06-01", "2023-09-01")
                .sort("CLOUDY_PIXEL_PERCENTAGE")
                .first()
            )

            red = image.select("B4")
            nir = image.select("B8")

            ndci = nir.subtract(red).divide(nir.add(red))

            value = ndci.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=point.buffer(500),
                scale=10
            )

            ndci_val = value.getInfo().get("ndci", 0)

            results.append({
                "lat": lat,
                "lon": lon,
                "ndci": ndci_val
            })

    return {"points": results}
