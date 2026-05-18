<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRight, RotateCcw, Check, Sparkles } from '@lucide/svelte';
  import type { EstacionColor, PerfilCromatico } from '~/lib/types';
  import { PALETAS } from '~/lib/data';
  import { getPerfilCromatico, guardarPerfilCromatico } from '~/lib/storage';

  // ─── Modelo del wizard ──────────────────────────────────────
  type Temp   = 'calido' | 'frio' | 'neutro';
  type Valor  = 'claro'  | 'medio' | 'profundo';
  type Croma  = 'brillante' | 'suave';

  interface Respuestas {
    temp: Temp | null;
    valor: Valor | null;
    croma: Croma | null;
    venas: 'azul' | 'verde' | 'mixto' | null; // confirma temp pero no overrides
  }

  let paso = $state(0);                       // 0..4 (4 = result)
  let respuestas = $state<Respuestas>({
    temp: null, valor: null, croma: null, venas: null,
  });
  let perfilExistente = $state<PerfilCromatico | null>(null);
  let cargando = $state(true);
  let resultadoGuardado = $state(false);
  let toast = $state<string | null>(null);

  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

  onMount(async () => {
    perfilExistente = (await getPerfilCromatico()) ?? null;
    cargando = false;
  });

  // ─── Decisión: respuestas → estación ────────────────────────
  function inferirEstacion(r: Respuestas): { principal: EstacionColor; alternativa: EstacionColor } {
    const { temp, valor, croma } = r;
    // Mapa explícito de las 18 combinaciones (3×3×2) a estaciones
    // Cada combo tiene principal + alternativa para que la usuaria valide
    const T = temp ?? 'neutro';
    const V = valor ?? 'medio';
    const C = croma ?? 'suave';

    // Cálido
    if (T === 'calido') {
      if (V === 'claro') {
        return C === 'brillante'
          ? { principal: 'bright-spring', alternativa: 'light-spring' }
          : { principal: 'light-spring',  alternativa: 'true-spring' };
      }
      if (V === 'medio') {
        return C === 'brillante'
          ? { principal: 'true-spring',   alternativa: 'bright-spring' }
          : { principal: 'soft-autumn',   alternativa: 'true-autumn' };
      }
      // profundo
      return C === 'brillante'
        ? { principal: 'true-autumn',   alternativa: 'dark-autumn' }
        : { principal: 'dark-autumn',   alternativa: 'true-autumn' };
    }

    // Frío
    if (T === 'frio') {
      if (V === 'claro') {
        return C === 'brillante'
          ? { principal: 'bright-winter', alternativa: 'true-winter' }
          : { principal: 'light-summer',  alternativa: 'true-summer' };
      }
      if (V === 'medio') {
        return C === 'brillante'
          ? { principal: 'true-winter',   alternativa: 'bright-winter' }
          : { principal: 'true-summer',   alternativa: 'soft-summer' };
      }
      // profundo
      return C === 'brillante'
        ? { principal: 'dark-winter',   alternativa: 'bright-winter' }
        : { principal: 'soft-summer',   alternativa: 'dark-winter' };
    }

    // Neutro (oliva, mezcla)
    if (V === 'claro') {
      return C === 'brillante'
        ? { principal: 'light-spring', alternativa: 'light-summer' }
        : { principal: 'light-summer', alternativa: 'soft-autumn' };
    }
    if (V === 'medio') {
      return C === 'brillante'
        ? { principal: 'bright-spring', alternativa: 'bright-winter' }
        : { principal: 'soft-autumn',   alternativa: 'soft-summer' };
    }
    // profundo
    return C === 'brillante'
      ? { principal: 'dark-autumn',  alternativa: 'dark-winter' }
      : { principal: 'soft-summer',  alternativa: 'dark-autumn' };
  }

  const resultado = $derived(
    paso === 4 ? inferirEstacion(respuestas) : null
  );

  function avanzar() { paso += 1; }
  function retroceder() { if (paso > 0) paso -= 1; }
  function reiniciar() {
    respuestas = { temp: null, valor: null, croma: null, venas: null };
    paso = 0;
    resultadoGuardado = false;
  }

  function setVenas(v: 'azul' | 'verde' | 'mixto') {
    respuestas.venas = v;
    // Inferimos temp desde venas como sugerencia, pero el usuario puede confirmarla en paso 2
    if (v === 'azul') respuestas.temp = 'frio';
    if (v === 'verde') respuestas.temp = 'calido';
    if (v === 'mixto') respuestas.temp = 'neutro';
    avanzar();
  }
  function setTemp(t: Temp)    { respuestas.temp  = t; avanzar(); }
  function setValor(v: Valor)  { respuestas.valor = v; avanzar(); }
  function setCroma(c: Croma)  { respuestas.croma = c; avanzar(); }

  async function aceptarEstacion(est: EstacionColor) {
    const nuevo: PerfilCromatico = {
      ...(perfilExistente ?? { ultimaActualizacion: '' }),
      estacion: est,
      ultimaActualizacion: new Date().toISOString(),
    };
    await guardarPerfilCromatico(nuevo);
    perfilExistente = nuevo;
    resultadoGuardado = true;
    mostrarToast('Estación guardada en tu perfil');
  }

  function mostrarToast(msg: string, ms = 2200) {
    toast = msg;
    setTimeout(() => { if (toast === msg) toast = null; }, ms);
  }

  const pasos = [
    { num: '01', label: 'Venas' },
    { num: '02', label: 'Temperatura' },
    { num: '03', label: 'Valor' },
    { num: '04', label: 'Croma' },
  ];
</script>

<section class="diag">
  {#if cargando}
    <p class="t-caption">Cargando…</p>
  {:else}
    <!-- Progreso -->
    <header class="diag__progress">
      {#each pasos as p, i}
        <div class={`diag__step-mark ${i < paso ? 'is-done' : ''} ${i === paso ? 'is-current' : ''}`}>
          <span class="diag__step-num">{p.num}</span>
          <span class="diag__step-label">{p.label}</span>
        </div>
      {/each}
      <div class={`diag__step-mark ${paso === 4 ? 'is-current' : ''}`}>
        <span class="diag__step-num">★</span>
        <span class="diag__step-label">Tu estación</span>
      </div>
    </header>

    <!-- ─── PASO 0 · Venas ─────────────────────────────────── -->
    {#if paso === 0}
      <article class="diag__card">
        <p class="ed-eyebrow">PRIMERA OBSERVACIÓN · VENAS</p>
        <h2 class="diag__pregunta">
          Mira tus venas en la cara interna de la muñeca, con <em>luz natural</em>.
          ¿Qué color predomina?
        </h2>
        <p class="diag__hint">
          Mejor cerca de una ventana sin sol directo. Sin maquillaje, sin joyería.
          Si no estás segura, mira las venas del antebrazo también.
        </p>
        <ol class="diag__opciones">
          <li>
            <button class="diag__opcion" onclick={() => setVenas('azul')}>
              <span class="diag__opcion-color" style="background:#5471A8"></span>
              <div>
                <h3>Azul · violeta</h3>
                <p>Tonos azulados, púrpura. Sugiere subtono <em>frío</em>.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion" onclick={() => setVenas('verde')}>
              <span class="diag__opcion-color" style="background:#6B7F5E"></span>
              <div>
                <h3>Verde · oliva</h3>
                <p>Tonos verdosos, casi caqui. Sugiere subtono <em>cálido</em>.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion" onclick={() => setVenas('mixto')}>
              <span class="diag__opcion-color" style="background:#7B7268"></span>
              <div>
                <h3>Mezcla · indeciso</h3>
                <p>Algunas azules, algunas verdes. Sugiere subtono <em>neutro</em>.</p>
              </div>
            </button>
          </li>
        </ol>
      </article>
    {/if}

    <!-- ─── PASO 1 · Temperatura (oro vs plata) ────────────── -->
    {#if paso === 1}
      <article class="diag__card">
        <p class="ed-eyebrow">CONFIRMACIÓN · ORO vs PLATA</p>
        <h2 class="diag__pregunta">
          Pon una joya de <em>oro amarillo</em> y luego una de <em>plata</em> bajo
          tu mentón. ¿Cuál ilumina mejor tu rostro?
        </h2>
        <p class="diag__hint">
          La que "limpia" la piel, atenúa ojeras y unifica el tono es la ganadora.
          Si ambas funcionan, eres neutro.
        </p>
        <ol class="diag__opciones">
          <li>
            <button class="diag__opcion {respuestas.temp === 'calido' ? 'is-selected' : ''}"
                    onclick={() => setTemp('calido')}>
              <span class="diag__opcion-color" style="background:#D4A04A"></span>
              <div>
                <h3>Oro · cálido</h3>
                <p>El oro amarillo te ilumina. La plata te apaga.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion {respuestas.temp === 'frio' ? 'is-selected' : ''}"
                    onclick={() => setTemp('frio')}>
              <span class="diag__opcion-color" style="background:#B8B8C0"></span>
              <div>
                <h3>Plata · frío</h3>
                <p>La plata te limpia. El oro amarillo te amarillea.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion {respuestas.temp === 'neutro' ? 'is-selected' : ''}"
                    onclick={() => setTemp('neutro')}>
              <span class="diag__opcion-color diag__opcion-color--split"></span>
              <div>
                <h3>Ambos · neutro</h3>
                <p>Las dos te favorecen casi por igual. Es lo más común.</p>
              </div>
            </button>
          </li>
        </ol>
        <button class="diag__back" onclick={retroceder}>← Volver</button>
      </article>
    {/if}

    <!-- ─── PASO 2 · Valor ─────────────────────────────────── -->
    {#if paso === 2}
      <article class="diag__card">
        <p class="ed-eyebrow">SEGUNDA DIMENSIÓN · VALOR</p>
        <h2 class="diag__pregunta">
          Considerando piel, ojos y cabello como conjunto, ¿qué nivel
          de <em>luminosidad</em> tienes?
        </h2>
        <p class="diag__hint">
          Truco: una selfie en blanco y negro lo deja claro. Mira si los tres
          elementos juntos son más bien claros, medios u oscuros.
        </p>
        <ol class="diag__opciones">
          <li>
            <button class="diag__opcion" onclick={() => setValor('claro')}>
              <span class="diag__opcion-color" style="background:#EDE3D2"></span>
              <div>
                <h3>Claro · luminoso</h3>
                <p>Piel clara, cabello rubio o castaño claro, ojos claros o medios.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion" onclick={() => setValor('medio')}>
              <span class="diag__opcion-color" style="background:#A89580"></span>
              <div>
                <h3>Medio</h3>
                <p>Tonos medios en todo: castaño medio, ojos avellana o medios.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion" onclick={() => setValor('profundo')}>
              <span class="diag__opcion-color" style="background:#3B2E22"></span>
              <div>
                <h3>Profundo · oscuro</h3>
                <p>Cabello castaño muy oscuro o negro, ojos oscuros, piel media-oscura.</p>
              </div>
            </button>
          </li>
        </ol>
        <button class="diag__back" onclick={retroceder}>← Volver</button>
      </article>
    {/if}

    <!-- ─── PASO 3 · Croma ─────────────────────────────────── -->
    {#if paso === 3}
      <article class="diag__card">
        <p class="ed-eyebrow">TERCERA DIMENSIÓN · INTENSIDAD</p>
        <h2 class="diag__pregunta">
          Mira tus ojos de cerca. ¿Tienen un patrón <em>brillante</em>
          (rayos definidos, alto contraste con la esclerótica) o
          <em>suave</em> (manchas difusas, contraste menor)?
        </h2>
        <p class="diag__hint">
          Lo mismo aplica a tu contraste general piel-ojos-cabello: alto
          (mucha diferencia entre los tres) o bajo (los tres parecidos).
        </p>
        <ol class="diag__opciones">
          <li>
            <button class="diag__opcion" onclick={() => setCroma('brillante')}>
              <span class="diag__opcion-color" style="background:radial-gradient(circle at center, #4A6BB0, #2A2825 70%)"></span>
              <div>
                <h3>Brillante · alto contraste</h3>
                <p>Ojos chispeantes, contraste claro entre piel-ojos-cabello.</p>
              </div>
            </button>
          </li>
          <li>
            <button class="diag__opcion" onclick={() => setCroma('suave')}>
              <span class="diag__opcion-color" style="background:radial-gradient(circle at center, #908070, #6B5E50 70%)"></span>
              <div>
                <h3>Suave · bajo contraste</h3>
                <p>Iris difuso, los tres elementos están en valores cercanos.</p>
              </div>
            </button>
          </li>
        </ol>
        <button class="diag__back" onclick={retroceder}>← Volver</button>
      </article>
    {/if}

    <!-- ─── PASO 4 · Resultado ────────────────────────────── -->
    {#if paso === 4 && resultado}
      <article class="diag__card diag__card--resultado">
        <p class="ed-eyebrow">RESULTADO PRELIMINAR</p>
        <h2 class="diag__resultado-title">
          Tu estación más probable es <em>{PALETAS[resultado.principal].nombre}</em>.
        </h2>
        <p class="diag__resultado-desc">{PALETAS[resultado.principal].descripcion}</p>

        <!-- Swatches preview -->
        <div class="diag__swatches">
          {#each [...PALETAS[resultado.principal].neutros, ...PALETAS[resultado.principal].acentos.slice(0, 4)] as hex}
            <span class="diag__swatch" style="background:{hex}" title={hex}></span>
          {/each}
        </div>

        <div class="diag__acciones">
          <button class="btn btn--bold btn--prom" onclick={() => aceptarEstacion(resultado.principal)}
                  disabled={resultadoGuardado}>
            {#if resultadoGuardado}
              <Check size={16} strokeWidth={2} /> Guardada
            {:else}
              <Sparkles size={14} strokeWidth={1.6} /> Guardar como mi estación
            {/if}
          </button>
          {#if resultadoGuardado}
            <a class="btn btn--primary" href={`${base}/mi-paleta`}>
              Ver mi paleta <ArrowRight size={14} strokeWidth={2} />
            </a>
          {/if}
        </div>

        <hr class="ed-rule" data-num="ALTERNATIVA" style="margin-top: 3rem;" />

        <div class="diag__alt">
          <p class="ed-eyebrow">SI NO ENCAJA · SEGUNDA OPCIÓN</p>
          <h3 class="diag__alt-title">
            <em>{PALETAS[resultado.alternativa].nombre}</em>
          </h3>
          <p class="diag__alt-desc">{PALETAS[resultado.alternativa].descripcion}</p>
          <div class="diag__swatches">
            {#each [...PALETAS[resultado.alternativa].neutros, ...PALETAS[resultado.alternativa].acentos.slice(0, 4)] as hex}
              <span class="diag__swatch" style="background:{hex}"></span>
            {/each}
          </div>
          <button class="btn btn--secondary" onclick={() => aceptarEstacion(resultado.alternativa)}>
            Probar con esta en su lugar
          </button>
        </div>

        <hr class="ed-rule" />

        <div class="diag__nota">
          <p class="ed-eyebrow">UN APUNTE</p>
          <p class="diag__nota-texto">
            Este auto-diagnóstico es <em>una aproximación</em>, no un análisis
            profesional. Si tienes dudas persistentes entre dos estaciones, o
            vas a invertir en un armario nuevo, considera un análisis con un
            analista certificado en Sci\ART / 12 Blueprints o House of Colour.
            Más detalle en la guía abajo.
          </p>
        </div>

        <button class="diag__back" onclick={reiniciar}>
          <RotateCcw size={14} strokeWidth={1.5} /> Empezar de nuevo
        </button>
      </article>
    {/if}
  {/if}

  {#if toast}<div class="diag__toast">{toast}</div>{/if}
</section>

<style>
  .diag {
    margin: var(--space-7) 0 var(--space-9);
  }

  /* ── Progreso superior ──────────────────────────────────── */
  .diag__progress {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1px;
    background: var(--color-linea);
    border: 1px solid var(--color-linea);
    margin-bottom: var(--space-9);
  }
  .diag__step-mark {
    background: var(--color-marfil);
    padding: var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--color-negro-45);
    transition: background var(--motion-fast), color var(--motion-fast);
  }
  .diag__step-mark.is-done {
    color: var(--color-negro-60);
  }
  .diag__step-mark.is-current {
    background: var(--color-tinta);
    color: var(--color-marfil);
  }
  .diag__step-num {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.24em;
  }
  .diag__step-mark.is-current .diag__step-num { color: var(--color-terracota-soft); }
  .diag__step-label {
    font-family: var(--font-serif);
    font-size: 16px;
    line-height: 1.2;
    font-weight: var(--weight-medium);
  }
  .diag__step-mark.is-current .diag__step-label { font-style: italic; }

  @media (max-width: 720px) {
    .diag__progress { grid-template-columns: repeat(5, auto); overflow-x: auto; }
    .diag__step-mark { min-width: 96px; padding: var(--space-3) var(--space-4); }
    .diag__step-label { font-size: 13px; }
  }

  /* ── Card de pregunta ───────────────────────────────────── */
  .diag__card {
    border: 1.5px solid var(--color-negro);
    background: var(--color-crema);
    padding: var(--space-9);
  }
  .diag__pregunta {
    font-family: var(--font-serif);
    font-size: clamp(26px, 3.4vw, 38px);
    line-height: 1.15;
    font-weight: var(--weight-medium);
    letter-spacing: -0.008em;
    margin: var(--space-4) 0 var(--space-4);
    color: var(--color-negro);
  }
  .diag__pregunta :global(em) { font-style: italic; color: var(--color-terracota); }
  .diag__hint {
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-negro-60);
    margin: 0 0 var(--space-8);
    max-width: 42rem;
  }

  /* ── Opciones ───────────────────────────────────────────── */
  .diag__opciones {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-3);
  }
  .diag__opcion {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: var(--space-4);
    align-items: center;
    text-align: left;
    width: 100%;
    background: var(--color-marfil);
    border: 1px solid var(--color-linea);
    padding: var(--space-5);
    cursor: pointer;
    transition: all var(--motion-fast);
    min-height: 96px;
  }
  .diag__opcion:hover {
    border-color: var(--color-negro);
    transform: translateY(-1px);
  }
  .diag__opcion.is-selected {
    border-color: var(--color-terracota);
    background: var(--color-marfil);
  }
  .diag__opcion-color {
    width: 56px;
    height: 56px;
    border: 1px solid var(--color-linea);
    flex-shrink: 0;
  }
  .diag__opcion-color--split {
    background: linear-gradient(to right, #D4A04A 50%, #B8B8C0 50%);
  }
  .diag__opcion h3 {
    font-family: var(--font-serif);
    font-size: 19px;
    line-height: 1.15;
    font-weight: var(--weight-medium);
    margin: 0 0 4px;
    color: var(--color-negro);
  }
  .diag__opcion h3 :global(em) { font-style: italic; color: var(--color-terracota); }
  .diag__opcion p {
    font-family: var(--font-sans);
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--color-negro-60);
    margin: 0;
  }
  .diag__opcion p :global(em) { font-style: italic; color: var(--color-terracota); }

  /* ── Volver ─────────────────────────────────────────────── */
  .diag__back {
    margin-top: var(--space-6);
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-negro-60);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px 0;
  }
  .diag__back:hover { color: var(--color-terracota); }

  /* ── Resultado ──────────────────────────────────────────── */
  .diag__card--resultado { background: var(--color-marfil); }
  .diag__resultado-title {
    font-family: var(--font-serif);
    font-size: clamp(30px, 4.5vw, 52px);
    line-height: 1.05;
    font-weight: var(--weight-medium);
    letter-spacing: -0.01em;
    margin: var(--space-3) 0 var(--space-4);
    color: var(--color-negro);
  }
  .diag__resultado-title :global(em) { font-style: italic; color: var(--color-terracota); }
  .diag__resultado-desc {
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.55;
    color: var(--color-negro-60);
    margin: 0 0 var(--space-6);
    max-width: 42rem;
  }
  .diag__swatches {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: var(--space-7);
  }
  .diag__swatch {
    width: 48px;
    height: 48px;
    border: 1px solid var(--color-linea);
    display: inline-block;
  }
  .diag__acciones {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .diag__alt {
    margin-top: var(--space-5);
  }
  .diag__alt-title {
    font-family: var(--font-serif);
    font-size: clamp(22px, 3vw, 32px);
    font-weight: var(--weight-medium);
    margin: var(--space-3) 0 var(--space-3);
  }
  .diag__alt-title :global(em) { font-style: italic; color: var(--color-terracota); }
  .diag__alt-desc {
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-negro-60);
    margin: 0 0 var(--space-4);
    max-width: 36rem;
  }
  .diag__nota {
    background: var(--color-crema);
    padding: var(--space-6);
    border-left: 2px solid var(--color-terracota);
    margin: var(--space-7) 0;
  }
  .diag__nota-texto {
    font-family: var(--font-serif);
    font-size: 18px;
    line-height: 1.45;
    margin: var(--space-3) 0 0;
    color: var(--color-negro);
  }
  .diag__nota-texto :global(em) { font-style: italic; color: var(--color-terracota); }

  /* ── Toast ──────────────────────────────────────────────── */
  .diag__toast {
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
    z-index: 100;
  }

  @media (max-width: 540px) {
    .diag__card { padding: var(--space-6) var(--space-5); }
    .diag__opcion { grid-template-columns: 48px 1fr; padding: var(--space-4); }
    .diag__opcion-color { width: 48px; height: 48px; }
  }
</style>
