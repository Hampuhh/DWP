// Capa fina sobre idb-keyval con fallback a localStorage (para file://
// en algunos navegadores que no permiten IndexedDB en ese protocolo).

import { get, set, del, keys } from 'idb-keyval';
import type { Outfit, PerfilCromatico, Prenda } from './types';

const LS_PREFIX = 'estilo:';
let useFallback: boolean | null = null;

async function checkIndexedDB(): Promise<boolean> {
  if (useFallback !== null) return !useFallback;
  try {
    await set('__ping__', 1);
    await del('__ping__');
    useFallback = false;
    return true;
  } catch {
    useFallback = true;
    return false;
  }
}

async function rawGet<T>(key: string): Promise<T | undefined> {
  if (await checkIndexedDB()) {
    try { return (await get<T>(key)) ?? undefined; }
    catch (err) { console.warn('[storage] IndexedDB get falló', key, err); return undefined; }
  }
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(LS_PREFIX + key);
  if (!raw) return undefined;
  try { return JSON.parse(raw) as T; }
  catch (err) {
    console.warn('[storage] JSON corrupto en localStorage para', key, err);
    return undefined;
  }
}

async function rawSet<T>(key: string, value: T): Promise<void> {
  if (await checkIndexedDB()) {
    try { await set(key, value); return; }
    catch (err) {
      console.warn('[storage] IndexedDB set falló, intentando localStorage', err);
      useFallback = true; // marca el fallback para próximas operaciones
    }
  }
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); }
  catch (err) {
    // QuotaExceededError típicamente
    console.error('[storage] No se pudo escribir en localStorage', err);
    throw new Error('Espacio de almacenamiento agotado. Exporta un backup y elimina prendas antiguas.');
  }
}

async function rawDel(key: string): Promise<void> {
  if (await checkIndexedDB()) {
    await del(key);
    return;
  }
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LS_PREFIX + key);
}

// ────────────────────────────────────────────────────────────
// Closet (prendas)
// ────────────────────────────────────────────────────────────

const CLOSET_KEY = 'closet';

export async function getClosetCompleto(): Promise<Prenda[]> {
  return (await rawGet<Prenda[]>(CLOSET_KEY)) ?? [];
}

export async function guardarPrenda(p: Prenda): Promise<void> {
  const lista = await getClosetCompleto();
  const idx = lista.findIndex((x) => x.id === p.id);
  if (idx >= 0) lista[idx] = p;
  else lista.push(p);
  await rawSet(CLOSET_KEY, lista);
}

export async function eliminarPrenda(id: string): Promise<void> {
  const lista = await getClosetCompleto();
  await rawSet(CLOSET_KEY, lista.filter((p) => p.id !== id));
}

export async function incrementarUso(id: string): Promise<void> {
  const lista = await getClosetCompleto();
  const p = lista.find((x) => x.id === id);
  if (p) {
    p.usos += 1;
    await rawSet(CLOSET_KEY, lista);
  }
}

export async function reemplazarClosetCompleto(lista: Prenda[]): Promise<void> {
  await rawSet(CLOSET_KEY, lista);
}

// ────────────────────────────────────────────────────────────
// Outfits favoritos
// ────────────────────────────────────────────────────────────

const FAVORITOS_KEY = 'outfits-favoritos';

export async function getOutfitsFavoritos(): Promise<Outfit[]> {
  return (await rawGet<Outfit[]>(FAVORITOS_KEY)) ?? [];
}

export async function guardarOutfit(o: Outfit): Promise<void> {
  const lista = await getOutfitsFavoritos();
  const idx = lista.findIndex((x) => x.id === o.id);
  if (idx >= 0) lista[idx] = o;
  else lista.push(o);
  await rawSet(FAVORITOS_KEY, lista);
}

export async function eliminarOutfit(id: string): Promise<void> {
  const lista = await getOutfitsFavoritos();
  await rawSet(FAVORITOS_KEY, lista.filter((o) => o.id !== id));
}

// ────────────────────────────────────────────────────────────
// Perfil cromático
// ────────────────────────────────────────────────────────────

const PERFIL_KEY = 'perfil-cromatico';

export async function getPerfilCromatico(): Promise<PerfilCromatico | undefined> {
  return rawGet<PerfilCromatico>(PERFIL_KEY);
}

export async function guardarPerfilCromatico(p: PerfilCromatico): Promise<void> {
  await rawSet(PERFIL_KEY, p);
}

export async function borrarPerfilCromatico(): Promise<void> {
  await rawDel(PERFIL_KEY);
}

// ────────────────────────────────────────────────────────────
// Backup / restore
// ────────────────────────────────────────────────────────────

export interface Backup {
  version: 1;
  exportadoEn: string;
  closet: Prenda[];
  outfitsFavoritos: Outfit[];
  perfilCromatico?: PerfilCromatico;
}

export async function exportarBackup(): Promise<Backup> {
  return {
    version: 1,
    exportadoEn: new Date().toISOString(),
    closet: await getClosetCompleto(),
    outfitsFavoritos: await getOutfitsFavoritos(),
    perfilCromatico: await getPerfilCromatico(),
  };
}

export async function importarBackup(data: unknown, modo: 'reemplazar' | 'fusionar' = 'reemplazar'): Promise<void> {
  if (!data || typeof data !== 'object') throw new Error('Archivo de backup vacío o malformado');
  const d = data as Partial<Backup>;
  if (d.version !== 1) throw new Error(`Versión de backup no compatible (${d.version ?? 'sin versión'})`);
  if (!Array.isArray(d.closet)) throw new Error('Backup sin lista de prendas válida');
  if (!Array.isArray(d.outfitsFavoritos)) throw new Error('Backup sin outfits favoritos válidos');
  if (modo === 'reemplazar') {
    await reemplazarClosetCompleto(d.closet);
    await rawSet(FAVORITOS_KEY, d.outfitsFavoritos);
  } else {
    const closetActual = await getClosetCompleto();
    const ids = new Set(closetActual.map((p) => p.id));
    const fusion = [...closetActual, ...d.closet.filter((p) => !ids.has(p.id))];
    await rawSet(CLOSET_KEY, fusion);
    const favsActual = await getOutfitsFavoritos();
    const idsF = new Set(favsActual.map((o) => o.id));
    const fusionFavs = [...favsActual, ...d.outfitsFavoritos.filter((o) => !idsF.has(o.id))];
    await rawSet(FAVORITOS_KEY, fusionFavs);
  }
  if (d.perfilCromatico) await guardarPerfilCromatico(d.perfilCromatico);
}
