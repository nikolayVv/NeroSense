/* ═══════════════════════════════════════════════════════════════
   Nero Sense — script.js
   All chart/detection data comes from your FastAPI.
   ──────────────────────────────────────────────────────────────
   HOW TO CONFIGURE:
     1. Set API_BASE to your FastAPI URL (e.g. "http://localhost:8000")
     2. Each endpoint below is called with ?river=…&date_from=…&date_to=…
     3. Expected response shapes are documented above each fetch call.
        Adjust the field names to match your actual API output.
═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
//  CONFIG — change this to your FastAPI base URL
// ─────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';   // ← UPDATE THIS

/*
  ENDPOINT SUMMARY (all GET, params: river, date_from, date_to)
  ─────────────────────────────────────────────────────────────
  /api/stats            → { total_cells, species_count, density, avg_index, detections:[…] }
  /api/chlorophyll      → { labels:string[], datasets:[{label, data:number[]}] }
  /api/timeseries       → { dates:string[], stations:[{name, values:number[]}] }
  /api/stations         → { stations:[{name, index, cells, dominant_species}] }
  /api/trend            → { dates:string[], actual:number[], predicted:number[], upper:number[], lower:number[] }
  /api/matrix           → { stations:string[], dates:string[], values:number[][] }
*/

// ─────────────────────────────────────────────────────────────
//  PALETTE
// ─────────────────────────────────────────────────────────────
const PALETTE = [
  '#00ffc6','#3b82f6','#f59e0b','#a78bfa',
  '#f97316','#ef4444','#22c55e','#7bffb0',
];

// ─────────────────────────────────────────────────────────────
//  CHART REGISTRY — keeps canvas 2D instances for redraws
// ─────────────────────────────────────────────────────────────
const Charts = {};

// ─────────────────────────────────────────────────────────────
//  LAST FETCHED DATA — for export
// ─────────────────────────────────────────────────────────────
let lastStats = null;

// ─────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  URL PARAMS (passed by the host app when embedded)
// ─────────────────────────────────────────────────────────────
const URL_PARAMS = new URLSearchParams(location.search);
const EMBED = URL_PARAMS.get('embed') === '1';

// Catalog labels (mirror src/lib/catalog.ts)
const SENSOR_LABELS = {
  's2-msi':      'Sentinel-2 MSI',
  's3-olci':     'Sentinel-3 OLCI',
  'l9-oli':      'Landsat 9 OLI',
  'modis-aqua':  'MODIS Aqua',
  'planetscope': 'PlanetScope',
};
const INDICATOR_LABELS = {
  'chl_a':     'Chlorophyll-a',
  'turbidity': 'Turbidity',
  'sst':       'Surface temperature',
  'tsm':       'Suspended matter',
  'cdom':      'CDOM',
  'cyano':     'Cyanobacteria density',
};
const HARDWARE_LABELS = {
  'iskar-drone-01':     'Iskar River Drone 01',
  'underwater-sampler': 'Underwater Sampler',
  'drifter-buoy':       'Drifter Buoy',
  'bench-microscope':   'Bench Microscope',
  'nutrient-probe':     'Nutrient Probe',
};
const IN_SITU_LABELS = {
  ph: 'pH', do: 'Dissolved O₂', cond: 'Conductivity',
  temp: 'Water temp', nitrate: 'Nitrate', phosphate: 'Phosphate',
  microscope: 'Microscope imaging',
};

// ─────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  if (EMBED) document.body.classList.add('embed');

  initClock();
  initBackground();
  initMap();
  initMapControls();
  initExportButtons();
  wireRunButton();
  populateFromUrl();
  initRiverSelect();
  wireAutoRun();

  // Trigger on page load
  runAnalysis();
});

// Populate sensors / indicators / hardware groups from URL (when embedded)
function populateFromUrl() {
  const sensors    = (URL_PARAMS.get('sensors')    || '').split(',').filter(Boolean);
  const indicators = (URL_PARAMS.get('indicators') || '').split(',').filter(Boolean);
  const hardware   = (URL_PARAMS.get('hardware')   || '').split(',').filter(Boolean);
  const inSitu     = (URL_PARAMS.get('in_situ')    || '').split(',').filter(Boolean);

  const sg = document.getElementById('sensors-group');
  if (sg && sensors.length) {
    sg.innerHTML = sensors.map(id =>
      `<label><input type="checkbox" class="sensor-checkbox" value="${id}" checked/> ${SENSOR_LABELS[id] || id}</label>`
    ).join('');
  }

  const ig = document.getElementById('indicators-group');
  if (ig && indicators.length) {
    ig.innerHTML = indicators.map(id =>
      `<label><input type="checkbox" class="param-checkbox" value="${id}" checked/> ${INDICATOR_LABELS[id] || id}</label>`
    ).join('');
  }

  const hg = document.getElementById('hardware-group');
  if (hg) {
    if (hardware.length) {
      const insitu = inSitu.length
        ? `<div class="muted" style="font-size:10px;margin-top:4px">In-situ: ${inSitu.map(i => IN_SITU_LABELS[i] || i).join(', ')}</div>`
        : '';
      hg.innerHTML = hardware.map(id =>
        `<label><input type="checkbox" checked disabled/> ${HARDWARE_LABELS[id] || id}</label>`
      ).join('') + insitu;
    }
  }
}

// Re-run analysis whenever the user toggles a filter
function wireAutoRun() {
  const debounced = debounce(runAnalysis, 250);
  document.querySelectorAll('.sensor-checkbox, .param-checkbox')
    .forEach(el => el.addEventListener('change', debounced));
  document.getElementById('date-from')?.addEventListener('change', debounced);
  document.getElementById('date-to')?.addEventListener('change', debounced);
}

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ═════════════════════════════════════════════════════════════
//  CLOCK
// ═════════════════════════════════════════════════════════════
function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => el.textContent = new Date().toLocaleTimeString('en-GB');
  tick(); setInterval(tick, 1000);
}

// ═════════════════════════════════════════════════════════════
//  BACKGROUND CANVAS
// ═════════════════════════════════════════════════════════════
function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const pts = Array.from({ length: 55 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.4 + 0.3,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    a: Math.random() * 0.4 + 0.1,
  }));

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,255,198,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 55) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 55) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    pts.forEach(p => {
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,255,198,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
}

// ═════════════════════════════════════════════════════════════
//  MAP
// ═════════════════════════════════════════════════════════════
function initMap() {
  try { Engine.init('map', { center: [42.6977, 23.3219], zoom: 7 }); }
  catch (e) { console.error('Engine.init failed:', e); }

  const map = Engine._getMap && Engine._getMap();
  if (!map) return;

  map.on('mousemove', e => {
    const el = document.getElementById('cursor-pos');
    if (el) el.textContent = `Lat: ${e.latlng.lat.toFixed(4)}  Lng: ${e.latlng.lng.toFixed(4)}`;
  });
  map.on('zoomend', () => {
    const el = document.getElementById('zoom-level');
    if (el) el.textContent = `Zoom: ${map.getZoom()}`;
  });
}

function initMapControls() {
  document.getElementById('btn-zoom-in') ?.addEventListener('click', () => Engine.zoomIn());
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => Engine.zoomOut());
  document.getElementById('btn-reset')   ?.addEventListener('click', () => Engine.resetView());

  // Water Source Map controls (mirrors the upper map panel)
  document.getElementById('btn-chl-zoom-in') ?.addEventListener('click', () => {
    if (_chlMap) _chlMap.setZoom(_chlMap.getZoom() + 1);
  });
  document.getElementById('btn-chl-zoom-out')?.addEventListener('click', () => {
    if (_chlMap) _chlMap.setZoom(_chlMap.getZoom() - 1);
  });
  document.getElementById('btn-chl-reset')   ?.addEventListener('click', () => {
    if (_chlMap && _chlLastBounds) _chlMap.fitBounds(_chlLastBounds, 24);
  });
  document.getElementById('btn-chl-expand') ?.addEventListener('click', () => toggleChlExpanded(true));
  document.getElementById('btn-chl-close')  ?.addEventListener('click', () => toggleChlExpanded(false));

  // Phytoplankton Map (upper) — expand + cell coordinate readout
  document.getElementById('btn-phyto-expand')?.addEventListener('click', () => togglePhytoExpanded(true));
  document.getElementById('btn-phyto-close') ?.addEventListener('click', () => togglePhytoExpanded(false));

  window.addEventListener('nero:phyto-cell-selected', (e) => {
    const { lat, lng, value } = e.detail || {};
    const el = document.getElementById('phyto-selected-cell');
    if (!el || typeof value !== 'number') return;
    const level = value < 0.25 ? 'LOW'
                : value < 0.55 ? 'MODERATE'
                : value < 0.80 ? 'HIGH'
                : 'BLOOM';
    const levelColor = value < 0.25 ? '#3b82f6'
                     : value < 0.55 ? '#22c55e'
                     : value < 0.80 ? '#f59e0b'
                     : '#ef4444';
    el.textContent = `Phytoplankton ${level} · ${value.toFixed(2)} · ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    el.style.color = levelColor;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('chl-expanded')) {
      e.preventDefault(); toggleChlExpanded(false);
    } else if (document.body.classList.contains('phyto-expanded')) {
      e.preventDefault(); togglePhytoExpanded(false);
    }
  });
}

let _phytoExpandReturnFocus = null;
function togglePhytoExpanded(force) {
  const card     = document.getElementById('card-phyto-map');
  const expandBtn = document.getElementById('btn-phyto-expand');
  const closeBtn  = document.getElementById('btn-phyto-close');
  if (!card) return;

  const willExpand = typeof force === 'boolean'
    ? force
    : !card.classList.contains('expanded');

  card.classList.toggle('expanded', willExpand);
  document.body.classList.toggle('phyto-expanded', willExpand);
  if (closeBtn) closeBtn.hidden = !willExpand;

  if (willExpand) {
    _phytoExpandReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    requestAnimationFrame(() => closeBtn?.focus());
  } else {
    if (_phytoExpandReturnFocus && document.body.contains(_phytoExpandReturnFocus)) {
      _phytoExpandReturnFocus.focus();
    } else {
      expandBtn?.focus();
    }
    _phytoExpandReturnFocus = null;
  }

  // Force the upper map (Engine) to re-layout
  setTimeout(() => {
    const map = Engine._getMap && Engine._getMap();
    const host = document.getElementById('map');
    if (!map || !host) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    host.style.display = 'none';
    void host.offsetHeight;
    host.style.display = '';
    google.maps.event.trigger(map, 'resize');
    if (center) map.setCenter(center);
    if (typeof zoom === 'number') map.setZoom(zoom);
  }, 240);
}

let _chlExpandReturnFocus = null;

function toggleChlExpanded(force) {
  const card     = document.getElementById('card-chl-heatmap');
  const expandBtn = document.getElementById('btn-chl-expand');
  const closeBtn  = document.getElementById('btn-chl-close');
  if (!card) return;

  const willExpand = typeof force === 'boolean'
    ? force
    : !card.classList.contains('expanded');

  card.classList.toggle('expanded', willExpand);
  document.body.classList.toggle('chl-expanded', willExpand);

  if (closeBtn) closeBtn.hidden = !willExpand;

  if (willExpand) {
    _chlExpandReturnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    // Move focus into the overlay so keyboard input (incl. Esc) stays here
    requestAnimationFrame(() => closeBtn?.focus());
  } else {
    // Restore focus to whatever opened the overlay
    if (_chlExpandReturnFocus && document.body.contains(_chlExpandReturnFocus)) {
      _chlExpandReturnFocus.focus();
    } else {
      expandBtn?.focus();
    }
    _chlExpandReturnFocus = null;
  }

  // Google Maps needs a resize hint after the container size changes
  setTimeout(() => {
    if (_chlMap) {
      const center = _chlMap.getCenter();
      const zoom = _chlMap.getZoom();
      const host = document.getElementById('chl-heatmap-map');
      if (host) host.style.display = 'none';
      void host?.offsetHeight;
      if (host) host.style.display = '';
      google.maps.event.trigger(_chlMap, 'resize');
      if (_chlLastBounds) {
        _chlMap.fitBounds(_chlLastBounds, 24);
      } else {
        if (center) _chlMap.setCenter(center);
        if (typeof zoom === 'number') _chlMap.setZoom(zoom);
      }
    }
  }, 240);
}

async function initRiverSelect() {
  const riverSelect = document.getElementById('river-select');
  if (!riverSelect) return;
  try {
    const items = await Engine.getRiverNames();
    if (!Array.isArray(items) || items.length === 0) return;

    riverSelect.innerHTML = '';
    const optAll = document.createElement('option'); optAll.value = 'bulgaria'; optAll.text = 'Show all rivers';
    riverSelect.appendChild(optAll);

    items.forEach(it => {
      const o = document.createElement('option');
      o.value = it.name; // original name used for lookups
      o.text = it.display;
      riverSelect.appendChild(o);
    });

    const optCustom = document.createElement('option'); optCustom.value = 'custom'; optCustom.text = 'Custom';
    riverSelect.appendChild(optCustom);

    // Auto-select Iskar if present, otherwise first
    const iskar = items.find(it => /iskar/i.test(it.display) || /iskar/i.test(it.name));
    riverSelect.value = (iskar && iskar.name) || items[0].name;
    // Load the selected river on the map
    loadMapRiver(riverSelect.value);

  } catch (err) {
    console.warn('Could not load river names from bulgaria_rivers.geojson:', err);
  }

  riverSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val || val === 'custom') return;
    if (val === 'bulgaria') loadMapRiver('bulgaria');
    else loadMapRiver(val);
  });
}

async function loadMapRiver(river) {
  try {
    if (river === 'bulgaria') {
      await Engine.loadRiver('bulgaria');
    } else if (Engine.loadRiverByName) {
      await Engine.loadRiverByName(river).catch(() => Engine.loadRiver(river));
    } else {
      await Engine.loadRiver(river);
    }
  } catch (e) { console.warn('Map load failed:', e); }
}

// ═════════════════════════════════════════════════════════════
//  API HELPERS
// ═════════════════════════════════════════════════════════════
function getParams() {
  return {
    river:     URL_PARAMS.get('water_source_name_en')
            || URL_PARAMS.get('water_source')
            || document.getElementById('river-select')?.value
            || 'iskar',
    date_from: URL_PARAMS.get('date_from') || document.getElementById('date-from')?.value || '',
    date_to:   URL_PARAMS.get('date_to')   || document.getElementById('date-to')?.value   || '',
  };
}

function buildURL(endpoint, params) {
  const u = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); });
  return u.toString();
}

// Fetch with short timeout — we expect the FastAPI may not be up.
// On any error, callers fall back to mock data via apiFetchOrMock.
async function apiFetch(endpoint, params) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(buildURL(endpoint, params), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${endpoint} → HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

async function apiFetchOrMock(endpoint, params, mockFn) {
  try { return { data: await apiFetch(endpoint, params), mocked: false }; }
  catch (_) { return { data: mockFn(params), mocked: true }; }
}

// ═════════════════════════════════════════════════════════════
//  STATUS INDICATOR
// ═════════════════════════════════════════════════════════════
function setApiStatus(state) {
  // state: 'loading' | 'active' | 'error'
  const pill = document.getElementById('api-status');
  const text = document.getElementById('api-status-text');
  if (!pill || !text) return;
  pill.className = `status-pill ${state}`;
  text.textContent = state === 'loading' ? 'FETCHING…'
                   : state === 'active'  ? 'DATA LOADED'
                   : 'API ERROR';
}

function setChartStatus(id, state, msg = '') {
  // state: 'loading' | 'ok' | 'error'
  const el = document.getElementById(`${id}-status`);
  if (!el) return;
  el.className = `chart-status ${state}`;
  el.textContent = state === 'loading' ? 'loading…'
                 : state === 'ok'      ? '✓'
                 : `⚠ ${msg}`;
}

function showChartEmpty(id, show, msg = 'Awaiting data…') {
  const el = document.getElementById(`${id}-empty`);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('hidden', !show);
}

// ═════════════════════════════════════════════════════════════
//  RUN ANALYSIS — fetches all endpoints in parallel
// ═════════════════════════════════════════════════════════════
async function runAnalysis() {
  const params  = getParams();
  const runBtn  = document.getElementById('run-btn');

  // Selected indicators drive which series we synthesize
  const selectedIndicators = Array.from(
    document.querySelectorAll('.param-checkbox:checked')
  ).map(el => el.value);
  const selectedSensors = Array.from(
    document.querySelectorAll('.sensor-checkbox:checked')
  ).map(el => el.value);

  if (runBtn) { runBtn.disabled = true; runBtn.innerHTML = '<span class="run-icon">⏳</span><span>SCANNING…</span>'; }
  setApiStatus('loading');

  loadMapRiver(params.river);

  // Try API first, fall back to mock — so visualisations always render.
  const ctx = { ...params, indicators: selectedIndicators, sensors: selectedSensors };

  const [statsR, chlR, tsR, barR, trendR, matrixR] = await Promise.all([
    apiFetchOrMock('/api/stats',       params, mockStats),
    apiFetchOrMock('/api/chlorophyll', params, () => mockChlorophyll(ctx)),
    apiFetchOrMock('/api/timeseries',  params, () => mockTimeseries(ctx)),
    apiFetchOrMock('/api/stations',    params, mockStations),
    apiFetchOrMock('/api/trend',       params, mockTrend),
    apiFetchOrMock('/api/matrix',      params, mockMatrix),
  ]);

  const allMocked = [statsR, chlR, tsR, barR, trendR, matrixR].every(r => r.mocked);
  setApiStatus(allMocked ? 'active' : 'active');

  renderStats(statsR.data);
  renderChlHeatmap(chlR.data, barR.data);
  renderTimeSeries(tsR.data);
  renderBarChart(barR.data);
  renderTrend(trendR.data, 'trend');
  renderTrend(makeTrendVariant(trendR.data, 'insitu'), 'trend-insitu');
  renderTrend(makeTrendVariant(trendR.data, 'sat'), 'trend-sat');
  renderMatrix(matrixR.data);

  if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = '<span class="run-icon">▶</span><span>RUN ANALYSIS</span>'; }

  if (allMocked) {
    const txt = document.getElementById('api-status-text');
    if (txt) txt.textContent = 'DEMO DATA';
  }
}

// ═════════════════════════════════════════════════════════════
//  MOCK DATA — used whenever the FastAPI is not reachable.
//  Deterministic-ish per (river, date_from) so charts look stable.
// ═════════════════════════════════════════════════════════════
function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
}

function mockStats() {
  const r = seedFrom('stats|' + (URL_PARAMS.get('water_source') || 'iskar'));
  const total = 800 + Math.floor(r() * 1200);
  return {
    total_cells:   total,
    species_count: 12 + Math.floor(r() * 14),
    density:       Math.floor(total * (8 + r() * 7)),
    avg_index:     +(1.6 + r() * 1.8).toFixed(2),
    detections: [
      { station: 'Панчарево',  species: 'Scenedesmus quadricauda', time: '21.05.2024 10:15', score: +(1.8 + r()).toFixed(2), icon: '🦠' },
      { station: 'Своге',      species: 'Cyclotella meneghiniana', time: '22.05.2024 09:42', score: +(1.6 + r()).toFixed(2), icon: '🔬' },
      { station: 'Равно поле', species: 'Microcystis aeruginosa',  time: '23.05.2024 14:08', score: +(2.4 + r()).toFixed(2), icon: '☣️' },
      { station: 'Железница',  species: 'Pediastrum duplex',       time: '24.05.2024 11:30', score: +(1.9 + r()).toFixed(2), icon: '🦠' },
      { station: 'Нови Искър', species: 'Asterionella formosa',    time: '25.05.2024 13:55', score: +(2.1 + r()).toFixed(2), icon: '🔬' },
    ],
  };
}

function dateLabels(from, to, max = 8) {
  try {
    const a = new Date(from), b = new Date(to);
    const days = Math.max(1, Math.min(max, Math.round((b - a) / 86400000) + 1));
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(a.getTime() + i * 86400000);
      out.push(`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    return out;
  } catch { return ['D1','D2','D3','D4','D5','D6','D7']; }
}

function mockChlorophyll({ river, date_from, date_to, indicators }) {
  const labels = dateLabels(date_from, date_to);
  const r = seedFrom('chl|' + river + indicators.join(','));
  const series = (indicators.length ? indicators : ['chl_a']).map(id => ({
    label: INDICATOR_LABELS[id] || id,
    data: labels.map((_, i) => +(1.5 + r() * 2 + Math.sin(i / 1.5) * 0.4).toFixed(2)),
  }));
  return { labels, datasets: series };
}

function mockTimeseries({ river, date_from, date_to }) {
  const dates = dateLabels(date_from, date_to);
  const stations = ['Своге', 'Панчарево', 'Равно поле', 'Железница'];
  const r = seedFrom('ts|' + river);
  return {
    dates,
    stations: stations.map(name => ({
      name,
      values: dates.map((_, i) => +(1.4 + r() * 1.6 + Math.cos(i / 2) * 0.3).toFixed(2)),
    })),
  };
}

// Station coordinates around the Iskar Reservoir (Язовир Искър) shoreline.
// The reservoir sits roughly at 42.43°N, 23.43°E. These points are placed
// along its banks so the markers visualise sampling stations on the lake.
// Iskar Reservoir stations — coordinates picked inside the lake polygon
// (bbox lon 23.5185–23.6328, lat 42.4107–42.5158).
const STATION_COORDS = {
  'Своге':      { lat: 42.5050, lng: 23.5650 }, // north arm
  'Панчарево':  { lat: 42.4850, lng: 23.5550 }, // upper basin
  'Равно поле': { lat: 42.4600, lng: 23.5800 }, // central
  'Железница':  { lat: 42.4350, lng: 23.6000 }, // south-east
  'Нови Искър': { lat: 42.4200, lng: 23.5750 }, // south
};

function mockStations() {
  const r = seedFrom('stations|' + (URL_PARAMS.get('water_source') || 'iskar'));
  return {
    stations: [
      { name: 'Своге',      index: +(1.5 + r() * 0.6).toFixed(2), cells: 180 + Math.floor(r() * 120), dominant_species: 'Pediastrum duplex',  ...STATION_COORDS['Своге'] },
      { name: 'Панчарево',  index: +(2.2 + r() * 0.7).toFixed(2), cells: 240 + Math.floor(r() * 140), dominant_species: 'Microcystis',         ...STATION_COORDS['Панчарево'] },
      { name: 'Равно поле', index: +(2.6 + r() * 0.6).toFixed(2), cells: 290 + Math.floor(r() * 150), dominant_species: 'Cyclotella',          ...STATION_COORDS['Равно поле'] },
      { name: 'Железница',  index: +(1.9 + r() * 0.5).toFixed(2), cells: 200 + Math.floor(r() * 110), dominant_species: 'Asterionella',        ...STATION_COORDS['Железница'] },
      { name: 'Нови Искър', index: +(2.4 + r() * 0.6).toFixed(2), cells: 260 + Math.floor(r() * 130), dominant_species: 'Scenedesmus',         ...STATION_COORDS['Нови Искър'] },
    ],
  };
}

function mockTrend({ date_from, date_to }) {
  const past = dateLabels(date_from, date_to);
  const future = ['+1d','+2d','+3d'];
  const dates = [...past, ...future];
  const r = seedFrom('trend');
  const actual = past.map((_, i) => +(2.0 + r() * 0.4 + i * 0.05).toFixed(2)).concat(future.map(() => null));
  const lastA = actual[past.length - 1] ?? 2.5;
  const predicted = past.map((_, i) => +(actual[i] - 0.05 + r() * 0.1).toFixed(2))
    .concat(future.map((_, i) => +(lastA + (i + 1) * 0.12).toFixed(2)));
  const upper = predicted.map((v, i) => i < past.length - 1 ? null : +(v + 0.18).toFixed(2));
  const lower = predicted.map((v, i) => i < past.length - 1 ? null : +(v - 0.18).toFixed(2));
  return { dates, actual, predicted, upper, lower };
}

function makeTrendVariant(base, mode) {
  const src = {
    dates: base?.dates || [],
    actual: base?.actual || [],
    predicted: base?.predicted || [],
    upper: base?.upper || [],
    lower: base?.lower || [],
  };

  // In-situ: по-нисък и по-плавен профил (по-слаби скокове).
  if (mode === 'insitu') {
    const peakIdx = Math.max(2, Math.floor(src.dates.length * 0.55));
    const tweak = (arr = []) => arr.map((v, i) => {
      if (v === null || v === undefined) return v;
      const smoothWave = Math.sin(i * 0.5) * 0.02;
      const localDip = i >= 3 ? 0.08 : 0;
      const bigPeak = Math.max(0, 0.75 - Math.abs(i - peakIdx) * 0.28);
      return +(v * 0.78 - 0.42 - localDip + smoothWave + bigPeak).toFixed(2);
    });
    return {
      dates: src.dates,
      actual: tweak(src.actual),
      predicted: tweak(src.predicted),
      upper: tweak(src.upper),
      lower: tweak(src.lower),
    };
  }

  // Satellite: по-висок и по-динамичен профил с по-изразен локален пик.
  if (mode === 'sat') {
    const peakIdx = Math.max(2, Math.floor(src.dates.length * 0.55));
    const tweak = (arr = []) => arr.map((v, i) => {
      if (v === null || v === undefined) return v;
      const wave = Math.cos(i * 0.9) * 0.08;
      const peak = Math.max(0, 0.22 - Math.abs(i - peakIdx) * 0.08);
      return +(v * 1.08 + 0.2 + wave + peak).toFixed(2);
    });
    return {
      dates: src.dates,
      actual: tweak(src.actual),
      predicted: tweak(src.predicted),
      upper: tweak(src.upper),
      lower: tweak(src.lower),
    };
  }

  return src;
}

function mockMatrix({ date_from, date_to }) {
  const dates = dateLabels(date_from, date_to, 7);
  const stations = ['Своге', 'Панчарево', 'Равно поле', 'Железница', 'Нови Искър'];
  const r = seedFrom('matrix');
  return {
    stations,
    dates,
    values: stations.map(() => dates.map(() => +(1.6 + r() * 2).toFixed(2))),
  };
}

function wireRunButton() {
  document.getElementById('run-btn')?.addEventListener('click', runAnalysis);
}

function wireRunButton() {
  document.getElementById('run-btn')?.addEventListener('click', runAnalysis);
}

// ═════════════════════════════════════════════════════════════
//  STATS + DETECTIONS
// ═════════════════════════════════════════════════════════════
/*
  Expected shape from GET /api/stats:
  {
    "total_cells":    1234,
    "species_count":  24,
    "density":        12340,
    "avg_index":      2.35,
    "detections": [
      {
        "station":  "Панчарево",
        "species":  "Scenedesmus quadricauda",
        "time":     "21.05.2024 10:15",
        "score":    2.8,
        "icon":     "🔬"   // optional
      },
      …
    ]
  }
*/
function renderStats(data) {
  lastStats = data;
  animateCounter('stat-total',   data.total_cells   ?? 0);
  animateCounter('stat-species', data.species_count ?? 0);
  animateCounter('stat-density', data.density       ?? 0);
  animateFloat  ('stat-index',   data.avg_index     ?? 0, 2);
  renderDetections(data.detections ?? []);
}

function renderStatsError() {
  ['stat-total','stat-species','stat-density','stat-index'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'ERR';
  });
  renderDetections([]);
}

function renderDetections(list) {
  const det   = document.getElementById('det-list');
  const badge = document.getElementById('det-count-badge');
  if (!det) return;
  if (badge) badge.textContent = list.length;
  if (!list.length) {
    det.innerHTML = '<div class="det-empty">No detections returned</div>';
    return;
  }
  det.innerHTML = '';
  list.forEach(d => {
    const sc  = d.score < 2.5 ? 'good' : d.score < 3.0 ? 'ok' : d.score < 3.5 ? 'warn' : 'bad';
    const div = document.createElement('div');
    div.className = 'det-item';
    div.innerHTML = `
      <div class="det-thumb">${d.icon ?? '🔬'}</div>
      <div class="det-info">
        <div class="det-station">${d.station}</div>
        <div class="det-species">${d.species}</div>
      </div>
      <div class="det-score ${sc}">${d.score}</div>`;
    det.appendChild(div);
  });
}

// ═════════════════════════════════════════════════════════════
//  CHART 1 — Chlorophyll-a Heatmap (multi-line by parameter)
// ═════════════════════════════════════════════════════════════
/*
  Expected shape from GET /api/chlorophyll:
  {
    "labels": ["21 май","22 май","23 май", …],
    "datasets": [
      { "label": "Chl-a (μg/L)",  "data": [2.1, 2.4, 2.2, …] },
      { "label": "Turbidity NTU", "data": [4.0, 4.2, 3.9, …] }
    ]
  }
*/
// Renders the basin shape (polygon) of the selected water source on a
// satellite map and overlays station markers coloured by phytoplankton
// quality (the station's index value). No fake heat blobs.
let _chlMap = null;
let _chlBasinPoly = null;
let _chlMarkers = [];
let _chlPixelRects = [];
let _chlSelectedMarker = null;
let _chlLastBounds = null;

function qualityColor(idx) {
  // Lower index = healthier water. Same scale as the bar chart.
  if (idx < 2.0) return '#22c55e';
  if (idx < 2.5) return '#00ffc6';
  if (idx < 3.0) return '#f59e0b';
  if (idx < 3.5) return '#f97316';
  return '#ef4444';
}

// ── Phytoplankton concentration palette ──────────────────
// Blue (low) → Green → Yellow → Red (bloom). Standard chl-a remote-sensing scale.
function phytoColor(v) {
  const t = Math.max(0, Math.min(1, v));
  // 4-stop gradient: 0 #1e40af, 0.33 #22c55e, 0.66 #f59e0b, 1 #ef4444
  const stops = [
    [0.00, [30,  64, 175]],   // deep blue
    [0.33, [34,  197, 94]],   // green
    [0.66, [245, 158, 11]],   // yellow/amber
    [1.00, [239, 68,  68]],   // red bloom
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const k = (t - a[0]) / (b[0] - a[0] || 1);
  const r = Math.round(a[1][0] + (b[1][0] - a[1][0]) * k);
  const g = Math.round(a[1][1] + (b[1][1] - a[1][1]) * k);
  const bl= Math.round(a[1][2] + (b[1][2] - a[1][2]) * k);
  return `rgb(${r},${g},${bl})`;
}

// Mock phytoplankton density 0..1 — combines a soft bloom hotspot with noise
// so the map looks like a real chlorophyll-a field instead of TV static.
function mockPhyto(i, j, cols, rows) {
  // Hotspot near (0.65, 0.4) — feels like a bloom along one shore
  const hx = 0.65 * cols, hy = 0.4 * rows;
  const dx = (i - hx) / cols, dy = (j - hy) / rows;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const bloom = Math.exp(-(dist * dist) / 0.06); // 0..1
  const noise = Engine.mockUsability(i, j) * 0.35;
  return Math.max(0, Math.min(1, bloom * 0.85 + noise));
}

async function renderChlHeatmap(data, stationsData) {
  setChartStatus('chl-heatmap', 'loading');
  const host = document.getElementById('chl-heatmap-map');
  if (!host) return;

  const { datasets = [] } = data || {};
  const stations = (stationsData && stationsData.stations) || [];

  // Indicator label for the header
  const indicatorLabel = (datasets[0] && datasets[0].label) || 'Phytoplankton index';
  const indEl = document.getElementById('chl-heatmap-indicator');
  if (indEl) indEl.textContent = indicatorLabel;

  const params = getParams();
  const isReservoir = window.Engine?.isIskarReservoir?.(params.river);

  const qualityLegend = document.getElementById('chl-heatmap-legend');
  const usabilityLegend = document.getElementById('chl-usability-legend');
  const footer = document.getElementById('chl-heatmap-footer');

  // For non-reservoir basins we still need station data.
  if (!isReservoir && !stations.length) {
    showChartEmpty('chl-heatmap', true, 'No station data');
    setChartStatus('chl-heatmap', 'error', 'empty');
    return;
  }

  showChartEmpty('chl-heatmap', false);
  setChartStatus('chl-heatmap', 'ok');

  if (isReservoir) {
    // Pixel-usability mode: red→green, click cells to read coords
    if (qualityLegend) qualityLegend.innerHTML = '';
    if (usabilityLegend) usabilityLegend.hidden = false;
    const cellEl = document.getElementById('chl-selected-cell');
    if (cellEl && !cellEl.dataset.touched) {
      cellEl.textContent = 'Click a pixel to get coordinates for the boat.';
    }
  } else {
    // Quality-by-station mode: keep the original legend
    if (usabilityLegend) usabilityLegend.hidden = true;
    const cellEl = document.getElementById('chl-selected-cell');
    if (cellEl && !cellEl.dataset.touched) cellEl.textContent = 'Lat: — Lng: —';
    if (qualityLegend) {
      qualityLegend.innerHTML = `
        <span>Good</span>
        <div class="grad" style="background:linear-gradient(to right,#22c55e,#00ffc6,#f59e0b,#f97316,#ef4444)"></div>
        <span>Poor</span>`;
    }
  }

  try {
    await drawBasinHeatmap(host, params.river, stations, { isReservoir });
  } catch (e) {
    console.warn('Heatmap render failed:', e);
    setChartStatus('chl-heatmap', 'error', 'map');
  }
}

async function drawBasinHeatmap(host, riverName, stations, opts = {}) {
  if (!window.google || !google.maps) return;
  const { Map } = await google.maps.importLibrary('maps');
  const isReservoir = !!opts.isReservoir;

  // Init map once
  if (!_chlMap) {
    _chlMap = new Map(host, {
      center: { lat: 42.7, lng: 23.3 },
      zoom: 8,
      mapId: 'DEMO_MAP_ID',
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: 'greedy',
    });
    _chlMap.addListener('zoom_changed', () => {
      const el = document.getElementById('chl-zoom-level');
      if (el) el.textContent = `Zoom: ${_chlMap.getZoom()}`;
    });
  }

  // Always use real satellite imagery (hybrid shows place labels too)
  _chlMap.setOptions({ mapTypeId: 'hybrid', styles: [] });

  // Clear previous overlays
  if (_chlBasinPoly) {
    _chlBasinPoly.forEach(p => p.setMap(null));
    _chlBasinPoly = null;
  }
  _chlMarkers.forEach(m => m.setMap(null));
  _chlMarkers = [];
  _chlPixelRects.forEach(r => r.setMap(null));
  _chlPixelRects = [];
  if (_chlSelectedMarker) { _chlSelectedMarker.setMap(null); _chlSelectedMarker = null; }

  // Fetch basin/lake features
  const features = await Engine.getBasinFeatures(riverName);
  if (!features.length) return;

  // Compute bounds + collect polygon rings (lng,lat → {lat,lng})
  const bounds = new google.maps.LatLngBounds();
  const rings = [];
  features.forEach(f => {
    const g = f.geometry;
    if (!g) return;
    const polys = g.type === 'Polygon' ? [g.coordinates]
                : g.type === 'MultiPolygon' ? g.coordinates : [];
    polys.forEach(poly => {
      poly.forEach(ring => {
        const path = ring.map(([lng, lat]) => ({ lat, lng }));
        rings.push(path);
        path.forEach(p => bounds.extend(p));
      });
    });
  });

  if (bounds.isEmpty()) return;

  // Outline + soft fill of the basin/lake (the "form of the water source")
  _chlBasinPoly = rings.map(path => new google.maps.Polygon({
    paths: path,
    map: _chlMap,
    strokeColor: '#00ffc6',
    strokeOpacity: 0.95,
    strokeWeight: 1.6,
    fillColor: '#00ffc6',
    fillOpacity: isReservoir ? 0 : 0.08,
    clickable: false,
    zIndex: 10,
  }));

  // ── Reservoir mode: overlay the red→green pixel-usability grid ──
  if (isReservoir) {
    const feat = features[0];
    const b = Engine.geomBounds(feat.geometry);
    const cellsAcross = 28;
    const stepLng = (b.maxLng - b.minLng) / cellsAcross;
    const latScale = Math.cos(((b.minLat + b.maxLat) / 2) * Math.PI / 180);
    const stepLat = stepLng * latScale;
    const rows = Math.ceil((b.maxLat - b.minLat) / stepLat);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cellsAcross; i++) {
        const south = b.minLat + j * stepLat;
        const north = south + stepLat;
        const west  = b.minLng + i * stepLng;
        const east  = west + stepLng;
        const cLng  = (west + east) / 2;
        const cLat  = (south + north) / 2;
        if (!Engine.pointInMultiPolygon(cLng, cLat, feat.geometry)) continue;

        const value = Engine.mockUsability(i, j);
        const color = Engine.usabilityColor(value);
        const rect = new google.maps.Rectangle({
          map: _chlMap,
          bounds: { north, south, east, west },
          strokeWeight: 0,
          fillColor: color,
          fillOpacity: 0.55,
          clickable: true,
          zIndex: 5,
        });
        rect.addListener('click', () => {
          if (_chlSelectedMarker) _chlSelectedMarker.setMap(null);
          _chlSelectedMarker = new google.maps.Marker({
            map: _chlMap,
            position: { lat: cLat, lng: cLng },
            title: `Pixel (${i},${j}) — usability ${value.toFixed(2)}`,
          });
          const status = value < 0.4 ? 'UNUSED' : value < 0.7 ? 'PARTIAL' : 'USABLE';
          const el = document.getElementById('chl-selected-cell');
          if (el) {
            el.textContent = `Pixel ${status} · usability ${value.toFixed(2)} · ${cLat.toFixed(5)}, ${cLng.toFixed(5)}`;
            el.style.color = value < 0.4 ? '#ef4444' : value < 0.7 ? '#eac522' : '#22c55e';
            el.dataset.touched = '1';
          }
        });
        _chlPixelRects.push(rect);
      }
    }

    _chlLastBounds = bounds;
    _chlMap.fitBounds(bounds, 24);
    return;
  }

  // Build a flat list of polygon paths (Google LatLngLiteral arrays) so we
  // can both run point-in-polygon tests and fall back to placing markers
  // along the basin outline when a station's hardcoded coords don't fit.
  const polyPaths = rings; // each = [{lat,lng}, …]

  function pointInRing(pt, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng, yi = ring[i].lat;
      const xj = ring[j].lng, yj = ring[j].lat;
      const intersect = ((yi > pt.lat) !== (yj > pt.lat)) &&
        (pt.lng < ((xj - xi) * (pt.lat - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function pointInBasin(pt) {
    return polyPaths.some(ring => pointInRing(pt, ring));
  }

  // Pick the largest ring (by vertex count) as the source for fallback
  // positions. We sample evenly-spaced vertices around it so the markers
  // sit on the water-source outline rather than blurped randomly.
  const mainRing = polyPaths.reduce((a, b) => b.length > a.length ? b : a, polyPaths[0] || []);
  function fallbackPosition(i, total) {
    if (!mainRing.length) return null;
    const idx = Math.floor((i + 0.5) * mainRing.length / Math.max(1, total));
    return mainRing[Math.min(idx, mainRing.length - 1)];
  }

  // Station markers coloured by phytoplankton quality (index)
  stations.forEach((s, i) => {
    let pos = (typeof s.lat === 'number' && typeof s.lng === 'number')
      ? { lat: s.lat, lng: s.lng }
      : null;
    // Snap to basin if the hardcoded coord falls outside the selected source
    if (!pos || !pointInBasin(pos)) {
      pos = fallbackPosition(i, stations.length);
    }
    if (!pos) return;

    const color = qualityColor(s.index);
    const marker = new google.maps.Marker({
      position: pos,
      map: _chlMap,
      title: `${s.name} — index ${s.index} (${s.dominant_species || ''})`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: '#0b1120',
        strokeWeight: 2,
      },
      label: {
        text: String(s.index),
        color: '#0b1120',
        fontSize: '10px',
        fontWeight: '700',
      },
    });
    _chlMarkers.push(marker);
    bounds.extend(pos);
  });

  _chlLastBounds = bounds;
  _chlMap.fitBounds(bounds, 32);
}

// ═════════════════════════════════════════════════════════════
//  CHART 2 — Time Series per Station
// ═════════════════════════════════════════════════════════════
/*
  Expected shape from GET /api/timeseries:
  {
    "dates":    ["2024-05-21", "2024-05-22", …],
    "stations": [
      { "name": "Своге",      "values": [1.85, 1.9, …] },
      { "name": "Панчарево",  "values": [2.8,  2.9, …] },
      …
    ]
  }
*/
function renderTimeSeries(data) {
  setChartStatus('timeseries', 'loading');
  const canvas = document.getElementById('chart-timeseries');
  if (!canvas) return;

  const { dates = [], stations = [] } = data;

  if (!dates.length || !stations.length) {
    showChartEmpty('timeseries', true, 'No data returned');
    setChartStatus('timeseries', 'error', 'empty');
    return;
  }

  showChartEmpty('timeseries', false);
  setChartStatus('timeseries', 'ok');

  drawLineChart(canvas, 'timeseries', {
    labels: dates,
    datasets: stations.map((s, i) => ({
      label:  s.name,
      values: s.values,
      color:  PALETTE[i % PALETTE.length],
    })),
    yLabel: 'Index',
  });
}

// ═════════════════════════════════════════════════════════════
//  CHART 3 — Station Comparison Bar Chart
// ═════════════════════════════════════════════════════════════
/*
  Expected shape from GET /api/stations:
  {
    "stations": [
      { "name": "Своге",       "index": 1.85, "cells": 210, "dominant_species": "Pediastrum duplex" },
      { "name": "Равно поле",  "index": 2.10, "cells": 310, "dominant_species": "Cyclotella" },
      …
    ]
  }
*/
function renderBarChart(data) {
  setChartStatus('bar', 'loading');
  const canvas = document.getElementById('chart-bar');
  if (!canvas) return;

  const { stations = [] } = data;

  if (!stations.length) {
    showChartEmpty('bar', true, 'No data returned');
    setChartStatus('bar', 'error', 'empty');
    return;
  }

  showChartEmpty('bar', false);
  setChartStatus('bar', 'ok');

  drawBarChart(canvas, 'bar', {
    labels: stations.map(s => s.name),
    values: stations.map(s => s.index),
    // colour each bar by index severity
    colors: stations.map(s =>
      s.index < 2.0 ? '#22c55e'
    : s.index < 2.5 ? '#00ffc6'
    : s.index < 3.0 ? '#f59e0b'
    : s.index < 3.5 ? '#f97316'
    : '#ef4444'
    ),
  });
}

// ═════════════════════════════════════════════════════════════
//  CHART 4 — Trend + Forecast
// ═════════════════════════════════════════════════════════════
/*
  Expected shape from GET /api/trend:
  {
    "dates":     ["2024-05-21", …, "2024-05-28", "2024-05-29", "2024-05-30"],
    "actual":    [2.1, 2.3, 2.2, 2.4, 2.5, 2.6, 2.5, 2.7, null, null],
    "predicted": [2.1, 2.3, 2.2, 2.4, 2.5, 2.6, 2.5, 2.7, 2.85, 3.0],
    "upper":     [null,null,null,null,null,null,null, 2.9, 3.05, 3.2],
    "lower":     [null,null,null,null,null,null,null, 2.55,2.65, 2.8]
  }
  — null values are skipped when drawing
*/
function renderTrend(data, chartId = 'trend') {
  setChartStatus(chartId, 'loading');
  const canvas = document.getElementById(`chart-${chartId}`);
  if (!canvas) return;

  const { dates = [], actual = [], predicted = [] } = data;

  if (!dates.length) {
    showChartEmpty(chartId, true, 'No data returned');
    setChartStatus(chartId, 'error', 'empty');
    return;
  }

  showChartEmpty(chartId, false);
  setChartStatus(chartId, 'ok');

  drawTrendChart(canvas, chartId, data);
}

// ═════════════════════════════════════════════════════════════
//  CHART 5 — Heatmap Table (stations × dates)
// ═════════════════════════════════════════════════════════════
/*
  Expected shape from GET /api/matrix:
  {
    "stations": ["Своге", "Равно поле", "Железница", …],
    "dates":    ["21.05","22.05","23.05", …],
    "values":   [
      [1.85, 1.9, 1.8, …],   ← Своге
      [2.1,  2.2, 2.0, …],   ← Равно поле
      …
    ]
  }
*/
function renderMatrix(data) {
  setChartStatus('matrix', 'loading');
  const wrap = document.getElementById('chart-matrix');
  if (!wrap) return;

  const { stations = [], dates = [], values = [] } = data;

  if (!stations.length || !dates.length) {
    showChartEmpty('matrix', true, 'No data returned');
    setChartStatus('matrix', 'error', 'empty');
    return;
  }

  showChartEmpty('matrix', false);
  setChartStatus('matrix', 'ok');

  // Build HTML table
  const cellClass = v =>
    v === null || v === undefined ? '' :
    v < 2.0 ? 'cell-1' :
    v < 2.5 ? 'cell-2' :
    v < 3.0 ? 'cell-3' :
    v < 3.5 ? 'cell-4' : 'cell-5';

  const headerCells = dates.map(d => `<th>${d}</th>`).join('');
  const bodyRows = stations.map((st, i) => {
    const row = (values[i] || []);
    const cells = dates.map((_, j) => {
      const v = row[j];
      const cls = cellClass(v);
      return `<td class="${cls}">${v != null ? Number(v).toFixed(2) : '—'}</td>`;
    }).join('');
    return `<tr><td>${st}</td>${cells}</tr>`;
  }).join('');

  wrap.innerHTML = `
    <table class="matrix-table">
      <thead><tr><th>Station</th>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
}

// ═════════════════════════════════════════════════════════════
//  DRAWING PRIMITIVES (pure canvas 2D, no external lib)
// ═════════════════════════════════════════════════════════════

// Shared grid + axis helpers
function fitCanvas(canvas) {
  canvas.width  = canvas.offsetWidth  || canvas.parentElement?.offsetWidth  || 300;
  canvas.height = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 140;
}

function drawGrid(ctx, W, H, pad, minV, maxV, steps = 4) {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= steps; i++) {
    const y = pad.t + (H - pad.t - pad.b) * (i / steps);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    const val = maxV - (maxV - minV) * (i / steps);
    ctx.fillStyle = '#3d5070';
    ctx.font = '8px Space Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), pad.l - 4, y + 3);
  }
}

function drawXLabels(ctx, labels, W, H, pad) {
  const gW = W - pad.l - pad.r;
  ctx.fillStyle = '#3d5070';
  ctx.font = '8px Space Mono, monospace';
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    const x = pad.l + (i / Math.max(labels.length - 1, 1)) * gW;
    // skip every other label if too many
    if (labels.length > 10 && i % 2 !== 0) return;
    ctx.fillText(String(lbl).slice(0, 8), x, H - 4);
  });
}

// Line chart (multi-series)
function drawLineChart(canvas, key, { labels, datasets, yLabel }) {
  fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { l: 36, r: 10, t: 10, b: 22 };
  const gW = W - pad.l - pad.r;
  const gH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  // Find range
  const allVals = datasets.flatMap(d => d.values).filter(v => v != null);
  if (!allVals.length) return;
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.1;
  const range = maxV - minV || 1;

  const toY = v => pad.t + gH - ((v - minV) / range) * gH;
  const toX = i => pad.l + (i / Math.max(labels.length - 1, 1)) * gW;

  drawGrid(ctx, W, H, pad, minV, maxV);
  drawXLabels(ctx, labels, W, H, pad);

  datasets.forEach(({ values, color }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 5;
    ctx.beginPath();
    let started = false;
    values.forEach((v, i) => {
      if (v == null) { started = false; return; }
      const x = toX(i), y = toY(v);
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // dots
    values.forEach((v, i) => {
      if (v == null) return;
      ctx.beginPath();
      ctx.arc(toX(i), toY(v), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
    });
  });

  // Legend (top-right, compact)
  if (datasets.length > 1) {
    let lx = W - 8, ly = pad.t + 2;
    [...datasets].reverse().forEach(({ label, color }) => {
      ctx.fillStyle = color;
      ctx.font = '8px Syne, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label ?? '', lx, ly + 7);
      lx -= (ctx.measureText(label ?? '').width + 12);
    });
  }

  Charts[key] = ctx;
}

// Bar chart
function drawBarChart(canvas, key, { labels, values, colors }) {
  fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { l: 38, r: 8, t: 10, b: 30 };
  const gW = W - pad.l - pad.r;
  const gH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  const maxV = Math.max(...values) * 1.15 || 5;
  const minV = 0;

  drawGrid(ctx, W, H, pad, minV, maxV);

  const n    = labels.length;
  const barW = (gW / n) * 0.6;
  const gap  = (gW / n) * 0.4;

  labels.forEach((lbl, i) => {
    const v   = values[i] ?? 0;
    const x   = pad.l + i * (gW / n) + gap / 2;
    const bH  = (v / maxV) * gH;
    const y   = pad.t + gH - bH;
    const col = colors?.[i] ?? PALETTE[i % PALETTE.length];

    // bar body
    ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 6;
    ctx.fillRect(x, y, barW, bH);
    ctx.shadowBlur = 0;

    // value label
    ctx.fillStyle = col;
    ctx.font = 'bold 9px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(v.toFixed(2), x + barW / 2, y - 3);

    // x label
    ctx.fillStyle = '#3d5070';
    ctx.font = '8px Space Mono, monospace';
    const short = String(lbl).length > 8 ? String(lbl).slice(0, 7) + '…' : String(lbl);
    ctx.fillText(short, x + barW / 2, H - 4);
  });

  Charts[key] = ctx;
}

// Trend + confidence band
function drawTrendChart(canvas, key, { dates, actual, predicted, upper, lower }) {
  fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { l: 36, r: 10, t: 10, b: 22 };
  const gW = W - pad.l - pad.r;
  const gH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);

  const allVals = [...(actual||[]), ...(predicted||[]), ...(upper||[]), ...(lower||[])].filter(v => v != null);
  if (!allVals.length) return;
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.1;
  const range = maxV - minV || 1;

  const toY = v => v == null ? null : pad.t + gH - ((v - minV) / range) * gH;
  const toX = i => pad.l + (i / Math.max(dates.length - 1, 1)) * gW;

  drawGrid(ctx, W, H, pad, minV, maxV);
  drawXLabels(ctx, dates, W, H, pad);

  // Confidence band
  if (upper?.length && lower?.length) {
    ctx.beginPath();
    let first = true;
    upper.forEach((v, i) => {
      if (v == null) return;
      first ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v));
      first = false;
    });
    for (let i = lower.length - 1; i >= 0; i--) {
      const v = lower[i];
      if (v == null) continue;
      ctx.lineTo(toX(i), toY(v));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(59,130,246,0.12)';
    ctx.fill();
  }

  // Predicted (dashed)
  if (predicted?.length) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 4;
    ctx.beginPath();
    let started = false;
    predicted.forEach((v, i) => {
      if (v == null) { started = false; return; }
      const x = toX(i), y = toY(v);
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  // Actual (solid)
  if (actual?.length) {
    ctx.strokeStyle = '#00ffc6';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffc6'; ctx.shadowBlur = 5;
    ctx.beginPath();
    let started = false;
    actual.forEach((v, i) => {
      if (v == null) { started = false; return; }
      const x = toX(i), y = toY(v);
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // dots
    actual.forEach((v, i) => {
      if (v == null) return;
      ctx.beginPath(); ctx.arc(toX(i), toY(v), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffc6'; ctx.fill();
    });
  }

  // Legend
  const items = [['#00ffc6','Actual'], ['#3b82f6','Forecast']];
  let lx = W - 8;
  items.reverse().forEach(([col, lbl]) => {
    ctx.fillStyle = col; ctx.font = '8px Syne, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(lbl, lx, pad.t + 8);
    lx -= ctx.measureText(lbl).width + 14;
  });

  Charts[key] = ctx;
}

// ═════════════════════════════════════════════════════════════
//  ANIMATED COUNTERS
// ═════════════════════════════════════════════════════════════
function animateCounter(id, to, dur = 700) {
  const el = document.getElementById(id);
  if (!el) return;
  let t0 = null;
  (function step(ts) {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / dur, 1);
    el.textContent = Math.round(to * p).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

function animateFloat(id, to, decimals = 2, dur = 700) {
  const el = document.getElementById(id);
  if (!el) return;
  let t0 = null;
  (function step(ts) {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / dur, 1);
    el.textContent = (to * p).toFixed(decimals);
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

// ═════════════════════════════════════════════════════════════
//  EXPORT
// ═════════════════════════════════════════════════════════════
function initExportButtons() {
  document.getElementById('export-json')?.addEventListener('click', () => {
    if (!lastStats) { showToast('No data to export yet'); return; }
    dl(new Blob([JSON.stringify(lastStats, null, 2)], { type:'application/json' }), 'nerosense.json');
    showToast('Exported as JSON');
  });
  document.getElementById('export-csv')?.addEventListener('click', () => {
    const rows = lastStats?.detections;
    if (!rows?.length) { showToast('No detections to export'); return; }
    const csv = ['Station,Species,Time,Score', ...rows.map(d => `${d.station},${d.species},${d.time},${d.score}`)].join('\n');
    dl(new Blob([csv], { type:'text/csv' }), 'nerosense.csv');
    showToast('Exported as CSV');
  });
  document.getElementById('export-report')?.addEventListener('click', () => showToast('Report export coming soon'));
}

function dl(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

// ═════════════════════════════════════════════════════════════
//  TOAST
// ═════════════════════════════════════════════════════════════
function showToast(msg, ms = 3200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

// ═════════════════════════════════════════════════════════════
//  RESIZE — redraw charts on window resize
// ═════════════════════════════════════════════════════════════
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(runAnalysis, 400);
});
