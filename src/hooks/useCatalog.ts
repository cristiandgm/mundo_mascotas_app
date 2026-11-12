import { useCallback, useEffect, useState } from 'react';
import { CATALOG_BAGS, ProductBag } from '../data/catalog';
import { fetchShopifyCatalog, isShopifyConfigured } from '../services/shopify';

export type CatalogSource = 'local' | 'shopify';

interface CatalogState {
  catalog: ProductBag[];
  source: CatalogSource;
  loading: boolean;
  error: string | null;
}

// Caché en memoria compartida por toda la app (evita pedir el catálogo en cada pantalla)
const CATALOG_CACHE_VERSION = 2;
let memoryCache: ProductBag[] | null = null;
let memoryCacheVersion = 0;
let inflight: Promise<ProductBag[]> | null = null;

function loadShopifyCatalog(force: boolean): Promise<ProductBag[]> {
  if (!force && memoryCache && memoryCacheVersion === CATALOG_CACHE_VERSION) {
    return Promise.resolve(memoryCache);
  }
  if (!inflight) {
    inflight = fetchShopifyCatalog()
      .then((items) => {
        if (items.length === 0) {
          throw new Error('Shopify no devolvió productos con SKU.');
        }
        memoryCache = items;
        memoryCacheVersion = CATALOG_CACHE_VERSION;
        return items;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Fuente única del catálogo para toda la app.
 * - Con credenciales de Shopify: catálogo real (precios, stock y fotos en vivo).
 * - Sin credenciales o si falla la red: catálogo local de respaldo (la app nunca se queda vacía).
 */
export function useCatalog() {
  const hasFreshCache =
    Boolean(memoryCache) && memoryCacheVersion === CATALOG_CACHE_VERSION;
  const [state, setState] = useState<CatalogState>({
    catalog: hasFreshCache && memoryCache ? memoryCache : CATALOG_BAGS,
    source: hasFreshCache ? 'shopify' : 'local',
    loading: isShopifyConfigured && !hasFreshCache,
    error: null,
  });

  const refresh = useCallback(async (force = true) => {
    if (!isShopifyConfigured) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await loadShopifyCatalog(force);
      console.info(`[Catalog] Cargados ${items.length} productos reales desde Shopify.`);
      setState({ catalog: items, source: 'shopify', loading: false, error: null });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Error desconocido cargando el catálogo';
      console.warn('[Catalog] Usando catálogo local de respaldo:', message);
      setState((s) => ({
        ...s,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    if (
      isShopifyConfigured &&
      (!memoryCache || memoryCacheVersion !== CATALOG_CACHE_VERSION)
    ) {
      void refresh(false);
    }
  }, [refresh]);

  return { ...state, refresh };
}

