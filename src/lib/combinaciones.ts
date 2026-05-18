// Diccionario de combinaciones cromáticas
// Inspirado en "A Dictionary of Color Combinations" de Sanzo Wada (1933-1934),
// curado para paleta editorial · quiet luxury · armario silencioso.
//
// Organizado en 3 grupos:
//  · Editoriales (E·001-030): combinaciones-clásicos atemporales
//  · Estacionales (S·001-024): 2 paletas por estación cromática
//  · Infalibles (I·001-024): recetas probadas para vestir
//
// Cada combinación tiene 3-4 colores en hex.

import type { EstacionColor } from './types';

export type TipoCombinacion =
  | 'editorial'
  | 'estacional'
  | 'infalible'
  | 'monocromatico'
  | 'analogo'
  | 'complementario'
  | 'triadico'
  | 'neutro';

export interface Combinacion {
  id: string;        // ej. 'E·001'
  nombre: string;
  colores: string[]; // hex
  tipo: TipoCombinacion;
  estacion?: EstacionColor;
  notas?: string;
}

export const COMBINACIONES: Combinacion[] = [
  // ──────────────────────────────────────────────────────────
  // EDITORIALES · clásicos atemporales (30)
  // ──────────────────────────────────────────────────────────
  { id: 'E·001', nombre: 'Marfil · chocolate · terracota',     tipo: 'editorial',     colores: ['#F5F1EA', '#5F4339', '#B97A57'] },
  { id: 'E·002', nombre: 'Marino · dorado antiguo · crema',    tipo: 'editorial',     colores: ['#1F2A44', '#B8860B', '#FAF7F1'] },
  { id: 'E·003', nombre: 'Greige · chocolate · crema',         tipo: 'neutro',        colores: ['#B8B0A4', '#5F4339', '#FAF7F1'] },
  { id: 'E·004', nombre: 'Bone · verde botella · dorado',      tipo: 'editorial',     colores: ['#EFE3D2', '#0B3B2E', '#C49A4A'] },
  { id: 'E·005', nombre: 'Rojo Hermès · crema · negro',        tipo: 'complementario',colores: ['#A4151D', '#FAF7F1', '#2A2825'] },
  { id: 'E·006', nombre: 'Salvia · crema · canela',            tipo: 'analogo',       colores: ['#9CAF88', '#FAF7F1', '#A47148'] },
  { id: 'E·007', nombre: 'Lavanda · gris perla · plata',       tipo: 'analogo',       colores: ['#C8B4E1', '#C2C0BC', '#8E8E93'] },
  { id: 'E·008', nombre: 'Oxblood · bone · gris medio',        tipo: 'editorial',     colores: ['#4A0E13', '#EFE3D2', '#7D7468'] },
  { id: 'E·009', nombre: 'Caqui · bone · cobre',               tipo: 'analogo',       colores: ['#8A8060', '#EFE3D2', '#B87333'] },
  { id: 'E·010', nombre: 'Pizarra · crema · dorado pálido',    tipo: 'editorial',     colores: ['#3D4856', '#FAF7F1', '#DBC392'] },
  { id: 'E·011', nombre: 'Terracota · oliva · marfil',         tipo: 'triadico',      colores: ['#B97A57', '#7D8156', '#F5F1EA'] },
  { id: 'E·012', nombre: 'Ciruela · camel · crema',            tipo: 'editorial',     colores: ['#5A2A4C', '#B98E5B', '#FAF7F1'] },
  { id: 'E·013', nombre: 'Cobalto · bone · dorado',            tipo: 'complementario',colores: ['#0F52BA', '#EFE3D2', '#C49A4A'] },
  { id: 'E·014', nombre: 'Peltre · lavanda · perla',           tipo: 'analogo',       colores: ['#8B8589', '#B8A6C9', '#E8E2D5'] },
  { id: 'E·015', nombre: 'Malva · bone · plata',               tipo: 'analogo',       colores: ['#9F8AAE', '#EFE3D2', '#B8B0A4'] },
  { id: 'E·016', nombre: 'Verde musgo · canela · crema',       tipo: 'analogo',       colores: ['#5F6B3C', '#A47148', '#FAF7F1'] },
  { id: 'E·017', nombre: 'Rosa empolvado · gris · plata',      tipo: 'editorial',     colores: ['#D4A5A0', '#A8A4A0', '#B8B0A4'] },
  { id: 'E·018', nombre: 'Berenjena · dorado · crema',         tipo: 'complementario',colores: ['#3D2138', '#C49A4A', '#FAF7F1'] },
  { id: 'E·019', nombre: 'Arena · verde botella · terracota',  tipo: 'triadico',      colores: ['#D6C9A9', '#0B3B2E', '#B97A57'] },
  { id: 'E·020', nombre: 'Piedra · carmín · marfil',           tipo: 'complementario',colores: ['#9A968B', '#9B111E', '#F5F1EA'] },
  { id: 'E·021', nombre: 'Azul polvo · crema · oro blanco',    tipo: 'editorial',     colores: ['#9BB0C1', '#FAF7F1', '#D4D2C8'] },
  { id: 'E·022', nombre: 'Negro · marfil · terracota',         tipo: 'editorial',     colores: ['#2A2825', '#F5F1EA', '#B97A57'] },
  { id: 'E·023', nombre: 'Verde bosque · camel · crema',       tipo: 'editorial',     colores: ['#2F4F1F', '#B98E5B', '#FAF7F1'] },
  { id: 'E·024', nombre: 'Burdeos · crema · negro',            tipo: 'editorial',     colores: ['#722F37', '#FAF7F1', '#2A2825'] },
  { id: 'E·025', nombre: 'Mostaza · marino · marfil',          tipo: 'complementario',colores: ['#C4A24A', '#1F2A44', '#F5F1EA'] },
  { id: 'E·026', nombre: 'Coral · marino · crema',             tipo: 'complementario',colores: ['#E27D60', '#1F2A44', '#FAF7F1'] },
  { id: 'E·027', nombre: 'Esmeralda · oro · marfil',           tipo: 'editorial',     colores: ['#046307', '#C49A4A', '#F5F1EA'] },
  { id: 'E·028', nombre: 'Antracita · crema · cobre',          tipo: 'editorial',     colores: ['#36373A', '#FAF7F1', '#B87333'] },
  { id: 'E·029', nombre: 'Lila · perla · ciruela',             tipo: 'monocromatico', colores: ['#C8B4E1', '#E8E2D5', '#5A2A4C'] },
  { id: 'E·030', nombre: 'Ocre · marrón · marfil',             tipo: 'monocromatico', colores: ['#C68E17', '#7B4A2B', '#F5F1EA'] },

  // ──────────────────────────────────────────────────────────
  // ESTACIONALES · 2 por estación (24)
  // ──────────────────────────────────────────────────────────
  // Primavera Clara
  { id: 'S·001', nombre: 'Coral salmón · marfil · aguamarina',  tipo: 'estacional', estacion: 'light-spring',  colores: ['#FA8072', '#F5F1EA', '#7FFFD4'] },
  { id: 'S·002', nombre: 'Amarillo mantequilla · camel · lavanda', tipo: 'estacional', estacion: 'light-spring', colores: ['#FFF8B6', '#C5B299', '#C8B4E1'] },
  // Primavera Cálida
  { id: 'S·003', nombre: 'Coral · camel · verde manzana',       tipo: 'estacional', estacion: 'true-spring',   colores: ['#FF7F50', '#D2A679', '#8DB600'] },
  { id: 'S·004', nombre: 'Naranja melocotón · marfil · turquesa cálido', tipo: 'estacional', estacion: 'true-spring', colores: ['#FFA07A', '#F5F1EA', '#30D5C8'] },
  // Primavera Brillante
  { id: 'S·005', nombre: 'Fucsia · turquesa · marfil',          tipo: 'estacional', estacion: 'bright-spring', colores: ['#FF1493', '#40E0D0', '#F5F1EA'] },
  { id: 'S·006', nombre: 'Esmeralda brillante · marfil · rojo escarlata', tipo: 'estacional', estacion: 'bright-spring', colores: ['#50C878', '#F5F1EA', '#FF2400'] },
  // Verano Claro
  { id: 'S·007', nombre: 'Rosa empolvado · gris perla · periwinkle', tipo: 'estacional', estacion: 'light-summer', colores: ['#F4C2C2', '#D1CFCB', '#CCCCFF'] },
  { id: 'S·008', nombre: 'Azul cielo · marfil frío · lavanda',  tipo: 'estacional', estacion: 'light-summer',  colores: ['#87CEEB', '#F8F4F0', '#E6E6FA'] },
  // Verano Frío
  { id: 'S·009', nombre: 'Rosa frambuesa · marino · gris perla',tipo: 'estacional', estacion: 'true-summer',   colores: ['#DE5D83', '#1B2A4E', '#D1CFCB'] },
  { id: 'S·010', nombre: 'Burgundy frío · marfil · azul francés',tipo: 'estacional', estacion: 'true-summer',  colores: ['#722F37', '#F0EDE5', '#4F86C6'] },
  // Verano Suave
  { id: 'S·011', nombre: 'Mauve · taupe frío · salvia',         tipo: 'estacional', estacion: 'soft-summer',   colores: ['#9F8AAE', '#A89C8E', '#9CAF88'] },
  { id: 'S·012', nombre: 'Azul tormenta · perla · oxblood frío',tipo: 'estacional', estacion: 'soft-summer',   colores: ['#5C7A8F', '#E8E2D5', '#5E2F2F'] },
  // Otoño Suave
  { id: 'S·013', nombre: 'Camel · oliva claro · salmón apagado',tipo: 'estacional', estacion: 'soft-autumn',   colores: ['#D2B48C', '#BDB76B', '#E9967A'] },
  { id: 'S·014', nombre: 'Marfil cálido · canela · taupe',      tipo: 'estacional', estacion: 'soft-autumn',   colores: ['#F5F1EA', '#A47148', '#A0826D'] },
  // Otoño Cálido
  { id: 'S·015', nombre: 'Rojo óxido · mostaza · verde musgo',  tipo: 'estacional', estacion: 'true-autumn',   colores: ['#B7410E', '#DAA520', '#8A9A5B'] },
  { id: 'S·016', nombre: 'Chocolate cálido · camel · turquesa cálido', tipo: 'estacional', estacion: 'true-autumn', colores: ['#3D2817', '#B98E5B', '#30D5C8'] },
  // Otoño Profundo
  { id: 'S·017', nombre: 'Granate · oliva muy oscuro · oro antiguo', tipo: 'estacional', estacion: 'dark-autumn', colores: ['#722F37', '#2F4F1F', '#B8860B'] },
  { id: 'S·018', nombre: 'Berenjena · chocolate · mostaza',     tipo: 'estacional', estacion: 'dark-autumn',   colores: ['#3D2138', '#3D2817', '#C4A24A'] },
  // Invierno Profundo
  { id: 'S·019', nombre: 'Rubí · negro · blanco brillante',     tipo: 'estacional', estacion: 'dark-winter',   colores: ['#9B111E', '#1C1C1C', '#FFFFFF'] },
  { id: 'S·020', nombre: 'Esmeralda profundo · marino · plata', tipo: 'estacional', estacion: 'dark-winter',   colores: ['#006633', '#0B1A33', '#C0C0C0'] },
  // Invierno Frío
  { id: 'S·021', nombre: 'Rojo carmín · marino · blanco óptico',tipo: 'estacional', estacion: 'true-winter',   colores: ['#DC143C', '#000080', '#FFFFFF'] },
  { id: 'S·022', nombre: 'Zafiro · gris carbón · fucsia frío',  tipo: 'estacional', estacion: 'true-winter',   colores: ['#0F52BA', '#36454F', '#FF0066'] },
  // Invierno Brillante
  { id: 'S·023', nombre: 'Fucsia eléctrico · negro · turquesa', tipo: 'estacional', estacion: 'bright-winter', colores: ['#FF0099', '#000000', '#00CED1'] },
  { id: 'S·024', nombre: 'Cobalto · blanco · amarillo limón',   tipo: 'estacional', estacion: 'bright-winter', colores: ['#0033CC', '#FFFFFF', '#FFFF33'] },

  // ──────────────────────────────────────────────────────────
  // INFALIBLES · recetas probadas para vestir (24)
  // ──────────────────────────────────────────────────────────
  { id: 'I·001', nombre: 'Marino + camel + blanco',             tipo: 'infalible', colores: ['#1F2A44', '#B98E5B', '#FAF7F1'] },
  { id: 'I·002', nombre: 'Camel + crema + chocolate',           tipo: 'infalible', colores: ['#B98E5B', '#FAF7F1', '#5F4339'] },
  { id: 'I·003', nombre: 'Greige + crema + chocolate',          tipo: 'infalible', colores: ['#B8B0A4', '#FAF7F1', '#5F4339'] },
  { id: 'I·004', nombre: 'Marino + camel',                      tipo: 'infalible', colores: ['#1F2A44', '#B98E5B'] },
  { id: 'I·005', nombre: 'Blanco + negro',                      tipo: 'infalible', colores: ['#FAF7F1', '#2A2825'] },
  { id: 'I·006', nombre: 'Gris + burgundy',                     tipo: 'infalible', colores: ['#7D7468', '#722F37'] },
  { id: 'I·007', nombre: 'Marino + blanco + rojo (náutico)',    tipo: 'infalible', colores: ['#1F2A44', '#FAF7F1', '#A4151D'] },
  { id: 'I·008', nombre: 'Negro + blanco + terracota',          tipo: 'infalible', colores: ['#2A2825', '#FAF7F1', '#B97A57'] },
  { id: 'I·009', nombre: 'Beige + oliva + marrón',              tipo: 'infalible', colores: ['#D6C9A9', '#7D8156', '#7B4A2B'] },
  { id: 'I·010', nombre: 'Negro + marfil + dorado',             tipo: 'infalible', colores: ['#2A2825', '#F5F1EA', '#C49A4A'] },
  { id: 'I·011', nombre: 'Marino + crema + cobre',              tipo: 'infalible', colores: ['#1F2A44', '#FAF7F1', '#B87333'] },
  { id: 'I·012', nombre: 'Camel + blanco + perla',              tipo: 'infalible', colores: ['#B98E5B', '#FAF7F1', '#E8E2D5'] },
  { id: 'I·013', nombre: 'Marino + burdeos + crema',            tipo: 'infalible', colores: ['#1F2A44', '#722F37', '#FAF7F1'] },
  { id: 'I·014', nombre: 'Verde bosque + crema + camel',        tipo: 'infalible', colores: ['#2F4F1F', '#FAF7F1', '#B98E5B'] },
  { id: 'I·015', nombre: 'Antracita + camel + marfil',          tipo: 'infalible', colores: ['#36373A', '#B98E5B', '#F5F1EA'] },
  { id: 'I·016', nombre: 'Crema + denim + camel',               tipo: 'infalible', colores: ['#FAF7F1', '#4A6FA5', '#B98E5B'] },
  { id: 'I·017', nombre: 'Negro + perla + plata',               tipo: 'infalible', colores: ['#2A2825', '#E8E2D5', '#C0C0C0'] },
  { id: 'I·018', nombre: 'Marrón chocolate + marfil + oro',     tipo: 'infalible', colores: ['#3D2817', '#F5F1EA', '#C49A4A'] },
  { id: 'I·019', nombre: 'Gris carbón + rosa palo',             tipo: 'infalible', colores: ['#36373A', '#D4A5A0'] },
  { id: 'I·020', nombre: 'Marino + rosa empolvado + crema',     tipo: 'infalible', colores: ['#1F2A44', '#D4A5A0', '#FAF7F1'] },
  { id: 'I·021', nombre: 'Verde oliva + crema + marrón',        tipo: 'infalible', colores: ['#7D8156', '#FAF7F1', '#5F4339'] },
  { id: 'I·022', nombre: 'Negro + camel + burdeos',             tipo: 'infalible', colores: ['#2A2825', '#B98E5B', '#722F37'] },
  { id: 'I·023', nombre: 'Marfil + ciruela + dorado',           tipo: 'infalible', colores: ['#F5F1EA', '#5A2A4C', '#C49A4A'] },
  { id: 'I·024', nombre: 'Crema + verde salvia + canela',       tipo: 'infalible', colores: ['#FAF7F1', '#9CAF88', '#A47148'] },
];

export const TIPOS_LABEL: Record<TipoCombinacion, string> = {
  editorial:      'Editorial',
  estacional:     'Estacional',
  infalible:      'Infalible',
  monocromatico:  'Monocromática',
  analogo:        'Análoga',
  complementario: 'Complementaria',
  triadico:       'Triádica',
  neutro:         'Neutra',
};
