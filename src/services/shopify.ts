import { CATALOG_BAGS, ProductBag, TopServiceTabType } from '../data/catalog';

/**
 * Cliente mínimo de la Storefront API de Shopify (GraphQL).
 *
 * - El token de Storefront es PÚBLICO por diseño (puede ir en la app).
 * - NUNCA pongas aquí el token de Admin API: eso vive solo en Cloud Functions.
 *
 * Variables (archivo .env.local en la raíz del proyecto, ver .env.example):
 *   EXPO_PUBLIC_SHOPIFY_DOMAIN            ej. mundomascotas.myshopify.com
 *   EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN  token público de Storefront
 *   EXPO_PUBLIC_SHOPIFY_API_VERSION       (opcional) ej. 2026-07
 */

const DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN;
const TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = process.env.EXPO_PUBLIC_SHOPIFY_API_VERSION || '2026-07';
const REQUEST_TIMEOUT_MS = 12000;

/** Namespace de los metafields de producto que se crean en el admin de Shopify */
export const METAFIELD_NAMESPACE = 'mundo';

export const isShopifyConfigured = Boolean(DOMAIN && TOKEN);

const METAFIELD_KEYS = [
  'species', // dog | cat
  'service', // bultos | snacks
  'sub_filter', // humedos | premios | higiene | medicamentos
  'protein', // texto corto de proteína principal
  'life_stage', // Adulto, Cachorro, Senior, Todas las etapas...
  'weight_lb', // peso del producto en libras (número)
  'badge', // etiqueta destacada: "Más pedido", "70% Proteína"...
  'accent_color', // color hex de acento (#D4AF37)
  'unit_label', // "Pack x6 Latas", "Bolsa 92g"
  'kcal_per_kg', // energía metabolizable (para el quiz)
] as const;

type MetafieldKey = (typeof METAFIELD_KEYS)[number];

const PRODUCTS_QUERY = /* GraphQL */ `
  query CatalogProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        vendor
        productType
        tags
        featuredImage {
          url(transform: { maxWidth: 600, maxHeight: 600 })
        }
        metafields(identifiers: [${METAFIELD_KEYS.map(
          (k) => `{ namespace: "${METAFIELD_NAMESPACE}", key: "${k}" }`
        ).join(', ')}]) {
          key
          value
        }
        variants(first: 5) {
          nodes {
            id
            sku
            availableForSale
            price {
              amount
            }
            weight
            weightUnit
          }
        }
      }
    }
  }
`;

interface ShopifyVariantNode {
  id: string;
  sku: string | null;
  availableForSale: boolean;
  price: { amount: string };
  weight: number | null;
  weightUnit: 'KILOGRAMS' | 'GRAMS' | 'POUNDS' | 'OUNCES' | null;
}

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: { url: string } | null;
  metafields: ({ key: string; value: string } | null)[];
  variants: { nodes: ShopifyVariantNode[] };
}

interface ProductsResponse {
  data?: {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: ShopifyProductNode[];
    };
  };
  errors?: { message: string }[];
}

async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://${DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': TOKEN as string,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      throw new Error(`Shopify respondió HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const KNOWN_BRANDS: ProductBag['brand'][] = [
  'Diamond Naturals',
  'Taste of the Wild',
  'Acana',
  'Orijen',
  'Salud Vet',
];

function resolveBrand(vendor: string): ProductBag['brand'] {
  const v = vendor.toLowerCase();
  const found = KNOWN_BRANDS.find((b) => v.includes(b.toLowerCase().split(' ')[0]));
  return found ?? 'Salud Vet';
}

function toPounds(weight: number | null, unit: ShopifyVariantNode['weightUnit']) {
  if (!weight || !unit) return undefined;
  switch (unit) {
    case 'POUNDS':
      return weight;
    case 'KILOGRAMS':
      return weight * 2.20462;
    case 'GRAMS':
      return weight / 453.592;
    case 'OUNCES':
      return weight / 16;
  }
}

/**
 * Convierte un producto de Shopify al modelo ProductBag que usa la app.
 *
 * Estrategia de datos (de más a menos prioridad):
 *   1. Metafields `mundo.*` cargados en Shopify
 *   2. Producto equivalente del catálogo local (mismo SKU) -> conserva colores, textos y badges
 *   3. Inferencia por tags / tipo de producto / peso de la variante
 *
 * El `id` se mantiene como `prod_<SKU>` para que el quiz, el carrito y los
 * pedidos existentes sigan funcionando sin cambios.
 */
export function mapShopifyProduct(node: ShopifyProductNode): ProductBag | null {
  const variant = node.variants.nodes.find((v) => v.sku) ?? node.variants.nodes[0];
  if (!variant || !variant.sku) return null; // sin SKU no podemos enlazar con la app

  const mf: Partial<Record<MetafieldKey, string>> = {};
  node.metafields.forEach((m) => {
    if (m) mf[m.key as MetafieldKey] = m.value;
  });

  const sku = variant.sku.trim();
  const id = `prod_${sku}`;
  const local = CATALOG_BAGS.find((p) => p.sku === sku);

  const tagsLower = node.tags.map((t) => t.toLowerCase());
  const price = Math.round(parseFloat(variant.price.amount));

  const species: 'dog' | 'cat' =
    mf.species === 'cat' || mf.species === 'dog'
      ? mf.species
      : local?.petType ??
        (tagsLower.some((t) => t.includes('gato') || t === 'cat') ? 'cat' : 'dog');

  const subFilterRaw = mf.sub_filter ?? local?.subFilter;
  const subFilter = (['humedos', 'premios', 'higiene', 'medicamentos'] as const).find(
    (s) => s === subFilterRaw
  );

  const serviceRaw = mf.service ?? local?.category;
  const category: TopServiceTabType =
    serviceRaw === 'snacks' || serviceRaw === 'bultos'
      ? serviceRaw
      : subFilter
      ? 'snacks'
      : 'bultos';

  const weightLb =
    (mf.weight_lb ? parseFloat(mf.weight_lb) : undefined) ??
    local?.weightLb ??
    toPounds(variant.weight, variant.weightUnit) ??
    1;

  return {
    id,
    sku,
    brand: resolveBrand(node.vendor),
    name: node.title,
    protein: mf.protein ?? local?.protein ?? node.productType,
    weightLb: Math.round(weightLb * 10) / 10,
    unitLabel: mf.unit_label ?? local?.unitLabel,
    price,
    coins: Math.floor(price / 1000), // regla actual: 1 Consenticoin por cada $1.000 COP
    petType: species,
    category,
    subFilter,
    stage: mf.life_stage ?? local?.stage ?? 'Todas las etapas',
    tag: mf.badge ?? local?.tag,
    accentColor: mf.accent_color ?? local?.accentColor ?? '#D4AF37',
    variantId: variant.id,
    handle: node.handle,
    imageUrl: node.featuredImage?.url,
    available: variant.availableForSale,
  };
}

/** Descarga todo el catálogo publicado en el canal de Storefront (con paginación). */
export async function fetchShopifyCatalog(): Promise<ProductBag[]> {
  if (!isShopifyConfigured) {
    throw new Error('Shopify no está configurado (faltan variables EXPO_PUBLIC_SHOPIFY_*).');
  }

  const products: ProductBag[] = [];
  let after: string | null = null;

  // Tope de seguridad: 5 páginas x 100 = 500 productos
  for (let page = 0; page < 5; page++) {
    const json: ProductsResponse = await storefrontFetch<ProductsResponse>(PRODUCTS_QUERY, {
      first: 100,
      after,
    });

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join(' | '));
    }
    if (!json.data) throw new Error('Respuesta vacía de Shopify.');

    json.data.products.nodes.forEach((node) => {
      const mapped = mapShopifyProduct(node);
      if (mapped) products.push(mapped);
    });

    if (!json.data.products.pageInfo.hasNextPage) break;
    after = json.data.products.pageInfo.endCursor;
  }

  // El SKU es la llave única de la app (id = prod_<SKU>). Si en Shopify hay productos
  // con el mismo SKU, conservamos uno (prefiriendo el disponible) y avisamos en consola.
  const bySku = new Map<string, ProductBag>();
  const duplicates: string[] = [];
  products.forEach((p) => {
    const existing = bySku.get(p.id);
    if (!existing) {
      bySku.set(p.id, p);
      return;
    }
    duplicates.push(`${p.sku} → "${existing.name}" / "${p.name}"`);
    if (!existing.available && p.available) bySku.set(p.id, p);
  });
  if (duplicates.length > 0) {
    console.warn(
      `[Shopify] SKUs duplicados (corrígelos en el admin para evitar productos ocultos):\n${duplicates.join('\n')}`
    );
  }

  return Array.from(bySku.values());
}

