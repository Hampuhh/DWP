// Tipos compartidos del dominio

export type Categoria =
  | 'Top'
  | 'Bottom'
  | 'Vestido'
  | 'Abrigo'
  | 'Calzado'
  | 'Accesorio';

export type Estacion = 'primavera' | 'verano' | 'otono' | 'invierno';

export type Ocasion =
  | 'casual'
  | 'smart-casual'
  | 'cocktail'
  | 'formal'
  | 'noche'
  | 'oficina'
  | 'fin-de-semana'
  | 'viaje'
  | 'lluvia'
  | 'frio'
  | 'calor'
  | 'deporte';

export type Subcategoria =
  // Top
  | 'camisa' | 'blusa' | 'camiseta' | 'jersey' | 'cardigan' | 'top'
  // Bottom
  | 'pantalon-vestir' | 'jeans' | 'falda' | 'short' | 'leggings'
  // Vestido
  | 'vestido-mini' | 'vestido-midi' | 'vestido-largo' | 'wrap' | 'camisero' | 'shift'
  // Abrigo
  | 'blazer' | 'trench' | 'abrigo' | 'gabardina' | 'cazadora' | 'kimono'
  // Calzado
  | 'pump' | 'mocasin' | 'balerina' | 'botin' | 'bota' | 'sneaker' | 'sandalia'
  // Accesorio
  | 'bolso' | 'panuelo' | 'cinturon' | 'joya' | 'reloj' | 'gafas' | 'sombrero';

export type FitTag = 'oversized' | 'fitted' | 'recto' | 'wide-leg' | 'cropped';

export type Contexto =
  | 'cafe'
  | 'dia'
  | 'cita'
  | 'cena'
  | 'boda'
  | 'viaje'
  | 'cine'
  | 'brunch';

export interface Prenda {
  id: string;
  nombre: string;
  categoria: Categoria;
  subcategoria?: Subcategoria;
  fit?: FitTag;
  foto: string; // base64 dataURL
  colorPrincipal: string; // hex
  colorSecundario?: string;
  tela: string;
  estaciones: Estacion[];
  ocasiones: Ocasion[];
  fechaIncorporacion: string; // ISO date
  usos: number;
  precio?: number;
  notas?: string;
}

export interface Outfit {
  id: string;
  fecha: string; // ISO
  contexto: Contexto;
  prendaIds: string[];
  porQueFunciona: string;
  usado: boolean;
}

export type EstacionColor =
  | 'light-spring' | 'true-spring'  | 'bright-spring'
  | 'light-summer' | 'true-summer'  | 'soft-summer'
  | 'soft-autumn'  | 'true-autumn'  | 'dark-autumn'
  | 'dark-winter'  | 'true-winter'  | 'bright-winter';

export type TipoFigura =
  | 'reloj-arena'
  | 'pera'
  | 'manzana'
  | 'rectangulo'
  | 'triangulo-invertido';

export type FormaRostro =
  | 'ovalado'
  | 'redondo'
  | 'cuadrado'
  | 'rectangular'
  | 'corazon'
  | 'diamante';

export interface PerfilCromatico {
  estacion: EstacionColor;
  tipoFigura?: TipoFigura;
  formaRostro?: FormaRostro;
  ultimaActualizacion: string;
}
