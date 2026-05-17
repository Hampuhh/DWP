<script lang="ts">
  import { onMount } from 'svelte';
  import { Sparkles, ShoppingBag } from '@lucide/svelte';
  import { CONTEXTOS } from '~/lib/data';
  import type { Contexto } from '~/lib/types';
  import { getOutfitsFavoritos, getClosetCompleto } from '~/lib/storage';
  import type { Outfit, Prenda } from '~/lib/types';

  let { contexto }: { contexto: Contexto } = $props();

  let outfits = $state<Outfit[]>([]);
  let closet = $state<Prenda[]>([]);
  let cargando = $state(true);

  const info = $derived(CONTEXTOS[contexto]);

  onMount(async () => {
    closet = await getClosetCompleto();
    const todos = await getOutfitsFavoritos();
    outfits = todos.filter((o) => o.contexto === contexto);
    cargando = false;
  });

  function prendaById(id: string): Prenda | undefined {
    return closet.find((p) => p.id === id);
  }
</script>

<header class="cabecera">
  <p class="t-eyebrow">PROPUESTAS PARA</p>
  <h1 class="cabecera__title">{info.nombre}</h1>
  <p class="cabecera__lede">{info.descripcion}</p>
  <p class="cabecera__hint t-mono">CÓDIGO · {info.codigo.toUpperCase()}</p>
</header>

<section class="acciones">
  <a class="btn btn--accent" href="../generador">
    <Sparkles size={16} strokeWidth={1.6} />
    Generar outfit para {info.nombre.toLowerCase()}
  </a>
  <a class="btn btn--secondary" href="../mi-closet">
    <ShoppingBag size={16} strokeWidth={1.6} />
    Ver mi closet
  </a>
</section>

<hr class="hr-hair" />

<section class="bloque">
  <h2 class="bloque__title">Outfits que ya te <em>funcionan</em></h2>

  {#if cargando}
    <p class="t-caption">Cargando…</p>
  {:else if outfits.length === 0}
    <div class="empty">
      <p class="empty__title">Aún no tienes outfits guardados para {info.nombre.toLowerCase()}.</p>
      <p class="empty__hint">
        Usa el <a href="../generador">generador</a> para crear combinaciones desde tu closet, marca
        las que te gustan con ★ y aparecerán aquí.
      </p>
      <p class="empty__tip t-caption">
        <strong>Prendas típicas para este plan:</strong> {info.prendasTipicas}
      </p>
    </div>
  {:else}
    <ul class="outfits">
      {#each outfits as o (o.id)}
        <li class="outfit">
          <header class="outfit__head">
            <span class="t-mono">{new Date(o.fecha).toLocaleDateString('es')}</span>
            {#if o.usado}<span class="chip is-active--accent" style="min-height:auto;padding:2px 10px;">Usado</span>{/if}
          </header>
          <div class="outfit__prendas">
            {#each o.prendaIds as pid}
              {@const p = prendaById(pid)}
              {#if p}
                <figure class="mini">
                  {#if p.foto}
                    <img src={p.foto} alt={p.nombre} />
                  {:else}
                    <div class="placeholder-img" style="aspect-ratio:1;"></div>
                  {/if}
                  <div class="mini__bar" style="background: {p.colorPrincipal};"></div>
                  <figcaption class="t-caption">{p.nombre}</figcaption>
                </figure>
              {/if}
            {/each}
          </div>
          <p class="outfit__porque">{o.porQueFunciona}</p>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .cabecera { margin-bottom: var(--space-9); }
  .cabecera__title {
    font-family: var(--font-serif);
    font-size: clamp(40px, 7vw, 72px);
    font-weight: var(--weight-medium);
    line-height: 0.98;
    margin: var(--space-3) 0 var(--space-5);
    color: var(--color-negro);
  }
  .cabecera__lede {
    font-family: var(--font-sans);
    font-size: var(--type-body-lg-size);
    color: var(--color-negro-60);
    max-width: 36rem;
    margin: 0 0 var(--space-4);
  }
  .cabecera__hint { margin: 0; }

  .acciones {
    display: flex; gap: var(--space-3); flex-wrap: wrap;
    margin: var(--space-7) 0 var(--space-9);
  }

  .bloque__title {
    font-family: var(--font-serif);
    font-size: clamp(28px, 4vw, 36px);
    font-weight: var(--weight-medium);
    margin: var(--space-9) 0 var(--space-6);
  }
  .bloque__title :global(em) { font-style: italic; color: var(--color-terracota); }

  .empty {
    padding: var(--space-9);
    border: var(--border-dashed);
    text-align: center;
    background: var(--color-crema);
  }
  .empty__title {
    font-family: var(--font-serif); font-size: var(--type-h4-size);
    color: var(--color-negro); margin: 0 0 var(--space-3);
  }
  .empty__hint { color: var(--color-negro-60); margin: 0 0 var(--space-6); }
  .empty__tip { font-size: 12px; }

  .outfits { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-7); }
  .outfit {
    border: var(--border-hairline);
    padding: var(--space-6);
    background: var(--color-marfil);
  }
  .outfit__head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: var(--space-5);
  }
  .outfit__prendas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-3);
  }
  .mini { margin: 0; display: flex; flex-direction: column; }
  .mini img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; border: var(--border-hairline); }
  .mini__bar { height: 4px; width: 100%; }
  .mini figcaption { margin-top: var(--space-2); }
  .outfit__porque {
    margin-top: var(--space-5);
    font-family: var(--font-serif);
    font-size: var(--type-h5-size);
    line-height: 1.4;
    color: var(--color-negro);
    border-left: 2px solid var(--color-terracota);
    padding-left: var(--space-4);
  }
</style>
