<script lang="ts">
  import { onMount } from 'svelte';
  import { Trash2, Save } from '@lucide/svelte';
  import type { EstacionColor, FormaRostro, PerfilCromatico, TipoFigura } from '~/lib/types';
  import { PALETAS } from '~/lib/data';
  import {
    getPerfilCromatico, guardarPerfilCromatico, borrarPerfilCromatico,
    getClosetCompleto, reemplazarClosetCompleto,
  } from '~/lib/storage';

  let cargando = $state(true);
  let perfil = $state<PerfilCromatico>({
    estacion: 'soft-autumn',
    ultimaActualizacion: new Date().toISOString(),
  });
  let toast = $state<string | null>(null);

  const estacionesOrden: EstacionColor[] = [
    'light-spring', 'true-spring', 'bright-spring',
    'light-summer', 'true-summer', 'soft-summer',
    'soft-autumn', 'true-autumn', 'dark-autumn',
    'dark-winter', 'true-winter', 'bright-winter',
  ];

  const figuras: { id: TipoFigura; label: string }[] = [
    { id: 'reloj-arena',         label: 'Reloj de arena' },
    { id: 'pera',                label: 'Pera / triángulo' },
    { id: 'manzana',             label: 'Manzana / círculo' },
    { id: 'rectangulo',          label: 'Rectángulo' },
    { id: 'triangulo-invertido', label: 'Triángulo invertido' },
  ];

  const rostros: { id: FormaRostro; label: string }[] = [
    { id: 'ovalado',     label: 'Ovalado' },
    { id: 'redondo',     label: 'Redondo' },
    { id: 'cuadrado',    label: 'Cuadrado' },
    { id: 'rectangular', label: 'Rectangular / oblongo' },
    { id: 'corazon',     label: 'Corazón' },
    { id: 'diamante',    label: 'Diamante' },
  ];

  onMount(async () => {
    const guardado = await getPerfilCromatico();
    if (guardado) perfil = guardado;
    cargando = false;
  });

  async function guardar() {
    perfil = { ...perfil, ultimaActualizacion: new Date().toISOString() };
    await guardarPerfilCromatico(perfil);
    mostrarToast('Perfil guardado');
  }

  async function borrarTodo() {
    if (!confirm('¿Borrar perfil cromático? Tu closet y favoritos se conservan.')) return;
    await borrarPerfilCromatico();
    perfil = { estacion: 'soft-autumn', ultimaActualizacion: new Date().toISOString() };
    mostrarToast('Perfil borrado');
  }

  async function reiniciarUsos() {
    if (!confirm('¿Reiniciar el contador de usos de TODAS las prendas a 0?')) return;
    const closet = await getClosetCompleto();
    closet.forEach((p) => p.usos = 0);
    await reemplazarClosetCompleto(closet);
    mostrarToast('Contadores reiniciados');
  }

  function mostrarToast(msg: string, ms = 2000) {
    toast = msg;
    setTimeout(() => { if (toast === msg) toast = null; }, ms);
  }
</script>

{#if cargando}
  <p class="t-caption">Cargando…</p>
{:else}
  <header class="ed-page-head">
    <div>
      <p class="ed-eyebrow">CAPÍTULO · CONFIGURACIÓN</p>
      <h1 class="ed-page-head__title"><em>Ajustes</em></h1>
    </div>
    <div class="ed-page-head__meta">
      <span class="ed-mark">VOL · I</span>
      <span class="ed-mark">SECCIÓN 99</span>
    </div>
    <p class="ed-page-head__lede">
      Tu estación de color, tipo de figura y forma de rostro. Estos tres datos
      sostienen el resto del sistema. Quedan guardados en este dispositivo.
    </p>
  </header>

  <section class="bloque">
    <h2 class="bloque__title">Estación de color</h2>
    <p class="bloque__lede">
      Determina la paleta personal que sostiene el resto de la app. Si no la sabes con seguridad,
      consulta el <a href="./auto-diagnostico">auto-diagnóstico</a>.
    </p>
    <select class="select" bind:value={perfil.estacion}>
      {#each estacionesOrden as id}
        <option value={id}>{PALETAS[id].nombre}</option>
      {/each}
    </select>
    <div class="preview">
      <p class="t-eyebrow">VISTA RÁPIDA · {PALETAS[perfil.estacion].nombre}</p>
      <div class="preview__row">
        {#each [...PALETAS[perfil.estacion].neutros, ...PALETAS[perfil.estacion].acentos] as hex}
          <span class="preview__dot" style="background:{hex}" title={hex}></span>
        {/each}
      </div>
    </div>
  </section>

  <section class="bloque">
    <h2 class="bloque__title">Tipo de figura</h2>
    <p class="bloque__lede">
      Ayuda al generador a sugerir prendas y cortes coherentes. Si no estás segura, lee
      <a href="./tipo-de-figura">tipo de figura</a>.
    </p>
    <div class="chips">
      {#each figuras as f}
        <button
          class="chip {perfil.tipoFigura === f.id ? 'is-active' : ''}"
          onclick={() => perfil.tipoFigura = f.id}>
          {f.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="bloque">
    <h2 class="bloque__title">Forma de rostro</h2>
    <p class="bloque__lede">
      Para sugerencias de escotes, aretes y peinados. Más detalle en
      <a href="./forma-de-rostro">forma de rostro</a>.
    </p>
    <div class="chips">
      {#each rostros as r}
        <button
          class="chip {perfil.formaRostro === r.id ? 'is-active' : ''}"
          onclick={() => perfil.formaRostro = r.id}>
          {r.label}
        </button>
      {/each}
    </div>
  </section>

  <footer class="footer">
    <button class="btn btn--secondary" onclick={borrarTodo}>
      <Trash2 size={14} strokeWidth={1.6} /> Borrar perfil
    </button>
    <button class="btn btn--secondary" onclick={reiniciarUsos}>
      Reiniciar contadores de uso
    </button>
    <button class="btn btn--primary" onclick={guardar}>
      <Save size={14} strokeWidth={1.6} /> Guardar cambios
    </button>
  </footer>

  <p class="ultimo t-caption">
    Última actualización · {new Date(perfil.ultimaActualizacion).toLocaleString('es')}
  </p>
{/if}

{#if toast}<div class="toast">{toast}</div>{/if}

<style>
  /* (Cabecera ahora usa .ed-page-head global) */

  .bloque { margin-bottom: var(--space-11); }
  .bloque__title {
    font-family: var(--font-serif); font-size: var(--type-h3-size);
    font-weight: var(--weight-medium); margin: 0 0 var(--space-3);
  }
  .bloque__lede { color: var(--color-negro-60); margin: 0 0 var(--space-5); max-width: 36rem; }

  .chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .select { max-width: 320px; }

  .preview { margin-top: var(--space-5); }
  .preview__row { display: flex; gap: var(--space-2); margin-top: var(--space-3); flex-wrap: wrap; }
  .preview__dot {
    width: 28px; height: 28px; border: var(--border-hairline);
    display: inline-block;
  }

  .footer {
    display: flex; gap: var(--space-3); flex-wrap: wrap;
    padding-top: var(--space-7); border-top: var(--border-hairline);
    margin-top: var(--space-9);
  }

  .ultimo { margin-top: var(--space-5); }

  .toast {
    position: fixed; bottom: var(--space-7); left: 50%; transform: translateX(-50%);
    background: var(--color-negro); color: var(--color-marfil);
    padding: var(--space-3) var(--space-6);
    font-family: var(--font-sans); font-size: 12px;
    letter-spacing: var(--tracking-wide);
    z-index: 1100;
  }
</style>
