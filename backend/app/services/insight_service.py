from loguru import logger


def fuse_data(hotspots, sensor_data):
    logger.info("Fusing satellite and sensor data")

    results = []

    for h, s in zip(hotspots, sensor_data):

        if h["score"] > 0.5 and s["turbidity"] < 5:
            status = "confirmed bloom"

        elif h["score"] > 0.5 and s["turbidity"] > 5:
            status = "uncertain (possible sediment)"

        else:
            status = "low risk"

        results.append({
            "lat": h["lat"],
            "lon": h["lon"],
            "status": status,
            "confidence": "medium"
        })

    return results

def generate_insights(fused_data):
    insights = []

    for d in fused_data:
        if "confirmed" in d["status"]:
            insights.append({
                "type": "alert",
                "message": "High phytoplankton concentration confirmed"
            })

        elif "uncertain" in d["status"]:
            insights.append({
                "type": "warning",
                "message": "Satellite signal uncertain due to turbidity"
            })

        else:
            insights.append({
                "type": "info",
                "message": "No significant risk detected"
            })

    return insights