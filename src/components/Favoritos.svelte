<script lang="ts">
  import { onMount } from 'svelte';
  import { Trash2 } from '@lucide/svelte';
  import type { Contexto, Outfit, Prenda } from '~/lib/types';
  import { CONTEXTOS } from '~/lib/data';
  import { getClosetCompleto, getOutfitsFavoritos, eliminarOutfit } from '~/lib/storage';

  let cargando = $state(true);
  let outfits = $state<Outfit[]>([]);
  let closet = $state<Prenda[]>([]);
  let filtroContexto = $state<Contexto | 'todos'>('todos');

  onMount(async () => {
    outfits = await getOutfitsFavoritos();
    closet = await getClosetCompleto();
    cargando = false;
  });

  const contextosArray = $derived(Object.values(CONTEXTOS));
  const filtrados = $derived(
    filtroContexto === 'todos'
      ? outfits
      : outfits.filter((o) => o.contexto === filtroContexto)
  );

  function prendaById(id: string): Prenda | undefined {
    return closet.find((p) => p.id === id);
  }

  async function borrar(id: string) {
    if (!confirm('¿Eliminar este outfit de favoritos?')) return;
    await eliminarOutfit(id);
    outfits = await getOutfitsFavoritos();
  }
</script>

<section class="filtros">
  <button class="chip {filtroContexto === 'todos' ? 'is-active' : ''}" onclick={() => filtroContexto = 'todos'}>Todos</button>
  {#each contextosArray as c}
    <button class="chip {filtroContexto === c.id ? 'is-active' : ''}" onclick={() => filtroContexto = c.id}>
      {c.nombre}
    </button>
  {/each}
</section>

<hr class="hr-hair" style="margin: var(--space-7) 0;" />

{#if cargando}
  <p class="t-caption">Cargando…</p>
{:else if outfits.length === 0}
  <div class="empty">
    <p class="empty__lede">
      Aún no has guardado ningún outfit. Ve al <a href="./generador">generador</a> y guarda los que
      te funcionen con ★ o ❤.
    </p>
  </div>
{:else if filtrados.length === 0}
  <p class="t-caption">No hay favoritos para este plan.</p>
{:else}
  <ul class="lista">
    {#each filtrados as o (o.id)}
      <li class="fav">
        <header class="fav__head">
          <div>
            <p class="t-mono">{new Date(o.fecha).toLocaleDateString('es')}</p>
            <h3 class="fav__title">{CONTEXTOS[o.contexto].nombre}</h3>
          </div>
          <div class="fav__head-meta">
            {#if o.usado}<span class="chip is-active--accent" style="min-height:auto;padding:2px 10px;">Usado</span>{/if}
            <button class="iconbtn" onclick={() => borrar(o.id)} aria-label="Eliminar">
              <Trash2 size={16} strokeWidth={1.6} />
            </button>
          </div>
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

        <p class="fav__porque">{o.porQueFunciona}</p>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .filtros { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .empty {
    border: var(--border-dashed); padding: var(--space-9);
    background: var(--color-crema); text-align: center;
    max-width: 32rem; margin: 0 auto;
  }
  .empty__lede { color: var(--color-negro-60); margin: 0; }

  .lista { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-7); }
  .fav { border: var(--border-hairline); padding: var(--space-6); }
  .fav__head {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: var(--space-4); margin-bottom: var(--space-5);
  }
  .fav__head-meta { display: flex; gap: var(--space-3); align-items: center; }
  .fav__title {
    font-family: var(--font-serif); font-size: var(--type-h4-size);
    font-weight: var(--weight-medium); margin: var(--space-1) 0 0;
  }
  .fav__prendas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-3);
  }
  .mini img { width: 100%; aspect-ratio: 1; object-fit: cover; border: var(--border-hairline); }
  .mini__bar { height: 4px; }
  .mini figcaption { margin-top: var(--space-2); }

  .fav__porque {
    margin-top: var(--space-5); padding-left: var(--space-4);
    border-left: 2px solid var(--color-terracota);
    font-family: var(--font-serif); font-size: var(--type-h5-size); line-height: 1.45;
  }

  .iconbtn {
    background: transparent; border: none; cursor: pointer;
    color: var(--color-negro-60);
    min-width: 44px; min-height: 44px;
    display: grid; place-items: center;
  }
  .iconbtn:hover { color: var(--color-terracota); }
</style>
