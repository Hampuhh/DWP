<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, X, Copy } from '@lucide/svelte';
  import { COMBINACIONES, TIPOS_LABEL, type Combinacion, type TipoCombinacion } from '~/lib/combinaciones';
  import { PALETAS } from '~/lib/data';
  import { getPerfilCromatico } from '~/lib/storage';
  import type { EstacionColor } from '~/lib/types';

  let filtroTipo = $state<TipoCombinacion | 'todos'>('todos');
  let filtroEstacion = $state<EstacionColor | 'todas'>('todas');
  let busqueda = $state('');
  let detalle = $state<Combinacion | null>(null);
  let toast = $state<string | null>(null);
  let perfilEstacion = $state<EstacionColor | null>(null);

  onMount(async () => {
    const p = await getPerfilCromatico();
    perfilEstacion = p?.estacion ?? null;
  });

  // Tipos disponibles para filtrar (los que tienen al menos 1 combo)
  const tiposDisponibles = $derived(() => {
    const set = new Set<TipoCombinacion>();
    COMBINACIONES.forEach((c) => set.add(c.tipo));
    return Array.from(set);
  });

  const filtradas = $derived.by(() => {
    const term = busqueda.trim().toLowerCase().replace('#', '');
    return COMBINACIONES.filter((c) => {
      if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false;
      if (filtroEstacion !== 'todas' && c.estacion !== filtroEstacion) return false;
      if (term) {
        const inNombre = c.nombre.toLowerCase().includes(term);
        const inHex = c.colores.some((col) => col.toLowerCase().includes(term));
        if (!inNombre && !inHex) return false;
      }
      return true;
    });
  });

  // Bloquear scroll del body cuando detalle está abierto
  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = detalle ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  });

  // Escape cierra el modal
  $effect(() => {
    if (!detalle) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') detalle = null; };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function copiar(hex: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(hex);
      } else {
        const ta = document.createElement('textarea');
        ta.value = hex;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      mostrarToast(`Copiado · ${hex}`);
    } catch {
      mostrarToast(`Copia manual · ${hex}`, 3500);
    }
  }

  async function copiarTodas(combo: Combinacion) {
    const todos = combo.colores.join(' · ');
    await copiar(todos);
  }

  function mostrarToast(msg: string, ms = 1800) {
    toast = msg;
    setTimeout(() => { if (toast === msg) toast = null; }, ms);
  }

  function limpiarFiltros() {
    filtroTipo = 'todos';
    filtroEstacion = 'todas';
    busqueda = '';
  }

  // Lista de estaciones para el filtro (solo las que tienen al menos 1 combo)
  const estacionesDisponibles: EstacionColor[] = [
    'light-spring','true-spring','bright-spring',
    'light-summer','true-summer','soft-summer',
    'soft-autumn','true-autumn','dark-autumn',
    'dark-winter','true-winter','bright-winter',
  ];
</script>

<!-- ────────────────────────────────────────────────────────── -->
<!-- Toolbar de filtros                                          -->
<!-- ────────────────────────────────────────────────────────── -->
<section class="diccionario-toolbar">
  <div class="dt-primary">
    <label class="dt-search">
      <Search size={16} strokeWidth={1.5} />
      <input
        type="search"
        placeholder="Buscar por nombre o hex…"
        bind:value={busqueda}
      />
      {#if busqueda}
        <button class="dt-search__clear" onclick={() => busqueda = ''} aria-label="Limpiar">
          <X size={14} strokeWidth={1.5} />
        </button>
      {/if}
    </label>
    <p class="dt-count">
      <span class="ed-mark">{filtradas.length}</span>
      <span class="ed-mark"> · DE {COMBINACIONES.length} COMBINACIONES</span>
    </p>
  </div>

  <div class="dt-filter-row">
    <span class="ed-eyebrow">POR TIPO</span>
    <div class="dt-chips">
      <button
        class="chip {filtroTipo === 'todos' ? 'is-active' : ''}"
        onclick={() => filtroTipo = 'todos'}>Todos</button>
      {#each tiposDisponibles() as t}
        <button
          class="chip {filtroTipo === t ? 'is-active' : ''}"
          onclick={() => filtroTipo = t}>{TIPOS_LABEL[t]}</button>
      {/each}
    </div>
  </div>

  <div class="dt-filter-row">
    <span class="ed-eyebrow">POR ESTACIÓN</span>
    <div class="dt-chips">
      <button
        class="chip {filtroEstacion === 'todas' ? 'is-active' : ''}"
        onclick={() => filtroEstacion = 'todas'}>Todas</button>
      {#if perfilEstacion}
        <button
          class="chip {filtroEstacion === perfilEstacion ? 'is-active--accent' : ''}"
          onclick={() => filtroEstacion = perfilEstacion!}>
          ★ La mía
        </button>
      {/if}
      {#each estacionesDisponibles as e}
        <button
          class="chip {filtroEstacion === e ? 'is-active' : ''}"
          onclick={() => filtroEstacion = e}>{PALETAS[e].nombre}</button>
      {/each}
    </div>
  </div>
</section>

<!-- ────────────────────────────────────────────────────────── -->
<!-- Grid del diccionario                                        -->
<!-- ────────────────────────────────────────────────────────── -->
{#if filtradas.length === 0}
  <div class="dicc-empty">
    <p class="ed-eyebrow">SIN RESULTADOS</p>
    <p>Ninguna combinación coincide con tus filtros actuales.</p>
    <button class="btn btn--secondary" onclick={limpiarFiltros}>Limpiar filtros</button>
  </div>
{:else}
  <ol class="dicc-grid">
    {#each filtradas as c (c.id)}
      <li>
        <button class="dicc-card" onclick={() => detalle = c}>
          <div class="dicc-card__bands">
            {#each c.colores as color}
              <span class="dicc-card__band" style="background:{color}"></span>
            {/each}
          </div>
          <div class="dicc-card__meta">
            <span class="dicc-card__id">{c.id}</span>
            <span class="dicc-card__nombre">{c.nombre}</span>
            <span class="dicc-card__tipo">{TIPOS_LABEL[c.tipo]}</span>
          </div>
        </button>
      </li>
    {/each}
  </ol>
{/if}

<!-- ────────────────────────────────────────────────────────── -->
<!-- Modal de detalle                                            -->
<!-- ────────────────────────────────────────────────────────── -->
{#if detalle}
  <div class="dicc-modal" role="presentation" onclick={() => detalle = null}>
    <div class="dicc-modal__panel" role="dialog" aria-modal="true" aria-labelledby="dicc-modal-title"
         onclick={(e) => e.stopPropagation()}>
      <header class="dicc-modal__head">
        <div>
          <p class="ed-mark">{detalle.id} · {TIPOS_LABEL[detalle.tipo]}</p>
          <h2 id="dicc-modal-title" class="dicc-modal__title">{detalle.nombre}</h2>
          {#if detalle.estacion}
            <p class="dicc-modal__estacion">
              Estación · <em>{PALETAS[detalle.estacion].nombre}</em>
            </p>
          {/if}
        </div>
        <button class="iconbtn" onclick={() => detalle = null} aria-label="Cerrar">
          <X size={20} strokeWidth={1.5} />
        </button>
      </header>

      <div class="dicc-modal__visual">
        {#each detalle.colores as color}
          <span class="dicc-modal__band" style="background:{color}"></span>
        {/each}
      </div>

      <div class="dicc-modal__codes">
        {#each detalle.colores as color, i}
          <button class="dicc-modal__code" onclick={() => copiar(color)}>
            <span class="dicc-modal__code-swatch" style="background:{color}"></span>
            <span class="dicc-modal__code-hex">{color.toUpperCase()}</span>
            <span class="dicc-modal__code-pos">{['I','II','III','IV','V'][i]}</span>
            <Copy size={14} strokeWidth={1.5} />
          </button>
        {/each}
      </div>

      <div class="dicc-modal__cta">
        <button class="btn btn--bold" onclick={() => copiarTodas(detalle!)}>
          <Copy size={14} strokeWidth={1.6} /> Copiar todos como texto
        </button>
        {#if detalle.estacion}
          <a class="btn btn--secondary" href="../mi-paleta">
            Ver paleta de {PALETAS[detalle.estacion].nombre}
          </a>
        {/if}
      </div>

      {#if detalle.notas}
        <p class="dicc-modal__notas">{detalle.notas}</p>
      {/if}
    </div>
  </div>
{/if}

{#if toast}<div class="dicc-toast">{toast}</div>{/if}

<style>
  /* ── Toolbar ────────────────────────────────────────────── */
  .diccionario-toolbar {
    margin: var(--space-7) 0 var(--space-9);
    padding-bottom: var(--space-7);
    border-bottom: 1.5px solid var(--color-negro);
  }
  .dt-primary {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-5);
    align-items: center;
    margin-bottom: var(--space-5);
  }
  .dt-search {
    display: flex; align-items: center; gap: var(--space-3);
    background: var(--color-crema);
    border: 1px solid var(--color-linea);
    padding: 0 var(--space-4);
    color: var(--color-negro-60);
    transition: border-color var(--motion-fast);
  }
  .dt-search:focus-within { border-color: var(--color-negro); color: var(--color-negro); }
  .dt-search input {
    flex: 1; background: transparent; border: none; outline: none;
    padding: 14px 0; font-family: var(--font-sans); font-size: 15px;
    color: var(--color-negro); min-height: 44px;
  }
  .dt-search input::placeholder { color: var(--color-negro-45); font-style: italic; }
  .dt-search__clear {
    background: transparent; border: none; cursor: pointer;
    color: var(--color-negro-60); padding: 4px;
    min-width: 28px; min-height: 28px;
  }
  .dt-search__clear:hover { color: var(--color-negro); }

  .dt-count {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.24em;
    color: var(--color-negro-60);
    margin: 0;
    white-space: nowrap;
    text-align: right;
  }
  .dt-count .ed-mark:first-child {
    color: var(--color-terracota);
    font-weight: var(--weight-medium);
  }

  .dt-filter-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-5);
    margin-top: var(--space-4);
  }
  .dt-filter-row .ed-eyebrow {
    flex-shrink: 0;
    margin-top: 12px;
    min-width: 110px;
  }
  .dt-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    flex: 1;
  }

  @media (max-width: 720px) {
    .dt-primary { grid-template-columns: 1fr; }
    .dt-count { text-align: left; }
    .dt-filter-row { flex-direction: column; gap: var(--space-2); }
    .dt-filter-row .ed-eyebrow { margin-top: 0; }
  }

  /* ── Empty ──────────────────────────────────────────────── */
  .dicc-empty {
    padding: var(--space-9);
    text-align: center;
    border: 1px dashed var(--color-linea);
    background: var(--color-crema);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-items: center;
  }
  .dicc-empty p {
    font-family: var(--font-serif);
    font-size: 20px;
    margin: 0;
  }

  /* ── Grid de combinaciones ──────────────────────────────── */
  .dicc-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1px;
    background: var(--color-linea);
    border: 1px solid var(--color-linea);
  }
  .dicc-grid > li { background: var(--color-marfil); }

  .dicc-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0;
    background: var(--color-marfil);
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--motion-fast);
  }
  .dicc-card:hover { background: var(--color-crema); }

  /* Bandas verticales de color — el "look Wada" */
  .dicc-card__bands {
    display: flex;
    flex-direction: column;
    aspect-ratio: 1 / 1.15;
    overflow: hidden;
  }
  .dicc-card__band {
    flex: 1;
    display: block;
    transition: flex var(--motion-base);
  }
  .dicc-card:hover .dicc-card__band:first-child { flex: 1.3; }

  .dicc-card__meta {
    padding: var(--space-3) var(--space-4) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px solid var(--color-linea);
  }
  .dicc-card__id {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.24em;
    color: var(--color-terracota);
  }
  .dicc-card__nombre {
    font-family: var(--font-serif);
    font-size: 14.5px;
    line-height: 1.25;
    font-weight: var(--weight-medium);
    color: var(--color-negro);
  }
  .dicc-card__tipo {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--color-negro-45);
    margin-top: 2px;
  }

  @media (max-width: 540px) {
    .dicc-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Modal de detalle ───────────────────────────────────── */
  .dicc-modal {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(42, 40, 37, 0.55);
    backdrop-filter: blur(2px);
    display: grid; place-items: center;
    padding: var(--space-6);
  }
  .dicc-modal__panel {
    background: var(--color-marfil);
    border: 1.5px solid var(--color-negro);
    width: 100%; max-width: 640px;
    max-height: 92vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 768px) {
    .dicc-modal { padding: 0; }
    .dicc-modal__panel { max-height: 100vh; height: 100vh; }
  }

  .dicc-modal__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--space-7) var(--space-7) var(--space-5);
    border-bottom: 1px solid var(--color-linea);
  }
  .dicc-modal__title {
    font-family: var(--font-serif);
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1.1;
    font-weight: var(--weight-medium);
    margin: var(--space-2) 0 var(--space-2);
    color: var(--color-negro);
    letter-spacing: -0.005em;
  }
  .dicc-modal__estacion {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--color-negro-60);
    margin: 0;
  }
  .dicc-modal__estacion em {
    font-style: italic;
    color: var(--color-terracota);
  }
  .iconbtn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
    min-width: 44px;
    min-height: 44px;
    color: var(--color-negro);
    display: grid;
    place-items: center;
  }

  .dicc-modal__visual {
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }
  .dicc-modal__band {
    flex: 1;
    min-height: 48px;
  }

  .dicc-modal__codes {
    padding: var(--space-5) var(--space-7);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    border-top: 1px solid var(--color-linea);
  }
  .dicc-modal__code {
    display: grid;
    grid-template-columns: 36px 1fr auto auto;
    align-items: center;
    gap: var(--space-4);
    background: transparent;
    border: 1px solid var(--color-linea);
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    transition: all var(--motion-fast);
    text-align: left;
  }
  .dicc-modal__code:hover {
    border-color: var(--color-negro);
    background: var(--color-crema);
  }
  .dicc-modal__code-swatch {
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-linea);
  }
  .dicc-modal__code-hex {
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.12em;
    color: var(--color-negro);
  }
  .dicc-modal__code-pos {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 14px;
    color: var(--color-terracota);
  }

  .dicc-modal__cta {
    padding: var(--space-5) var(--space-7) var(--space-7);
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    border-top: 1px solid var(--color-linea);
  }

  .dicc-modal__notas {
    padding: var(--space-5) var(--space-7);
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 15px;
    line-height: 1.5;
    color: var(--color-negro);
    margin: 0;
    border-left: 2px solid var(--color-terracota);
    margin: 0 var(--space-7) var(--space-7);
  }

  /* ── Toast ──────────────────────────────────────────────── */
  .dicc-toast {
    position: fixed;
    bottom: var(--space-7);
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-negro);
    color: var(--color-marfil);
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-sans);
    font-size: 12px;
    letter-spacing: var(--tracking-wide);
    z-index: 1100;
  }
</style>
