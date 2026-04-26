import ee
from loguru import logger


def calculate_confidence_score_s2(image, reflectance_scaled):
    cloud_prob = image.select('probability')
    ndwi = reflectance_scaled.normalizedDifference(['B3', 'B8']).rename('ndwi')
    cloud_conf = cloud_prob.multiply(-1).add(100).divide(100)
    water_conf = ndwi.subtract(0.1).divide(0.3).clamp(0, 1)
    
    return cloud_conf.multiply(water_conf).rename('confidence')


def compute_chla_from_s2(reflectance_scaled):
    return reflectance_scaled.expression(
        '4.26 * ((green / nir) ** 3.94)',
        {
            'green': reflectance_scaled.select('B3'),
            'nir': reflectance_scaled.select('B8'),
        }
    ).rename('chla')


def compute_ndti_from_s2(reflectance_scaled):
    return reflectance_scaled.normalizedDifference(['B4', 'B3']).rename('ndti')


def compute_cyano_from_s2(reflectance_scaled):
    return reflectance_scaled.expression('115530.31 * (((b3 * b4)/b2) ** 2.38)', {
        'b2': reflectance_scaled.select('B2'),
        'b3': reflectance_scaled.select('B3'),
        'b4': reflectance_scaled.select('B4')
    }).rename('cyano')


def compute_fai_from_s2(reflectance_scaled):
    return reflectance_scaled.expression(
        'nir - (red + (swir - red) * ((nir_wl - red_wl) / (swir_wl - red_wl)))',
        {
            'nir': reflectance_scaled.select('B8'),
            'red': reflectance_scaled.select('B4'),
            'swir': reflectance_scaled.select('B11'),

            # wavelengths (nm)
            'nir_wl': 842,
            'red_wl': 665,
            'swir_wl': 1610,
        }
    ).rename('fai')


def process_phyto_image_s2(image):
    reflectance_scaled = image.select('B.*').multiply(0.0001)

    # parameters
    chla = compute_chla_from_s2(reflectance_scaled)
    ndti = compute_ndti_from_s2(reflectance_scaled)
    cyano = compute_cyano_from_s2(reflectance_scaled)
    fai = compute_fai_from_s2(reflectance_scaled)

    # confidence
    confidence = calculate_confidence_score_s2(image, reflectance_scaled)

    return image.addBands([
        chla.toFloat(),
        ndti.toFloat(),
        cyano.toFloat(),
        fai.toFloat(),
        confidence.toFloat()
    ])


def get_s2_image(start_date, end_date, study_area, mapping):
    logger.info("Fetching Sentinel-2 data from GEE")

    return (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .linkCollection(
            ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY"),
            'probability',
        )
        .filterDate(start_date, end_date)
        .filterBounds(study_area)
        .map(mapping)
    )
