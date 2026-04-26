def normalize(image, band, min_val, max_val):
    return image.select(band).subtract(min_val).divide(max_val - min_val).clamp(0, 1)