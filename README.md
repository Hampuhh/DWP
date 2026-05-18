# Diplomats wear *prada*

Una plataforma personal y privada de imagen — colorimetría, closet digital y
generador de outfits. Astro + Starlight + Svelte 5. Todo local, sin backend.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:4321/
npm run dev -- --host  # también accesible desde el celular en la misma WiFi
```

## Build de producción

```bash
npm run build
npm run preview
```

El output queda en `dist/`. En GitHub Pages se publica automáticamente con cada
push a `main` (ver `.github/workflows/deploy.yml`).

URL en producción: **https://hampuhh.github.io/DWP/**

## Estructura

- `src/content/docs/` — páginas de la guía (markdown y MDX)
- `src/components/` — componentes Astro y Svelte
- `src/lib/` — lógica de dominio (color, storage, tipos, catálogo)
- `src/styles/` — tokens del design system y overrides de Starlight

## Privacidad

Toda la información del closet, outfits favoritos y perfil cromático vive en
**IndexedDB del navegador** (con fallback a localStorage). No hay backend, no
hay analítica, no hay tracking. Si desinstalas el sitio o limpias el navegador,
los datos se borran. Usa el botón **Backup** del closet para descargar un JSON
y guardarlo en iCloud o donde prefieras.
