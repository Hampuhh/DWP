<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';
  import { Sparkles, RotateCw, Star, Heart, AlertCircle, ShoppingBag } from '@lucide/svelte';
  import type { Categoria, Contexto, Outfit, PerfilCromatico, Prenda, Subcategoria } from '~/lib/types';
  import { CONTEXTOS, PALETAS } from '~/lib/data';
  import { validarCombinacion, type EsquemaCromatico, hexToHsl } from '~/lib/color';
  import {
    getClosetCompleto, getOutfitsFavoritos, guardarOutfit, incrementarUso, getPerfilCromatico,
    eliminarOutfit,
  } from '~/lib/storage';

  // Props: el componente se puede embeber con un contexto fijo (lockContexto)
  // desde OutfitsPorContexto, o ser standalone (página /generador).
  let {
    contextoInicial = 'dia' as Contexto,
    lockContexto = false,
  }: { contextoInicial?: Contexto; lockContexto?: boolean } = $props();

  let closet = $state<Prenda[]>([]);
  let favoritos = $state<Outfit[]>([]);
  let perfil = $state<PerfilCromatico | null>(null);
  let contextoActivo = $state<Contexto>(contextoInicial);
  let propuesta = $state<{
    prendas: Prenda[]; esquema: EsquemaCromatico; explicacion: string;
  } | null>(null);
  let toast = $state<string | null>(null);
  let cargando = $state(true);
  let intentos = $state(0);

  onMount(async () => {
    // Si NO está locked, permitir override por URL param (?contexto=cafe)
    if (!lockContexto && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('contexto');
      if (c && (c in CONTEXTOS)) contextoActivo = c as Contexto;
    }
    closet = await getClosetCompleto();
    favoritos = await getOutfitsFavoritos();
    perfil = (await getPerfilCromatico()) ?? null;
    cargando = false;
    if (closet.length > 0) regenerar();
  });

  const contextosArray = $derived(Object.values(CONTEXTOS));
  const favoritosContexto = $derived(favoritos.filter((o) => o.contexto === contextoActivo));

  // ── Catálogos de subcategorías por rol estructural ──
  const SUBCAT_CAPA_MEDIA  = ['jersey', 'cardigan'] as const;
  const SUBCAT_CALZADO_FORMAL = ['pump', 'botin', 'mocasin'] as const;
  const SUBCAT_CALZADO_CASUAL = ['sneaker', 'balerina', 'mocasin', 'botin', 'sandalia'] as const;
  const BASE_LIGERA       = ['camiseta', 'top', 'blusa'] as const;
  const NEUTROS_UNIVERSALES = [
    '#F5F1EA', '#FAF7F1', '#FFFFFF', '#FFF8B6',
    '#2A2825', '#000000', '#1C1C1C', '#1F2A44', '#22344D', '#36454F',
  ];

  // Filtrar prendas válidas para el contexto
  function aptaParaContexto(p: Prenda, ctx: Contexto): boolean {
    const info = CONTEXTOS[ctx];
    if (p.ocasiones.length === 0) return true; // sin restricciones registradas
    return p.ocasiones.some((o) => info.ocasionesPermitidas.includes(o));
  }

  function porCategoria(prendas: Prenda[], cat: Categoria): Prenda[] {
    return prendas.filter((p) => p.categoria === cat);
  }

  function porSubcats(prendas: Prenda[], subs: readonly Subcategoria[]): Prenda[] {
    return prendas.filter((p) => p.subcategoria && subs.includes(p.subcategoria));
  }

  // Selección ponderada: prendas con MENOS usos tienen MÁS probabilidad.
  // Esto fuerza una rotación democrática del armario (no siempre el mismo blazer).
  function pickWeighted(arr: Prenda[]): Prenda | null {
    if (arr.length === 0) return null;
    const weights = arr.map((p) => Math.max(1, 12 - p.usos));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }

  // Múltiples sin duplicar subcategoría (no dos bolsos, no dos pañuelos)
  function pickMultipleDistinct(arr: Prenda[], n: number): Prenda[] {
    if (arr.length <= n) return [...arr];
    const copia = [...arr];
    // Fisher-Yates shuffle
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    const out: Prenda[] = [];
    const subsUsadas = new Set<string>();
    for (const p of copia) {
      const sub = p.subcategoria || '__none__';
      if (subsUsadas.has(sub)) continue;
      out.push(p);
      subsUsadas.add(sub);
      if (out.length >= n) break;
    }
    return out;
  }

  function calzadoApto(p: Prenda, codigo: string): boolean {
    const sub = p.subcategoria;
    if (!sub) return true; // sin subcategoría, asumimos válido
    if (codigo === 'formal' || codigo === 'cocktail') {
      return SUBCAT_CALZADO_FORMAL.includes(sub as any);
    }
    if (codigo === 'casual') {
      return SUBCAT_CALZADO_CASUAL.includes(sub as any);
    }
    return true; // smart-casual: todos
  }

  // Reglas de fit: máximo 1 prenda oversized, no wide-leg + oversized arriba
  function fitHarmonico(piezas: Prenda[]): boolean {
    const oversized = piezas.filter((p) => p.fit === 'oversized').length;
    if (oversized > 1) return false;
    const wideleg = piezas.find((p) => p.fit === 'wide-leg' && p.categoria === 'Bottom');
    const oversizedArriba = piezas.find(
      (p) => p.fit === 'oversized' && (p.categoria === 'Top' || p.categoria === 'Abrigo'),
    );
    if (wideleg && oversizedArriba) return false; // demasiado volumen total
    return true;
  }

  function esCercanoAPaleta(hex: string, paleta: string[]): boolean {
    const [h1, , l1] = hexToHsl(hex);
    return paleta.some((p) => {
      const [h2, , l2] = hexToHsl(p);
      const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
      const dl = Math.abs(l1 - l2);
      return dh < 30 && dl < 0.25;
    });
  }

  function esNeutroUniversal(hex: string): boolean {
    return NEUTROS_UNIVERSALES.some((u) => {
      const [h1, , l1] = hexToHsl(hex);
      const [h2, , l2] = hexToHsl(u);
      const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
      return dh < 25 && Math.abs(l1 - l2) < 0.18;
    });
  }

  function respetaPaletaEstricto(colores: string[]): boolean {
    if (!perfil) return true;
    const paleta = PALETAS[perfil.estacion];
    const tonosPaleta = [...paleta.neutros, ...paleta.acentos, ...paleta.statement];
    return colores.every((c) => esCercanoAPaleta(c, tonosPaleta) || esNeutroUniversal(c));
  }

  // ────────────────────────────────────────────────────────
  // GENERADOR · jerarquía de capas + reglas de coherencia
  // ────────────────────────────────────────────────────────
  function intentarPropuesta(): {
    prendas: Prenda[]; esquema: EsquemaCromatico; explicacion: string;
  } | null {
    const aptas = closet.filter((p) => aptaParaContexto(p, contextoActivo));
    if (aptas.length === 0) return null;

    const codigoCtx = CONTEXTOS[contextoActivo].codigo;
    const seleccion: Prenda[] = [];
    let baseEsVestido = false;

    // ── CAPA 1 (base): Vestido o Top+Bottom ──
    const vestidos = porCategoria(aptas, 'Vestido');
    const tops = porCategoria(aptas, 'Top').filter(
      (p) => !p.subcategoria || !SUBCAT_CAPA_MEDIA.includes(p.subcategoria as any),
    );
    const bottoms = porCategoria(aptas, 'Bottom');

    // Sesgo: cocktail/formal favorece vestidos
    const probVestido =
      codigoCtx === 'cocktail' || codigoCtx === 'formal' ? 0.55 : 0.3;
    const intentarVestido = vestidos.length > 0 && Math.random() < probVestido;

    if (intentarVestido || tops.length === 0 || bottoms.length === 0) {
      if (vestidos.length === 0) return null;
      const v = pickWeighted(vestidos);
      if (!v) return null;
      seleccion.push(v);
      baseEsVestido = true;
    } else {
      const t = pickWeighted(tops);
      const b = pickWeighted(bottoms);
      if (!t || !b) return null;
      seleccion.push(t, b);
    }

    // ── CAPA 2 (media): jersey/cardigan, solo si base es ligera y no es vestido ──
    if (!baseEsVestido) {
      const baseTop = seleccion[0];
      const baseEsLigera =
        baseTop.subcategoria && BASE_LIGERA.includes(baseTop.subcategoria as any);
      if (baseEsLigera) {
        const candidatosMedia = porSubcats(porCategoria(aptas, 'Top'), SUBCAT_CAPA_MEDIA);
        if (candidatosMedia.length > 0 && Math.random() < 0.35) {
          const m = pickWeighted(candidatosMedia);
          if (m) seleccion.push(m);
        }
      }
    }

    // ── CAPA 3 (exterior): blazer/trench/abrigo · probabilidad por código ──
    const yaTieneMedia = seleccion.some(
      (p) => p.subcategoria && SUBCAT_CAPA_MEDIA.includes(p.subcategoria as any),
    );
    const exteriores = porCategoria(aptas, 'Abrigo');
    const probExterior =
      codigoCtx === 'formal'       ? 0.85
      : codigoCtx === 'cocktail'   ? 0.55
      : codigoCtx === 'smart-casual' ? 0.4
      : yaTieneMedia                 ? 0.15
      :                                0.25;
    if (exteriores.length > 0 && Math.random() < probExterior) {
      const e = pickWeighted(exteriores);
      if (e) seleccion.push(e);
    }

    // ── CALZADO coherente con el código ──
    const calzadosAptos = porCategoria(aptas, 'Calzado').filter((p) =>
      calzadoApto(p, codigoCtx),
    );
    const calzadosFallback = porCategoria(aptas, 'Calzado');
    const pool = calzadosAptos.length > 0 ? calzadosAptos : calzadosFallback;
    const c = pickWeighted(pool);
    if (c) seleccion.push(c);

    // ── ACCESORIOS (1-2, sin duplicar subcategoría) ──
    const accesorios = porCategoria(aptas, 'Accesorio');
    const numAcc =
      accesorios.length === 0 ? 0
      : codigoCtx === 'cocktail' || codigoCtx === 'formal' ? Math.min(2, accesorios.length)
      : Math.random() < 0.6 ? 1 : 2;
    if (numAcc > 0) seleccion.push(...pickMultipleDistinct(accesorios, numAcc));

    // ── VALIDACIONES ──
    // 1. Fit harmony
    if (!fitHarmonico(seleccion)) return null;

    // 2. Esquema cromático armónico
    const colores = seleccion.map((p) => p.colorPrincipal);
    const validacion = validarCombinacion(colores);
    if (!validacion.valido) return null;

    // 3. Paleta personal — estricta
    if (!respetaPaletaEstricto(colores)) return null;

    // ── Explicación rica ──
    const explicacion = construirExplicacionRica(seleccion, validacion.esquema, validacion.explicacion, codigoCtx);

    return { prendas: seleccion, esquema: validacion.esquema, explicacion };
  }

  function construirExplicacionRica(
    piezas: Prenda[],
    _esquema: EsquemaCromatico,
    baseCromatica: string,
    codigo: string,
  ): string {
    const codigoLabel = ({
      casual:         'el casual relajado',
      'smart-casual': 'el smart casual',
      cocktail:       'el cocktail',
      formal:         'la formalidad',
    } as Record<string, string>)[codigo] ?? codigo;

    const partes: string[] = [baseCromatica];

    // Cuenta capas (solo top/vestido/abrigo)
    const numCapas = piezas.filter((p) =>
      p.categoria === 'Top' || p.categoria === 'Vestido' || p.categoria === 'Abrigo',
    ).length;
    if (numCapas >= 3) {
      partes.push(`Layering en ${numCapas} capas (base · intermedia · exterior) que conviven sin pelearse.`);
    } else if (numCapas === 2) {
      partes.push('Layering limpio: una capa de carácter sin saturar la silueta.');
    }

    // Detalle de fit
    const fitsDistintos = new Set(piezas.map((p) => p.fit).filter(Boolean));
    if (fitsDistintos.size > 1) {
      partes.push('Combina volúmenes distintos para crear proporción.');
    }

    // Calzado coherente
    const calzado = piezas.find((p) => p.categoria === 'Calzado');
    if (calzado?.subcategoria) {
      const labels: Record<string, string> = {
        pump:     'pump',
        mocasin:  'mocasín',
        balerina: 'balerina',
        botin:    'botín',
        bota:     'bota',
        sneaker:  'sneaker',
        sandalia: 'sandalia',
      };
      const calLabel = labels[calzado.subcategoria] ?? calzado.subcategoria;
      partes.push(`Cierra con ${calLabel}, alineado al código.`);
    }

    partes.push(`Adecuado para ${codigoLabel}.`);
    return partes.join(' ');
  }

  async function regenerar() {
    if (closet.length === 0) return;
    propuesta = null;
    // Intentamos varias veces hasta encontrar una combinación que pase las reglas
    for (let i = 0; i < 30; i++) {
      const intento = intentarPropuesta();
      if (intento) { propuesta = intento; intentos = i + 1; return; }
    }
    intentos = 30;
    mostrarToast('No se encontró una combinación armónica. Añade más prendas o ajusta filtros.');
  }

  async function meGusta(usar: boolean) {
    if (!propuesta) return;
    const o: Outfit = {
      id: uuid(),
      fecha: new Date().toISOString(),
      contexto: contextoActivo,
      prendaIds: propuesta.prendas.map((p) => p.id),
      porQueFunciona: propuesta.explicacion,
      usado: usar,
    };
    await guardarOutfit(o);
    if (usar) {
      for (const p of propuesta.prendas) await incrementarUso(p.id);
      closet = await getClosetCompleto();
    }
    favoritos = await getOutfitsFavoritos();
    mostrarToast(usar ? 'Outfit registrado como usado hoy' : 'Outfit guardado en favoritos');
  }

  function mostrarToast(msg: string, ms = 2500) {
    toast = msg;
    setTimeout(() => { if (toast === msg) toast = null; }, ms);
  }

  function cambiarContexto(c: Contexto) {
    contextoActivo = c;
    regenerar();
  }

  async function eliminarFavorito(id: string) {
    if (!confirm('¿Eliminar este outfit de favoritos?')) return;
    try {
      await eliminarOutfit(id);
      favoritos = await getOutfitsFavoritos();
      mostrarToast('Outfit eliminado de favoritos');
    } catch (err) {
      mostrarToast('No se pudo eliminar el outfit');
      console.error('[generador] eliminar:', err);
    }
  }

  function prendaById(id: string): Prenda | undefined {
    return closet.find((p) => p.id === id);
  }
</script>

{#if !lockContexto}
  <!-- Cabecera editorial + selector de contexto (modo standalone) -->
  <header class="ed-page-head">
    <div>
      <p class="ed-eyebrow">CAPÍTULO · MI ESPACIO</p>
      <h1 class="ed-page-head__title"><em>Generador</em> de outfits</h1>
    </div>
    <div class="ed-page-head__meta">
      <span class="ed-mark">VOL · I</span>
      <span class="ed-mark">SECCIÓN 02</span>
    </div>
    <p class="ed-page-head__lede">
      Eliges un plan; el sistema lee tu closet, aplica reglas cromáticas y propone
      una combinación coherente con tu paleta personal.
    </p>
  </header>

  <section class="contextos-bloque">
    <p class="ed-eyebrow">¿QUÉ PLAN TIENES?</p>
    <div class="contextos">
      {#each contextosArray as c}
        <button
          class="chip {contextoActivo === c.id ? 'is-active--accent' : ''}"
          onclick={() => cambiarContexto(c.id)}>
          {c.nombre}
        </button>
      {/each}
    </div>
  </section>

  <hr class="hr-hair" style="margin: var(--space-7) 0;" />
{/if}

<!-- Propuesta -->
{#if cargando}
  <p class="t-caption">Leyendo tu closet…</p>
{:else if closet.length === 0}
  <div class="empty">
    <h3 class="empty__title">Tu closet está <em>vacío</em></h3>
    <p class="empty__lede">
      Para generar outfits necesito al menos unas prendas catalogadas. Añade entre 5 y 10 piezas
      en distintas categorías y vuelve aquí.
    </p>
    <a class="btn btn--primary" href="../mi-closet">
      <ShoppingBag size={14} strokeWidth={1.6} /> Ir al closet
    </a>
  </div>
{:else if propuesta}
  <section class="propuesta">
    <header class="propuesta__head">
      <div>
        <p class="t-eyebrow">PROPUESTA PARA TI</p>
        <h2 class="propuesta__title">{CONTEXTOS[contextoActivo].nombre}</h2>
        <p class="t-mono">ESQUEMA · {propuesta.esquema.toUpperCase()} · INTENTO {intentos}</p>
      </div>
      <div class="propuesta__acciones">
        <button class="btn btn--secondary" onclick={regenerar}>
          <RotateCw size={14} strokeWidth={1.6} /> Otra propuesta
        </button>
        <button class="btn btn--secondary" onclick={() => meGusta(false)}>
          <Star size={14} strokeWidth={1.6} /> Guardar
        </button>
        <button class="btn btn--bold" onclick={() => meGusta(true)}>
          <Heart size={14} strokeWidth={1.6} /> Usar hoy
        </button>
      </div>
    </header>

    <div class="prendas-row">
      {#each propuesta.prendas as p (p.id)}
        <figure class="pieza">
          {#if p.foto}
            <img src={p.foto} alt={p.nombre} />
          {:else}
            <div class="placeholder-img" style="aspect-ratio:1;"></div>
          {/if}
          <div class="pieza__bar" style="background: {p.colorPrincipal};"></div>
          <figcaption>
            <span class="t-mono">{p.categoria.toUpperCase()}</span>
            <span class="pieza__nombre">{p.nombre}</span>
          </figcaption>
        </figure>
      {/each}
    </div>

    <aside class="porque">
      <p class="t-eyebrow">POR QUÉ FUNCIONA</p>
      <p class="porque__texto">{propuesta.explicacion}</p>
    </aside>
  </section>
{:else}
  <div class="warn">
    <AlertCircle size={20} strokeWidth={1.5} />
    <div class="warn__body">
      <p>Aún no encuentro una combinación armónica para <strong>{CONTEXTOS[contextoActivo].nombre.toLowerCase()}</strong>. Esto pasa cuando hay pocas prendas catalogadas para esa ocasión, o cuando los colores no encajan entre sí.</p>
      <div class="warn__acciones">
        <button class="btn btn--secondary" onclick={regenerar}>
          <RotateCw size={14} strokeWidth={1.6} /> Reintentar
        </button>
        <a class="btn btn--secondary" href="../mi-closet">
          Ir al closet
        </a>
      </div>
    </div>
  </div>
{/if}

<!-- Favoritos del contexto -->
{#if favoritosContexto.length > 0}
  <hr class="hr-hair" style="margin: var(--space-12) 0 var(--space-9);" />
  <section>
    <h3 class="bloque__title">Outfits que ya te <em>funcionan</em></h3>
    <ul class="favoritos">
      {#each favoritosContexto as o (o.id)}
        <li class="fav">
          <header class="fav__head">
            <span class="t-mono">{new Date(o.fecha).toLocaleDateString('es')}</span>
            <button class="iconbtn-text" onclick={() => eliminarFavorito(o.id)}>Eliminar</button>
          </header>
          <div class="fav__prendas">
            {#each o.prendaIds as pid}
              {@const p = prendaById(pid)}
              {#if p}
                <figure class="mini">
                  {#if p.foto}<img src={p.foto} alt={p.nombre} />
                  {:else}<div class="placeholder-img" style="aspect-ratio:1;"></div>{/if}
                  <div class="mini__bar" style="background:{p.colorPrincipal}"></div>
                  <figcaption class="t-caption">{p.nombre}</figcaption>
                </figure>
              {/if}
            {/each}
          </div>
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#if toast}<div class="toast">{toast}</div>{/if}

<style>
  .contextos-bloque { margin: var(--space-7) 0 var(--space-9); }
  .contextos-bloque .ed-eyebrow { margin-bottom: var(--space-4); display: inline-flex; }
  .contextos {
    display: flex; gap: var(--space-2); flex-wrap: wrap;
    margin-top: var(--space-4);
  }

  .empty {
    padding: var(--space-12) var(--space-8);
    text-align: center;
    border: var(--border-dashed);
    background: var(--color-crema);
    max-width: 32rem;
    margin: 0 auto;
  }
  .empty__title {
    font-family: var(--font-serif); font-size: var(--type-h3-size);
    margin: 0 0 var(--space-4);
  }
  .empty__title :global(em) { font-style: italic; color: var(--color-terracota); }
  .empty__lede { color: var(--color-negro-60); margin: 0 0 var(--space-7); }

  .propuesta__head {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: var(--space-5); flex-wrap: wrap;
    margin-bottom: var(--space-7);
  }
  .propuesta__title {
    font-family: var(--font-serif); font-size: var(--type-h2-size);
    font-weight: var(--weight-medium); line-height: 1.0;
    margin: var(--space-3) 0;
  }
  .propuesta__acciones { display: flex; gap: var(--space-3); flex-wrap: wrap; }

  .prendas-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-7);
  }
  .pieza { margin: 0; }
  .pieza img {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border: var(--border-hairline); display: block;
  }
  .pieza__bar { height: 4px; }
  .pieza figcaption {
    display: flex; flex-direction: column; gap: var(--space-1);
    padding-top: var(--space-2);
  }
  .pieza__nombre { font-family: var(--font-serif); font-size: var(--type-h5-size); }

  .porque {
    border-left: 2px solid var(--color-terracota);
    padding: var(--space-3) var(--space-5);
    background: var(--color-crema);
  }
  .porque__texto {
    font-family: var(--font-serif);
    font-size: var(--type-h5-size);
    line-height: 1.45;
    margin: var(--space-2) 0 0;
  }

  .warn {
    display: flex; align-items: flex-start; gap: var(--space-4);
    padding: var(--space-6); border: var(--border-hairline);
    background: var(--color-crema);
  }
  .warn__body { display: flex; flex-direction: column; gap: var(--space-4); flex: 1; }
  .warn__acciones { display: flex; gap: var(--space-3); flex-wrap: wrap; }

  .bloque__title {
    font-family: var(--font-serif); font-size: var(--type-h3-size);
    font-weight: var(--weight-medium); margin: 0 0 var(--space-6);
  }
  .bloque__title :global(em) { font-style: italic; color: var(--color-terracota); }

  .favoritos { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-6); }
  .fav {
    border: var(--border-hairline); padding: var(--space-5);
  }
  .fav__head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: var(--space-4);
  }
  .iconbtn-text {
    background: transparent; border: none; cursor: pointer;
    font-family: var(--font-sans); font-size: 11px;
    letter-spacing: var(--tracking-wider); text-transform: uppercase;
    color: var(--color-negro-60);
    min-height: 32px;
  }
  .iconbtn-text:hover { color: var(--color-terracota); }
  .fav__prendas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--space-3);
  }
  .mini img { width: 100%; aspect-ratio: 1; object-fit: cover; border: var(--border-hairline); }
  .mini__bar { height: 4px; }
  .mini figcaption { margin-top: var(--space-2); }

  .toast {
    position: fixed; bottom: var(--space-7); left: 50%; transform: translateX(-50%);
    background: var(--color-negro); color: var(--color-marfil);
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-sans); font-size: 12px;
    letter-spacing: var(--tracking-wide);
    z-index: 1100;
    box-shadow: var(--shadow-lifted);
  }
</style>
