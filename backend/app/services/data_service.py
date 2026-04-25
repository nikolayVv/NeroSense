import numpy as np
from loguru import logger
from app.services.gee_service import sample_area

def generate_mock_satellite_data(grid_size: int = 50):
    logger.info("Generating mock satellite data")

    # simulate reflectance bands
    red = np.random.uniform(0.01, 0.1, (grid_size, grid_size))
    nir = np.random.uniform(0.02, 0.15, (grid_size, grid_size))

    return red, nir


def compute_chlorophyll(red, nir):
    logger.info("Computing chlorophyll proxy")

    ndci = (nir - red) / (nir + red + 1e-6)
    return ndci


def compute_turbidity(red):
    logger.info("Computing turbidity proxy")

    turbidity = red * 100  # simple scaling
    return turbidity


def build_map(grid_size=50):
    red, nir = generate_mock_satellite_data(grid_size)

    chlorophyll = compute_chlorophyll(red, nir)
    turbidity = compute_turbidity(red)

    grid = []

    lat_start, lon_start = 42.4, 23.2

    for i in range(grid_size):
        for j in range(grid_size):
            grid.append({
                "lat": lat_start + i * 0.001,
                "lon": lon_start + j * 0.001,
                "chlorophyll": float(chlorophyll[i][j]),
                "turbidity": float(turbidity[i][j])
            })

    return grid


def generate_sensor_data(points):
    import random

    sensor_data = []

    for p in points:
        sensor_data.append({
            "lat": p["lat"],
            "lon": p["lon"],
            "turbidity": random.uniform(1, 10),
            "temperature": random.uniform(15, 25)
        })

    return sensor_data


def get_real_chlorophyll(lat, lon):
    result = sample_area(lat, lon)

    return result.get("ndci", 0)