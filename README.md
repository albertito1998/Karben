# Karben WebGIS

WebGIS estatica del proyecto **Karben 042-051** para consulta de traza, apoyos, accesos, superficies de trabajo y capas auxiliares de Zuwegungen.

La web replica la logica base usada previamente en Audorf-Kassoe, adaptada a este proyecto sin flujo DXF. En Karben la fuente principal son los datos GIS del proyecto QGIS/GPKG y los KMZ de linea y apoyos.

## URL

Repositorio:

`https://github.com/albertito1998/Karben`

GitHub Pages:

`https://albertito1998.github.io/Karben/`

## Datos del proyecto

| Campo | Valor |
| --- | --- |
| Proyecto visible | Karben 042-051 |
| Tramo / Leitung | Karben 042-051 |
| Autor / equipo | Alberto Gomez |
| Fecha inicial WebGIS | 29.07.2026 |
| Publicacion | GitHub Pages mediante GitHub Actions |

## Estructura

| Ruta | Uso |
| --- | --- |
| `01_QGIS/` | Proyecto QGIS y configuracion auxiliar. |
| `02_CAD/` | KMZ y archivos GIS de referencia usados como entrada. |
| `03_DATA/` | Datos intermedios o tabulares. |
| `04_PERMITS/` | Exceles de permisos o estado de propietarios, si se incorporan en el futuro. |
| `05_WEB/` | Web Leaflet publicada en GitHub Pages. |
| `05_WEB/assets/` | Logo y recursos visuales. |
| `05_WEB/data/` | GeoJSON generados para Leaflet. |
| `05_WEB/tools/` | Scripts de conversion y mantenimiento. |
| `06_ATLAS/` | Salidas cartograficas, screenshots o atlas. |
| `07_ASSETS/` | Recursos auxiliares del proyecto. |
| `.github/workflows/pages.yml` | Workflow de despliegue automatico a GitHub Pages. |

## Entradas actuales

| Archivo / origen | Uso |
| --- | --- |
| `02_CAD/Leitung.kmz` | Traza de la linea desde KMZ. |
| `02_CAD/Tragwerk.kmz` | Apoyos / masten desde KMZ. |
| `02_CAD/LH-11-3024_Karben-Grosskrotzenburg_Zuwegungen_ordenado.qgz` | Proyecto QGIS de trabajo usado como referencia. |
| `../01_Datos_Proyecto/*.gpkg` | GeoPackage de superficies, accesos, apoyos y buffer. |
| ALKIS Hessen WFS `ave:Flurstueck` | Catastro descargado por teselas sobre `buffer_leitung_800m.geojson`. |
| `05_WEB/assets/elecnor-deutsch-tp.png` | Logo copiado desde la WebGIS de Audorf-Kassoe. |

## Capas publicadas

Las capas se generan con:

```powershell
py -m pip install pyproj shapely pyshp
py 05_WEB/tools/build_layers.py
```

Conteos iniciales generados el 29.07.2026:

| Capa | GeoJSON | Features |
| --- | --- | ---: |
| Leitung | `leitung.geojson` | 1 |
| Masten | `masten.geojson` | 62 |
| Arbeitsflaechen | `arbeitsflaechen.geojson` | 9 |
| Gerueste | `gerueste.geojson` | 2 |
| Netz | `netz.geojson` | 0 |
| Sperrungen | `sperrungen.geojson` | 0 |
| Zuwegung vorhanden | `zuwegung_vorhanden.geojson` | 17 |
| Zuwegung temporaer | `zuwegung_temporaer.geojson` | 13 |
| Beschilderung | `beschilderung.geojson` | 10 |
| Buffer Leitung 800m | `buffer_leitung_800m.geojson` | 1 |
| Kataster Hessen WFS | `catastro_flurstueck.geojson` | 13953 |
| Kataster Hessen WFS overview | `catastro_flurstueck_overview.geojson` | 13953 |
| Leitung KMZ | `leitung_kmz.geojson` | 1 |
| Masten KMZ | `masten_kmz.geojson` | 62 |

Las capas `Netz` y `Sperrungen` estan creadas en la web, pero actualmente sus fuentes no contienen geometria.

## Funcionalidad de la web

- Visor Leaflet estatico.
- Fondo OpenStreetMap y fondo satelite ESRI.
- Control de capas activables.
- Popups con metadatos de cada geometria.
- Etiquetas permanentes para los apoyos.
- Buscador `Go To Mast`.
- Coordenadas del cursor en Lat/Lon y UTM32.
- Redireccion desde `index.html` raiz a `05_WEB/index.html`.

## Actualizacion habitual

1. Actualizar los KMZ o GPKG fuente.
2. Ejecutar:

```powershell
py 05_WEB/tools/build_layers.py
```

3. Validar:

```powershell
node --check 05_WEB/app.js
py -m py_compile 05_WEB/tools/build_layers.py
```

4. Revisar los conteos de `05_WEB/data/layers_manifest.json`.
5. Hacer commit y push a `main`.
6. GitHub Actions publica automaticamente la pagina.

## Trazabilidad

El documento `INSTRUCCIONES_REPLICACION_WEBGIS.md` describe el flujo universal para replicar esta WebGIS en otros proyectos y mantener trazabilidad del uso de IA, datos de entrada, conversiones, validaciones y despliegues.
