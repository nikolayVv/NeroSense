import ee
from loguru import logger


def calculate_confidence_score_s3(image):
    # Use valid radiance as proxy (mask invalid pixels)
    mask = image.select('Oa08_radiance').gt(0)

    return mask.rename('confidence')


def compute_chla_from_s3(image):
    return image.expression(
        '(b8 / b6)',
        {
            'b8': image.select('Oa08_radiance'),  # ~665 nm
            'b6': image.select('Oa06_radiance'),  # ~560 nm
        }
    ).rename('chla')


def compute_cyano_from_s3(image):
    return image.expression(
        '(b8 - b6) / (b8 + b6)',
        {
            'b8': image.select('Oa08_radiance'),
            'b6': image.select('Oa06_radiance'),
        }
    ).rename('cyano')


def compute_fai_from_s3(image):
    return image.expression(
        'nir - (red + (swir - red) * ((nir_wl - red_wl) / (swir_wl - red_wl)))',
        {
            'nir': image.select('Oa17_radiance'),
            'red': image.select('Oa08_radiance'),
            'swir': image.select('Oa21_radiance'),

            'nir_wl': 865,
            'red_wl': 665,
            'swir_wl': 1020,
        }
    ).rename('fai')


def process_phyto_image_s3(image):
    chla = compute_chla_from_s3(image)
    cyano = compute_cyano_from_s3(image)
    fai = compute_fai_from_s3(image)

    confidence = calculate_confidence_score_s3(image)

    return image.addBands([
        chla.toFloat(),
        cyano.toFloat(),
        fai.toFloat(),
        confidence.toFloat()
    ])


def get_s3_image(start_date, end_date, study_area, mapping):
    logger.info("Fetching Sentinel-3 data from GEE")

    return (
        ee.ImageCollection("COPERNICUS/S3/OLCI")
        .filterDate(start_date, end_date)
        .filterBounds(study_area)
        .map(mapping)
    )