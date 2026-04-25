// geoscript.js — Engine powered by Google Maps JavaScript API

window.Engine = (function () {
  let map = null;
  let currentLayer = null; // google.maps.Data layer
  let bigCache = null;
  let abortController = null;

  // ── Init ────────────────────────────────────────────────
  async function init(containerId = 'map', opts = { center: [42.6977, 23.3219], zoom: 7 }) {
    if (map) return map;

    // Load the Maps library
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById(containerId), {
      center:    { lat: opts.center[0], lng: opts.center[1] },
      zoom:      opts.zoom,
      mapId:     'DEMO_MAP_ID', // or your Cloud Map ID for custom styling
      mapTypeId: 'satellite',   // satellite view fits the remote-sensing theme

      // Clean up default controls to match your dark dashboard
      disableDefaultUI:    true,
      zoomControl:         false, // you handle zoom via your own buttons
      scaleControl:        false,
      streetViewControl:   false,
      rotateControl:       false,
      fullscreenControl:   false,
    });

    // Apply a dark style (works without a Map ID / Cloud Console)
    map.setOptions({ styles: DARK_STYLE });

    return map;
  }

  // ── Helpers ─────────────────────────────────────────────
  async function fetchJson(url, signal) {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
    return res.json();
  }

  function clearCurrentLayer() {
    if (!currentLayer || !map) return;
    // google.maps.Data: remove all features
    currentLayer.setMap(null);
    currentLayer = null;
  }

  function fitBoundsToLayer(layer) {
    const bounds = new google.maps.LatLngBounds();
    layer.forEach(feature => {
      feature.getGeometry()?.forEachLatLng(latlng => bounds.extend(latlng));
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds);
  }

  function styleLayer(layer, color = '#00ffc6', weight = 2) {
    layer.setStyle({
      strokeColor:   color,
      strokeWeight:  weight,
      strokeOpacity: 0.9,
      fillColor:     color,
      fillOpacity:   0.15,
    });
  }

  // ── Pixel-grid overlay (usability 0..1, red→green) ──────
  let gridRectangles = [];        // google.maps.Rectangle[]
  let selectedCellMarker = null;  // google.maps.Marker for highlighted cell

  function clearPixelGrid() {
    gridRectangles.forEach(r => r.setMap(null));
    gridRectangles = [];
    if (selectedCellMarker) { selectedCellMarker.setMap(null); selectedCellMarker = null; }
  }

  // Red (0) → Yellow (0.5) → Green (1)
  function usabilityColor(v) {
    const t = Math.max(0, Math.min(1, v));
    let r, g, b;
    if (t < 0.5) {
      // red → yellow
      const k = t / 0.5;
      r = 239; g = Math.round(68 + (197 - 68) * k); b = Math.round(68 + (34 - 68) * k);
    } else {
      // yellow → green
      const k = (t - 0.5) / 0.5;
      r = Math.round(234 - (234 - 34) * k);
      g = Math.round(197 - (197 - 197) * k);
      b = Math.round(34 + (94 - 34) * k);
    }
    return `rgb(${r},${g},${b})`;
  }

  // Ray-casting point-in-polygon (lng/lat space). polygon = array of [lng,lat]
  function pointInRing(lng, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function pointInMultiPolygon(lng, lat, geom) {
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    for (const poly of polys) {
      if (!pointInRing(lng, lat, poly[0])) continue;
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (pointInRing(lng, lat, poly[h])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
    return false;
  }
  function geomBounds(geom) {
    let minLng =  Infinity, minLat =  Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    for (const poly of polys) for (const ring of poly) for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
    return { minLng, minLat, maxLng, maxLat };
  }

  // Deterministic pseudo-random 0..1 from cell index (mock satellite pixel value)
  function mockUsability(i, j) {
    const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  // Phytoplankton concentration palette: blue → green → yellow → red
  function phytoColor(v) {
    const t = Math.max(0, Math.min(1, v));
    const stops = [
      [0.00, [30,  64, 175]],
      [0.33, [34,  197, 94]],
      [0.66, [245, 158, 11]],
      [1.00, [239, 68,  68]],
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

  // Mock phytoplankton density 0..1 — bloom hotspot + noise
  function mockPhyto(i, j, cols, rows) {
    const hx = 0.65 * cols, hy = 0.4 * rows;
    const dx = (i - hx) / cols, dy = (j - hy) / rows;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const bloom = Math.exp(-(dist * dist) / 0.06);
    const noise = mockUsability(i, j) * 0.35;
    return Math.max(0, Math.min(1, bloom * 0.85 + noise));
  }

  // Build a phytoplankton-concentration grid clipped to the lake polygon.
  function buildPhytoGridForFeature(feature, cellsAcross = 28) {
    clearPixelGrid();
    if (!feature?.geometry) return;
    const b = geomBounds(feature.geometry);
    const stepLng = (b.maxLng - b.minLng) / cellsAcross;
    const latScale = Math.cos(((b.minLat + b.maxLat) / 2) * Math.PI / 180);
    const stepLat = stepLng * latScale;
    const cols = cellsAcross;
    const rows = Math.ceil((b.maxLat - b.minLat) / stepLat);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const south = b.minLat + j * stepLat;
        const north = south + stepLat;
        const west  = b.minLng + i * stepLng;
        const east  = west + stepLng;
        const cLng  = (west + east) / 2;
        const cLat  = (south + north) / 2;
        if (!pointInMultiPolygon(cLng, cLat, feature.geometry)) continue;

        const value = mockPhyto(i, j, cols, rows);
        const color = phytoColor(value);
        const rect = new google.maps.Rectangle({
          map,
          bounds: { north, south, east, west },
          strokeWeight: 0,
          fillColor: color,
          fillOpacity: 0.7,
          clickable: true,
          zIndex: 5,
        });
        rect.__cell = { i, j, lat: cLat, lng: cLng, value };
        rect.addListener('click', () => {
          if (selectedCellMarker) selectedCellMarker.setMap(null);
          selectedCellMarker = new google.maps.Marker({
            map,
            position: { lat: cLat, lng: cLng },
            title: `Phytoplankton ${value.toFixed(2)}`,
          });
          window.dispatchEvent(new CustomEvent('nero:phyto-cell-selected', {
            detail: { i, j, lat: cLat, lng: cLng, value },
          }));
        });
        gridRectangles.push(rect);
      }
    }
  }

  // Build a grid of rectangles clipped to the lake polygon.
  // cellsAcross controls resolution (default ~28 cells horizontally).
  function buildPixelGridForFeature(feature, cellsAcross = 28) {
    clearPixelGrid();
    if (!feature?.geometry) return;
    const b = geomBounds(feature.geometry);
    const stepLng = (b.maxLng - b.minLng) / cellsAcross;
    // keep cells visually square-ish (lat/lng aren't equal at this latitude)
    const latScale = Math.cos(((b.minLat + b.maxLat) / 2) * Math.PI / 180);
    const stepLat = stepLng * latScale;

    const cols = cellsAcross;
    const rows = Math.ceil((b.maxLat - b.minLat) / stepLat);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const south = b.minLat + j * stepLat;
        const north = south + stepLat;
        const west  = b.minLng + i * stepLng;
        const east  = west + stepLng;
        const cLng  = (west + east) / 2;
        const cLat  = (south + north) / 2;
        if (!pointInMultiPolygon(cLng, cLat, feature.geometry)) continue;

        const value = mockUsability(i, j);
        const color = usabilityColor(value);
        const rect = new google.maps.Rectangle({
          map,
          bounds: { north, south, east, west },
          strokeWeight: 0,
          fillColor: color,
          fillOpacity: 0.78,
          clickable: true,
          zIndex: 5,
        });
        rect.__cell = { i, j, lat: cLat, lng: cLng, value };

        rect.addListener('click', () => {
          // highlight
          if (selectedCellMarker) selectedCellMarker.setMap(null);
          selectedCellMarker = new google.maps.Marker({
            map,
            position: { lat: cLat, lng: cLng },
            title: `Pixel (${i},${j}) — usability ${value.toFixed(2)}`,
          });
          window.dispatchEvent(new CustomEvent('nero:cell-selected', {
            detail: { i, j, lat: cLat, lng: cLng, value },
          }));
        });

        gridRectangles.push(rect);
      }
    }
  }

  // ── Iskar Reservoir (Язовир Искър) ───────────────────────
  // Precise outline loaded from IskarReservoir.geojson (converted from
  // EPSG:32635 to WGS84). Cached after first fetch.
  let iskarReservoirFeature = null;
  async function getIskarReservoirFeature() {
    if (iskarReservoirFeature) return iskarReservoirFeature;
    const fc = await fetchJson('IskarReservoir.geojson');
    iskarReservoirFeature = fc.features?.[0] ?? null;
    return iskarReservoirFeature;
  }
  function isIskarReservoir(name) {
    const n = normalizeName(name);
    return n === 'iskar' || n === 'iskar reservoir' || n === 'yazovir iskar' || n === 'yazovir iskar reservoir';
  }

  // ── loadRiver ────────────────────────────────────────────
  // Loads a basin polygon from LargeRiverBasins.geojson by id (e.g. "iskar")
  // matched case-insensitively against Name_en / Name_bg.
  async function loadRiver(riverName) {
    if (!map) throw new Error('Map not initialized');
    if (!riverName || riverName === 'custom') return;

    if (abortController) abortController.abort();
    abortController = new AbortController();

    clearCurrentLayer();
    clearPixelGrid();
    currentLayer = new google.maps.Data({ map });

    try {
      // Special case: show only the Iskar Reservoir lake shape (no basemap)
      if (isIskarReservoir(riverName)) {
        map.setOptions({ styles: RESERVOIR_ONLY_STYLE });
        const feat = await getIskarReservoirFeature();
        if (feat) {
          currentLayer.addGeoJson({ type: 'FeatureCollection', features: [feat] });
          // Lake outline + soft fill — phytoplankton grid is drawn on top.
          currentLayer.setStyle({
            strokeColor:   '#00ffc6',
            strokeWeight:  1.5,
            strokeOpacity: 0.95,
            fillColor:     '#00ffc6',
            fillOpacity:   0.05,
            clickable:     false,
            zIndex:        10,
          });
          fitBoundsToLayer(currentLayer);
          // Overlay phytoplankton concentration heatmap (blue→red)
          buildPhytoGridForFeature(feat, 28);
        }
        return;
      }

      // Other rivers: restore the dark basemap
      map.setOptions({ styles: DARK_STYLE });

      if (!bigCache) bigCache = await fetchJson('LargeRiverBasins.geojson', abortController.signal);

      let features = bigCache.features || [];

      if (riverName !== 'all' && riverName !== 'bulgaria') {
        const target = normalizeName(riverName);
        features = features.filter(f => {
          const en = f.properties?.Name_en;
          const bg = f.properties?.Name_bg;
          if (en && normalizeName(en) === target) return true;
          if (bg && normalizeName(bg) === target) return true;
          if (en && normalizeName(en).includes(target)) return true;
          if (bg && normalizeName(bg).includes(target)) return true;
          return false;
        });
        if (!features.length) {
          console.warn(`Engine.loadRiver: no basin match for "${riverName}"`);
          return; // do not render anything if the basin is unknown
        }
      }

      currentLayer.addGeoJson({ type: 'FeatureCollection', features });
      styleLayer(currentLayer, '#00ffc6', 1.5);
      fitBoundsToLayer(currentLayer);

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Engine.loadRiver error:', err);
      throw err;
    }
  }

  async function loadRiverByName(name) { return loadRiver(name); }

  // Returns the matching GeoJSON feature(s) for a basin name (or all).
  async function getBasinFeatures(riverName) {
    if (isIskarReservoir(riverName)) {
      const feat = await getIskarReservoirFeature();
      return feat ? [feat] : [];
    }
    if (!bigCache) bigCache = await fetchJson('LargeRiverBasins.geojson');
    const features = bigCache.features || [];
    if (!riverName || riverName === 'all' || riverName === 'bulgaria') return features;
    const target = normalizeName(riverName);
    const matched = features.filter(f => {
      const en = f.properties?.Name_en;
      const bg = f.properties?.Name_bg;
      if (en && normalizeName(en) === target) return true;
      if (bg && normalizeName(bg) === target) return true;
      if (en && normalizeName(en).includes(target)) return true;
      if (bg && normalizeName(bg).includes(target)) return true;
      return false;
    });
    return matched; // empty array if nothing matched (callers must handle)
  }

  // ── getRiverNames ────────────────────────────────────────
  async function getRiverNames() {
    if (!bigCache) bigCache = await fetchJson('LargeRiverBasins.geojson');

    const seen = new Set();
    const results = [];

    (bigCache.features || []).forEach(f => {
      const en = f.properties?.Name_en?.trim();
      const bg = f.properties?.Name_bg?.trim();
      if (!en) return;
      const display = en
        .toLowerCase()
        .replace(/(^|\s|-)([a-z])/g, (_, p, c) => p + c.toUpperCase());
      if (seen.has(display)) return;
      seen.add(display);
      results.push({ name: en, display });
    });

    results.sort((a, b) => a.display.localeCompare(b.display));
    return results;
  }

  // ── Zoom helpers (called by your map control buttons) ────
  function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
  function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }
  function resetView() {
    if (map) { map.setCenter({ lat: 42.6977, lng: 23.3219 }); map.setZoom(7); }
  }

  // ── Text helpers ─────────────────────────────────────────
  function containsCyrillic(s) {
    return /\p{Script=Cyrillic}/u.test(s);
  }

  function transliterateReadable(str) {
    if (!str) return str;
    const m = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'','ю':'yu','я':'ya' };
    const u = {};
    Object.keys(m).forEach(k => { u[k.toUpperCase()] = m[k] ? m[k][0].toUpperCase() + m[k].slice(1) : ''; });
    return String(str).split('').map(ch => m[ch] ?? u[ch] ?? ch).join('').replace(/\s+/g, ' ').trim();
  }

  function normalizeName(str) {
    if (!str) return '';
    let s = String(str).normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const m = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'','ю':'yu','я':'ya','А':'a','Б':'b','В':'v','Г':'g','Д':'d','Е':'e','Ж':'zh','З':'z','И':'i','Й':'y','К':'k','Л':'l','М':'m','Н':'n','О':'o','П':'p','Р':'r','С':'s','Т':'t','У':'u','Ф':'f','Х':'h','Ц':'ts','Ч':'ch','Ш':'sh','Щ':'sht','Ъ':'a','Ь':'','Ю':'yu','Я':'ya' };
    s = s.split('').map(ch => m[ch] !== undefined ? m[ch] : ch).join('');
    return s.replace(/[^0-9a-zA-Z\s]/g, ' ').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ── Iskar reservoir-only style: hide everything except water shape ──
  const RESERVOIR_ONLY_STYLE = [
    { elementType: 'geometry',          stylers: [{ color: '#000000' }] },
    { elementType: 'labels',            stylers: [{ visibility: 'off' }] },
    { featureType: 'water',             stylers: [{ visibility: 'off' }] },
    { featureType: 'road',              stylers: [{ visibility: 'off' }] },
    { featureType: 'poi',               stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',           stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative',    stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape',         stylers: [{ color: '#000000' }] },
  ];

  // ── Dark map style ───────────────────────────────────────
  const DARK_STYLE = [
    { elementType: 'geometry',           stylers: [{ color: '#0b1120' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#3d5070' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
    { featureType: 'water', elementType: 'geometry',         stylers: [{ color: '#0d1a2e' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d5070' }] },
    { featureType: 'road',  elementType: 'geometry',         stylers: [{ color: '#111827' }] },
    { featureType: 'road',  elementType: 'geometry.stroke',  stylers: [{ color: '#0d1526' }] },
    { featureType: 'road.highway', elementType: 'geometry',  stylers: [{ color: '#1a2a40' }] },
    { featureType: 'poi',   stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a2d4a' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#00ffc6' }] },
  ];

  return {
    init, loadRiver, loadRiverByName, getRiverNames, getBasinFeatures,
    getIskarReservoirFeature, isIskarReservoir,
    usabilityColor, mockUsability, pointInMultiPolygon, geomBounds,
    RESERVOIR_ONLY_STYLE,
    normalizeName, _getMap: () => map,
    zoomIn, zoomOut, resetView,
  };
})();