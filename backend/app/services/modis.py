import ee
from loguru import logger


def calculate_confidence_score_modis(image, reflectance_scaled):
    qa = image.select('state_1km')

    # cloud bit (bit 10)
    cloud = qa.bitwiseAnd(1 << 10).neq(0)
    cloud_conf = cloud.Not()

    ndwi = reflectance_scaled.normalizedDifference(
        ['sur_refl_b04', 'sur_refl_b02']
    ).rename('ndwi')

    water_conf = ndwi.subtract(0.1).divide(0.3).clamp(0, 1)

    return cloud_conf.multiply(water_conf).rename('confidence')


def compute_chla_from_modis(reflectance_scaled):
    return reflectance_scaled.expression(
        '(green / blue)',
        {
            'green': reflectance_scaled.select('sur_refl_b04'),
            'blue': reflectance_scaled.select('sur_refl_b03'),
        }
    ).rename('chla')


def compute_fai_from_modis(reflectance_scaled):
    return reflectance_scaled.expression(
        'nir - (red + (swir - red) * ((nir_wl - red_wl) / (swir_wl - red_wl)))',
        {
            'nir': reflectance_scaled.select('sur_refl_b02'),
            'red': reflectance_scaled.select('sur_refl_b01'),
            'swir': reflectance_scaled.select('sur_refl_b06'),

            'nir_wl': 859,
            'red_wl': 645,
            'swir_wl': 1640,
        }
    ).rename('fai')


def process_phyto_image_modis(image):
    reflectance_scaled = image.select('sur_refl_b.*').multiply(0.0001)

    chla = compute_chla_from_modis(reflectance_scaled)
    fai = compute_fai_from_modis(reflectance_scaled)

    confidence = calculate_confidence_score_modis(image, reflectance_scaled)

    return image.addBands([
        chla.toFloat(),
        fai.toFloat(),
        confidence.toFloat()
    ])

def get_modis_image(start_date, end_date, study_area, mapping):
    logger.info("Fetching MODIS data from GEE")

    return (
        ee.ImageCollection("MODIS/061/MOD09GA")
        .filterDate(start_date, end_date)
        .filterBounds(study_area)
        .map(mapping)
    )