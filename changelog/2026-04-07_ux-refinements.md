# 2026-04-07 — Refinamientos de UX

## Branding

### Logo con icono Leaf
- Se agregó el icono `Leaf` de Lucide React como logo del proyecto en el color primario `#1D9E75`
- Visible en el header de navegación y en la pantalla de login

### Favicon y OG images
- **`/icon.svg`** — Favicon SVG con icono Leaf en `#1D9E75`, compatible con todos los navegadores
- **`/apple-icon`** — Apple touch icon (180×180 PNG): Leaf blanco sobre fondo verde, bordes redondeados
- **`/opengraph-image`** — Imagen para redes sociales (1200×630 JPEG): gradiente verde con Leaf + "MIG Export" + tagline
- Se eliminó el favicon.ico anterior y los SVGs de template de Next.js (file.svg, globe.svg, next.svg, vercel.svg, window.svg)

### Compliance con WhatsApp
- Formato JPEG para OG image (menor peso, bien bajo el límite de 300KB de WhatsApp)
- Meta tags explícitos: `og:image:width` (1200), `og:image:height` (630), `og:image:type` (image/jpeg)
- `og:title` y `og:description` presentes (requeridos por WhatsApp para generar vista previa)
- Locale `es_GT` configurado
- Twitter card `summary_large_image` como fallback

## Contenedores

### Selector de tamaño por contenedor
- Cada contenedor ahora tiene un toggle `20' / 40'` integrado en su header
- Al cambiar el tamaño, la capacidad se actualiza automáticamente (10,000 kg vs 23,000 kg) y el P&L se recalcula
- El botón "Agregar contenedor" ahora crea contenedores de 20' por defecto (el caso de uso más común) sin necesidad de dropdown

### Filtrado de costos por tamaño de contenedor
- El diálogo de detalle de costos solo muestra Anexo 3 (gastos 20') cuando hay contenedores de 20' y Anexo 4 (gastos 40') cuando hay contenedores de 40'
- El desglose expandible de costos operativos en el estado de resultados aplica el mismo filtro: oculta categorías de costos con total $0 para tamaños de contenedor no utilizados
- Elimina confusión al no mostrar costos irrelevantes al tamaño de contenedor seleccionado

## Estructura del proyecto
- La aplicación se movió de `mig-export/` a la raíz del repositorio, según las reglas del proyecto
- Se eliminó el repositorio git anidado que generó `create-next-app`
