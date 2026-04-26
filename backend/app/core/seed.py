from sqlalchemy.orm import Session
from app.models.indicator import Indicator
from app.services.indicator import create_indicator

INDICATORS = [
    {
        "name": "Phytoplankton",
        "description": "Microscopic photosynthetic organisms forming the base of aquatic food webs and indicating ecosystem productivity and nutrient status.",
        "unit": "qualitative / index"
    },
    {
        "name": "Eutrophication",
        "description": "Degree of nutrient enrichment in water bodies, often leading to algal blooms and oxygen depletion.",
        "unit": "index"
    },
    {
        "name": "Water Clarity",
        "description": "Transparency of water, indicating the depth to which light can penetrate.",
        "unit": "m"
    },
    {
        "name": "Dissolved Oxygen Status",
        "description": "Overall oxygen availability in water, critical for aquatic life survival.",
        "unit": "mg/L"
    },
    {
        "name": "Salinity",
        "description": "Concentration of dissolved salts in water, influencing species distribution and water density.",
        "unit": "PSU"
    },
    {
        "name": "Water Temperature Regime",
        "description": "Thermal condition of the water body, affecting chemical processes and biological activity.",
        "unit": "°C"
    },
    {
        "name": "Suspended Sediment Load",
        "description": "Amount of particulate matter carried within the water column, affecting turbidity and habitat quality.",
        "unit": "mg/L"
    },
    {
        "name": "Organic Pollution",
        "description": "Presence of biodegradable organic matter that can deplete oxygen during decomposition.",
        "unit": "index"
    },
    {
        "name": "Chemical Pollution",
        "description": "Presence of harmful chemical substances such as heavy metals, pesticides, or industrial contaminants.",
        "unit": "index"
    },
    {
        "name": "Biological Contamination",
        "description": "Presence of harmful microorganisms such as bacteria, viruses, or parasites.",
        "unit": "index"
    },
    {
        "name": "Acidity / Alkalinity Balance",
        "description": "Overall acid-base condition of the water affecting chemical stability and organism health.",
        "unit": "pH"
    },
    {
        "name": "Hydrological Stability",
        "description": "Variability and consistency of water flow, levels, and mixing processes.",
        "unit": "index"
    },
    {
        "name": "Stratification",
        "description": "Layering of water based on temperature or density differences, affecting oxygen and nutrient distribution.",
        "unit": "qualitative"
    },
    {
        "name": "Nutrient Load",
        "description": "Overall concentration of nutrients such as nitrogen and phosphorus driving ecosystem productivity.",
        "unit": "mg/L"
    }
]

def seed_data(db: Session):
    pass
    # create_indicator(db, Indicator(
    #     name="",
    #     description="",
    #     unit=""
    # ))
    