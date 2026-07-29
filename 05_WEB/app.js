const map = L.map('map', { preferCanvas: true }).setView([50.21, 8.82], 13);

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap',
}).addTo(map);

const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 20,
  attribution: 'Tiles &copy; Esri',
});

L.control.layers({ 'OpenStreetMap': osm, 'Satellit': esri }, {}, { collapsed: false }).addTo(map);

if (window.proj4) {
  proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs +type=crs');
}

const layerDefs = [
  { id: 'buffer', label: 'Buffer Leitung 800m', file: 'buffer_leitung_800m.geojson', color: '#8d99ae', type: 'polygon', checked: true },
  { id: 'leitung', label: 'Leitung', file: 'leitung.geojson', color: '#111827', type: 'line', checked: true, weight: 4 },
  { id: 'masten', label: 'Masten', file: 'masten.geojson', color: '#003f88', type: 'point', checked: true },
  { id: 'arbeitsflaechen', label: 'Arbeitsflächen', file: 'arbeitsflaechen.geojson', color: '#f6a21a', type: 'polygon', checked: true },
  { id: 'gerueste', label: 'Gerüste', file: 'gerueste.geojson', color: '#8b5cf6', type: 'polygon', checked: true },
  { id: 'netz', label: 'Netz', file: 'netz.geojson', color: '#14b8a6', type: 'line', checked: true },
  { id: 'sperrungen', label: 'Sperrungen', file: 'sperrungen.geojson', color: '#dc2626', type: 'polygon', checked: true },
  { id: 'zuwegung_vorhanden', label: 'Zuwegung vorhanden', file: 'zuwegung_vorhanden.geojson', color: '#2f9e44', type: 'line', checked: true, weight: 4 },
  { id: 'zuwegung_temporaer', label: 'Zuwegung temporär', file: 'zuwegung_temporaer.geojson', color: '#1c7ed6', type: 'line', checked: true, weight: 4 },
  { id: 'beschilderung', label: 'Beschilderung', file: 'beschilderung.geojson', color: '#e11d48', type: 'point', checked: true },
  { id: 'leitung_kmz', label: 'Leitung KMZ', file: 'leitung_kmz.geojson', color: '#64748b', type: 'line', checked: false, weight: 2 },
  { id: 'masten_kmz', label: 'Masten KMZ', file: 'masten_kmz.geojson', color: '#475569', type: 'point', checked: false },
];

const layers = new Map();
const mastIndex = new Map();
const allBounds = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function featureName(props = {}) {
  return props.Name || props.name || props.id || props.mast_nr || props['Beschilderung Mast'] || props.fid || '-';
}

function popupHtml(title, props = {}) {
  const rows = Object.entries(props)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 28)
    .map(([key, value]) => `<div class="popup-row"><span>${escapeHtml(key)}</span><div>${escapeHtml(value)}</div></div>`)
    .join('');
  return `<div class="popup-title">${escapeHtml(title)}</div>${rows || '<div>Keine Attribute</div>'}`;
}

function styleFor(def) {
  if (def.type === 'polygon') {
    return { color: def.color, weight: 1.5, opacity: 0.9, fillColor: def.color, fillOpacity: def.id === 'buffer' ? 0.08 : 0.32 };
  }
  return { color: def.color, weight: def.weight || 3, opacity: 0.95 };
}

function pointLayer(def, feature, latlng) {
  const props = feature.properties || {};
  if (def.id.includes('mast')) {
    return L.circleMarker(latlng, {
      radius: 5,
      color: '#ffffff',
      weight: 1.5,
      fillColor: def.color,
      fillOpacity: 1,
    });
  }
  return L.circleMarker(latlng, {
    radius: 6,
    color: '#ffffff',
    weight: 1.5,
    fillColor: def.color,
    fillOpacity: 0.95,
  });
}

async function loadLayer(def) {
  if (layers.has(def.id)) return layers.get(def.id);
  const response = await fetch(`data/${def.file}`);
  if (!response.ok) throw new Error(`${def.file}: HTTP ${response.status}`);
  const data = await response.json();
  const layer = L.geoJSON(data, {
    style: () => styleFor(def),
    pointToLayer: (feature, latlng) => pointLayer(def, feature, latlng),
    onEachFeature: (feature, lyr) => {
      const props = feature.properties || {};
      lyr.bindPopup(() => popupHtml(def.label, props));
      const name = featureName(props);
      if (def.id.includes('mast')) {
        lyr.bindTooltip(String(name), { permanent: true, direction: 'top', className: 'mast-label', opacity: 0.95 });
        mastIndex.set(String(name).toLowerCase(), lyr);
      } else {
        lyr.bindTooltip(`${def.label}: ${name}`, { sticky: true });
      }
    },
  });
  layers.set(def.id, layer);
  const count = data.features?.length || 0;
  const countEl = document.querySelector(`[data-count="${def.id}"]`);
  if (countEl) countEl.textContent = count;
  if (count > 0) allBounds.push(layer.getBounds());
  return layer;
}

function buildLayerList() {
  const list = document.getElementById('layer-list');
  list.innerHTML = '';
  for (const def of layerDefs) {
    const label = document.createElement('label');
    label.className = 'layer-item';
    label.innerHTML = `
      <input type="checkbox" ${def.checked ? 'checked' : ''} data-layer="${def.id}">
      <span class="swatch" style="color:${def.color}"></span>
      <span>${escapeHtml(def.label)}</span>
      <span class="count" data-count="${def.id}">-</span>
    `;
    list.appendChild(label);
  }
}

async function initializeLayers() {
  for (const def of layerDefs) {
    const layer = await loadLayer(def);
    if (def.checked && layer.getLayers().length) layer.addTo(map);
  }
  const validBounds = allBounds.filter(bounds => bounds.isValid());
  if (validBounds.length) {
    const bounds = validBounds.reduce((acc, bounds) => acc.extend(bounds), validBounds[0]);
    map.fitBounds(bounds.pad(0.12));
  }
  fillMastOptions();
}

function fillMastOptions() {
  const options = document.getElementById('mast-options');
  [...mastIndex.keys()]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(name => {
      const option = document.createElement('option');
      option.value = name.toUpperCase();
      options.appendChild(option);
    });
}

document.getElementById('layer-list').addEventListener('change', async event => {
  const checkbox = event.target.closest('input[data-layer]');
  if (!checkbox) return;
  const def = layerDefs.find(item => item.id === checkbox.dataset.layer);
  const layer = await loadLayer(def);
  if (checkbox.checked) {
    layer.addTo(map);
  } else {
    map.removeLayer(layer);
  }
});

document.getElementById('goto-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('goto-mast');
  const status = document.getElementById('goto-status');
  const key = input.value.trim().toLowerCase();
  const layer = mastIndex.get(key) || mastIndex.get(key.padStart(3, '0'));
  if (!layer) {
    status.textContent = 'Mast nicht gefunden';
    return;
  }
  const latlng = layer.getLatLng ? layer.getLatLng() : layer.getBounds().getCenter();
  map.setView(latlng, 18);
  layer.openPopup();
  status.textContent = `Mast ${input.value.trim()} geöffnet`;
});

map.on('mousemove', event => {
  const { lat, lng } = event.latlng;
  let utm = '-';
  if (window.proj4) {
    const [easting, northing] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat]);
    utm = `E ${Math.round(easting)} · N ${Math.round(northing)}`;
  }
  document.getElementById('coords').textContent = `Lat/Lon: ${lat.toFixed(6)}, ${lng.toFixed(6)} · UTM32: ${utm}`;
});

buildLayerList();
initializeLayers().catch(error => {
  console.error(error);
  window.alert(`Fehler beim Laden der WebGIS-Daten: ${error.message}`);
});
