<script lang="ts">
  import OutfitGenerator from './OutfitGenerator.svelte';
  import { CONTEXTOS } from '~/lib/data';
  import type { Contexto } from '~/lib/types';

  let { contexto }: { contexto: Contexto } = $props();
  const info = $derived(CONTEXTOS[contexto]);
</script>

<header class="ed-page-head">
  <div>
    <p class="ed-eyebrow">PROPUESTA PARA</p>
    <h1 class="ed-page-head__title"><em>{info.nombre}</em></h1>
  </div>
  <div class="ed-page-head__meta">
    <span class="ed-mark">VOL · I</span>
    <span class="ed-mark">CÓDIGO · {info.codigo.toUpperCase()}</span>
  </div>
  <p class="ed-page-head__lede">
    {info.descripcion} Se genera desde tu closet con reglas de capas, fit y paleta personal.
    Las prendas típicas: {info.prendasTipicas}
  </p>
</header>

<OutfitGenerator contextoInicial={contexto} lockContexto />
