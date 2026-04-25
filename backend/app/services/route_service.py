import math
from loguru import logger


def distance(p1, p2):
    return math.sqrt((p1["lat"] - p2["lat"])**2 + (p1["lon"] - p2["lon"])**2)


def compute_route(points):
    logger.info("Computing route")

    if not points:
        return []

    route = [points[0]]
    remaining = points[1:]

    while remaining:
        last = route[-1]

        next_point = min(remaining, key=lambda p: distance(last, p))
        route.append(next_point)
        remaining.remove(next_point)

    return route