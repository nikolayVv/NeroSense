import ee
import os
from loguru import logger


def initialize_gee():
    try:
        service_account = os.getenv("GEE_SERVICE_ACCOUNT")
        key_path = os.getenv("GEE_KEY_PATH")

        if not service_account or not key_path:
            raise ValueError("Missing GEE environment variables")

        credentials = ee.ServiceAccountCredentials(
            service_account,
            key_path
        )

        ee.Initialize(credentials)

        logger.info("GEE initialized successfully")

    except Exception as e:
        logger.error(f"GEE init failed: {e}")
        raise