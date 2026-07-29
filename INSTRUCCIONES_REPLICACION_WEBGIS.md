# Instrucciones Universales Para Replicar Una WebGIS De Proyecto

Este documento describe un procedimiento reutilizable para crear una WebGIS estatica tipo Leaflet, publicar en GitHub Pages y dejar trazabilidad tecnica del trabajo realizado con asistencia de IA.

El flujo esta basado en la experiencia de Audorf-Kassoe y Karben.

## 1. Objetivo

Crear una WebGIS estatica de proyecto que permita visualizar datos de planificacion, accesos, apoyos, superficies de trabajo, catastro, permisos y capas auxiliares, con un flujo de actualizacion sencillo.

La web debe poder publicarse en GitHub Pages y mantenerse con datos generados desde fuentes GIS locales como QGIS, GPKG, KMZ, KML, DXF o Excel.

## 2. Estructura Base Recomendada

Crear una carpeta principal llamada `server` dentro del directorio de trabajo del proyecto.

Estructura:

```text
server/
  01_QGIS/
  02_CAD/
  03_DATA/
  04_PERMITS/
  05_WEB/
    assets/
    data/
    tools/
  06_ATLAS/
  07_ASSETS/
  .github/
    workflows/
      pages.yml
  README.md
  INSTRUCCIONES_REPLICACION_WEBGIS.md
  index.html
```

Uso:

| Carpeta | Uso |
| --- | --- |
| `01_QGIS/` | Proyecto QGIS, estilos, copias de trabajo o configuraciones auxiliares. |
| `02_CAD/` | KMZ, KML, DXF, DWG u otros archivos CAD/GIS originales. |
| `03_DATA/` | Datos intermedios generados por scripts. |
| `04_PERMITS/` | Exceles de permisos o propietarios, si aplica. |
| `05_WEB/` | Web estatica Leaflet. |
| `05_WEB/assets/` | Logos, imagenes, documentos PDF y recursos visuales. |
| `05_WEB/data/` | GeoJSON finales consumidos por Leaflet. |
| `05_WEB/tools/` | Scripts de conversion, actualizacion y validacion. |
| `06_ATLAS/` | Atlas, screenshots o entregables cartograficos. |
| `07_ASSETS/` | Recursos auxiliares no directamente publicados. |

## 3. Informacion Minima Necesaria

Antes de montar la web se debe definir:

| Dato | Ejemplo |
| --- | --- |
| Nombre visible | `Karben 042-051` |
| Proyecto / tramo / Leitung | `Karben 042-051` |
| Autor o equipo | `Alberto Gomez` |
| Fecha inicial | `29.07.2026` |
| Repositorio GitHub | `https://github.com/albertito1998/Karben` |
| Metodo de publicacion | GitHub Pages con GitHub Actions |

## 4. Fuentes De Datos Posibles

La WebGIS puede construirse desde distintas fuentes:

| Fuente | Uso tipico |
| --- | --- |
| `KMZ/KML` | Apoyos, trazas, puntos de interes, exportaciones de Google Earth. |
| `GPKG` | Capas GIS de QGIS con geometria y atributos. |
| `DXF/DWG` | Capas CAD de accesos, superficies, protecciones o caminos. |
| `Excel` | Permisos, propietarios, estados, listados tecnicos. |
| `WFS/WMS` | Catastro, medio ambiente, servicios oficiales. |

En cada proyecto se debe documentar cual es la fuente oficial de cada capa.

## 5. Conversion A GeoJSON

La web debe consumir preferiblemente GeoJSON locales guardados en:

```text
05_WEB/data/
```

Ventajas:

- La web carga mas rapido.
- No depende de QGIS ni de servicios externos para las capas principales.
- GitHub Pages puede publicar los datos directamente.
- La trazabilidad queda clara porque cada GeoJSON se genera desde una fuente concreta.

Ejemplo de conversion en Karben:

```powershell
py 05_WEB/tools/build_layers.py
```

El script debe:

- Leer los archivos fuente.
- Convertir geometria a EPSG:4326 para Leaflet.
- Mantener los atributos utiles.
- Escribir un GeoJSON por capa.
- Crear un manifiesto con conteos.

Ejemplo de manifiesto:

```text
05_WEB/data/layers_manifest.json
```

## 6. Web Leaflet

Archivos minimos:

```text
05_WEB/index.html
05_WEB/style.css
05_WEB/app.js
```

Funcionalidad recomendada:

- Base OpenStreetMap.
- Base satelite ESRI.
- Control de capas.
- Popups con atributos.
- Etiquetas para apoyos.
- Buscador `Go To Mast`.
- Coordenadas de cursor en WGS84 y UTM.
- Fecha de ultima actualizacion visible en cabecera.
- Logo de proyecto o empresa.

## 7. GitHub Pages

Para publicar desde GitHub Actions se recomienda:

```text
.github/workflows/pages.yml
```

Workflow base:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

En GitHub, revisar en `Settings > Pages` que la fuente sea GitHub Actions.

## 8. Validacion Antes De Publicar

Comandos recomendados:

```powershell
py -m py_compile 05_WEB/tools/build_layers.py
node --check 05_WEB/app.js
```

Comprobar conteos:

```powershell
Get-Content 05_WEB/data/layers_manifest.json
```

Probar localmente:

```powershell
py -m http.server 5510
```

Abrir:

```text
http://localhost:5510/05_WEB/index.html
```

## 9. Deploy Habitual

Pasos:

```powershell
git status -sb
git add --all
git commit -m "Update WebGIS data"
git push origin main
```

Despues verificar:

```text
https://<usuario>.github.io/<repositorio>/
```

## 10. Trazabilidad Del Uso De IA

Para cada sesion de trabajo asistida por IA, registrar:

| Campo | Contenido recomendado |
| --- | --- |
| Fecha | Fecha real de la sesion. |
| Herramienta | Codex / ChatGPT / Claude / otra. |
| Proyecto | Nombre del proyecto y tramo. |
| Categoria | GIS, automatizacion, documentacion, deploy, revision. |
| Entradas | Archivos usados: KMZ, QGIS, GPKG, Excel, DXF, etc. |
| Acciones | Conversiones, scripts creados, capas generadas, validaciones. |
| Salidas | Web, GeoJSON, README, KMZ, Excel, screenshots, commit. |
| Validacion | Comandos ejecutados y resultado. |
| Repositorio | URL y commit si hubo push. |

Ejemplo:

```text
Fecha: 29.07.2026
Herramienta: Codex
Proyecto: Karben 042-051
Categoria: WebGIS / automatizacion GIS
Entradas: Leitung.kmz, Tragwerk.kmz, QGIS Zuwegungen, GeoPackage de superficies
Acciones: Creacion de estructura server, conversion GPKG/KMZ a GeoJSON, montaje Leaflet, configuracion GitHub Pages
Salidas: WebGIS publicada, build_layers.py, README, workflow Pages
Validacion: py_compile OK, node --check OK, HTTP 200 en GitHub Pages
Commit: 17d9654 Create Karben WebGIS
```

## 11. Buenas Practicas

- No publicar Exceles con datos personales en repositorios publicos.
- Mantener fuentes pesadas o sensibles fuera de Git si no son necesarias para la web.
- Documentar siempre de que archivo fuente sale cada GeoJSON.
- No mezclar cambios de datos con refactors grandes de la web.
- Actualizar la fecha de cabecera cuando cambien datos publicados.
- Mantener los scripts de conversion dentro de `05_WEB/tools/`.
- Mantener los datos web finales en `05_WEB/data/`.
- Revisar que los popups no expongan informacion sensible.

## 12. Checklist Rapida Para Nuevo Proyecto

```text
[ ] Crear carpeta server.
[ ] Crear subcarpetas base.
[ ] Copiar logo y assets basicos.
[ ] Colocar KMZ/GPKG/DXF/Excel fuente.
[ ] Crear o adaptar script de conversion.
[ ] Generar GeoJSON.
[ ] Crear index.html, style.css y app.js.
[ ] Validar JS y Python.
[ ] Probar en servidor local.
[ ] Crear repo GitHub o conectar remoto existente.
[ ] Configurar GitHub Pages.
[ ] Hacer commit y push.
[ ] Verificar URL publica.
[ ] Documentar entradas, salidas, fecha y commit.
```
