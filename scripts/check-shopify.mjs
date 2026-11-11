// Verifica la conexión con la Storefront API de Shopify usando .env.local
// Uso:  node scripts/check-shopify.mjs
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !line.trim().startsWith('#')) env[m[1]] = m[2];
}

const domain = env.EXPO_PUBLIC_SHOPIFY_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const token = env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const version = env.EXPO_PUBLIC_SHOPIFY_API_VERSION || '2026-07';

if (!domain || !token) {
  console.error('❌ Faltan EXPO_PUBLIC_SHOPIFY_DOMAIN o EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN en .env.local');
  process.exit(1);
}

const query = `{
  shop { name primaryDomain { url } }
  products(first: 100) {
    nodes {
      title
      vendor
      variants(first: 1) { nodes { sku price { amount } availableForSale } }
    }
  }
}`;

const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
  },
  body: JSON.stringify({ query }),
});

if (!res.ok) {
  console.error(`❌ HTTP ${res.status} ${res.statusText}`);
  if (res.status === 401 || res.status === 403) console.error('   Revisa que el token sea el de Storefront y tenga permisos.');
  if (res.status === 404) console.error('   Revisa el dominio (.myshopify.com) y la versión de API.');
  process.exit(1);
}

const json = await res.json();
if (json.errors) {
  console.error('❌ Shopify devolvió errores:', JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const products = json.data.products.nodes;
const withSku = products.filter((p) => p.variants.nodes[0]?.sku);
console.log(`✅ Conectado a: ${json.data.shop.name} (${json.data.shop.primaryDomain.url})`);
console.log(`   Productos visibles en Storefront: ${products.length}`);
console.log(`   Con SKU (los que usará la app): ${withSku.length}`);
products.slice(0, 15).forEach((p) => {
  const v = p.variants.nodes[0];
  console.log(`   - [${v?.sku ?? 'SIN SKU'}] ${p.title} · ${p.vendor} · $${v?.price.amount} ${v?.availableForSale ? '' : '(agotado)'}`);
});
if (products.length === 0) {
  console.log('\n⚠️  0 productos: en la app/canal de Shopify, publica los productos en el canal correspondiente (Headless / tu app).');
}
