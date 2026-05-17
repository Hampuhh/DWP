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
  | 'viaje'
  | 'deporte';

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
