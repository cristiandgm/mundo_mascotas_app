import { ProductBag } from '../data/catalog';

/**
 * Normaliza una cadena de texto:
 * - minúsculas
 * - sin tildes ni acentos (NFD)
 * - sin caracteres especiales
 * - espacios simples limpios
 */
export const normalizeSearchText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Mapeo de errores ortográficos comunes, fonética y variantes en concentrados y mascotas en Colombia
 */
export const getPhoneticToken = (token: string): string => {
  if (!token) return '';
  let s = normalizeSearchText(token);

  // Alias y errores frecuentes de marcas de concentrados
  if (s === 'origen' || s === 'orijen' || s === 'origene' || s === 'origens') return 'orijen';
  if (s === 'proplan' || s === 'pro plan' || s === 'purina' || s === 'purinaproplan') return 'proplan';
  if (s === 'nexgard' || s === 'nexguard' || s === 'nextgard' || s === 'nexgar' || s === 'nesgard') return 'nexgard';
  if (s === 'royal' || s === 'roial' || s === 'canin' || s === 'royalcanin' || s === 'roialcanin') return 'royalcanin';
  if (s === 'bravecto' || s === 'bravekto' || s === 'braveto') return 'bravecto';
  if (s === 'taste' || s === 'teist' || s === 'totw' || s === 'tast' || s === 'tasteofthewild') return 'taste';
  if (s === 'acana' || s === 'akana' || s === 'arcana') return 'acana';
  if (s === 'diamond' || s === 'daymond' || s === 'daimond' || s === 'diamon' || s === 'diamont') return 'diamond';
  if (s === 'simparica' || s === 'sinparica' || s === 'simpatica') return 'simparica';
  if (s === 'prey' || s === 'pray' || s === 'prei') return 'prey';

  // Fonética española general
  // 'g' suave antes de 'e' o 'i' suena idéntica a 'j'
  s = s.replace(/g(?=[ei])/g, 'j');
  // 'v' y 'b' suenan idénticas en español
  s = s.replace(/v/g, 'b');
  // 'z' y 'c' suave antes de 'e'/'i' suenan como 's'
  s = s.replace(/z/g, 's').replace(/c(?=[ei])/g, 's');
  // 'k' y 'qu' suenan como 'c'
  s = s.replace(/k/g, 'c').replace(/qu/g, 'c');
  // 'y' vocálica suena como 'i'
  s = s.replace(/y/g, 'i');
  // 'h' muda
  s = s.replace(/h/g, '');
  // colapsar letras dobles (ej. 'pp', 'tt', 'cc') excepto 'll'
  s = s.replace(/([^l])\1+/g, '$1');

  return s;
};

/**
 * Distancia de Levenshtein (número mínimo de ediciones para transformar a en b)
 */
export const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  if (Math.abs(a.length - b.length) > 3) {
    return Math.abs(a.length - b.length);
  }

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      if (a[i - 1] === b[j - 1]) {
        row[j] = prevDiag;
      } else {
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prevDiag + 1);
      }
      prevDiag = temp;
    }
  }
  return row[b.length];
};

/**
 * Verifica si una palabra de la búsqueda hace match con una palabra destino tolerando typos
 */
export const wordMatchesFuzzy = (queryWord: string, targetWord: string): boolean => {
  if (!queryWord || !targetWord) return false;

  // 1. Coincidencia directa o prefijo
  if (targetWord.startsWith(queryWord) || targetWord.includes(queryWord)) {
    return true;
  }

  // 2. Coincidencia fonética (ej. "origen" vs "orijen", "akana" vs "acana")
  const qPhon = getPhoneticToken(queryWord);
  const tPhon = getPhoneticToken(targetWord);
  if (tPhon.startsWith(qPhon) || tPhon.includes(qPhon) || qPhon === tPhon) {
    return true;
  }

  // 3. Tolerancia por distancia de edición (typos tipográficos)
  const maxAllowedDistance = queryWord.length <= 4 ? 1 : 2;
  if (levenshteinDistance(queryWord, targetWord) <= maxAllowedDistance) {
    return true;
  }
  if (levenshteinDistance(qPhon, tPhon) <= maxAllowedDistance) {
    return true;
  }

  return false;
};

/**
 * Evalúa si una cadena objetivo contiene o empata con la consulta tolerando errores ortográficos
 */
export const stringMatchesFuzzy = (query: string, target: string): boolean => {
  const normQuery = normalizeSearchText(query);
  const normTarget = normalizeSearchText(target);
  if (!normQuery) return true;
  if (!normTarget) return false;

  // 1. Substring exacto
  if (normTarget.includes(normQuery)) return true;

  // 2. Match sin espacios (ej. "pro plan" vs "proplan", "royal canin" vs "royalcanin")
  const noSpaceQuery = normQuery.replace(/\s+/g, '');
  const noSpaceTarget = normTarget.replace(/\s+/g, '');
  if (noSpaceTarget.includes(noSpaceQuery) || noSpaceQuery.includes(noSpaceTarget)) {
    return true;
  }

  // 3. Match fonético sin espacios
  const phonQuery = getPhoneticToken(noSpaceQuery);
  const phonTarget = getPhoneticToken(noSpaceTarget);
  if (phonTarget.includes(phonQuery) || phonQuery.includes(phonTarget)) {
    return true;
  }
  if (levenshteinDistance(phonQuery, phonTarget) <= (phonQuery.length <= 5 ? 1 : 2)) {
    return true;
  }

  // 4. Token por token: cada palabra de la búsqueda debe encajar en al menos una palabra del objetivo
  const queryWords = normQuery.split(' ').filter(Boolean);
  const targetWords = normTarget.split(' ').filter(Boolean);

  return queryWords.every((qWord) =>
    targetWords.some((tWord) => wordMatchesFuzzy(qWord, tWord))
  );
};

/**
 * Revisa si un producto del catálogo coincide con la consulta del buscador,
 * comparando nombre, marca, proteína, etapa, ingredientes y etiquetas.
 */
export const matchesProductFuzzy = (product: ProductBag, rawQuery: string): boolean => {
  const q = normalizeSearchText(rawQuery);
  if (!q) return true;

  // Palabras claves contextuales del producto
  const searchableParts = [
    product.name,
    product.brand,
    product.protein,
    product.stage,
    product.tag || '',
    product.subFilter || '',
    product.petType === 'dog' ? 'perro perros canino puppy cachorro' : 'gato gatos felino gatito kitten',
    `${product.weightLb} lb`,
    product.unitLabel || '',
  ];

  // Si la marca es Taste of the Wild Prey, agregar alias "prey"
  if (product.brand.toLowerCase().includes('prey')) {
    searchableParts.push('prey', 'taste prey');
  }

  // Si busca "proplan" o "pro plan", emparejar con Purina Pro Plan
  if (product.brand.toLowerCase().includes('pro plan') || product.name.toLowerCase().includes('pro plan')) {
    searchableParts.push('proplan', 'purina proplan', 'pro plan');
  }

  const fullText = searchableParts.join(' ');
  return stringMatchesFuzzy(q, fullText);
};

/**
 * Calcula un puntaje de relevancia (score) para ordenar los resultados de búsqueda:
 * los matches exactos en marca y nombre aparecen primero.
 */
export const scoreProductMatch = (
  product: ProductBag,
  rawQuery: string,
  activeSpecies?: 'dog' | 'cat'
): number => {
  const q = normalizeSearchText(rawQuery);
  if (!q) return 0;

  const normName = normalizeSearchText(product.name);
  const normBrand = normalizeSearchText(product.brand);
  const phonQuery = getPhoneticToken(q.replace(/\s+/g, ''));
  const phonBrand = getPhoneticToken(normBrand.replace(/\s+/g, ''));

  let score = 0;

  // Prioridad si coincide con la especie activa seleccionada
  if (activeSpecies && product.petType === activeSpecies) {
    score += 15;
  }

  // Coincidencia exacta o directa en marca
  if (normBrand === q || phonBrand === phonQuery) {
    score += 100;
  } else if (normBrand.includes(q) || phonBrand.includes(phonQuery)) {
    score += 70;
  }

  // Coincidencia en nombre
  if (normName.startsWith(q)) {
    score += 80;
  } else if (normName.includes(q)) {
    score += 50;
  }

  // Coincidencia fonética o fuzzy
  if (stringMatchesFuzzy(q, normBrand)) {
    score += 40;
  }
  if (stringMatchesFuzzy(q, normName)) {
    score += 30;
  }
  if (stringMatchesFuzzy(q, product.protein)) {
    score += 15;
  }

  return score;
};
