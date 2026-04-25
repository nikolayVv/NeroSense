import ee
from loguru import logger


def get_sentinel_image(lat, lon):
    logger.info("Fetching Sentinel-2 data from GEE")

    point = ee.Geometry.Point([lon, lat])

    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(point)
        .filterDate("2023-06-01", "2023-09-01")
        .sort("CLOUDY_PIXEL_PERCENTAGE")
        .first()
    )

    return collection


def compute_ndci(image):
    red = image.select("B4")
    nir = image.select("B8")

    ndci = nir.subtract(red).divide(nir.add(red)).rename("ndci")

    return ndci


def sample_area(lat, lon):
    image = get_sentinel_image(lat, lon)
    ndci = compute_ndci(image)

    region = ee.Geometry.Point([lon, lat]).buffer(5000)

    stats = ndci.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    return stats.getInfo()