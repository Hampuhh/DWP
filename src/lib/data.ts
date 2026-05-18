// Catálogo estático: 12 estaciones, contextos y ocasiones
import type { Contexto, EstacionColor, Ocasion } from './types';

export interface PaletaEstacion {
  id: EstacionColor;
  nombre: string;
  familia: 'primavera' | 'verano' | 'otono' | 'invierno';
  descripcion: string;
  neutros: string[]; // hex
  acentos: string[];
  statement: string[];
  metales: string[];
  evitar: string[];
}

export const PALETAS: Record<EstacionColor, PaletaEstacion> = {
  'light-spring': {
    id: 'light-spring',
    nombre: 'Primavera Clara',
    familia: 'primavera',
    descripcion: 'Cálida + clara. Contraste muy bajo. Marfil-melocotón.',
    neutros: ['#F5F1EA', '#E8D9C2', '#C5B299', '#8B7355'],
    acentos: ['#FA8072', '#FFC8A2', '#FFF8B6', '#7FFFD4', '#C8B4E1'],
    statement: ['#FF7F50', '#40E0D0'],
    metales: ['Oro amarillo claro', 'Oro rosado', 'Oro blanco'],
    evitar: ['Negro puro', 'Blanco óptico', 'Colores muy saturados fríos'],
  },
  'true-spring': {
    id: 'true-spring',
    nombre: 'Primavera Cálida',
    familia: 'primavera',
    descripcion: 'La más cálida. Marfil dorado, contraste medio.',
    neutros: ['#F5F1EA', '#D2A679', '#8B4513', '#3D5A80'],
    acentos: ['#FF7F50', '#FFA500', '#FFD700', '#8DB600', '#30D5C8'],
    statement: ['#FF6347', '#1E90FF'],
    metales: ['Oro amarillo brillante', 'Bronce', 'Cobre'],
    evitar: ['Negro puro', 'Grises fríos', 'Pasteles polvorientos'],
  },
  'bright-spring': {
    id: 'bright-spring',
    nombre: 'Primavera Brillante',
    familia: 'primavera',
    descripcion: 'Brillo alto, contraste alto. Ojos chispeantes.',
    neutros: ['#F5F1EA', '#C5B299', '#4A4A4A', '#1A2238'],
    acentos: ['#FF1493', '#FF4500', '#FFFF00', '#50C878', '#40E0D0', '#0066FF', '#9400D3'],
    statement: ['#FF1493', '#40E0D0'],
    metales: ['Oro amarillo pulido', 'Plata pulida'],
    evitar: ['Tonos polvorientos', 'Tierra apagada'],
  },
  'light-summer': {
    id: 'light-summer',
    nombre: 'Verano Claro',
    familia: 'verano',
    descripcion: 'Frío + claro. Contraste muy bajo, tinte rosado.',
    neutros: ['#F8F4F0', '#D1CFCB', '#A8A4B0', '#3D4B6B'],
    acentos: ['#FFB6C1', '#E6E6FA', '#87CEEB', '#B0D8E6', '#CCCCFF', '#C1E1C1'],
    statement: ['#FF69B4', '#9370DB'],
    metales: ['Plata pulida', 'Oro blanco', 'Platino', 'Oro rosado claro'],
    evitar: ['Tonos cálidos saturados', 'Negro puro', 'Naranjas'],
  },
  'true-summer': {
    id: 'true-summer',
    nombre: 'Verano Frío',
    familia: 'verano',
    descripcion: 'Pura frialdad. Marino sustituye al negro.',
    neutros: ['#F0EDE5', '#B0B0B0', '#5C6E91', '#1B2A4E'],
    acentos: ['#DE5D83', '#C71585', '#6B5B95', '#4F86C6', '#9CAF88', '#6B7B8C'],
    statement: ['#C71585', '#1B3A57'],
    metales: ['Plata pulida', 'Oro blanco', 'Platino'],
    evitar: ['Negro puro', 'Naranja', 'Amarillo cálido'],
  },
  'soft-summer': {
    id: 'soft-summer',
    nombre: 'Verano Suave',
    familia: 'verano',
    descripcion: 'Suavidad cromática máxima. Mutado, ceniza.',
    neutros: ['#E8E2D5', '#B8B0A4', '#7D7468', '#4A4F5C'],
    acentos: ['#C9A0A0', '#9F8AAE', '#7B9E89', '#6B8FA8', '#A89C8E'],
    statement: ['#8B5A6B', '#5C7A8F'],
    metales: ['Plata mate', 'Peltre', 'Rose gold mate'],
    evitar: ['Colores brillantes saturados', 'Negro puro'],
  },
  'soft-autumn': {
    id: 'soft-autumn',
    nombre: 'Otoño Suave',
    familia: 'otono',
    descripcion: 'Suavidad cálida. Camel reina. Aspecto natural.',
    neutros: ['#F5F1EA', '#D2B48C', '#8B7355', '#5D4E37'],
    acentos: ['#E9967A', '#CD853F', '#BDB76B', '#8FBC8F', '#A0826D'],
    statement: ['#B7410E', '#8A9A5B'],
    metales: ['Oro amarillo mate', 'Bronce mate', 'Cobre mate', 'Rose gold mate'],
    evitar: ['Negro puro', 'Blanco óptico', 'Fucsia frío', 'Colores brillantes'],
  },
  'true-autumn': {
    id: 'true-autumn',
    nombre: 'Otoño Cálido',
    familia: 'otono',
    descripcion: 'Centro del otoño. Máxima calidez. Chocolate es su negro.',
    neutros: ['#F5F1EA', '#B8860B', '#8B4513', '#3D2817'],
    acentos: ['#B7410E', '#D2691E', '#DAA520', '#808000', '#3B5323', '#5F4339'],
    statement: ['#A0522D', '#556B2F'],
    metales: ['Oro amarillo antiguo', 'Cobre', 'Bronce'],
    evitar: ['Negro puro', 'Rosa frío', 'Azul brillante frío'],
  },
  'dark-autumn': {
    id: 'dark-autumn',
    nombre: 'Otoño Profundo',
    familia: 'otono',
    descripcion: 'Profundidad cálida. Ojos y cabello oscuros.',
    neutros: ['#F0EAE0', '#8B7355', '#2F2419', '#1C1818'],
    acentos: ['#722F37', '#8B0000', '#B8860B', '#2F4F1F', '#1B2638', '#4B2C20'],
    statement: ['#5A0E2D', '#0F1F3C'],
    metales: ['Oro amarillo profundo', 'Bronce envejecido', 'Cobre oxidado'],
    evitar: ['Pasteles', 'Colores muy claros', 'Plata fría brillante'],
  },
  'dark-winter': {
    id: 'dark-winter',
    nombre: 'Invierno Profundo',
    familia: 'invierno',
    descripcion: 'Profundidad fría. Contraste alto, ojos nítidos.',
    neutros: ['#FFFFFF', '#2A2825', '#0B1A33', '#1C1C1C'],
    acentos: ['#9B111E', '#722F37', '#C71585', '#5E0099', '#006633', '#003366'],
    statement: ['#C71585', '#9B111E'],
    metales: ['Plata pulida', 'Oro blanco', 'Platino', 'Peltre brillante'],
    evitar: ['Camel', 'Tierra apagada', 'Oro amarillo cálido'],
  },
  'true-winter': {
    id: 'true-winter',
    nombre: 'Invierno Frío',
    familia: 'invierno',
    descripcion: 'Frialdad pura. Negro puro, blanco óptico, contraste alto.',
    neutros: ['#FFFFFF', '#1C1C1C', '#000080', '#36454F'],
    acentos: ['#DC143C', '#FF0066', '#FF1493', '#0F52BA', '#046307', '#5E0099'],
    statement: ['#DC143C', '#0F52BA'],
    metales: ['Solo plata pulida', 'Oro blanco', 'Platino'],
    evitar: ['Tonos tierra cálidos', 'Oro amarillo', 'Beige cálido'],
  },
  'bright-winter': {
    id: 'bright-winter',
    nombre: 'Invierno Brillante',
    familia: 'invierno',
    descripcion: 'Brillo máximo. Translúcido o brillante, ojos chispeantes.',
    neutros: ['#FFFFFF', '#000000', '#0F1A2E', '#36454F'],
    acentos: ['#FF0099', '#FF073A', '#FFFF33', '#39FF14', '#00CED1', '#0033CC', '#7B00FF'],
    statement: ['#FF0099', '#00CED1'],
    metales: ['Plata espejo', 'Oro blanco brillante', 'Platino'],
    evitar: ['Tonos polvorientos', 'Pasteles apagados', 'Tierra'],
  },
};

export interface ContextoInfo {
  id: Contexto;
  nombre: string;
  descripcion: string;
  codigo: 'casual' | 'smart-casual' | 'cocktail' | 'formal';
  ocasionesPermitidas: Ocasion[];
  prendasTipicas: string;
}

export const CONTEXTOS: Record<Contexto, ContextoInfo> = {
  cafe: {
    id: 'cafe',
    nombre: 'Café o almuerzo',
    descripcion: 'Casual elevado, paleta serena, cómodo sin parecer descuidado.',
    codigo: 'casual',
    ocasionesPermitidas: ['casual', 'smart-casual'],
    prendasTipicas: 'Pantalón ancho o jeans + camisa o jersey fino + balerina o mocasín.',
  },
  dia: {
    id: 'dia',
    nombre: 'Día a día',
    descripcion: 'Tu uniforme silencioso. Repetible, cómodo, intencional.',
    codigo: 'casual',
    ocasionesPermitidas: ['casual', 'smart-casual'],
    prendasTipicas: 'Base neutra + una capa de calidad + zapato limpio.',
  },
  cita: {
    id: 'cita',
    nombre: 'Una cita',
    descripcion: 'Sutil, intencional, tú. Sin disfraz.',
    codigo: 'smart-casual',
    ocasionesPermitidas: ['smart-casual', 'cocktail'],
    prendasTipicas: 'Vestido midi tierra + balerinas + pañuelo discreto.',
  },
  cena: {
    id: 'cena',
    nombre: 'Cena o cumpleaños',
    descripcion: 'Elegancia sin estridencia. Color tierra o joya.',
    codigo: 'smart-casual',
    ocasionesPermitidas: ['smart-casual', 'cocktail', 'noche'],
    prendasTipicas: 'Blusa seda color joya + pantalón vestir + tacón cómodo.',
  },
  boda: {
    id: 'boda',
    nombre: 'Una boda',
    descripcion: 'Cocktail o ceremonia. No robar foco a quien se casa.',
    codigo: 'cocktail',
    ocasionesPermitidas: ['cocktail', 'formal', 'noche'],
    prendasTipicas: 'Vestido midi paleta tierra + tocado o aretes statement + tacón + clutch.',
  },
  viaje: {
    id: 'viaje',
    nombre: 'Un viaje',
    descripcion: 'Mínima maleta, máximas combinaciones. Paleta única.',
    codigo: 'smart-casual',
    ocasionesPermitidas: ['casual', 'smart-casual', 'viaje'],
    prendasTipicas: 'Jeans premium oscuros + camisa blanca + blazer + sneaker blanca + trench.',
  },
  cine: {
    id: 'cine',
    nombre: 'Cine o paseo',
    descripcion: 'Casual con intención. Capa cómoda para cualquier clima.',
    codigo: 'casual',
    ocasionesPermitidas: ['casual'],
    prendasTipicas: 'Pantalón ancho + camiseta de algodón pesado + cárdigan + balerina.',
  },
  brunch: {
    id: 'brunch',
    nombre: 'Brunch',
    descripcion: 'Luz natural, paleta serena. Frescura sin esfuerzo.',
    codigo: 'smart-casual',
    ocasionesPermitidas: ['casual', 'smart-casual'],
    prendasTipicas: 'Vestido shirt-dress azul medio + sandalia plana + bolso pequeño.',
  },
};

export const ESTACIONES_NOMBRE: Record<string, string> = {
  primavera: 'Primavera',
  verano:    'Verano',
  otono:     'Otoño',
  invierno:  'Invierno',
};

export const OCASIONES_NOMBRE: Record<Ocasion, string> = {
  casual:           'Casual',
  'smart-casual':   'Smart casual',
  cocktail:         'Cocktail',
  formal:           'Formal',
  noche:            'Noche',
  oficina:          'Oficina',
  'fin-de-semana':  'Fin de semana',
  viaje:            'Viaje',
  lluvia:           'Lluvia',
  frio:             'Frío',
  calor:            'Calor',
  deporte:          'Deporte',
};

export const CATEGORIAS = ['Top', 'Bottom', 'Vestido', 'Abrigo', 'Calzado', 'Accesorio'] as const;

import type { Categoria, Subcategoria, FitTag } from './types';

// Subcategorías permitidas por cada categoría — usadas en el selector de la prenda
export const SUBCATEGORIAS: Record<Categoria, { id: Subcategoria; label: string }[]> = {
  Top: [
    { id: 'camisa',    label: 'Camisa' },
    { id: 'blusa',     label: 'Blusa' },
    { id: 'camiseta',  label: 'Camiseta' },
    { id: 'jersey',    label: 'Jersey / Punto' },
    { id: 'cardigan',  label: 'Cardigan' },
    { id: 'top',       label: 'Top (tirantes / corto)' },
  ],
  Bottom: [
    { id: 'pantalon-vestir', label: 'Pantalón de vestir' },
    { id: 'jeans',           label: 'Jeans' },
    { id: 'falda',           label: 'Falda' },
    { id: 'short',           label: 'Short' },
    { id: 'leggings',        label: 'Leggings' },
  ],
  Vestido: [
    { id: 'vestido-mini',  label: 'Mini' },
    { id: 'vestido-midi',  label: 'Midi' },
    { id: 'vestido-largo', label: 'Largo / Maxi' },
    { id: 'wrap',          label: 'Wrap / Cruzado' },
    { id: 'camisero',      label: 'Camisero' },
    { id: 'shift',         label: 'Shift / Recto' },
  ],
  Abrigo: [
    { id: 'blazer',    label: 'Blazer' },
    { id: 'trench',    label: 'Trench' },
    { id: 'abrigo',    label: 'Abrigo lana' },
    { id: 'gabardina', label: 'Gabardina' },
    { id: 'cazadora',  label: 'Cazadora / Bomber' },
    { id: 'kimono',    label: 'Kimono / Ligero' },
  ],
  Calzado: [
    { id: 'pump',     label: 'Pump / Salón' },
    { id: 'mocasin',  label: 'Mocasín' },
    { id: 'balerina', label: 'Balerina' },
    { id: 'botin',    label: 'Botín' },
    { id: 'bota',     label: 'Bota alta' },
    { id: 'sneaker',  label: 'Sneaker' },
    { id: 'sandalia', label: 'Sandalia' },
  ],
  Accesorio: [
    { id: 'bolso',    label: 'Bolso' },
    { id: 'panuelo',  label: 'Pañuelo / Fular' },
    { id: 'cinturon', label: 'Cinturón' },
    { id: 'joya',     label: 'Joya' },
    { id: 'reloj',    label: 'Reloj' },
    { id: 'gafas',    label: 'Gafas' },
    { id: 'sombrero', label: 'Sombrero' },
  ],
};

export const FIT_TAGS: { id: FitTag; label: string }[] = [
  { id: 'fitted',    label: 'Entallado' },
  { id: 'recto',     label: 'Recto' },
  { id: 'oversized', label: 'Oversized' },
  { id: 'wide-leg',  label: 'Wide-leg / Palazzo' },
  { id: 'cropped',   label: 'Cropped' },
];
