/**
 * Prendas de ejemplo (seed) para probar el generador sin tener que catalogar
 * manualmente desde cero. Cubre una capsule básica de 15 piezas con paleta
 * tierra y neutros — válida para casi cualquier estación cromática suave.
 *
 * Las fotos vienen como placeholder editorial (cuadrado crema con etiqueta)
 * para no inventar imágenes; la usuaria puede reemplazar cada foto después.
 */
import { v4 as uuid } from 'uuid';
import type { Prenda } from './types';

// SVG editorial placeholder cuadrado con la etiqueta de la prenda, codificado como dataURL
function placeholderFoto(etiqueta: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" fill="${color}"/>
    <rect x="8" y="8" width="184" height="184" fill="none" stroke="rgba(42,40,37,0.18)" stroke-width="1"/>
    <text x="100" y="105" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="22" fill="rgba(42,40,37,0.7)">${etiqueta}</text>
    <text x="100" y="178" text-anchor="middle" font-family="JetBrains Mono, Menlo, monospace" font-size="8" letter-spacing="3" fill="rgba(42,40,37,0.45)">PLACEHOLDER · DWP</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

interface SeedSpec {
  nombre: string;
  categoria: Prenda['categoria'];
  subcategoria?: Prenda['subcategoria'];
  fit?: Prenda['fit'];
  colorPrincipal: string;
  tela: string;
  estaciones: Prenda['estaciones'];
  ocasiones: Prenda['ocasiones'];
}

const SPECS: SeedSpec[] = [
  // ── Tops ──
  { nombre: 'Camisa blanca popelín',  categoria: 'Top',     subcategoria: 'camisa',   fit: 'fitted',  colorPrincipal: '#F5F1EA', tela: 'Algodón egipcio',     estaciones: ['primavera','verano','otono','invierno'], ocasiones: ['smart-casual','formal','oficina'] },
  { nombre: 'Blusa de seda crema',     categoria: 'Top',     subcategoria: 'blusa',    fit: 'recto',   colorPrincipal: '#EFE3D2', tela: 'Seda crepe',          estaciones: ['primavera','verano','otono'],            ocasiones: ['smart-casual','cocktail','noche'] },
  { nombre: 'Jersey cashmere camel',   categoria: 'Top',     subcategoria: 'jersey',   fit: 'recto',   colorPrincipal: '#C5A57A', tela: 'Cashmere 2-ply',      estaciones: ['otono','invierno'],                       ocasiones: ['casual','smart-casual','frio','oficina'] },
  { nombre: 'Camiseta merino marino',  categoria: 'Top',     subcategoria: 'camiseta', fit: 'fitted',  colorPrincipal: '#1F2A44', tela: 'Lana merino',         estaciones: ['otono','invierno'],                       ocasiones: ['casual','smart-casual','viaje','frio'] },
  // ── Bottoms ──
  { nombre: 'Pantalón sastre marino',  categoria: 'Bottom',  subcategoria: 'pantalon-vestir', fit: 'recto',    colorPrincipal: '#1F2A44', tela: 'Lana fría Super 110s',estaciones: ['otono','invierno','primavera'],  ocasiones: ['formal','smart-casual','oficina'] },
  { nombre: 'Jeans oscuros premium',   categoria: 'Bottom',  subcategoria: 'jeans',           fit: 'fitted',   colorPrincipal: '#22344D', tela: 'Denim italiano',      estaciones: ['otono','invierno','primavera'],  ocasiones: ['casual','smart-casual','fin-de-semana','viaje'] },
  { nombre: 'Falda midi camel',        categoria: 'Bottom',  subcategoria: 'falda',           fit: 'recto',    colorPrincipal: '#B98E5B', tela: 'Lana virgen',         estaciones: ['otono','invierno'],              ocasiones: ['smart-casual','formal','oficina'] },
  // ── Vestido ──
  { nombre: 'LBD shift midi',          categoria: 'Vestido', subcategoria: 'shift',           fit: 'fitted',   colorPrincipal: '#1C1C1C', tela: 'Crepe lana',          estaciones: ['otono','invierno','primavera','verano'], ocasiones: ['cocktail','formal','noche'] },
  { nombre: 'Vestido wrap marino',     categoria: 'Vestido', subcategoria: 'wrap',            fit: 'fitted',   colorPrincipal: '#1F2A44', tela: 'Jersey de viscosa',   estaciones: ['primavera','verano','otono'],    ocasiones: ['smart-casual','cocktail','oficina'] },
  // ── Abrigos ──
  { nombre: 'Blazer marino estructurado', categoria: 'Abrigo', subcategoria: 'blazer',    fit: 'fitted',   colorPrincipal: '#1F2A44', tela: 'Lana Super 120s',    estaciones: ['primavera','otono','invierno'],   ocasiones: ['formal','smart-casual','oficina'] },
  { nombre: 'Trench Burberry beige',    categoria: 'Abrigo', subcategoria: 'trench',    fit: 'recto',    colorPrincipal: '#C8B597', tela: 'Gabardina algodón',  estaciones: ['primavera','otono'],              ocasiones: ['casual','smart-casual','lluvia'] },
  // ── Calzado ──
  { nombre: 'Pump nude 6 cm',           categoria: 'Calzado', subcategoria: 'pump',      fit: undefined,  colorPrincipal: '#D4B59C', tela: 'Piel napa',           estaciones: ['primavera','verano','otono','invierno'],  ocasiones: ['cocktail','formal','noche'] },
  { nombre: 'Mocasín coñac',            categoria: 'Calzado', subcategoria: 'mocasin',   fit: undefined,  colorPrincipal: '#7B4A2B', tela: 'Piel granulada',      estaciones: ['otono','invierno','primavera'],          ocasiones: ['casual','smart-casual','oficina','viaje'] },
  { nombre: 'Balerina negra',           categoria: 'Calzado', subcategoria: 'balerina',  fit: undefined,  colorPrincipal: '#1C1C1C', tela: 'Piel napa',           estaciones: ['primavera','verano','otono'],             ocasiones: ['casual','smart-casual','oficina'] },
  // ── Accesorios ──
  { nombre: 'Pañuelo seda terracota',  categoria: 'Accesorio', subcategoria: 'panuelo', fit: undefined,  colorPrincipal: '#B97A57', tela: 'Seda twill 90×90',    estaciones: ['primavera','verano','otono','invierno'],  ocasiones: ['casual','smart-casual','cocktail','viaje'] },
];

const COLORES_PLACEHOLDER: Record<string, string> = {
  // Mapeo del color principal a un fondo placeholder MÁS CLARO para que se lea la etiqueta
};

export function generarSeedPrendas(): Prenda[] {
  const ahora = new Date();
  return SPECS.map((s, i) => {
    const fecha = new Date(ahora.getTime() - i * 86400000 * 7); // separadas por una semana
    return {
      id: uuid(),
      nombre: s.nombre,
      categoria: s.categoria,
      subcategoria: s.subcategoria,
      fit: s.fit,
      foto: placeholderFoto(s.nombre, mezclarConCrema(s.colorPrincipal, 0.78)),
      colorPrincipal: s.colorPrincipal,
      tela: s.tela,
      estaciones: s.estaciones,
      ocasiones: s.ocasiones,
      fechaIncorporacion: fecha.toISOString(),
      usos: Math.floor(Math.random() * 12),
      precio: undefined,
      notas: 'Prenda de ejemplo — reemplaza la foto cuando catalogues la tuya real.',
    };
  });
}

// Mezcla un hex con #FAF7F1 (crema) en una proporción para obtener un fondo
// editorial coherente que no abrume al ojo en el placeholder.
function mezclarConCrema(hex: string, mezcla: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const cr = 250, cg = 247, cb = 241;
  const mix = (a: number, b: number) => Math.round(a * (1 - mezcla) + b * mezcla);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(mix(r, cr))}${toHex(mix(g, cg))}${toHex(mix(b, cb))}`;
}
