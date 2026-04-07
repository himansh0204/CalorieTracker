const BASE_URL = 'https://world.openfoodfacts.org'

/**
 * Search food products by name.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchFoodByName(query) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: 1,
    action: 'process',
    json: 1,
    page_size: 20,
    fields: 'product_name,nutriments,serving_size,brands,image_thumb_url,code',
  })
  const res = await fetch(`${BASE_URL}/cgi/search.pl?${params}`)
  if (!res.ok) throw new Error('Food search failed')
  const data = await res.json()
  return (data.products || []).map(normalizeProduct)
}

/**
 * Look up a product by barcode.
 * @param {string} barcode
 * @returns {Promise<object|null>}
 */
export async function getFoodByBarcode(barcode) {
  const res = await fetch(`${BASE_URL}/api/v0/product/${barcode}.json`)
  if (!res.ok) throw new Error('Barcode lookup failed')
  const data = await res.json()
  if (data.status !== 1) return null
  return normalizeProduct(data.product)
}

function normalizeProduct(p) {
  const n = p.nutriments || {}
  const per100 = (key) => Number(n[`${key}_100g`] || n[key] || 0)
  return {
    barcode: p.code || '',
    name: p.product_name || 'Unknown product',
    brand: p.brands || '',
    imageUrl: p.image_thumb_url || '',
    servingSize: parseFloat(p.serving_size) || 100,
    servingUnit: p.serving_size ? extractUnit(p.serving_size) : 'g',
    per100g: {
      calories: per100('energy-kcal'),
      protein: per100('proteins'),
      carbs: per100('carbohydrates'),
      fat: per100('fat'),
    },
  }
}

function extractUnit(servingSize) {
  const match = String(servingSize).match(/[a-zA-Z]+/)
  return match ? match[0] : 'g'
}
