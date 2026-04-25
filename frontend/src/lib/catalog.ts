// Mock "backend" catalog: sensors, satellite indicators, hardware presets.
// Async on purpose — pretends to come from FastAPI so it's easy to swap later.

export type Sensor = { id: string; label: string; provider: string };
export type Indicator = { id: string; label: string; unit?: string };
export type HardwarePreset = {
  id: string;
  label: string;
  /** Indicators this hardware can measure in-situ */
  inSituIndicators: Indicator[];
};

const SENSORS: Sensor[] = [
  { id: "s2-msi", label: "Sentinel-2 MSI", provider: "ESA Copernicus" },
  { id: "s3-olci", label: "Sentinel-3 OLCI", provider: "ESA Copernicus" },
  { id: "l9-oli", label: "Landsat 9 OLI", provider: "USGS / NASA" },
  { id: "modis-aqua", label: "MODIS Aqua", provider: "NASA" },
  { id: "planetscope", label: "PlanetScope", provider: "Planet Labs" },
];

const INDICATORS: Indicator[] = [
  { id: "chl_a", label: "Chlorophyll-a", unit: "μg/L" },
  { id: "turbidity", label: "Turbidity", unit: "NTU" },
  { id: "sst", label: "Surface temperature", unit: "°C" },
  { id: "tsm", label: "Suspended matter", unit: "g/m³" },
  { id: "cdom", label: "CDOM", unit: "m⁻¹" },
  { id: "cyano", label: "Cyanobacteria density", unit: "cells/mL" },
];

const IN_SITU: Record<string, Indicator> = {
  ph: { id: "ph", label: "pH" },
  do: { id: "do", label: "Dissolved O₂", unit: "mg/L" },
  cond: { id: "cond", label: "Conductivity", unit: "μS/cm" },
  temp: { id: "temp", label: "Water temp", unit: "°C" },
  nitrate: { id: "nitrate", label: "Nitrate", unit: "mg/L" },
  phosphate: { id: "phosphate", label: "Phosphate", unit: "mg/L" },
  microscope: { id: "microscope", label: "Microscope imaging" },
};

const HARDWARE: HardwarePreset[] = [
  {
    id: "iskar-drone-01",
    label: "Iskar River Drone 01",
    inSituIndicators: [IN_SITU.ph, IN_SITU.do, IN_SITU.cond, IN_SITU.temp],
  },
  {
    id: "underwater-sampler",
    label: "Underwater Sampler",
    inSituIndicators: [IN_SITU.do, IN_SITU.temp, IN_SITU.microscope],
  },
  {
    id: "drifter-buoy",
    label: "Drifter Buoy",
    inSituIndicators: [IN_SITU.temp, IN_SITU.cond, IN_SITU.ph],
  },
  {
    id: "bench-microscope",
    label: "Bench Microscope",
    inSituIndicators: [IN_SITU.microscope],
  },
  {
    id: "nutrient-probe",
    label: "Nutrient Probe",
    inSituIndicators: [IN_SITU.nitrate, IN_SITU.phosphate, IN_SITU.ph],
  },
];

const delay = <T>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const fetchSensors = () => delay(SENSORS);
export const fetchIndicators = () => delay(INDICATORS);
export const fetchHardware = () => delay(HARDWARE);
