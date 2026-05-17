// ────────────────────────────────────────────────────────────
// Utilidades cromáticas: conversión, distancia, k-means, esquemas
// ────────────────────────────────────────────────────────────

export type Rgb = [number, number, number];
export type Hsl = [number, number, number]; // h: 0-360, s: 0-1, l: 0-1

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

export function rgbToHsl([r, g, b]: Rgb): Hsl {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s, l];
}

export function hslToRgb([h, s, l]: Hsl): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(hk + 1 / 3) * 255, f(hk) * 255, f(hk - 1 / 3) * 255];
}

export function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

// Distancia euclidiana en RGB (rápida y suficiente para clustering)
export function distRgb(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

// ────────────────────────────────────────────────────────────
// K-means simple en RGB para extraer color dominante de una imagen
// ────────────────────────────────────────────────────────────

interface KMeansOpts {
  k?: number;
  maxIter?: number;
  sampleStep?: number;
}

export async function extraerColorDominante(
  imageEl: HTMLImageElement | HTMLCanvasElement,
  opts: KMeansOpts = {},
): Promise<{ dominante: string; paleta: string[] }> {
  const { k = 5, maxIter = 10, sampleStep = 8 } = opts;

  let canvas: HTMLCanvasElement;
  if (imageEl instanceof HTMLCanvasElement) {
    canvas = imageEl;
  } else {
    canvas = document.createElement('canvas');
    const targetW = 100;
    const scale = targetW / imageEl.naturalWidth;
    canvas.width = targetW;
    canvas.height = Math.round(imageEl.naturalHeight * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('No 2d context');
    ctx.drawImage(imageEl, 0, 0, canvas.width, canvas.height);
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2d context');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Muestrear píxeles
  const pixels: Rgb[] = [];
  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const a = data[i + 3];
    if (a < 200) continue; // descartar transparente
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Descartar casi blancos puros (fondos) y casi negros puros
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 248 && min > 248) continue;
    if (max < 12) continue;
    pixels.push([r, g, b]);
  }
  if (pixels.length === 0) return { dominante: '#888888', paleta: ['#888888'] };

  // Inicializar centroides con k-means++
  const centroids: Rgb[] = [];
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  while (centroids.length < k) {
    const dists = pixels.map((p) => Math.min(...centroids.map((c) => distRgb(p, c))));
    const total = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i];
      if (r <= 0) { idx = i; break; }
    }
    centroids.push(pixels[idx]);
  }

  // Iteraciones
  const assignments = new Array(pixels.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // Asignar
    for (let i = 0; i < pixels.length; i++) {
      let best = 0, bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        const d = distRgb(pixels[i], centroids[j]);
        if (d < bestDist) { bestDist = d; best = j; }
      }
      assignments[i] = best;
    }
    // Recalcular
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]); // r, g, b, count
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i][0];
      sums[c][1] += pixels[i][1];
      sums[c][2] += pixels[i][2];
      sums[c][3]++;
    }
    for (let j = 0; j < k; j++) {
      if (sums[j][3] > 0) {
        centroids[j] = [
          sums[j][0] / sums[j][3],
          sums[j][1] / sums[j][3],
          sums[j][2] / sums[j][3],
        ];
      }
    }
  }

  // Ordenar centroides por número de píxeles asignados (descendente)
  const counts = new Array(k).fill(0);
  for (let i = 0; i < assignments.length; i++) counts[assignments[i]]++;
  const orden = centroids
    .map((c, i) => ({ c, count: counts[i] }))
    .filter((o) => o.count > 0)
    .sort((a, b) => b.count - a.count);

  if (orden.length === 0) return { dominante: '#888888', paleta: ['#888888'] };

  return {
    dominante: rgbToHex(orden[0].c),
    paleta: orden.map((o) => rgbToHex(o.c)),
  };
}

// ────────────────────────────────────────────────────────────
// Validación de esquemas cromáticos
// ────────────────────────────────────────────────────────────

export type EsquemaCromatico =
  | 'monocromatico'
  | 'analogo'
  | 'complementario-suave'
  | 'neutro'
  | 'fuera-de-armonia';

const NEUTRO_S_MAX = 0.18; // < 18% saturación => neutro

export function esNeutro(hex: string): boolean {
  const [, s] = hexToHsl(hex);
  return s <= NEUTRO_S_MAX;
}

function diferenciaHue(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

export function validarCombinacion(colores: string[]): {
  esquema: EsquemaCromatico;
  valido: boolean;
  explicacion: string;
} {
  if (colores.length === 0) {
    return { esquema: 'fuera-de-armonia', valido: false, explicacion: 'Sin colores.' };
  }

  const hsls = colores.map((c) => hexToHsl(c));
  const neutros = colores.filter(esNeutro);
  const noNeutros = colores.filter((c) => !esNeutro(c));

  // Todos neutros
  if (noNeutros.length === 0) {
    return {
      esquema: 'neutro',
      valido: true,
      explicacion:
        'Esquema neutro: una combinación de tonos discretos que descansa el ojo y deja que la textura y el corte hablen.',
    };
  }

  // Un solo color saturado (resto neutros)
  if (noNeutros.length === 1) {
    return {
      esquema: 'neutro',
      valido: true,
      explicacion:
        'Base neutra con un único acento de color. La fórmula 60-30-10 en su forma más limpia: el color guía, los neutros sostienen.',
    };
  }

  // Más de un color: comparar hues
  const huesNoNeutros = noNeutros.map((c) => hexToHsl(c)[0]);
  const difs: number[] = [];
  for (let i = 0; i < huesNoNeutros.length; i++) {
    for (let j = i + 1; j < huesNoNeutros.length; j++) {
      difs.push(diferenciaHue(huesNoNeutros[i], huesNoNeutros[j]));
    }
  }
  const maxDif = Math.max(...difs);

  // Monocromático: todos los hues están dentro de 15°
  if (maxDif <= 15) {
    return {
      esquema: 'monocromatico',
      valido: true,
      explicacion:
        'Esquema monocromático: un único matiz en distintos valores. Sofisticación silenciosa y alargamiento visual.',
    };
  }

  // Análogo: hues dentro de 60°
  if (maxDif <= 60) {
    return {
      esquema: 'analogo',
      valido: true,
      explicacion:
        'Esquema análogo: colores vecinos en el círculo cromático. Sensación armónica y natural, como las hojas en otoño.',
    };
  }

  // Complementario suavizado: opuestos (150°-180°) pero al menos uno con saturación moderada
  if (maxDif >= 150) {
    const saturacionMax = Math.max(...noNeutros.map((c) => hexToHsl(c)[1]));
    if (saturacionMax < 0.55) {
      return {
        esquema: 'complementario-suave',
        valido: true,
        explicacion:
          'Esquema complementario suavizado: opuestos en el círculo pero ambos desaturados. Contraste con calma.',
      };
    }
    return {
      esquema: 'complementario-suave',
      valido: false,
      explicacion:
        'Opuestos demasiado saturados — el contraste es estridente. Baja un tono o cambia uno por neutro.',
    };
  }

  // Diferencia intermedia (60°-150°): triádico o tetrádico, suele ser inestable
  return {
    esquema: 'fuera-de-armonia',
    valido: false,
    explicacion:
      'Combinación tensa: los colores están en una distancia que no es ni análoga ni complementaria. Intenta reemplazar uno por neutro.',
  };
}
