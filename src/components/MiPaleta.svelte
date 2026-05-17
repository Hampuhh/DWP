<script lang="ts">
  import { onMount } from 'svelte';
  import { Copy, Sparkles } from '@lucide/svelte';
  import type { PerfilCromatico } from '~/lib/types';
  import { PALETAS } from '~/lib/data';
  import { getPerfilCromatico } from '~/lib/storage';

  let perfil = $state<PerfilCromatico | null>(null);
  let cargando = $state(true);
  let toast = $state<string | null>(null);

  onMount(async () => {
    perfil = (await getPerfilCromatico()) ?? null;
    cargando = false;
  });

  const paleta = $derived(perfil ? PALETAS[perfil.estacion] : null);

  async function copiar(hex: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(hex);
      } else {
        // Fallback para file:// o contextos no seguros
        const ta = document.createElement('textarea');
        ta.value = hex;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand falló');
      }
      mostrarToast(`Copiado · ${hex}`);
    } catch {
      mostrarToast(`Copia manual · ${hex}`, 4000);
    }
  }

  function mostrarToast(msg: string, ms = 1800) {
    toast = msg;
    setTimeout(() => { if (toast === msg) toast = null; }, ms);
  }
</script>

<header class="cabecera">
  <p class="t-eyebrow">TU COLUMNA VERTEBRAL CROMÁTICA</p>
  <h1 class="cabecera__title">Mi <em>paleta</em> personal</h1>
</header>

<hr class="hr-hair" style="margin: var(--space-7) 0;" />

{#if cargando}
  <p class="t-caption">Cargando…</p>
{:else if !perfil || !paleta}
  <section class="sin-perfil">
    <p class="sin-perfil__lede">
      Aún no has configurado tu estación de color. Esta es la decisión más importante para que
      el resto de la plataforma —el generador de outfits, las recomendaciones de neutros y
      acentos— trabaje para ti.
    </p>
    <div class="sin-perfil__cta">
      <a class="btn btn--accent" href="./auto-diagnostico">
        <Sparkles size={14} strokeWidth={1.6} /> Hacer auto-diagnóstico
      </a>
      <a class="btn btn--secondary" href="./settings">
        Configurar manualmente en ajustes
      </a>
    </div>
  </section>
{:else}
  <section class="cabecera-paleta">
    <p class="t-eyebrow">TU ESTACIÓN</p>
    <h2 class="cabecera-paleta__nombre">{paleta.nombre}</h2>
    <p class="cabecera-paleta__desc">{paleta.descripcion}</p>
  </section>

  <section class="bloque">
    <header class="bloque__head">
      <h3>Neutros base <span class="t-mono">60-70 % DEL ARMARIO</span></h3>
      <p class="bloque__lede">
        Los neutros sostienen. Son tu pantalón sastre, tu blusa de seda, tu trench, tu jersey de
        cashmere. Compras de mayor inversión.
      </p>
    </header>
    <div class="grid-colores">
      {#each paleta.neutros as hex}
        <button class="swatch" onclick={() => copiar(hex)}>
          <span class="swatch__color" style="background:{hex}"></span>
          <span class="swatch__hex">{hex}</span>
          <Copy size={12} strokeWidth={1.6} />
        </button>
      {/each}
    </div>
  </section>

  <section class="bloque">
    <header class="bloque__head">
      <h3>Acentos <span class="t-mono">20-30 %</span></h3>
      <p class="bloque__lede">
        Blusas, jerséis, vestidos, acentos del 30 %. Lo que aporta carácter sin perder coherencia.
      </p>
    </header>
    <div class="grid-colores">
      {#each paleta.acentos as hex}
        <button class="swatch" onclick={() => copiar(hex)}>
          <span class="swatch__color" style="background:{hex}"></span>
          <span class="swatch__hex">{hex}</span>
          <Copy size={12} strokeWidth={1.6} />
        </button>
      {/each}
    </div>
  </section>

  <section class="bloque">
    <header class="bloque__head">
      <h3>Statement <span class="t-mono">5-10 %</span></h3>
      <p class="bloque__lede">
        Tu acento personal. Aparece en pañuelo, labial, una sola pieza. Lo que te hace
        reconocible.
      </p>
    </header>
    <div class="grid-colores">
      {#each paleta.statement as hex}
        <button class="swatch" onclick={() => copiar(hex)}>
          <span class="swatch__color" style="background:{hex}"></span>
          <span class="swatch__hex">{hex}</span>
          <Copy size={12} strokeWidth={1.6} />
        </button>
      {/each}
    </div>
  </section>

  <section class="bloque">
    <header class="bloque__head">
      <h3>Metales que te <em>favorecen</em></h3>
    </header>
    <ul class="lista">
      {#each paleta.metales as m}<li>{m}</li>{/each}
    </ul>
  </section>

  <section class="bloque bloque--evitar">
    <header class="bloque__head">
      <h3>Mejor evitar cerca del rostro</h3>
    </header>
    <ul class="lista">
      {#each paleta.evitar as e}<li>{e}</li>{/each}
    </ul>
  </section>

  <p class="cambiar">
    ¿Crees que tu estación es otra? <a href="./settings">Cambia tu perfil en ajustes</a>.
  </p>
{/if}

{#if toast}<div class="toast">{toast}</div>{/if}

<style>
  .cabecera__title {
    font-family: var(--font-serif); font-size: clamp(40px, 7vw, 72px);
    font-weight: var(--weight-medium); line-height: 0.98;
    margin: var(--space-3) 0 0;
  }
  .cabecera__title :global(em) { font-style: italic; color: var(--color-terracota); }

  .sin-perfil {
    border: var(--border-dashed); padding: var(--space-9);
    background: var(--color-crema); max-width: 36rem; margin: 0 auto;
    text-align: center;
  }
  .sin-perfil__lede { color: var(--color-negro-60); margin: 0 0 var(--space-7); }
  .sin-perfil__cta { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }

  .cabecera-paleta { margin-bottom: var(--space-9); }
  .cabecera-paleta__nombre {
    font-family: var(--font-serif); font-size: clamp(32px, 5vw, 52px);
    font-weight: var(--weight-medium); margin: var(--space-3) 0 var(--space-3);
  }
  .cabecera-paleta__desc { color: var(--color-negro-60); font-size: var(--type-body-lg-size); max-width: 36rem; }

  .bloque { margin-bottom: var(--space-11); }
  .bloque__head { margin-bottom: var(--space-5); }
  .bloque__head h3 {
    font-family: var(--font-serif); font-size: var(--type-h3-size);
    font-weight: var(--weight-medium);
    display: flex; align-items: baseline; gap: var(--space-5); flex-wrap: wrap;
    margin: 0 0 var(--space-3);
  }
  .bloque__head h3 :global(em) { font-style: italic; color: var(--color-terracota); }
  .bloque__lede { color: var(--color-negro-60); margin: 0; max-width: 36rem; }

  .grid-colores {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-3);
  }
  .swatch {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-marfil);
    border: var(--border-hairline);
    cursor: pointer;
    font-family: var(--font-mono); font-size: 11px;
    color: var(--color-negro);
    transition: background var(--motion-fast), border-color var(--motion-fast);
    min-height: 56px;
    text-align: left;
  }
  .swatch:hover { border-color: var(--color-negro); }
  .swatch__color {
    width: 32px; height: 32px; border: var(--border-hairline);
    flex-shrink: 0;
  }
  .swatch__hex { flex: 1; }

  .lista { padding-left: 1.2em; margin: 0; }
  .lista li { margin: 0.35em 0; }

  .bloque--evitar { color: var(--color-negro-60); }

  .cambiar {
    margin-top: var(--space-12); padding-top: var(--space-7);
    border-top: var(--border-hairline);
    color: var(--color-negro-60); font-size: var(--type-body-sm-size);
  }

  .toast {
    position: fixed; bottom: var(--space-7); left: 50%; transform: translateX(-50%);
    background: var(--color-negro); color: var(--color-marfil);
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-sans); font-size: 12px;
    letter-spacing: var(--tracking-wide);
    z-index: 1100;
  }
</style>
