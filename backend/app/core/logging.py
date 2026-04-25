from loguru import logger
import sys


def setup_logging():
    logger.remove()
    logger.add(
        sys.stdout,
        level="INFO",
        format="{time} | {level} | {message}"
    )