'use strict';

const BASEMAPS = {
  satellite: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Esri World Imagery', maxZoom: 19 }
  ),
  topo: L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    { attribution: 'OpenTopoMap', maxZoom: 17 }
  ),
  osm: L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: 'OpenStreetMap contributors', maxZoom: 19 }
  ),
  grey: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Esri Light Gray', maxZoom: 16 }
  ),
};

const map = L.map('map', {
  center: [50.17, 8.83],
  zoom: 13,
  layers: [BASEMAPS.satellite],
  zoomControl: false,
  preferCanvas: true,
});

L.control.zoom({ position: 'topright' }).addTo(map);
L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

const MAP_PANES = {
  catastroPane: 430,
  statusPane: 510,
  logisticsPane: 560,
  mastPane: 620,
  overlayPane2: 680,
};

Object.entries(MAP_PANES).forEach(([name, zIndex]) => {
  map.createPane(name);
  map.getPane(name).style.zIndex = String(zIndex);
});
map.createPane('catastroLabelPane');
map.getPane('catastroLabelPane').style.zIndex = '620';
map.getPane('catastroLabelPane').style.pointerEvents = 'none';

function setBasemap(name, button) {
  Object.values(BASEMAPS).forEach(layer => map.removeLayer(layer));
  BASEMAPS[name].addTo(map);
  document.querySelectorAll('.basemap-btn').forEach(btn => btn.classList.remove('active'));
  if (button) button.classList.add('active');
}

function toggleSidebar() {
  document.body.classList.toggle('sidebar-open');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function featureName(props = {}) {
  return props.Name || props.name || props.id || props.mast_nr || props.mast || props.fid || '-';
}

function normalizeMast(value) {
  const raw = String(value || '').trim().replace(/^M/i, '');
  const match = raw.match(/^0*(\d+[A-Z]?)$/i);
  if (!match) return raw.toUpperCase();
  return match[1].padStart(3, '0').toUpperCase();
}

const KETTEN_DOCS = {
  da: 'assets/ketten/LH-11-3024_DA-Kette.pdf',
  dh: 'assets/ketten/LH-11-3024_DH-Kette.pdf',
  hilfskette: 'assets/ketten/LH-11-3024_Kettenzeichnung_Hilfskette_geaendert_2025.pdf',
};

const ERDUNG_DOCS = {
  temporary: 'assets/Erdungen/Datenblatt Nr. 2.pdf',
  usage040250028: 'assets/Erdungen/040250028-EN-V02.pdf',
  usageEuK: 'assets/Erdungen/040106020_EuK_en_V02.PDF',
};

const MAST_TECHNICAL_INFO = {
  '042': {
    mastTyp: 'Abspannmast',
    ketten: [
      { label: 'LH-11-3024_DA-Kette', count: 1, href: KETTEN_DOCS.da },
      { label: 'LH-11-3024_Kettenzeichnung_Hilfskette', count: 2, href: KETTEN_DOCS.hilfskette },
    ],
    erdung: 'Arbeitsbereichserdung wegen Zone de Trabajo',
  },
  '043': { mastTyp: 'Tragmast', ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }] },
  '044': {
    mastTyp: 'Tragmast',
    ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }],
    erdung: 'Induktionserdung wegen Parallelismus',
  },
  '045': { mastTyp: 'Tragmast', ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }] },
  '046': { mastTyp: 'Tragmast', ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }] },
  '047': {
    mastTyp: 'Tragmast',
    ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }],
    erdung: 'Induktionserdung / Rollenerde wegen Kreuzung',
  },
  '048': {
    mastTyp: 'Abspannmast',
    ketten: [{ label: 'LH-11-3024_DA-Kette', count: 1, href: KETTEN_DOCS.da }],
    erdung: 'Arbeitsbereichserdung wegen Zone de Trabajo',
  },
  '049': { mastTyp: 'Tragmast', ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }] },
  '050': {
    mastTyp: 'Tragmast',
    ketten: [{ label: 'LH-11-3024_DH-Kette', count: 1, href: KETTEN_DOCS.dh }],
    erdung: 'Induktionserdung / Rollenerde wegen Kreuzung',
  },
  '051': {
    mastTyp: 'Abspannmast',
    ketten: [{ label: 'LH-11-3024_DA-Kette', count: 1, href: KETTEN_DOCS.da }],
    erdung: 'Arbeitsbereichserdung wegen Zone de Trabajo',
  },
};

function popupNavigationLink(latlng) {
  if (!latlng) return '';
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latlng.lat},${latlng.lng}`;
  return `<div class="popup-row"><span>Navigation:</span><a href="${url}" target="_blank" rel="noopener">Google Maps</a></div>`;
}

function ensureFeatureModal() {
  let modal = document.getElementById('feature-modal');
  if (modal) return modal;
  modal = document.createElement('aside');
  modal.id = 'feature-modal';
  modal.className = 'feature-modal hidden';
  modal.innerHTML = `
    <button type="button" class="feature-modal-close" aria-label="Cerrar">x</button>
    <div class="feature-modal-body"></div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.feature-modal-close').addEventListener('click', () => modal.classList.add('hidden'));
  return modal;
}

function openHtmlPopup(html, latlng) {
  lastPopupOpenedAt = Date.now();
  const modal = ensureFeatureModal();
  modal.querySelector('.feature-modal-body').innerHTML = html;
  modal.classList.remove('hidden');
  L.popup({ maxWidth: 360, autoPan: true })
    .setLatLng(latlng || map.getCenter())
    .setContent(html)
    .openOn(map);
}

function extractDescriptionAttributes(description) {
  if (!description || typeof DOMParser === 'undefined') return {};
  const doc = new DOMParser().parseFromString(String(description), 'text/html');
  const attrs = {};
  doc.querySelectorAll('tr').forEach(row => {
    const cells = row.querySelectorAll('th,td');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();
      if (key && value) attrs[key] = value;
    }
  });
  return attrs;
}

function mergedProps(props = {}) {
  return { ...extractDescriptionAttributes(props.description), ...props };
}

function popupRows(entries) {
  return entries
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `<div class="popup-row"><span>${escapeHtml(key)}</span><div>${escapeHtml(value)}</div></div>`)
    .join('');
}

function genericPopupProps(props = {}) {
  const hidden = new Set([
    'description', 'timestamp', 'begin', 'end', 'altitudeMode', 'tessellate',
    'extrude', 'visibility', 'drawOrder', 'icon', 'styleUrl',
  ]);
  return Object.fromEntries(
    Object.entries(mergedProps(props))
      .filter(([key, value]) => !hidden.has(key) && value !== null && value !== undefined && value !== '')
      .slice(0, 24)
  );
}

function popupHtml(title, props = {}, latlng) {
  const rows = popupRows(Object.entries(props));
  return `<div class="popup-title">${escapeHtml(title)}</div>${rows || '<div class="popup-empty">Keine Attribute</div>'}${popupNavigationLink(latlng)}`;
}

function ownerRows(props = {}) {
  const ownerName = props.eigentuemer || props.Eigentuemer || props.owner || props.Owner || props.besitzer || props.Besitzer || props.Nachname || props.nachname || props.name_eigentuemer;
  const firstName = props.Vorname || props.vorname;
  const phone = props.Telefon || props.telefon || props.Mobil || props.mobil || props.Phone || props.phone;
  const email = props['E-Mail'] || props.email || props.Email || props.mail || props.Mail;
  const status = props.Ampel || props.ampel || props.status || props.Status;
  const parcelRows = [
    ['Gemeinde', props.Gemeinde || props.gemeinde],
    ['Gemarkung', props.Gemarkung || props.gemarkung],
    ['Flur', props.Flur || props.flur],
    ['Flurstueck', props.Flurstueck || props['Flurstück'] || props.flurstueck],
    ['Flurstueckskennzeichen', props.Flurstueckskennzeichen || props['Flurstückskennzeichen'] || props.flstkennz],
    ['Mast Nr.', props['Mast Nr.'] || props.mast || props.Mast],
    ['Art / Typ', props['Art / Typ'] || props.typ || props.Typ],
    ['Betroffene Flaeche', props['Betroffene Flaeche [m2]'] || props['Betroffene Fläche [m2]']],
    ['Anteil am Flurstueck', props['Anteil am Flurstueck [%]'] || props['Anteil am Flurstück [%]']],
    ['Bemerkung', props.Bemerkung || props.bemerkung],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
  const parcelBlock = parcelRows.length
    ? popupRows(parcelRows.map(([label, value]) => [label, value]))
    : '<div class="popup-row"><span>Status:</span><div>Keine Flaechendaten mit dieser Parzelle verknuepft.</div></div>';
  const contactNote = ownerName || firstName || phone || email
    ? ''
    : '<div class="popup-row"><span>Kontakt:</span><div>Keine Eigentuemerkontaktdaten im lokalen Excel vorhanden.</div></div>';
  return `
    <div class="popup-plan-section">
      <div class="popup-plan-section-title">Genehmigung / Flaeche</div>
      <div class="popup-row"><span>Status:</span><div>${escapeHtml(status || '-')}</div></div>
      ${parcelBlock}
    </div>
    <div class="popup-plan-section">
      <div class="popup-plan-section-title">Eigentuemer / Kontakt</div>
      <div class="popup-row"><span>Name:</span><div>${escapeHtml([ownerName, firstName].filter(Boolean).join(', ') || '-')}</div></div>
      <div class="popup-row"><span>Telefon:</span><div>${escapeHtml(phone || '-')}</div></div>
      <div class="popup-row"><span>E-Mail:</span><div>${escapeHtml(email || '-')}</div></div>
      ${contactNote}
    </div>
  `;
}

function popupPlanLinks(links) {
  if (!links?.length) return '';
  const anchors = links.map(link => (
    `<a class="popup-plan-link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.text)}</a>`
  )).join('');
  return `<div class="popup-plan-actions">${anchors}</div>`;
}

function kettenSummary(info) {
  if (!info?.ketten?.length) return '-';
  return info.ketten.map(item => `${item.count} x ${item.label}`).join(', ');
}

function towerTechnicalBlock(mast) {
  const info = MAST_TECHNICAL_INFO[mast];
  if (!info) return '';
  const planLinks = info.ketten.map(item => ({ href: item.href, text: `${item.count} x ${item.label}` }));
  const erdungLinks = info.erdung
    ? [
        { href: ERDUNG_DOCS.temporary, text: 'Datenblatt Erdung Nr. 2' },
        { href: ERDUNG_DOCS.usage040250028, text: '040250028-EN-V02' },
        { href: ERDUNG_DOCS.usageEuK, text: '040106020 EuK' },
      ]
    : [];
  return `
    <div class="popup-plan-section">
      <div class="popup-plan-section-title">Kettenplanung Abschnitt 042-051</div>
      <div class="popup-row"><span>Masttyp:</span><div>${escapeHtml(info.mastTyp || '-')}</div></div>
      <div class="popup-row"><span>Ketten:</span><div>${escapeHtml(kettenSummary(info))}</div></div>
      ${popupPlanLinks(planLinks)}
    </div>
    ${info.erdung ? `
      <div class="popup-plan-section">
        <div class="popup-plan-section-title">Erdungskonzept</div>
        <div class="popup-row"><span>Erdung:</span><div>${escapeHtml(info.erdung)}</div></div>
        <div class="popup-row"><span>Hinweis:</span><div>Bei Arbeiten am Mast ist eine temporaere Erdung nach Datenblatt Nr. 2 je Phase vorzusehen.</div></div>
        ${popupPlanLinks(erdungLinks)}
      </div>
    ` : ''}
  `;
}

function towerPopupHtml(props = {}, latlng) {
  const fullProps = mergedProps(props);
  const mast = normalizeMast(featureName(fullProps));
  const rows = popupRows(Object.entries({
    'Mast Nr.': mast,
    Leitung: fullProps.U_TECHPLATZ_REF || fullProps.leitung || 'LH-11-3024',
  }));
  return `
    <div class="popup-title">Mast ${escapeHtml(mast)}</div>
    ${rows}
    ${towerTechnicalBlock(mast)}
    ${popupNavigationLink(latlng)}
  `;
}

function erdungPopupHtml(props = {}, latlng) {
  const mast = normalizeMast(props.mast || props.Name || props.name || props.apoyo);
  return `
    <div class="popup-title">Erdungskonzept Mast ${escapeHtml(mast)}</div>
    <div class="popup-row"><span>Leitung:</span><div>${escapeHtml(props.leitung || 'LH-11-3024')}</div></div>
    <div class="popup-row"><span>Typ:</span><div>${escapeHtml(props.erdung_typ || '-')}</div></div>
    <div class="popup-row"><span>Grund:</span><div>${escapeHtml(props.grund || '-')}</div></div>
    <div class="popup-row"><span>Abschnitt:</span><div>${escapeHtml(props.abschnitt || '042-051')}</div></div>
    ${popupPlanLinks([
      { href: ERDUNG_DOCS.temporary, text: 'Datenblatt Erdung Nr. 2' },
      { href: ERDUNG_DOCS.usage040250028, text: '040250028-EN-V02' },
      { href: ERDUNG_DOCS.usageEuK, text: '040106020 EuK' },
    ])}
    ${popupNavigationLink(latlng)}
  `;
}

function layerPopupHtml(def, props = {}, latlng) {
  const fullProps = mergedProps(props);
  if (def.type === 'mast') {
    return towerPopupHtml(fullProps, latlng);
  }
  if (def.type === 'erdung') {
    return erdungPopupHtml(fullProps, latlng);
  }
  if (def.type === 'toitoi') {
    return popupHtml('TOI TOI / Sanitaer', {
      Mast: fullProps.mast,
      Typ: fullProps.typ,
      Projekt: fullProps.projekt,
    }, latlng);
  }
  if (def.type === 'warehouse') {
    return popupHtml('Baulager / Lieferort', {
      Name: fullProps.name,
      Adresse: fullProps.adresse,
      Typ: fullProps.typ,
      Projekt: fullProps.projekt,
    }, latlng);
  }
  if (def.key === 'status_genehmigung') {
    return `
      <div class="popup-title">STATUS GENEHMIGUNG</div>
      ${ownerRows(fullProps)}
      ${popupRows(Object.entries(genericPopupProps(fullProps))) || '<div class="popup-empty">Keine Attribute</div>'}
      ${popupNavigationLink(latlng)}
    `;
  }
  return popupHtml(def.label, genericPopupProps(fullProps), latlng);
}

function layerLatLng(layer) {
  if (layer.getLatLng) return layer.getLatLng();
  if (layer.getBounds) return layer.getBounds().getCenter();
  return map.getCenter();
}

function wgs84ToUtm32(lat, lng) {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const lon0 = 9 * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lonRad = lng * Math.PI / 180;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);
  const n = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const t = tanLat * tanLat;
  const c = ep2 * cosLat * cosLat;
  const aa = cosLat * (lonRad - lon0);
  const m = a * (
    (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latRad)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad)
  );
  const easting = k0 * n * (
    aa + (1 - t + c) * aa ** 3 / 6
    + (5 - 18 * t + t ** 2 + 72 * c - 58 * ep2) * aa ** 5 / 120
  ) + 500000;
  const northing = k0 * (
    m + n * tanLat * (
      aa ** 2 / 2
      + (5 - t + 9 * c + 4 * c ** 2) * aa ** 4 / 24
      + (61 - 58 * t + t ** 2 + 600 * c - 330 * ep2) * aa ** 6 / 720
    )
  );
  return { easting, northing };
}

let measureActive = false;
let measurePts = [];
let measureLayers = [];
let measureRubber = null;

function clearMeasure() {
  measureLayers.forEach(layer => map.removeLayer(layer));
  measureLayers = [];
  measurePts = [];
  if (measureRubber) map.removeLayer(measureRubber);
  measureRubber = null;
  document.getElementById('measure-result')?.classList.add('hidden');
}

const MeasureControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd() {
    const btn = L.DomUtil.create('button', 'leaflet-bar measure-btn');
    btn.type = 'button';
    btn.title = 'Medir distancia';
    btn.innerHTML = 'm';
    L.DomEvent.disableClickPropagation(btn);
    L.DomEvent.on(btn, 'click', () => {
      measureActive = !measureActive;
      btn.classList.toggle('active', measureActive);
      map.getContainer().style.cursor = measureActive ? 'crosshair' : '';
      if (!measureActive) clearMeasure();
    });
    return btn;
  },
});

map.addControl(new MeasureControl());

function goToMast(rawValue) {
  const raw = String(rawValue || '').trim();
  const status = document.querySelector('.goto-mast-status');
  if (!raw) {
    if (status) {
      status.textContent = 'Mast eingeben';
      status.classList.add('error');
    }
    return;
  }

  const layer = mastIndex.get(raw.toLowerCase()) || mastIndex.get(raw.padStart(3, '0').toLowerCase());
  if (!layer) {
    if (status) {
      status.textContent = 'Mast nicht gefunden';
      status.classList.add('error');
    }
    return;
  }

  const latlng = layerLatLng(layer);
  map.setView(latlng, 18);
  const props = layer.feature?.properties || layer._featureProps || {};
  openHtmlPopup(towerPopupHtml(props, latlng), latlng);
  if (status) {
    status.textContent = `Mast ${raw} geoeffnet`;
    status.classList.remove('error');
  }
}

const GoToMastControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd() {
    const container = L.DomUtil.create('div', 'goto-mast-control leaflet-control');
    container.innerHTML = `
      <form id="goto-form" class="goto-form">
        <label for="goto-mast">Go To Mast</label>
        <div class="goto-row">
          <input id="goto-mast" list="mast-options" placeholder="z.B. 042" autocomplete="off" />
          <button type="submit">OK</button>
        </div>
        <datalist id="mast-options"></datalist>
        <div class="goto-mast-status">Apoyo eingeben oder auswaehlen</div>
      </form>
    `;
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    container.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      goToMast(container.querySelector('#goto-mast').value);
    });
    return container;
  },
});

map.addControl(new GoToMastControl());

const LocateControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd() {
    const btn = L.DomUtil.create('button', 'leaflet-bar locate-btn');
    btn.type = 'button';
    btn.title = 'Mostrar mi ubicacion';
    btn.innerHTML = '◎';
    L.DomEvent.disableClickPropagation(btn);
    L.DomEvent.on(btn, 'click', () => {
      if (!navigator.geolocation) return window.alert('Este navegador no permite geolocalizacion.');
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        const marker = L.circleMarker([latitude, longitude], {
          radius: 8, color: '#fff', weight: 3, fillColor: '#1e88ff', fillOpacity: 1,
        }).addTo(map);
        L.circle([latitude, longitude], {
          radius: accuracy || 0, color: '#1e88ff', weight: 1, fillColor: '#1e88ff', fillOpacity: 0.18,
        }).addTo(map);
        marker.bindPopup('Tu ubicacion actual').openPopup();
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15));
      });
    });
    return btn;
  },
});

map.addControl(new LocateControl());

map.on('mousemove', e => {
  if (measureActive && measurePts.length === 1) {
    if (!measureRubber) {
      measureRubber = L.polyline([measurePts[0], e.latlng], {
        color: '#ff7700', weight: 2, dashArray: '6 4', opacity: 0.8,
      }).addTo(map);
    } else {
      measureRubber.setLatLngs([measurePts[0], e.latlng]);
    }
  }
  const utm = wgs84ToUtm32(e.latlng.lat, e.latlng.lng);
  document.getElementById('coords-bar').textContent =
    `Lat: ${e.latlng.lat.toFixed(5)}  Lng: ${e.latlng.lng.toFixed(5)}  |  UTM32N EPSG:25832 E: ${utm.easting.toFixed(1)}  N: ${utm.northing.toFixed(1)}`;
});

map.on('click', e => {
  if (!measureActive) {
    if (Date.now() - lastPopupOpenedAt < 180) return;
    const statusFeature = document.getElementById('chk-status-genehmigung')?.checked
      ? findParcelAtLatLng(e.latlng, 'status')
      : null;
    if (statusFeature) {
      const statusDef = DATA_LAYERS.find(def => def.key === 'status_genehmigung');
      openHtmlPopup(layerPopupHtml(statusDef, statusFeature.properties || {}, e.latlng), e.latlng);
      return;
    }
    const catastroFeature = document.getElementById('chk-catastro')?.checked
      ? findParcelAtLatLng(e.latlng, 'catastro')
      : null;
    if (catastroFeature) {
      openHtmlPopup(catastroPopupHtml(catastroFeature.properties || {}, e.latlng), e.latlng);
    }
    return;
  }
  if (measurePts.length >= 2) clearMeasure();
  measurePts.push(e.latlng);
  const dot = L.circleMarker(e.latlng, {
    radius: 5, color: '#fff', weight: 2, fillColor: '#ff7700', fillOpacity: 1,
  }).addTo(map);
  measureLayers.push(dot);
  if (measurePts.length === 2) {
    if (measureRubber) map.removeLayer(measureRubber);
    measureRubber = null;
    const line = L.polyline(measurePts, { color: '#ff7700', weight: 2.5, dashArray: '8 5' }).addTo(map);
    measureLayers.push(line);
    const dist = measurePts[0].distanceTo(measurePts[1]);
    const label = dist >= 1000 ? `${(dist / 1000).toFixed(3)} km` : `${Math.round(dist)} m`;
    const el = document.getElementById('measure-result');
    el.textContent = label;
    el.classList.remove('hidden');
  }
});

const DATA_LAYERS = [
  { checkbox: 'chk-buffer', key: 'buffer', label: 'Buffer 800 m', file: 'buffer_leitung_800m.geojson', type: 'polygon', color: '#e63030', checked: true, opacity: 0.08 },
  { checkbox: 'chk-eje', key: 'leitung', label: 'Eje de Linea', file: 'leitung.geojson', type: 'line', color: '#e63030', weight: 4, checked: true },
  { checkbox: 'chk-torres', key: 'masten', label: 'Apoyos / Masten', file: 'masten.geojson', type: 'mast', color: '#3a7bd5', checked: true },
  { checkbox: 'chk-erdung', key: 'erdungskonzept', label: 'Erdungskonzept', file: 'erdungskonzept.geojson', type: 'erdung', color: '#f59e0b' },
  { checkbox: 'chk-rettung', key: 'rettungspunkte', label: 'Rettungspunkte', file: 'rettungspunkte.geojson', type: 'point', color: '#009a44', checked: true },
  { checkbox: 'chk-baulager', key: 'baulager', label: 'Almacenes / Baulager', file: 'baulager.geojson', type: 'warehouse', color: '#f59e0b', checked: true },
  { checkbox: 'chk-toitoi', key: 'toitoi', label: 'ToiToi / Sanitaer', file: 'toitoi.geojson', type: 'toitoi', color: '#0ea5e9', checked: true },
  { checkbox: 'chk-weg-best', key: 'zuwegung_vorhanden', label: 'Zuwegung vorhanden', file: 'zuwegung_vorhanden.geojson', type: 'polygon', color: '#7c3aed', weight: 2, checked: true, opacity: 1 },
  { checkbox: 'chk-weg-temp', key: 'zuwegung_temporaer', label: 'Zuwegung temporaer', file: 'zuwegung_temporaer.geojson', type: 'polygon', color: '#ff2d95', weight: 2, checked: true, opacity: 1 },
  { checkbox: 'chk-beschilderung', key: 'beschilderung', label: 'Beschilderung', file: 'beschilderung.geojson', type: 'point', color: '#e11d48', checked: true },
  { checkbox: 'chk-arbeit', key: 'arbeitsflaechen', label: 'Arbeitsflaechen', file: 'arbeitsflaechen.geojson', type: 'polygon', color: '#00d4ff', weight: 2, checked: true, opacity: 1 },
  { checkbox: 'chk-geruest', key: 'gerueste', label: 'Gerueste', file: 'gerueste.geojson', type: 'polygon', color: '#aa00aa', checked: true },
  { checkbox: 'chk-ausholz', key: 'ausholzung', label: 'Ausholzung', file: 'ausholzung.geojson', type: 'polygon', color: '#007733' },
  { checkbox: 'chk-schutz', key: 'netz', label: 'Schutznetz / Netz', file: 'netz.geojson', type: 'line', color: '#0055bb', weight: 3, checked: true },
  { checkbox: 'chk-sperr', key: 'sperrungen', label: 'Sperrungen', file: 'sperrungen.geojson', type: 'polygon', color: '#dd0000', checked: true },
  { checkbox: 'chk-status-genehmigung', key: 'status_genehmigung', label: 'STATUS GENEHMIGUNG', file: 'status_genehmigung.geojson', type: 'polygon', color: '#22aa55', checked: true, pane: 'statusPane' },
];

const layerCache = new Map();
const mastIndex = new Map();
const ownerParcelIndex = new Map();
const clickableParcelFeatures = {
  status: [],
  catastro: [],
};
const allBounds = [];
let lastPopupOpenedAt = 0;

function normalizeParcelValue(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function normalizeKennzeichenValue(value) {
  return normalizeParcelValue(value).replace(/_/g, '');
}

function parcelLookupKey(props = {}) {
  return [
    normalizeParcelValue(props.gemarkung || props.Gemarkung),
    normalizeParcelValue(props.flur || props.Flur),
    normalizeParcelValue(catastroNumber(props) || props['Flurstück'] || props.Flurstueck || props.flurstueck),
  ].join('|');
}

function parcelKennzeichenKey(props = {}) {
  const kennzeichen = props.flstkennz || props.Flurstueckskennzeichen || props['Flurstückskennzeichen'] || props.flurstueckskennzeichen;
  const normalized = normalizeKennzeichenValue(kennzeichen);
  return normalized ? `k|${normalized}` : '';
}

function indexOwnerParcel(props = {}) {
  const lookupKey = parcelLookupKey(props);
  const kennzeichenKey = parcelKennzeichenKey(props);
  if (lookupKey !== '||') ownerParcelIndex.set(lookupKey, props);
  if (kennzeichenKey) ownerParcelIndex.set(kennzeichenKey, props);
}

function ownerPropsForParcel(props = {}) {
  return ownerParcelIndex.get(parcelKennzeichenKey(props)) || ownerParcelIndex.get(parcelLookupKey(props)) || props;
}

function featureBBox(geometry) {
  const coords = [];
  const collect = value => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      coords.push(value);
      return;
    }
    value.forEach(collect);
  };
  collect(geometry?.coordinates);
  if (!coords.length) return null;
  return coords.reduce((bbox, [lng, lat]) => ({
    minLng: Math.min(bbox.minLng, lng),
    minLat: Math.min(bbox.minLat, lat),
    maxLng: Math.max(bbox.maxLng, lng),
    maxLat: Math.max(bbox.maxLat, lat),
  }), { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity });
}

function indexClickableParcels(target, features = []) {
  clickableParcelFeatures[target] = features
    .filter(feature => feature.geometry && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type))
    .map(feature => ({ feature, bbox: featureBBox(feature.geometry) }))
    .filter(item => item.bbox);
}

function pointInRing(latlng, ring) {
  const x = latlng.lng;
  const y = latlng.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(latlng, polygon) {
  if (!polygon?.length || !pointInRing(latlng, polygon[0])) return false;
  return !polygon.slice(1).some(ring => pointInRing(latlng, ring));
}

function geometryContainsLatLng(geometry, latlng) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(polygon => pointInPolygon(latlng, polygon));
}

function findParcelAtLatLng(latlng, target) {
  return clickableParcelFeatures[target].find(({ feature, bbox }) => (
    latlng.lng >= bbox.minLng
    && latlng.lng <= bbox.maxLng
    && latlng.lat >= bbox.minLat
    && latlng.lat <= bbox.maxLat
    && geometryContainsLatLng(feature.geometry, latlng)
  ))?.feature || null;
}

function vectorStyle(def) {
  if (def.type === 'polygon') {
    return {
      color: def.color,
      weight: 1.5,
      opacity: 0.95,
      fillColor: def.color,
      fillOpacity: def.opacity ?? 0.34,
      dashArray: def.dashArray,
    };
  }
  return { color: def.color, weight: def.weight || 3, opacity: 0.95, dashArray: def.dashArray };
}

function markerIcon(html, className, color) {
  return L.divIcon({
    html,
    className,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
  });
}

function pointToLayer(def, feature, latlng) {
  if (def.type === 'mast') {
    const name = normalizeMast(featureName(feature.properties || {}));
    return L.marker(latlng, {
      pane: 'mastPane',
      icon: L.divIcon({
        html: `<span>${escapeHtml(name)}</span>`,
        className: 'mast-marker',
        iconSize: [38, 24],
        iconAnchor: [19, 12],
        popupAnchor: [0, -12],
      }),
    });
  }
  if (def.type === 'toitoi') {
    return L.marker(latlng, { pane: 'logisticsPane', icon: markerIcon('WC', 'toitoi-marker', def.color) });
  }
  if (def.type === 'warehouse') {
    return L.marker(latlng, { pane: 'logisticsPane', icon: markerIcon('⌂', 'warehouse-marker', def.color) });
  }
  if (def.type === 'erdung') {
    return L.marker(latlng, { pane: 'logisticsPane', icon: markerIcon('E', 'erdung-marker', def.color) });
  }
  return L.circleMarker(latlng, {
    pane: 'logisticsPane', radius: 6, color: '#fff', weight: 2, fillColor: def.color, fillOpacity: 1,
  });
}

async function loadDataLayer(def) {
  if (layerCache.has(def.key)) return layerCache.get(def.key);
  const response = await fetch(`data/${def.file}`);
  if (!response.ok) throw new Error(`${def.file}: HTTP ${response.status}`);
  const data = await response.json();
  if (def.key === 'status_genehmigung') {
    ownerParcelIndex.clear();
    (data.features || []).forEach(feature => {
      const props = feature.properties || {};
      indexOwnerParcel(props);
    });
    indexClickableParcels('status', data.features || []);
  }
  const layer = L.geoJSON(data, {
    pane: def.pane || (def.type === 'mast' ? 'mastPane' : undefined),
    style: () => vectorStyle(def),
    pointToLayer: (feature, latlng) => pointToLayer(def, feature, latlng),
    onEachFeature: (feature, lyr) => {
      const props = feature.properties || {};
      lyr.bindPopup(() => layerPopupHtml(def, props, layerLatLng(lyr)));
      lyr.on('click', e => openHtmlPopup(layerPopupHtml(def, props, e.latlng), e.latlng));
      lyr.on('contextmenu', e => {
        L.DomEvent.preventDefault(e.originalEvent);
        openHtmlPopup(layerPopupHtml(def, props, e.latlng), e.latlng);
      });
      const name = featureName(props);
      if (def.type === 'mast') {
        const key = String(name).trim();
        mastIndex.set(key.toLowerCase(), lyr);
        mastIndex.set(key.padStart(3, '0').toLowerCase(), lyr);
      } else if (data.features.length > 0) {
        lyr.bindTooltip(`${def.label}: ${name}`, { sticky: true });
      }
    },
  });
  layerCache.set(def.key, layer);
  const count = data.features?.length || 0;
  document.querySelectorAll(`[data-count="${def.key}"]`).forEach(el => { el.textContent = count; });
  if (count > 0 && layer.getBounds().isValid()) allBounds.push(layer.getBounds());
  return layer;
}

async function toggleDataLayer(def, checked) {
  const layer = await loadDataLayer(def);
  if (checked) layer.addTo(map);
  else map.removeLayer(layer);
}

function fillMastOptions() {
  const options = document.getElementById('mast-options');
  options.innerHTML = '';
  [...new Set([...mastIndex.keys()].map(key => key.toUpperCase()))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      options.appendChild(option);
    });
}

const HESSEN_SCHUTZ = 'https://geodienste-umwelt.hessen.de/arcgis/services/inspire/schutzgebiete/MapServer/WmsServer';
const HESSEN_BIOTOP = 'https://geodienste-umwelt.hessen.de/arcgis/services/inspire/lebensraeume_biotope/MapServer/WmsServer';
const HESSEN_RISIKO = 'https://geodienste-umwelt.hessen.de/arcgis/services/inspire/gebiete_naturbedingter_risiken/MapServer/WmsServer';
const HESSEN_WASSER = 'https://geodienste-umwelt.hessen.de/arcgis/services/inspire/bewirtschaftungsgebiete/MapServer/WmsServer';

function createWmsLayer(url, options) {
  return L.tileLayer.wms(url, {
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    opacity: 0.55,
    ...options,
  });
}

const WMS_LAYERS = {
  'chk-naturschutz': createWmsLayer(HESSEN_SCHUTZ, {
    layers: 'Naturschutzgebiete', attribution: 'HLNUG Hessen - Naturschutzgebiete',
  }),
  'chk-ffh': createWmsLayer(HESSEN_SCHUTZ, {
    layers: 'Fauna-Flora-Habitate', attribution: 'HLNUG Hessen - FFH',
  }),
  'chk-vogel': createWmsLayer(HESSEN_SCHUTZ, {
    layers: 'Vogelschutzgebiete', attribution: 'HLNUG Hessen - Vogelschutzgebiete',
  }),
  'chk-landschaft': createWmsLayer(HESSEN_SCHUTZ, {
    layers: 'Landschaftsschutzgebiete', attribution: 'HLNUG Hessen - Landschaftsschutz',
  }),
  'chk-biotop': createWmsLayer(HESSEN_BIOTOP, {
    layers: 'BIOTOPE,GESCH_BIOTOPE', attribution: 'HLNUG Hessen - Biotope',
  }),
  'chk-hq100': createWmsLayer(HESSEN_RISIKO, {
    layers: 'Ueberschwemmungsgebiete_HQ100_nach_HWG', attribution: 'HLNUG Hessen - HQ100',
  }),
  'chk-wasserschutz': createWmsLayer(HESSEN_WASSER, {
    layers: 'TWS_HQS_ALK', attribution: 'HLNUG Hessen - Wasserschutz',
  }),
  'chk-hydro': createWmsLayer('https://sgx.geodatenzentrum.de/wms_gewaessernetz', {
    layers: 'gewaessernetz', attribution: 'BKG - Gewaessernetz', opacity: 0.7,
  }),
};

let catastroOverviewLayer = null;
let catastroOverviewLoading = false;
let catastroLayer = null;
let catastroLoading = false;
let catastroLabels = [];
const catastroLabelLayer = L.layerGroup();
const CATASTRO_DETAIL_ZOOM = 16;
const CATASTRO_LABEL_ZOOM = 17;
const CATASTRO_LABEL_LIMIT = 900;

function catastroStyle() {
  return { color: '#111827', weight: 0.9, opacity: 0.95, fillColor: '#ffffff', fillOpacity: 0.01 };
}

function catastroOverviewStyle() {
  return { color: '#111827', weight: 0.75, opacity: 0.86, fillColor: '#ffffff', fillOpacity: 0.01 };
}

function catastroNumber(props = {}) {
  const zae = props.flstnrzae ?? props.zaehler ?? props.flurstueck;
  const nen = props.flstnrnen ?? props.nenner;
  if (zae && nen) return `${zae}/${nen}`;
  if (zae) return String(zae);
  if (props.flstkennz) return String(props.flstkennz).replace(/_/g, '').slice(-8).replace(/^0+/, '') || props.flstkennz;
  return '';
}

function catastroPopupProps(props = {}) {
  return {
    flurstueck: catastroNumber(props),
    flstkennz: props.flstkennz,
    gemarkung: props.gemarkung,
    flur: props.flur,
    gemeinde: props.gemeinde,
    kreis: props.kreis,
    flaeche: props.flaeche,
    lagebeztxt: props.lagebeztxt,
    aktualit: props.aktualit,
    oid: props.oid || props.gml_id,
  };
}

function catastroPopupHtml(props = {}, latlng) {
  const p = catastroPopupProps(props);
  const ownerProps = ownerPropsForParcel(props);
  return `
    <div class="popup-title">ALKIS Flurstueck</div>
    <div class="popup-row"><span>Flurstueck:</span><div>${escapeHtml(p.flurstueck || '-')}</div></div>
    <div class="popup-row"><span>Kennzeichen:</span><div>${escapeHtml(p.flstkennz || '-')}</div></div>
    <div class="popup-row"><span>Gemarkung:</span><div>${escapeHtml(p.gemarkung || '-')}</div></div>
    <div class="popup-row"><span>Flur:</span><div>${escapeHtml(p.flur || '-')}</div></div>
    <div class="popup-row"><span>Gemeinde:</span><div>${escapeHtml(p.gemeinde || '-')}</div></div>
    <div class="popup-row"><span>Kreis:</span><div>${escapeHtml(p.kreis || '-')}</div></div>
    <div class="popup-row"><span>Flaeche:</span><div>${escapeHtml(p.flaeche || '-')} m2</div></div>
    <div class="popup-row"><span>Lage:</span><div>${escapeHtml(p.lagebeztxt || '-')}</div></div>
    <div class="popup-row"><span>Aktualitaet:</span><div>${escapeHtml(p.aktualit || '-')}</div></div>
    <div class="popup-row"><span>OID:</span><div>${escapeHtml(p.oid || '-')}</div></div>
    ${ownerRows(ownerProps)}
    ${popupNavigationLink(latlng)}
  `;
}

function updateCatastroLabels() {
  catastroLabelLayer.clearLayers();
  if (!catastroLayer || !map.hasLayer(catastroLayer) || map.getZoom() < CATASTRO_LABEL_ZOOM) {
    if (map.hasLayer(catastroLabelLayer)) map.removeLayer(catastroLabelLayer);
    return;
  }

  const bounds = map.getBounds().pad(0.08);
  const visible = catastroLabels.filter(item => bounds.contains(item.latlng)).slice(0, CATASTRO_LABEL_LIMIT);
  visible.forEach(item => {
    L.marker(item.latlng, {
      pane: 'catastroLabelPane',
      interactive: false,
      icon: L.divIcon({
        className: 'catastro-parcel-label',
        html: escapeHtml(item.label),
        iconSize: [42, 16],
        iconAnchor: [21, 8],
      }),
    }).addTo(catastroLabelLayer);
  });
  if (!map.hasLayer(catastroLabelLayer)) catastroLabelLayer.addTo(map);
}

async function ensureCatastro() {
  if (catastroLayer || catastroLoading) return catastroLayer;
  catastroLoading = true;
  const response = await fetch('data/catastro_flurstueck.geojson');
  if (!response.ok) throw new Error(`catastro_flurstueck.geojson: HTTP ${response.status}`);
  const data = await response.json();
  indexClickableParcels('catastro', data.features || []);
  catastroLabels = [];
  catastroLayer = L.geoJSON(data, {
    pane: 'catastroPane',
    renderer: L.canvas({ padding: 0.5, pane: 'catastroPane' }),
    style: catastroStyle,
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const label = catastroNumber(props);
      if (label) {
        const center = layer.getBounds ? layer.getBounds().getCenter() : null;
        if (center) catastroLabels.push({ latlng: center, label });
      }
      layer.bindPopup(() => catastroPopupHtml(props, layerLatLng(layer)));
      layer.on('click', e => openHtmlPopup(catastroPopupHtml(props, e.latlng), e.latlng));
      layer.on('contextmenu', e => {
        L.DomEvent.preventDefault(e.originalEvent);
        openHtmlPopup(catastroPopupHtml(props, e.latlng), e.latlng);
      });
    },
  });
  catastroLoading = false;
  return catastroLayer;
}

async function ensureCatastroOverview() {
  if (catastroOverviewLayer || catastroOverviewLoading) return catastroOverviewLayer;
  catastroOverviewLoading = true;
  const response = await fetch('data/catastro_flurstueck_overview.geojson');
  if (!response.ok) throw new Error(`catastro_flurstueck_overview.geojson: HTTP ${response.status}`);
  const data = await response.json();
  catastroOverviewLayer = L.geoJSON(data, {
    pane: 'catastroPane',
    renderer: L.canvas({ padding: 0.5, pane: 'catastroPane' }),
    style: catastroOverviewStyle,
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      layer.bindTooltip(catastroNumber(props), { sticky: true, className: 'catastro-tooltip' });
      layer.bindPopup(() => catastroPopupHtml(props, layerLatLng(layer)));
      layer.on('click', e => openHtmlPopup(catastroPopupHtml(props, e.latlng), e.latlng));
      layer.on('contextmenu', e => {
        L.DomEvent.preventDefault(e.originalEvent);
        openHtmlPopup(catastroPopupHtml(props, e.latlng), e.latlng);
      });
    },
  });
  catastroOverviewLoading = false;
  return catastroOverviewLayer;
}

async function updateCatastroVisibility() {
  const checkbox = document.getElementById('chk-catastro');
  if (!checkbox?.checked) {
    if (catastroOverviewLayer && map.hasLayer(catastroOverviewLayer)) map.removeLayer(catastroOverviewLayer);
    if (catastroLayer && map.hasLayer(catastroLayer)) map.removeLayer(catastroLayer);
    if (map.hasLayer(catastroLabelLayer)) map.removeLayer(catastroLabelLayer);
    catastroLabelLayer.clearLayers();
    return;
  }

  const layer = await ensureCatastro();
  if (catastroOverviewLayer && map.hasLayer(catastroOverviewLayer)) map.removeLayer(catastroOverviewLayer);
  if (layer && !map.hasLayer(layer)) layer.addTo(map);
  updateCatastroLabels();
}

async function init() {
  for (const def of DATA_LAYERS) {
    const checkbox = document.getElementById(def.checkbox);
    if (!checkbox) continue;
    checkbox.checked = Boolean(def.checked);
    checkbox.addEventListener('change', e => toggleDataLayer(def, e.target.checked).catch(console.error));
    const layer = await loadDataLayer(def);
    if (checkbox.checked && layer.getLayers().length) layer.addTo(map);
  }

  Object.entries(WMS_LAYERS).forEach(([id, layer]) => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    checkbox.addEventListener('change', e => {
      if (e.target.checked) layer.addTo(map);
      else map.removeLayer(layer);
    });
  });

  document.getElementById('chk-catastro')?.addEventListener('change', () => updateCatastroVisibility().catch(console.error));
  map.on('zoomend moveend', () => updateCatastroVisibility().catch(console.error));

  const validBounds = allBounds.filter(bounds => bounds.isValid());
  if (validBounds.length) {
    const bounds = validBounds.reduce((acc, bounds) => acc.extend(bounds), validBounds[0]);
    map.fitBounds(bounds.pad(0.12));
  }

  fillMastOptions();
  updateCatastroVisibility().catch(console.error);
  document.getElementById('loading-overlay')?.classList.add('hidden');
}

init().catch(error => {
  console.error(error);
  document.getElementById('loading-overlay')?.classList.add('hidden');
  window.alert(`Fehler beim Laden der WebGIS-Daten: ${error.message}`);
});
