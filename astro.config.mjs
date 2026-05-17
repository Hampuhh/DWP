// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

// Configuración multi-entorno:
//  - En dev: site/base normales
//  - En build para GitHub Pages: site = https://USUARIO.github.io, base = /REPO/
//
// Cuando configures el repo, las variables PUBLIC_GH_USER y PUBLIC_GH_REPO
// se inyectarán desde GitHub Actions (ver .github/workflows/deploy.yml).
const ghUser = process.env.PUBLIC_GH_USER ?? '';
const ghRepo = process.env.PUBLIC_GH_REPO ?? 'estilo';
const site = ghUser ? `https://${ghUser}.github.io` : undefined;
const base = ghUser ? `/${ghRepo}/` : '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'never',
  build: {
    format: 'file',
    assets: 'assets',
  },
  integrations: [
    svelte(),
    starlight({
      title: 'estilo',
      description: 'Tu estilo, tu manera — guía personal de imagen.',
      defaultLocale: 'es',
      locales: {
        root: { label: 'Español', lang: 'es' },
      },
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      customCss: [
        './src/styles/tokens.css',
        './src/styles/fonts.css',
        './src/styles/custom.css',
      ],
      head: [
        // Default theme = light (sobrescribe la detección por prefers-color-scheme
        // que viene de Starlight, sin perder la posibilidad de elegir dark)
        {
          tag: 'script',
          content: `try { if (typeof localStorage !== 'undefined' && !localStorage.getItem('starlight-theme')) { localStorage.setItem('starlight-theme', 'light'); document.documentElement.dataset.theme = 'light'; } } catch(_) {}`,
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.googleapis.com',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: '',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
          },
        },
        {
          tag: 'meta',
          attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        },
      ],
      components: {
        Hero: './src/components/starlight/Hero.astro',
      },
      pagination: false,
      lastUpdated: false,
      credits: false,
      sidebar: [
        {
          label: 'MI ESPACIO',
          items: [
            { label: 'Bienvenida', link: '/' },
            { label: 'Mi closet', link: '/mi-closet' },
            { label: 'Generador de outfits', link: '/generador' },
            { label: 'Mis favoritos', link: '/favoritos' },
            { label: 'Inspiración', link: '/inspiracion' },
          ],
        },
        {
          label: 'ESENCIALES',
          items: [
            { label: 'Mi paleta de colores', link: '/mi-paleta' },
            {
              label: 'Las 12 estaciones',
              items: [
                { label: 'Visión general', link: '/estaciones' },
                { label: 'Primaveras', link: '/estaciones/primaveras' },
                { label: 'Veranos', link: '/estaciones/veranos' },
                { label: 'Otoños', link: '/estaciones/otonos' },
                { label: 'Inviernos', link: '/estaciones/inviernos' },
              ],
            },
            { label: 'Auto-diagnóstico', link: '/auto-diagnostico' },
            { label: 'Mi tipo de figura', link: '/tipo-de-figura' },
            { label: 'Forma de rostro', link: '/forma-de-rostro' },
          ],
        },
        {
          label: 'GUÍA DE VESTIR',
          items: [
            { label: 'Códigos de vestimenta', link: '/codigos-de-vestimenta' },
            { label: 'Teoría del color', link: '/teoria-del-color' },
            { label: 'Combinaciones que funcionan', link: '/combinaciones' },
            { label: 'Estilos y arquetipos', link: '/estilos-y-arquetipos' },
            { label: 'Accesorios', link: '/accesorios' },
          ],
        },
        {
          label: 'MI ARMARIO',
          items: [
            { label: 'Prendas esenciales', link: '/prendas-esenciales' },
            { label: 'Calidad y telas', link: '/calidad-y-telas' },
            { label: 'Cuidado', link: '/cuidado' },
            { label: 'Armario cápsula', link: '/armario-capsula' },
          ],
        },
        {
          label: 'RECURSOS',
          items: [
            { label: 'Libros', link: '/libros' },
            { label: 'Apps y marcas', link: '/apps-y-marcas' },
          ],
        },
        {
          label: 'AJUSTES',
          items: [
            { label: 'Ajustes', link: '/settings' },
          ],
        },
      ],
    }),
    mdx(),
  ],
});
