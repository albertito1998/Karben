# Karben WebGIS Server

WebGIS estática para el proyecto Karben 042-051, replicando la lógica base usada en Audorf-Kassoe.

## Estructura

| Carpeta | Uso previsto |
| --- | --- |
| `01_QGIS/` | Proyecto QGIS y configuracion GIS auxiliar. |
| `02_CAD/` | DXF/DWG/KMZ originales, incluido `export_autocad.dxf`. |
| `03_DATA/` | Datos tabulares o geoespaciales intermedios. |
| `04_PERMITS/` | Exceles de permisos o estado de propietarios. |
| `05_WEB/` | Web Leaflet estatica para GitHub Pages. |
| `05_WEB/assets/` | Logos, PDF, imagenes y recursos de la web. |
| `05_WEB/data/` | GeoJSON convertidos para Leaflet. |
| `05_WEB/tools/` | Scripts de conversion y actualizacion. |
| `06_ATLAS/` | Atlas, screenshots o salidas cartograficas. |
| `07_ASSETS/` | Recursos auxiliares del proyecto. |

## Flujo previsto

1. Actualizar los KMZ o el QGIS/GPKG de trabajo.
2. Ejecutar `py 05_WEB/tools/build_layers.py`.
3. Revisar la web en `05_WEB/index.html`.
4. Hacer commit y push a `main`.
5. GitHub Actions publica GitHub Pages con `.github/workflows/pages.yml`.

## Capas actuales

Las capas se generan desde `01_Datos_Proyecto`, `02_CAD/Leitung.kmz` y `02_CAD/Tragwerk.kmz`.

La web muestra:

- Leitung.
- Masten.
- Arbeitsflächen.
- Gerüste.
- Netz.
- Sperrungen.
- Zuwegung vorhanden.
- Zuwegung temporär.
- Beschilderung.
- Buffer Leitung 800m.
