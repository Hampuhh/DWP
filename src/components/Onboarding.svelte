<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRight, Check } from '@lucide/svelte';
  import {
    getPerfilCromatico, getClosetCompleto, getOutfitsFavoritos,
  } from '~/lib/storage';

  // Cuando lockClosed === true, no muestra el bloque (lo decide el host).
  // Útil si en algún momento queremos suprimirlo por A/B.
  let { lockClosed = false }: { lockClosed?: boolean } = $props();

  let cargando = $state(true);
  let pasos = $state<{
    num: string;
    titulo: string;
    desc: string;
    cta: string;
    href: string;
    done: boolean;
  }[]>([]);

  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  const completo = $derived(pasos.length > 0 && pasos.every((p) => p.done));

  onMount(async () => {
    const [perfil, closet, outfits] = await Promise.all([
      getPerfilCromatico(),
      getClosetCompleto(),
      getOutfitsFavoritos(),
    ]);
    pasos = [
      {
        num: '01',
        titulo: 'Define tu paleta personal',
        desc: 'Configura tu estación cromática. Es la decisión que sostiene todo lo demás —los neutros que sostienen, los acentos que vibran, los colores a evitar.',
        cta: 'Ir a auto-diagnóstico',
        href: `${base}/auto-diagnostico`,
        done: !!perfil,
      },
      {
        num: '02',
        titulo: 'Cataloga tres prendas',
        desc: 'Empieza por las que más amas. El sistema detecta el color principal de cada foto. ¿Sin tiempo? Carga 15 piezas de ejemplo desde Ajustes para probar el sistema.',
        cta: 'Abrir mi closet',
        href: `${base}/mi-closet`,
        done: closet.length >= 3,
      },
      {
        num: '03',
        titulo: 'Genera tu primer outfit',
        desc: 'Eliges contexto, el sistema arma una combinación coherente con tu paleta y tu closet. Guarda los que funcionen.',
        cta: 'Ir al generador',
        href: `${base}/generador`,
        done: outfits.length > 0,
      },
    ];
    cargando = false;
  });
</script>

{#if !lockClosed && !cargando && !completo}
  <section class="onboarding">
    <header class="onboarding__head">
      <p class="ed-eyebrow">BIENVENIDA · TRES PASOS</p>
      <h2 class="onboarding__title">Configura tu <em>edición personal</em>.</h2>
      <p class="onboarding__lede">
        Cinco minutos te dejan listo todo el sistema. Después es tuyo para siempre,
        sin servidor, en este dispositivo.
      </p>
    </header>

    <ol class="onboarding__steps">
      {#each pasos as p}
        <li class={`onboarding__step ${p.done ? 'is-done' : ''}`}>
          <span class="onboarding__num">{p.num}</span>
          <div class="onboarding__body">
            <h3 class="onboarding__step-title">
              {p.titulo}
              {#if p.done}<span class="onboarding__check" aria-label="Hecho"><Check size={16} strokeWidth={2.5} /></span>{/if}
            </h3>
            <p class="onboarding__desc">{p.desc}</p>
          </div>
          <div class="onboarding__action">
            {#if p.done}
              <span class="ed-mark onboarding__done-label">HECHO</span>
            {:else}
              <a class="btn btn--bold" href={p.href}>
                {p.cta} <ArrowRight size={14} strokeWidth={2} />
              </a>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .onboarding {
    margin: 0 0 var(--space-12);
    padding: var(--space-9) var(--space-8);
    background: var(--color-crema);
    border: 1.5px solid var(--color-negro);
    position: relative;
  }
  .onboarding::before {
    content: 'EMPIEZA AQUÍ';
    position: absolute;
    top: -10px;
    left: var(--space-7);
    background: var(--color-rojo);
    color: var(--color-marfil);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.32em;
    padding: 4px 12px;
  }

  .onboarding__head {
    margin-bottom: var(--space-7);
    max-width: 38rem;
  }
  .onboarding__title {
    font-family: var(--font-serif);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: var(--weight-medium);
    line-height: 1.0;
    letter-spacing: -0.01em;
    margin: var(--space-3) 0 var(--space-4);
    color: var(--color-negro);
  }
  .onboarding__title :global(em) {
    font-style: italic;
    color: var(--color-terracota);
  }
  .onboarding__lede {
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    color: var(--color-negro-60);
    margin: 0;
  }

  .onboarding__steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--color-linea);
  }
  .onboarding__step {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-6) var(--space-3);
    border-bottom: 1px solid var(--color-linea);
    transition: background var(--motion-fast);
  }
  .onboarding__step.is-done {
    background: var(--color-marfil);
    opacity: 0.75;
  }
  .onboarding__num {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 38px;
    color: var(--color-terracota);
    line-height: 1;
  }
  .onboarding__step.is-done .onboarding__num {
    color: var(--color-negro-45);
  }
  .onboarding__step-title {
    font-family: var(--font-serif);
    font-size: clamp(20px, 2.4vw, 26px);
    line-height: 1.15;
    font-weight: var(--weight-medium);
    margin: 0 0 var(--space-2);
    color: var(--color-negro);
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .onboarding__check {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    background: var(--color-terracota);
    color: var(--color-marfil);
    border-radius: 50%;
  }
  .onboarding__desc {
    font-family: var(--font-sans);
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--color-negro-60);
    margin: 0;
    max-width: 44ch;
  }
  .onboarding__action :global(.btn) { white-space: nowrap; }
  .onboarding__done-label {
    color: var(--color-terracota);
    font-weight: var(--weight-medium);
  }

  @media (max-width: 720px) {
    .onboarding { padding: var(--space-7) var(--space-5); margin: 0 0 var(--space-9); }
    .onboarding__step {
      grid-template-columns: 44px 1fr;
      grid-template-rows: auto auto;
      gap: var(--space-3);
    }
    .onboarding__action {
      grid-column: 1 / -1;
      margin-top: var(--space-2);
    }
    .onboarding__num { font-size: 32px; }
  }
</style>
