# 🌊 NeroSense – Adaptive Water Intelligence System

<img width="1041" height="390" alt="file_00000000cd7c72439afca8c88eb08ddc" src="https://github.com/user-attachments/assets/1b274f94-78e3-4904-bd24-35a396d22c66" />

NeroSense is a scalable, modular water intelligence platform that combines **remote sensing** and **in-situ measurements** to enable adaptive, data-driven monitoring of water quality.

The system transforms satellite observations into **strategic measurement plans**, guiding autonomous hardware to collect data where it matters most.

---

## 💡 Why NeroSense?

Water monitoring today is often:
- Static (fixed sampling locations)
- Fragmented (isolated data sources)
- Inefficient (high cost, low adaptability)

**NeroSense changes this** by introducing:

👉 **Adaptive sensing** – measurements guided by data  
👉 **Multi-source fusion** – satellite + in-situ + custom inputs  
👉 **Intelligent prioritization** – focus on high-impact areas  

---

## 🧠 Core Concept: Strategic Sampling Engine

At the heart of NeroSense is a **spatial prioritization model** that determines where measurements should be taken.

It is based on three key components:

- **Confidence** – how reliable the satellite data is (clouds, land interference)
- **Risk** – intensity of the observed environmental signal (e.g. chlorophyll)
- **Temporal Dynamics** – how fast things are changing

These are combined into **priority maps**, which:

- Identify **hotspots**
- Guide **autonomous sampling routes**
- Optimize **resource usage**

---

## 🌍 Use Case: Phytoplankton Monitoring (Iskar Reservoir)

For the 11th edition of the Cassini hackathon, NeroSense focuses on:

👉 Detecting and tracking **phytoplankton blooms**

We combine:
- Satellite-derived indicators (chlorophyll, turbidity, temperature)
- Autonomous surface robot measurements

This enables:
- Early detection of bloom formation
- Targeted validation of satellite data
- Better water management decisions

---

## 🛰️ Data Sources

NeroSense integrates multiple Earth Observation datasets:

- **Sentinel-2** → High-resolution inland water monitoring  
- **Sentinel-3** → Spectral accuracy for water color  
- **Landsat 8/9** → Long-term historical trends  
- **MODIS** → High-frequency temporal dynamics  

The platform is **data-agnostic**, allowing users to plug in:
- Drone imagery
- External APIs
- Custom remote sensing sources

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/nerosense.git
cd nerosense
```

### 2. Setup environment variables
Create a `.env` file in the root directory:
```bash
APP_NAME=NeroSense
API_VERSION=v1
DEBUG=True

DATABASE_URL=postgresql://postgres:postgres@db:5432/nerosense

GEE_SERVICE_ACCOUNT=your-service-account@your-project.iam.gserviceaccount.com
GEE_CREDENTIALS_PATH=/app/credentials/gee-key.json

SECRET_KEY=your-secret-key
```

### 3. Add Google Earth Engine credentials
Create a folder `credentials/` and add your key file `gee-key.json`:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 4. Run with Docker
```bash
docker compose up --build
```

---

## 👥 Contributors

- **Nikolay Vasilev** – AI & Data Science, Backend  
  [GitHub](https://github.com/nikolayVv) | [LinkedIn](https://linkedin.com/in/nikolayvv)

- **Viktoria Todorova** – Data Engineering & Analytics  
  [GitHub](https://github.com/Viktoria-Todorova) | [LinkedIn](https://linkedin.com/in/viktoria-todorova-4a629a22a)

- **Yoan Trendafilov** – Embedded Systems & Sensors  
  [GitHub](https://github.com/YoanTrendafilov2002) | [LinkedIn](https://linkedin.com/in/yoan-trendafilov)

- **Nikoleta Evtimova** – Automation & Robotics  
  [GitHub](https://github.com/Nevtimova) | [LinkedIn](https://linkedin.com/in/nikoleta-evtimova-289854214)

- **Nikola Lozanov** – Full Stack Engineering  
  [GitHub](https://github.com/NikolaLozanov) | [LinkedIn](https://linkedin.com/in/nikola-lozanov-628056176)

- **Martina Dimitrova** – Remote Sensing & Environmental Science
  

- **Elena Deleva** – Water Systems Engineering
  
  [LinkedIn](https://linkedin.com/in/elena-deleva-3b4805139)

- **Bojan Baidanoff** – GIS & Business Strategy

  [GitHub](https://github.com/bbaid) | [LinkedIn](https://linkedin.com/in/bbaidanoff)
