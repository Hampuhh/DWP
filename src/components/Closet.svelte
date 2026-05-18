<script lang="ts">
  import { onMount, tick } from 'svelte';
  import imageCompression from 'browser-image-compression';
  import { v4 as uuid } from 'uuid';
  import {
    Plus, Search, Camera, Trash2, X, Pencil, Download, Upload, Check,
    Shirt, Layers, Footprints, Watch,
  } from '@lucide/svelte';
  import type { Categoria, Estacion, Ocasion, Prenda } from '~/lib/types';
  import { CATEGORIAS, OCASIONES_NOMBRE } from '~/lib/data';
  import {
    getClosetCompleto, guardarPrenda, eliminarPrenda, incrementarUso,
    exportarBackup, importarBackup,
  } from '~/lib/storage';
  import { extraerColorDominante } from '~/lib/color';

  let prendas = $state<Prenda[]>([]);
  let cargando = $state(true);
  let filtroCategoria = $state<Categoria | 'todas'>('todas');
  let busqueda = $state('');
  let modalAbierto = $state(false);
  let detalleAbierto = $state(false);
  let prendaEditando = $state<Prenda | null>(null);
  let prendaDetalle = $state<Prenda | null>(null);
  let toast = $state<string | null>(null);

  let form = $state(crearFormVacio());
  let fileInput: HTMLInputElement;
  let importInput: HTMLInputElement;
  let nombreInput: HTMLInputElement | undefined = $state();
  let detectandoColor = $state(false);

  // Escape cierra modales abiertos; autofocus al abrir
  $effect(() => {
    if (!modalAbierto && !detalleAbierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (modalAbierto) cerrarModal();
        else if (detalleAbierto) detalleAbierto = false;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  $effect(() => {
    if (modalAbierto && nombreInput) {
      // microtask: el DOM debe estar pintado
      queueMicrotask(() => nombreInput?.focus());
    }
  });

  // Bloquear scroll del body cuando hay modal abierto
  $effect(() => {
    if (typeof document === 'undefined') return;
    const abierto = modalAbierto || detalleAbierto;
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  });

  function crearFormVacio() {
    return {
      id: '',
      nombre: '',
      categoria: 'Top' as Categoria,
      foto: '',
      colorPrincipal: '#888888',
      colorSecundario: '',
      tela: '',
      estaciones: [] as Estacion[],
      ocasiones: [] as Ocasion[],
      precio: '',
      notas: '',
    };
  }

  onMount(async () => {
    prendas = await getClosetCompleto();
    cargando = false;
  });

  const filtradas = $derived.by(() => {
    const term = busqueda.trim().toLowerCase();
    return prendas.filter((p) => {
      if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
      if (term && !p.nombre.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  function abrirModalNueva() {
    form = crearFormVacio();
    prendaEditando = null;
    modalAbierto = true;
  }

  function abrirModalEditar(p: Prenda) {
    form = {
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      foto: p.foto,
      colorPrincipal: p.colorPrincipal,
      colorSecundario: p.colorSecundario ?? '',
      tela: p.tela,
      estaciones: [...p.estaciones],
      ocasiones: [...p.ocasiones],
      precio: p.precio?.toString() ?? '',
      notas: p.notas ?? '',
    };
    prendaEditando = p;
    detalleAbierto = false;
    modalAbierto = true;
  }

  function cerrarModal() {
    modalAbierto = false;
    form = crearFormVacio();
  }

  async function onArchivoSeleccionado(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToast('Solo se admiten imágenes (jpg, png, webp, heic).');
      target.value = '';
      return;
    }
    // Límite duro: 25 MB antes de comprimir (suficiente para fotos de cámara modernas)
    if (file.size > 25 * 1024 * 1024) {
      mostrarToast('La imagen es demasiado grande (> 25 MB).');
      target.value = '';
      return;
    }

    detectandoColor = true;
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.readAsDataURL(compressed);
      });
      form.foto = dataUrl;

      // Detectar color principal automáticamente, con timeout
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout al decodificar la imagen')), 6000);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Imagen corrupta o no soportada')); };
      });
      const { dominante, paleta } = await extraerColorDominante(img, { k: 4 });
      form.colorPrincipal = dominante;
      if (paleta[1] && paleta[1] !== dominante) form.colorSecundario = paleta[1];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error procesando la imagen';
      mostrarToast(msg);
      console.error('[closet] foto:', err);
    } finally {
      detectandoColor = false;
      target.value = ''; // permite re-seleccionar el mismo archivo
    }
  }

  function toggleEstacion(e: Estacion) {
    if (form.estaciones.includes(e)) {
      form.estaciones = form.estaciones.filter((x) => x !== e);
    } else {
      form.estaciones = [...form.estaciones, e];
    }
  }

  function toggleOcasion(o: Ocasion) {
    if (form.ocasiones.includes(o)) {
      form.ocasiones = form.ocasiones.filter((x) => x !== o);
    } else {
      form.ocasiones = [...form.ocasiones, o];
    }
  }

  async function guardar() {
    if (!form.nombre.trim()) { mostrarToast('Falta el nombre de la prenda'); return; }
    const p: Prenda = {
      id: form.id || uuid(),
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      foto: form.foto,
      colorPrincipal: form.colorPrincipal,
      colorSecundario: form.colorSecundario || undefined,
      tela: form.tela.trim(),
      estaciones: form.estaciones,
      ocasiones: form.ocasiones,
      fechaIncorporacion: prendaEditando?.fechaIncorporacion ?? new Date().toISOString(),
      usos: prendaEditando?.usos ?? 0,
      precio: form.precio ? Number(form.precio) : undefined,
      notas: form.notas.trim() || undefined,
    };
    await guardarPrenda(p);
    prendas = await getClosetCompleto();
    cerrarModal();
    mostrarToast(prendaEditando ? 'Prenda actualizada' : 'Prenda añadida al closet');
  }

  async function borrar(p: Prenda) {
    if (!confirm(`¿Eliminar "${p.nombre}"? No se puede deshacer.`)) return;
    await eliminarPrenda(p.id);
    prendas = await getClosetCompleto();
    detalleAbierto = false;
    mostrarToast('Prenda eliminada');
  }

  async function marcarUso(p: Prenda) {
    await incrementarUso(p.id);
    prendas = await getClosetCompleto();
    prendaDetalle = prendas.find((x) => x.id === p.id) ?? null;
    mostrarToast('Uso registrado');
  }

  async function exportar() {
    const backup = await exportarBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `estilo-backup-${fecha}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('Backup descargado');
  }

  async function onImportar(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let data: unknown;
      try { data = JSON.parse(text); }
      catch { throw new Error('El archivo no es JSON válido'); }
      const modo = confirm('¿Reemplazar el closet actual?\n\nOK = reemplazar · Cancelar = fusionar')
        ? 'reemplazar' : 'fusionar';
      await importarBackup(data, modo as 'reemplazar' | 'fusionar');
      prendas = await getClosetCompleto();
      mostrarToast(`Backup importado (${modo})`, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Archivo inválido';
      mostrarToast(msg, 4000);
    } finally {
      target.value = '';
    }
  }

  function abrirDetalle(p: Prenda) {
    prendaDetalle = p;
    detalleAbierto = true;
  }

  function mostrarToast(msg: string, ms = 2200) {
    toast = msg;
    setTimeout(() => { if (toast === msg) toast = null; }, ms);
  }

  function iconoCategoria(cat: Categoria) {
    if (cat === 'Calzado') return Footprints;
    if (cat === 'Accesorio') return Watch;
    if (cat === 'Abrigo') return Layers;
    return Shirt;
  }
</script>

<!-- ────────────────────────────────────────────────── -->
<!-- Cabecera editorial -->
<!-- ────────────────────────────────────────────────── -->
<header class="ed-page-head">
  <div>
    <p class="ed-eyebrow">CAPÍTULO · MI ESPACIO</p>
    <h1 class="ed-page-head__title">Mi <em>closet</em></h1>
  </div>
  <div class="ed-page-head__meta">
    <span class="ed-mark">VOL · I</span>
    <span class="ed-mark">SECCIÓN 01</span>
    <span class="ed-mark">{prendas.length.toString().padStart(2, '0')} PIEZAS</span>
  </div>
  <p class="ed-page-head__lede">
    Tu armario, una pieza a la vez. Cada prenda con foto, color detectado
    automáticamente, ocasión y contador de usos. Todo guardado en este dispositivo.
  </p>
</header>

<!-- ────────────────────────────────────────────────── -->
<!-- Toolbar editorial · dos filas -->
<!-- ────────────────────────────────────────────────── -->
<section class="closet-toolbar">
  <div class="closet-toolbar__primary">
    <label class="closet-search">
      <Search size={16} strokeWidth={1.5} />
      <input
        type="search"
        placeholder="Buscar en mi closet…"
        bind:value={busqueda}
      />
    </label>
    <button class="btn btn--accent btn--prom" onclick={abrirModalNueva}>
      <Plus size={16} strokeWidth={2} /> Añadir prenda
    </button>
  </div>

  <div class="closet-toolbar__secondary">
    <div class="closet-chips">
      <button
        class="chip {filtroCategoria === 'todas' ? 'is-active' : ''}"
        onclick={() => filtroCategoria = 'todas'}>Todas</button>
      {#each CATEGORIAS as cat}
        <button
          class="chip {filtroCategoria === cat ? 'is-active' : ''}"
          onclick={() => filtroCategoria = cat}>{cat}</button>
      {/each}
    </div>
    <div class="closet-secondary-actions">
      <button class="icon-action" title="Importar backup" onclick={() => importInput.click()}>
        <Upload size={16} strokeWidth={1.6} /> <span>Importar</span>
      </button>
      <button class="icon-action" title="Descargar backup" onclick={exportar}>
        <Download size={16} strokeWidth={1.6} /> <span>Backup</span>
      </button>
    </div>
  </div>
  <input bind:this={importInput} type="file" accept="application/json" onchange={onImportar} hidden />
</section>

<!-- ────────────────────────────────────────────────── -->
<!-- Grid o empty state -->
<!-- ────────────────────────────────────────────────── -->
{#if cargando}
  <p class="t-caption">Cargando tu closet…</p>
{:else if prendas.length === 0}
  <section class="closet-empty">
    <div class="closet-empty__head">
      <p class="ed-eyebrow">CAPÍTULO 01 — INICIO</p>
      <h2 class="closet-empty__title">
        Tu armario empieza con <em>una sola pieza</em>.
      </h2>
      <p class="closet-empty__lede">
        Catalogá una prenda con foto, color y ocasión. El sistema detecta el
        color principal automáticamente. Con cinco piezas ya podés generar
        outfits coherentes desde tu armario real.
      </p>
      <button class="btn btn--accent btn--prom" onclick={abrirModalNueva}>
        <Plus size={16} strokeWidth={2} /> Añadir mi primera prenda
      </button>
    </div>

    <hr class="ed-rule" data-num="POR DÓNDE EMPEZAR" />

    <ol class="closet-empty__hints">
      <li>
        <span class="closet-empty__hints-num">01</span>
        <h3>Luz natural difusa</h3>
        <p>Ponete junto a una ventana sin sol directo. Fondo neutro: cama
          blanca, pared crema, suelo de madera.</p>
      </li>
      <li>
        <span class="closet-empty__hints-num">02</span>
        <h3>Foto cuadrada</h3>
        <p>Plana o colgada en una percha. La prenda entera, sin recortes,
          ocupando casi todo el cuadro.</p>
      </li>
      <li>
        <span class="closet-empty__hints-num">03</span>
        <h3>Catalogá lo esencial</h3>
        <p>Nombre, tela, categoría. Estaciones y ocasiones cuando sepas.
          El color principal lo detecta el sistema.</p>
      </li>
    </ol>
  </section>
{:else if filtradas.length === 0}
  <div class="closet-empty closet-empty--filter">
    <p class="ed-eyebrow">SIN RESULTADOS</p>
    <p>No hay prendas que coincidan con ese filtro o búsqueda.</p>
    <button class="btn btn--secondary" onclick={() => { filtroCategoria = 'todas'; busqueda = ''; }}>
      Limpiar filtros
    </button>
  </div>
{:else}
  <ol class="closet-grid">
    {#each filtradas as p, i (p.id)}
      <li>
        <button class="g-card" onclick={() => abrirDetalle(p)}>
          <div class="g-card__media">
            {#if p.foto}
              <img src={p.foto} alt={p.nombre} loading="lazy" />
            {:else}
              <div class="placeholder-img" style="position:absolute;inset:0;"></div>
            {/if}
            <span class="g-card__num">{String(i + 1).padStart(2, '0')}</span>
          </div>
          <div class="g-card__color-bar" style="background: {p.colorPrincipal};"></div>
          <div class="g-card__meta">
            <span class="g-card__cat">{p.categoria.toUpperCase()}</span>
            <h3 class="g-card__name">{p.nombre}</h3>
            <div class="g-card__foot">
              <span class="g-card__tela">{p.tela || '—'}</span>
              <span class="g-card__uses">USOS · {String(p.usos).padStart(2, '0')}</span>
            </div>
          </div>
        </button>
      </li>
    {/each}
  </ol>
{/if}

<!-- ────────────────────────────────────────────────── -->
<!-- Modal: añadir/editar prenda -->
<!-- ────────────────────────────────────────────────── -->
{#if modalAbierto}
  <div class="modal" role="presentation" onclick={cerrarModal}>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-nueva-title"
         onclick={(e) => e.stopPropagation()}>
      <header class="modal__head">
        <div>
          <p class="t-eyebrow">{prendaEditando ? 'EDITAR PRENDA' : 'NUEVA PRENDA'}</p>
          <h2 id="modal-nueva-title" class="modal__title">{prendaEditando ? 'Editar' : 'Añadir'} <em>una prenda</em></h2>
        </div>
        <button class="iconbtn" onclick={cerrarModal} aria-label="Cerrar">
          <X size={20} strokeWidth={1.5} />
        </button>
      </header>

      <div class="modal__body">
        <!-- Foto + color -->
        <div class="row row--media">
          <div class="media-preview">
            {#if form.foto}
              <img src={form.foto} alt="" />
            {:else}
              <div class="placeholder-img" style="aspect-ratio:1;display:grid;place-items:center;">
                <Camera size={32} strokeWidth={1.3} color="var(--color-negro-45)" />
              </div>
            {/if}
            {#if detectandoColor}
              <div class="media-preview__overlay">Detectando color…</div>
            {/if}
          </div>
          <div class="media-controls">
            <button class="btn btn--secondary" onclick={() => fileInput.click()}>
              <Camera size={14} strokeWidth={1.6} />
              {form.foto ? 'Cambiar foto' : 'Tomar o subir foto'}
            </button>
            <input
              bind:this={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              onchange={onArchivoSeleccionado}
              hidden
            />
            <p class="t-caption" style="margin: var(--space-3) 0 0;">
              En el móvil, abrirá directamente la cámara.
            </p>

            <div class="colors">
              <label class="color-field">
                <span class="field-label">COLOR PRINCIPAL</span>
                <div class="color-row">
                  <input type="color" bind:value={form.colorPrincipal} class="color-swatch" />
                  <input class="input input--boxed" type="text" bind:value={form.colorPrincipal} />
                </div>
              </label>
              <label class="color-field">
                <span class="field-label">SECUNDARIO (OPCIONAL)</span>
                <div class="color-row">
                  <input type="color" bind:value={form.colorSecundario} class="color-swatch" />
                  <input class="input input--boxed" type="text" bind:value={form.colorSecundario} placeholder="#______" />
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Campos básicos -->
        <div class="row">
          <label>
            <span class="field-label">NOMBRE</span>
            <input bind:this={nombreInput} class="input input--boxed" bind:value={form.nombre} placeholder="Ej. Camisa blanca egipcia" />
          </label>
          <label>
            <span class="field-label">CATEGORÍA</span>
            <select class="select" bind:value={form.categoria}>
              {#each CATEGORIAS as cat}<option value={cat}>{cat}</option>{/each}
            </select>
          </label>
        </div>

        <div class="row">
          <label>
            <span class="field-label">TELA</span>
            <input class="input input--boxed" bind:value={form.tela} placeholder="Algodón egipcio Giza 87" />
          </label>
          <label>
            <span class="field-label">PRECIO (OPCIONAL)</span>
            <input class="input input--boxed" type="number" min="0" bind:value={form.precio} placeholder="—" />
          </label>
        </div>

        <!-- Estaciones -->
        <div class="block">
          <span class="field-label">ESTACIONES</span>
          <div class="chips">
            {#each (['primavera','verano','otono','invierno'] as Estacion[]) as e}
              <button
                class="chip {form.estaciones.includes(e) ? 'is-active' : ''}"
                onclick={() => toggleEstacion(e)}
                type="button">{e}</button>
            {/each}
          </div>
        </div>

        <!-- Ocasiones -->
        <div class="block">
          <span class="field-label">OCASIONES</span>
          <div class="chips">
            {#each Object.entries(OCASIONES_NOMBRE) as [o, label]}
              <button
                class="chip {form.ocasiones.includes(o as Ocasion) ? 'is-active' : ''}"
                onclick={() => toggleOcasion(o as Ocasion)}
                type="button">{label}</button>
            {/each}
          </div>
        </div>

        <!-- Notas -->
        <label class="block">
          <span class="field-label">NOTAS</span>
          <textarea class="input input--boxed" rows="3" bind:value={form.notas}
                    placeholder="De segunda mano, regalo, combinación favorita…"></textarea>
        </label>
      </div>

      <footer class="modal__foot">
        <button class="btn btn--secondary" onclick={cerrarModal}>Cancelar</button>
        <button class="btn btn--primary" onclick={guardar}>
          <Check size={14} strokeWidth={2} /> Guardar
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- ────────────────────────────────────────────────── -->
<!-- Modal: detalle de prenda -->
<!-- ────────────────────────────────────────────────── -->
{#if detalleAbierto && prendaDetalle}
  <div class="modal" role="presentation" onclick={() => detalleAbierto = false}>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-detalle-title"
         onclick={(e) => e.stopPropagation()}>
      <header class="modal__head">
        <div>
          <p class="t-eyebrow">{prendaDetalle.categoria.toUpperCase()}</p>
          <h2 id="modal-detalle-title" class="modal__title">{prendaDetalle.nombre}</h2>
        </div>
        <button class="iconbtn" onclick={() => detalleAbierto = false} aria-label="Cerrar">
          <X size={20} strokeWidth={1.5} />
        </button>
      </header>

      <div class="modal__body">
        <div class="row row--media">
          <div class="media-preview">
            {#if prendaDetalle.foto}
              <img src={prendaDetalle.foto} alt={prendaDetalle.nombre} />
            {:else}
              <div class="placeholder-img" style="aspect-ratio:1;"></div>
            {/if}
          </div>
          <div class="detalle-info">
            <div class="kv">
              <span class="field-label">TELA</span>
              <span>{prendaDetalle.tela || '—'}</span>
            </div>
            <div class="kv">
              <span class="field-label">COLOR</span>
              <span class="colors-pair">
                <span class="dot" style="background:{prendaDetalle.colorPrincipal}"></span>
                <span class="t-mono">{prendaDetalle.colorPrincipal}</span>
                {#if prendaDetalle.colorSecundario}
                  <span class="dot" style="background:{prendaDetalle.colorSecundario}"></span>
                  <span class="t-mono">{prendaDetalle.colorSecundario}</span>
                {/if}
              </span>
            </div>
            <div class="kv">
              <span class="field-label">USOS</span>
              <span class="t-mono">{prendaDetalle.usos}</span>
            </div>
            <div class="kv">
              <span class="field-label">DESDE</span>
              <span class="t-mono">{new Date(prendaDetalle.fechaIncorporacion).toLocaleDateString('es')}</span>
            </div>
            {#if prendaDetalle.precio !== undefined}
              <div class="kv">
                <span class="field-label">CPW</span>
                <span class="t-mono">
                  {prendaDetalle.usos > 0
                    ? '€' + (prendaDetalle.precio / prendaDetalle.usos).toFixed(2)
                    : '—'}
                </span>
              </div>
            {/if}
            {#if prendaDetalle.estaciones.length}
              <div class="kv">
                <span class="field-label">ESTACIONES</span>
                <span>{prendaDetalle.estaciones.join(' · ')}</span>
              </div>
            {/if}
            {#if prendaDetalle.ocasiones.length}
              <div class="kv">
                <span class="field-label">OCASIONES</span>
                <span>{prendaDetalle.ocasiones.map((o) => OCASIONES_NOMBRE[o]).join(' · ')}</span>
              </div>
            {/if}
            {#if prendaDetalle.notas}
              <div class="kv">
                <span class="field-label">NOTAS</span>
                <span style="font-style:italic;">{prendaDetalle.notas}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <footer class="modal__foot">
        <button class="btn btn--secondary" onclick={() => borrar(prendaDetalle!)}>
          <Trash2 size={14} strokeWidth={1.6} /> Eliminar
        </button>
        <button class="btn btn--secondary" onclick={() => abrirModalEditar(prendaDetalle!)}>
          <Pencil size={14} strokeWidth={1.6} /> Editar
        </button>
        <button class="btn btn--accent" onclick={() => marcarUso(prendaDetalle!)}>
          <Check size={14} strokeWidth={2} /> Marcar uso
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Toast -->
{#if toast}
  <div class="toast">{toast}</div>
{/if}

<style>
  /* ── Toolbar editorial · dos filas ───────────────────── */
  .closet-toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-6) 0 var(--space-7);
    border-bottom: 1px solid var(--color-negro);
    margin-bottom: var(--space-9);
  }
  .closet-toolbar__primary {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-5);
    align-items: stretch;
  }
  .closet-search {
    display: flex; align-items: center; gap: var(--space-3);
    background: var(--color-crema);
    border: 1px solid var(--color-linea);
    padding: 0 var(--space-4);
    color: var(--color-negro-60);
    transition: border-color var(--motion-fast);
  }
  .closet-search:focus-within { border-color: var(--color-negro); color: var(--color-negro); }
  .closet-search input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 14px 0;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-negro);
    min-height: 44px;
  }
  .closet-search input::placeholder {
    color: var(--color-negro-45);
    font-style: italic;
  }
  .closet-toolbar__secondary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-5);
    flex-wrap: wrap;
  }
  .closet-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .closet-secondary-actions {
    display: flex;
    gap: var(--space-2);
    margin-left: auto;
  }
  .icon-action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px 14px;
    background: transparent;
    border: 1px solid var(--color-linea);
    color: var(--color-negro-60);
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
    min-height: 36px;
    transition: all var(--motion-fast);
  }
  .icon-action:hover { color: var(--color-negro); border-color: var(--color-negro); }
  .icon-action span { line-height: 1; }

  @media (max-width: 720px) {
    .closet-toolbar__primary { grid-template-columns: 1fr; }
    .closet-toolbar__secondary { flex-direction: column; align-items: flex-start; }
    .closet-secondary-actions { margin-left: 0; }
  }

  /* ── Botón prominente (CTA principal) ────────────────── */
  :global(.btn--prom) {
    padding: 16px 28px;
    font-size: 13px;
    letter-spacing: 0.18em;
    min-height: 52px;
  }

  /* ── Grid editorial con hairlines compartidas ────────── */
  .closet-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1px;
    background: var(--color-linea);
    border: 1px solid var(--color-linea);
  }
  .closet-grid > li {
    background: var(--color-marfil);
    list-style: none;
    counter-increment: none;
  }
  @media (max-width: 640px) {
    .closet-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 420px) {
    .closet-grid { grid-template-columns: 1fr; }
  }

  /* ── Garment card editorial ──────────────────────────── */
  .g-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0;
    background: var(--color-marfil);
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--motion-base);
  }
  .g-card:hover { background: var(--color-crema); }
  .g-card:hover .g-card__name { color: var(--color-terracota); }

  .g-card__media {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: var(--color-crema);
  }
  .g-card__media img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .g-card__num {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.24em;
    color: var(--color-marfil);
    background: rgba(42, 40, 37, 0.7);
    padding: 4px 8px;
  }

  .g-card__color-bar {
    height: 6px;
    width: 100%;
  }

  .g-card__meta {
    padding: var(--space-4) var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .g-card__cat {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.32em;
    color: var(--color-negro-45);
  }
  .g-card__name {
    font-family: var(--font-serif);
    font-size: 21px;
    line-height: 1.15;
    font-weight: var(--weight-medium);
    margin: 0;
    color: var(--color-negro);
    transition: color var(--motion-base);
  }
  .g-card__foot {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: var(--space-2);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    color: var(--color-negro-60);
  }
  .g-card__tela {
    text-transform: none;
    font-family: var(--font-sans);
    font-size: 11.5px;
    font-style: italic;
    color: var(--color-negro-60);
    letter-spacing: 0;
  }

  /* ── Empty state editorial ───────────────────────────── */
  .closet-empty {
    padding: var(--space-12) 0;
  }
  .closet-empty__head {
    max-width: 38rem;
    margin-bottom: var(--space-12);
  }
  .closet-empty__title {
    font-family: var(--font-serif);
    font-size: clamp(36px, 5vw, 56px);
    line-height: 1.0;
    letter-spacing: -0.01em;
    font-weight: var(--weight-medium);
    margin: var(--space-5) 0 var(--space-6);
    color: var(--color-negro);
  }
  .closet-empty__title :global(em) {
    font-style: italic;
    color: var(--color-terracota);
  }
  .closet-empty__lede {
    font-family: var(--font-serif);
    font-size: clamp(18px, 1.8vw, 22px);
    line-height: 1.5;
    color: var(--color-negro);
    margin: 0 0 var(--space-8);
    max-width: 36rem;
  }

  .closet-empty__hints {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--color-linea);
    border: 1px solid var(--color-linea);
  }
  .closet-empty__hints li {
    padding: var(--space-8);
    background: var(--color-marfil);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .closet-empty__hints-num {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.32em;
    color: var(--color-terracota);
  }
  .closet-empty__hints h3 {
    font-family: var(--font-serif);
    font-size: 22px;
    line-height: 1.1;
    font-weight: var(--weight-medium);
    margin: 0;
    color: var(--color-negro);
  }
  .closet-empty__hints p {
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.55;
    color: var(--color-negro-60);
    margin: 0;
  }
  @media (max-width: 900px) {
    .closet-empty__hints { grid-template-columns: 1fr; }
  }

  .closet-empty--filter {
    padding: var(--space-9);
    border: 1px dashed var(--color-linea);
    background: var(--color-crema);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }
  .closet-empty--filter p {
    font-family: var(--font-serif);
    font-size: 20px;
    color: var(--color-negro);
    margin: 0;
  }

  /* Modal */
  .modal {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(42, 40, 37, 0.55);
    backdrop-filter: blur(2px);
    display: grid; place-items: center;
    padding: var(--space-6);
  }
  .modal__panel {
    background: var(--color-marfil);
    border: var(--border-hairline);
    width: 100%; max-width: 720px;
    max-height: 92vh; overflow-y: auto;
    display: flex; flex-direction: column;
  }
  @media (max-width: 768px) {
    .modal { padding: 0; }
    .modal__panel { max-height: 100vh; height: 100vh; }
  }
  .modal__head {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: var(--space-7);
    border-bottom: var(--border-hairline);
  }
  .modal__title {
    font-family: var(--font-serif); font-size: var(--type-h3-size);
    font-weight: var(--weight-medium); margin: var(--space-2) 0 0;
  }
  .modal__title :global(em) { font-style: italic; color: var(--color-terracota); }
  .modal__body {
    padding: var(--space-7); display: flex; flex-direction: column; gap: var(--space-6);
  }
  .modal__foot {
    display: flex; gap: var(--space-3); justify-content: flex-end;
    padding: var(--space-6) var(--space-7);
    border-top: var(--border-hairline);
    background: var(--color-crema);
    flex-wrap: wrap;
  }

  .iconbtn {
    background: transparent; border: none; cursor: pointer;
    padding: var(--space-3); min-width: 44px; min-height: 44px;
    color: var(--color-negro);
  }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
  .row--media { grid-template-columns: 200px 1fr; }
  @media (max-width: 600px) {
    .row, .row--media { grid-template-columns: 1fr; }
  }

  .media-preview {
    position: relative; aspect-ratio: 1; overflow: hidden;
    border: var(--border-hairline);
  }
  .media-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .media-preview__overlay {
    position: absolute; inset: 0;
    background: rgba(245, 241, 234, 0.85); display: grid; place-items: center;
    font-family: var(--font-sans); font-size: 12px; letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
  }
  .media-controls { display: flex; flex-direction: column; }
  .colors { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-top: var(--space-5); }
  .color-row { display: flex; gap: var(--space-2); align-items: center; }
  .color-swatch {
    width: 36px; height: 36px; border: var(--border-hairline);
    padding: 0; background: transparent; cursor: pointer;
  }
  .color-field { display: flex; flex-direction: column; }

  .block { display: flex; flex-direction: column; gap: var(--space-2); }
  .chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  textarea.input {
    font-family: var(--font-sans);
    resize: vertical;
    min-height: 80px;
  }

  /* Detalle */
  .detalle-info { display: flex; flex-direction: column; gap: var(--space-4); }
  .kv { display: flex; flex-direction: column; gap: var(--space-1); }
  .colors-pair { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
  .dot { width: 14px; height: 14px; border: var(--border-hairline); display: inline-block; }

  /* Toast */
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
