from app.services.sentinel_2 import get_s2_image, process_phyto_image_s2
from app.services.sentinel_3 import get_s3_image, process_phyto_image_s3
from app.services.landsat import get_landsat_image, process_phyto_image_landsat
from app.services.modis import get_modis_image, process_phyto_image_modis
from loguru import logger
from datetime import datetime, timedelta

import ee


PARAMETERS = {
    "chla": {"min": 0, "max": 50, "palette": ['blue', 'green', 'yellow', 'red']},
    "fai": {"min": -0.01, "max": 0.05, "palette": ['purple', 'cyan', 'green']},
    "ndti": {"min": -0.2, "max": 0.5, "palette": ['blue', 'brown']},
    "cyano": {"min": 0, "max": 1, "palette": ['white', 'red']},
    "lst": {"min": 5, "max": 30, "palette": ['blue', 'orange', 'red']},
}

PARAM_SOURCES = {
    "chla": "s2",
    "fai": "s2",
    "ndti": "s2",
    "cyano": "s2",
    "lst": "landsat",  # 👈 important
}

ALL_BANDS = ["chla", "fai", "ndti", "cyano", "lst", "confidence"]


def parse_geometry(coords_str: str):
    coords = list(map(float, coords_str.split(",")))

    # group into [lon, lat] pairs
    points = [[coords[i], coords[i+1]] for i in range(0, len(coords), 2)]

    return ee.Geometry.Polygon([points])


def normalize_dates(start: str | None, end: str | None):
    now = datetime.utcnow()

    # helper: parse either date or datetime
    def parse(dt_str):
        try:
            return datetime.fromisoformat(dt_str)
        except ValueError:
            return datetime.strptime(dt_str, "%Y-%m-%d")

    # Case 1: nothing → now (last 24h is usually better than same-day)
    if not start and not end:
        start_dt = now - timedelta(days=1)
        end_dt = now

    # Case 2: only start → start → now
    elif start and not end:
        start_dt = parse(start)
        end_dt = now

    # Case 3: only end → single day (or moment)
    elif end and not start:
        end_dt = parse(end)
        start_dt = end_dt - timedelta(days=1)

    # Case 4: both provided
    else:
        start_dt = parse(start)
        end_dt = parse(end)

    return start_dt.isoformat(), end_dt.isoformat()

def align_and_cast(image):
    bands = image.bandNames()

    def get_band(b):
        return ee.Image(
            ee.Algorithms.If(
                bands.contains(b),
                image.select(b),
                ee.Image.constant(0).rename(b)
            )
        ).toFloat()

    return ee.Image.cat([get_band(b) for b in ALL_BANDS]).toFloat()

def band_exists(image, band):
    return ee.List(image.bandNames()).contains(band)


def aggregate_collection(collection):
    return {
        "mean": collection.mean(),
        "median": collection.median(),
        "std": collection.reduce(ee.Reducer.stdDev()),
        "max": collection.max(),
    }


def safe_select(image, band, default=0):
    return ee.Image(
        ee.Algorithms.If(
            ee.List(image.bandNames()).contains(band),
            image.select(band),
            ee.Image.constant(default).rename(band)
        )
    )


def has_band(image, band):
    return image.bandNames().contains(band)


def normalize(image, band, min_val, max_val):
    return image.select(band).subtract(min_val).divide(max_val - min_val).clamp(0, 1)


def get_map_layer(image, vis_params):
    map_id = image.getMapId(vis_params)
    return map_id['tile_fetcher'].url_format


def extract_timeseries(collection, band, study_area):
    def per_image(img):
        band_img = ee.Image(
            ee.Algorithms.If(
                img.bandNames().contains(band),
                img.select(band),
                ee.Image.constant(None).rename(band)
            )
        )

        stats = band_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=study_area,
            scale=30,
            maxPixels=1e9
        )

        return ee.Feature(None, {
            'date': img.date().format(),
            band: stats.get(band)
        })

    return collection.map(per_image)


def extract_stats(image, band, study_area):
    stats = image.select(band).reduceRegion(
        reducer=ee.Reducer.mean()
            .combine(ee.Reducer.min(), '', True)
            .combine(ee.Reducer.max(), '', True)
            .combine(ee.Reducer.stdDev(), '', True),
        geometry=study_area,
        scale=30,
        maxPixels=1e9
    )
    return stats


def calculate_risk_score(image):
    chla = normalize(image, 'chla', 0, 50)
    fai = normalize(image, 'fai', -0.01, 0.05)

    components = [chla, fai]

    if band_exists(image, 'ndti'):
        components.append(normalize(image, 'ndti', -0.2, 0.5))

    if band_exists(image, 'cyano'):
        components.append(normalize(image, 'cyano', 0, 1))

    if band_exists(image, 'lst'):
        components.append(normalize(image, 'lst', 5, 30))

    risk = ee.Image.cat(components).reduce(ee.Reducer.mean()).rename('risk')

    return risk


def calculate_anomaly_score(recent_img, baseline_img):
    bands = ['chla', 'fai']

    anomalies = []

    for band in bands:
        diff = recent_img.select(band).subtract(baseline_img.select(band)).abs()
        norm = normalize(diff, band, 0, 10)  # relative scaling
        anomalies.append(norm)

    anomaly = ee.Image.cat(anomalies).reduce(ee.Reducer.mean()).rename('anomaly')

    return anomaly


def calculate_strategy_score(confidence, recent_img, baseline_img):
    risk = calculate_risk_score(recent_img)
    anomaly = calculate_anomaly_score(recent_img, baseline_img)
    
    alpha = 0.6  # importance of risk
    beta = 0.4   # importance of change

    # confidence * (alpha * risk + betta * anomaly)
    strategy = confidence.multiply(
        risk.multiply(alpha).add(anomaly.multiply(beta))
    ).rename('strategy')

    return {
        "confidence": confidence,
        "risk": risk,
        "anomaly": anomaly,
        "strategy": strategy,
    }


def get_hotspot_mask(strategy, study_area, percentile=90):
    threshold = strategy.reduceRegion(
        reducer=ee.Reducer.percentile([percentile]),
        geometry=study_area,
        scale=30,
        maxPixels=1e9
    ).get('strategy')

    mask = strategy.gte(ee.Number(threshold))

    # Convert to integer (VERY IMPORTANT)
    mask_int = mask.rename('strategy').toInt()

    return mask_int


def extract_hotspots(strategy_masked, study_area, scale=30, max_points=100):
    vectors = strategy_masked.reduceToVectors(
        geometry=study_area,
        scale=scale,
        geometryType='centroid',
        labelProperty='strategy',
        reducer=ee.Reducer.countEvery(),
        maxPixels=1e9
    )

    return vectors.limit(max_points)


def enrich_hotspots(points, strategy_img, study_area):
    strategy_img = strategy_img.clip(study_area)

    return points.map(lambda f: f.set({
        'strategy': strategy_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=f.geometry(),
            scale=30,
            maxPixels=1e9
        ).get('strategy')
    }))


def sample_hotspots(image, hotspots):
    return image.sampleRegions(
        collection=hotspots,
        scale=30,
        geometries=True
    )


def build_parameter_outputs(collections, recent_img, study_area):
    result = {}

    for param, cfg in PARAMETERS.items():
        try:
            band_available = band_exists(recent_img, param)

            image = ee.Image(
                ee.Algorithms.If(
                    band_available,
                    recent_img.select(param),
                    ee.Image(0)
                )
            )

            # map
            param_map = get_map_layer(image, {
                "min": cfg["min"],
                "max": cfg["max"],
                "palette": cfg["palette"]
            })

            # timeseries (use S2 as base OR merged later)
            source_key = PARAM_SOURCES.get(param, "s2")
            source_collection = collections[source_key]

            ts = extract_timeseries(source_collection, param, study_area)

            # stats
            stats = extract_stats(image, param, study_area)

            result[param] = {
                "map": param_map,
                "timeseries": ts.getInfo(),
                "stats": stats.getInfo()
            }

        except Exception as e:
            logger.warning(f"Skipping {param}: {e}")

    return result


def compute_phyto_analysis(start_date, end_date, study_area):
    logger.info("Computing phytoplankton bounds")

    start_date = ee.Date(start_date)
    end_date = ee.Date(end_date)

    # 1. Load collection
    s2 = get_s2_image(
        start_date,
        end_date,
        study_area,
        process_phyto_image_s2,
    )
    s3 = get_s3_image(
        start_date,
        end_date,
        study_area,
        process_phyto_image_s3,
    )
    ls = get_landsat_image(
        start_date,
        end_date,
        study_area,
        process_phyto_image_landsat,
    )
    modis = get_modis_image(
        start_date,
        end_date,
        study_area,
        process_phyto_image_modis,
    )
    collections = {
        "s2": s2,
        "s3": s3,
        "landsat": ls,
        "modis": modis
    }
    logger.info("S2 size:", s2.size().getInfo())
    logger.info("S3 size:", s3.size().getInfo())
    logger.info("Landsat size:", ls.size().getInfo())
    logger.info("MODIS size:", modis.size().getInfo())

    def aggregate(col):
        recent = col.filterDate(end_date.advance(-7, 'day'), end_date).mean()
        baseline = col.filterDate(start_date, end_date.advance(-7, 'day')).mean()
        confidence = col.select('confidence').mean()
        return recent, baseline, confidence

    s2_r, s2_b, s2_c = aggregate(s2)
    s2_r = align_and_cast(s2_r)
    s2_b = align_and_cast(s2_b)
    s3_r, s3_b, s3_c = aggregate(s3)
    s3_r = align_and_cast(s3_r)
    s3_b = align_and_cast(s3_b)
    ls_r, ls_b, ls_c = aggregate(ls)
    ls_r = align_and_cast(ls_r)
    ls_b = align_and_cast(ls_b)
    mo_r, mo_b, mo_c = aggregate(modis)
    mo_r = align_and_cast(mo_r)
    mo_b = align_and_cast(mo_b)

    recent_img = ee.ImageCollection([s2_r, s3_r, ls_r, mo_r]).mean()
    baseline_img = ee.ImageCollection([s2_b, s3_b, ls_b, mo_b]).mean()
    confidence = ee.ImageCollection([s2_c, s3_c, ls_c, mo_c]).mean()

    scores = calculate_strategy_score(confidence, recent_img, baseline_img)
    strategy = scores["strategy"]
    strategy = strategy.clip(study_area)
    scores["risk"] = scores["risk"].clip(study_area)
    scores["anomaly"] = scores["anomaly"].clip(study_area)
    confidence = confidence.clip(study_area)
    recent_img = recent_img.clip(study_area)
    mask = get_hotspot_mask(strategy, study_area, percentile=90)
    hotspots = extract_hotspots(mask, study_area)
    hotspots = enrich_hotspots(hotspots, strategy, study_area)
    
    parameters = build_parameter_outputs(collections, recent_img, study_area)

    return {
        "maps": {
            "strategy": get_map_layer(strategy, {
                "min": 0,
                "max": 1,
                "palette": ["blue", "yellow", "red"]
            }),
            "risk": get_map_layer(scores["risk"], {
                "min": 0,
                "max": 1,
                "palette": ["green", "orange", "red"]
            }),
        },

        "parameters": parameters,

        "strategy": {
            "stats": extract_stats(strategy, "strategy", study_area).getInfo()
        },

        "hotspots": hotspots.getInfo(),

        "samples": sample_hotspots(recent_img, hotspots).getInfo()
    }


def get_collection(sat, start, end, geom):
    if sat == "S2":
        return get_s2_image(start, end, geom, process_phyto_image_s2)

    if sat == "S3":
        return get_s3_image(start, end, geom, process_phyto_image_s3)

    if sat == "LANDSAT":
        return get_landsat_image(start, end, geom, process_phyto_image_landsat)

    if sat == "MODIS":
        return get_modis_image(start, end, geom, process_phyto_image_modis)

    raise ValueError(f"Unsupported satellite: {sat}")


def safe_select(image, params):
    band_names = image.bandNames().getInfo()

    valid = [p for p in params if p in band_names]

    if not valid:
        return None  # or ee.Image(0) if you prefer

    return image.select(valid)


def fetch_raw_data(
    satellites,
    start,
    end,
    bbox,
):
    start, end = normalize_dates(start, end)
    geom = parse_geometry(bbox)

    results = {}

    for sat in satellites:
        col = get_collection(sat, start, end, geom).sort("system:time_start")

        def extract(image):
            image = image.select(ee.List(ALL_BANDS).filter(ee.Filter.inList('item', image.bandNames())))

            samples = image.sample(
                region=geom,
                scale=30,
                geometries=True,
                numPixels=500
            )

            def format_feature(f):
                return f.set({
                    "timestamp": image.date().format("YYYY-MM-dd HH:mm:ss")
                })

            return samples.map(format_feature)

        # flatten all timestamps into one collection
        fc = col.map(extract).flatten().limit(5000)

        data = fc.getInfo()["features"]

        results[sat] = [
            {
                "timestamp": f["properties"]["timestamp"],
                "coordinates": f["geometry"]["coordinates"],
                **{
                    k: v
                    for k, v in f["properties"].items()
                    if k != "timestamp"
                }
            }
            for f in data
        ]

    return results