import ee
from loguru import logger


def calculate_confidence_score_landsat(image, reflectance_scaled):
    qa = image.select('QA_PIXEL')

    # bit masks
    cloud = qa.bitwiseAnd(1 << 3).neq(0)
    cirrus = qa.bitwiseAnd(1 << 2).neq(0)
    shadow = qa.bitwiseAnd(1 << 4).neq(0)
    dilated = qa.bitwiseAnd(1 << 1).neq(0)

    cloud_mask = cloud.Or(cirrus).Or(shadow).Or(dilated)
    ndwi = reflectance_scaled.normalizedDifference(['SR_B3', 'SR_B5']).rename('ndwi')

    water_conf = ndwi.subtract(0.1).divide(0.3).clamp(0, 1)
    cloud_conf = cloud_mask.Not().rename('cloud_conf')

    return cloud_conf.multiply(water_conf).rename('confidence')


def compute_lst_from_landsat(image):
    lst_kelvin = image.select('ST_B10').multiply(0.00341802).add(149)
    return lst_kelvin.subtract(273.15).rename('lst')


def compute_chla_from_landsat(reflectance_scaled):
    return reflectance_scaled.expression(
        '(green / blue)',
        {
            'green': reflectance_scaled.select('SR_B3'),
            'blue': reflectance_scaled.select('SR_B2'),
        }
    ).rename('chla')


def compute_ndti_from_landsat(reflectance_scaled):
    return reflectance_scaled.normalizedDifference(['SR_B4', 'SR_B3']).rename('ndti')


def compute_fai_from_landsat(reflectance_scaled):
    return reflectance_scaled.expression(
        'nir - (red + (swir - red) * ((nir_wl - red_wl) / (swir_wl - red_wl)))',
        {
            'nir': reflectance_scaled.select('SR_B5'),
            'red': reflectance_scaled.select('SR_B4'),
            'swir': reflectance_scaled.select('SR_B6'),

            # wavelengths (nm)
            'nir_wl': 865,
            'red_wl': 655,
            'swir_wl': 1609,
        }
    ).rename('fai')


def process_phyto_image_landsat(image):
    reflectance_scaled = image.select('SR_B.*').multiply(2.75e-05).add(-0.2)

    chla = compute_chla_from_landsat(reflectance_scaled)
    ndti = compute_ndti_from_landsat(reflectance_scaled)
    lst = compute_lst_from_landsat(image)
    fai = compute_fai_from_landsat(reflectance_scaled)

    confidence = calculate_confidence_score_landsat(image, reflectance_scaled)

    return image.addBands([
        chla.toFloat(),
        ndti.toFloat(),
        fai.toFloat(),
        confidence.toFloat()
    ])

def get_landsat_image(start_date, end_date, study_area, mapping):
    logger.info("Fetching Landsat data from GEE")

    l8 = (
        ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .filterDate(start_date, end_date)
        .filterBounds(study_area)
        .map(mapping)
    )
    l9 = (
        ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
        .filterDate(start_date, end_date)
        .filterBounds(study_area)
        .map(mapping)
    )

    return l8.merge(l9).sort('system:time_start')


