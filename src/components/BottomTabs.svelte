<script lang="ts">
  import { onMount } from 'svelte';
  import { Shirt, Sparkles, Palette, Heart, Home } from '@lucide/svelte';

  // Lista de patrones de URL que activan el bottom-tab
  const APP_ROUTES = ['mi-closet', 'generador', 'mi-paleta', 'favoritos', 'settings', 'outfits'];

  let path = $state('/');

  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  function readPath() {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  }

  onMount(() => {
    path = readPath();
    // popstate cubre back/forward; los cambios de href son full reload en Astro,
    // así que no hace falta SPA-routing detection
    const onPop = () => { path = readPath(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  });

  const inApp = $derived(APP_ROUTES.some((r) => path.includes('/' + r)));

  function isActive(slug: string): boolean {
    // Match exacto o sub-ruta (ej. /outfits/cafe match con 'outfits')
    return path.includes('/' + slug);
  }
</script>

{#if inApp}
  <nav class="bottom-tabs" aria-label="Navegación principal">
    <a class={`btab ${isActive('mi-closet') ? 'is-active' : ''}`} href={`${base}/mi-closet`}>
      <Shirt size={20} strokeWidth={1.5} />
      <span>Closet</span>
    </a>
    <a class={`btab ${isActive('generador') || isActive('outfits') ? 'is-active' : ''}`} href={`${base}/generador`}>
      <Sparkles size={20} strokeWidth={1.5} />
      <span>Generar</span>
    </a>
    <a class={`btab ${isActive('mi-paleta') ? 'is-active' : ''}`} href={`${base}/mi-paleta`}>
      <Palette size={20} strokeWidth={1.5} />
      <span>Paleta</span>
    </a>
    <a class={`btab ${isActive('favoritos') ? 'is-active' : ''}`} href={`${base}/favoritos`}>
      <Heart size={20} strokeWidth={1.5} />
      <span>Favoritos</span>
    </a>
    <a class="btab" href={`${base}/`}>
      <Home size={20} strokeWidth={1.5} />
      <span>Inicio</span>
    </a>
  </nav>
{/if}

<style>
  .bottom-tabs {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 80;
    background: var(--color-marfil);
    border-top: 1.5px solid var(--color-negro);
    padding: 4px 2px;
    padding-bottom: calc(4px + env(safe-area-inset-bottom, 0));
    grid-template-columns: repeat(5, 1fr);
    gap: 1px;
    box-shadow: 0 -8px 24px -16px rgba(42,40,37,0.18);
  }
  @media (max-width: 768px) {
    .bottom-tabs { display: grid; }
  }

  .btab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 4px;
    text-decoration: none;
    color: var(--color-negro-60);
    font-family: var(--font-sans);
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: var(--weight-medium);
    min-height: 56px;
    transition: color var(--motion-fast);
    border-top: 2px solid transparent;
  }
  .btab:hover { color: var(--color-negro); }
  .btab.is-active {
    color: var(--color-terracota);
    border-top-color: var(--color-terracota);
  }
  .btab span { line-height: 1; }
</style>
