<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';
  import { Sparkles, RotateCw, Star, Heart, AlertCircle, ShoppingBag } from '@lucide/svelte';
  import type { Categoria, Contexto, Outfit, PerfilCromatico, Prenda } from '~/lib/types';
  import { CONTEXTOS, PALETAS } from '~/lib/data';
  import { validarCombinacion, type EsquemaCromatico, hexToHsl } from '~/lib/color';
  import {
    getClosetCompleto, getOutfitsFavoritos, guardarOutfit, incrementarUso, getPerfilCromatico,
    eliminarOutfit,
  } from '~/lib/storage';

  let closet = $state<Prenda[]>([]);
  let favoritos = $state<Outfit[]>([]);
  let perfil = $state<PerfilCromatico | null>(null);
  let contextoActivo = $state<Contexto>('dia');
  let propuesta = $state<{
    prendas: Prenda[]; esquema: EsquemaCromatico; explicacion: string;
  } | null>(null);
  let toast = $state<string | null>(null);
  let cargando = $state(true);
  let intentos = $state(0);

  onMount(async () => {
    closet = await getClosetCompleto();
    favoritos = await getOutfitsFavoritos();
    perfil = (await getPerfilCromatico()) ?? null;
    cargando = false;
    if (closet.length > 0) regenerar();
  });

  const contextosArray = $derived(Object.values(CONTEXTOS));
  const favoritosContexto = $derived(favoritos.filter((o) => o.contexto === contextoActivo));

  function contienePalabra(arr: string[], target: string): boolean {
    return arr.includes(target);
  }

  // Filtrar prendas válidas para el contexto
  function aptaParaContexto(p: Prenda, ctx: Contexto): boolean {
    const info = CONTEXTOS[ctx];
    if (p.ocasiones.length === 0) return true; // sin restricciones registradas
    return p.ocasiones.some((o) => info.ocasionesPermitidas.includes(o));
  }

  function porCategoria(prendas: Prenda[], cat: Categoria): Prenda[] {
    return prendas.filter((p) => p.categoria === cat);
  }

  function pickRandom<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickRandomMultiple<T>(arr: T[], n: number): T[] {
    if (arr.length <= n) return [...arr];
    const copia = [...arr];
    const out: T[] = [];
    while (out.length < n && copia.length > 0) {
      const i = Math.floor(Math.random() * copia.length);
      out.push(copia.splice(i, 1)[0]);
    }
    return out;
  }

  function intentarPropuesta(): {
    prendas: Prenda[]; esquema: EsquemaCromatico; explicacion: string;
  } | null {
    const aptas = closet.filter((p) => aptaParaContexto(p, contextoActivo));
    if (aptas.length === 0) return null;

    const vestidos = porCategoria(aptas, 'Vestido');
    const tops = porCategoria(aptas, 'Top');
    const bottoms = porCategoria(aptas, 'Bottom');
    const abrigos = porCategoria(aptas, 'Abrigo');
    const calzados = porCategoria(aptas, 'Calzado');
    const accesorios = porCategoria(aptas, 'Accesorio');

    const seleccion: Prenda[] = [];

    // Vestido o Top+Bottom (50/50 si hay vestidos disponibles)
    const usarVestido = vestidos.length > 0 && Math.random() < 0.4;
    if (usarVestido) {
      const v = pickRandom(vestidos);
      if (v) seleccion.push(v);
    } else {
      const t = pickRandom(tops);
      const b = pickRandom(bottoms);
      if (t) seleccion.push(t);
      if (b) seleccion.push(b);
    }

    if (seleccion.length === 0) return null;

    // Abrigo opcional (20% prob si hay)
    if (abrigos.length > 0 && Math.random() < 0.25) {
      const a = pickRandom(abrigos);
      if (a) seleccion.push(a);
    }

    // Calzado
    const c = pickRandom(calzados);
    if (c) seleccion.push(c);

    // Accesorios 1-2
    const numAcc = accesorios.length === 0 ? 0 : (Math.random() < 0.5 ? 1 : 2);
    seleccion.push(...pickRandomMultiple(accesorios, numAcc));

    // Validación cromática
    const colores = seleccion.map((p) => p.colorPrincipal);
    const validacion = validarCombinacion(colores);

    if (!validacion.valido) return null;

    // Validar adecuación a la paleta del usuario (suave)
    if (perfil) {
      const paleta = PALETAS[perfil.estacion];
      const tonosPaleta = [...paleta.neutros, ...paleta.acentos, ...paleta.statement];
      const desviaciones = colores.filter((c) => !esCercanoAPaleta(c, tonosPaleta)).length;
      // Tolerancia: hasta 1/3 de las piezas pueden desviarse de la paleta personal
      if (desviaciones > Math.ceil(seleccion.length / 3)) return null;
    }

    const codigoCtx = CONTEXTOS[contextoActivo].codigo;
    const explicacion = construirExplicacion(validacion.esquema, validacion.explicacion, codigoCtx);

    return { prendas: seleccion, esquema: validacion.esquema, explicacion };
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

  function construirExplicacion(
    esquema: EsquemaCromatico,
    base: string,
    codigo: string,
  ): string {
    const codigoLabel = ({
      casual: 'casual relajado',
      'smart-casual': 'smart casual',
      cocktail: 'cocktail',
      formal: 'formal',
    } as Record<string, string>)[codigo] ?? codigo;
    return `${base} Cumple el código ${codigoLabel} sin esfuerzo: cada pieza está alineada con la ocasión.`;
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

<!-- Selector de contexto -->
<header class="cabecera">
  <p class="t-eyebrow">¿QUÉ PLAN TIENES?</p>
  <div class="contextos">
    {#each contextosArray as c}
      <button
        class="chip {contextoActivo === c.id ? 'is-active--accent' : ''}"
        onclick={() => cambiarContexto(c.id)}>
        {c.nombre}
      </button>
    {/each}
  </div>
</header>

<hr class="hr-hair" style="margin: var(--space-7) 0;" />

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
        <button class="btn btn--accent" onclick={() => meGusta(true)}>
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
  .cabecera p { margin: 0; }
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
