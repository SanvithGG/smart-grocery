import api from '../api/client'

export async function getGroceries(params) {
  const { data } = await api.get('/api/grocery', { params })
  return data
}

export async function getCategories() {
  const { data } = await api.get('/api/grocery/categories')
  return data
}

export async function getCatalog(params) {
  const { data } = await api.get('/api/grocery/catalog', { params })
  return data
}

export async function getSellerProducts() {
  const { data } = await api.get('/api/grocery/seller-products')
  return data
}

export async function getPublicCatalog(params) {
  const { data } = await api.get('/api/public/catalog', { params })
  return data
}

export async function getPublicCategories() {
  const { data } = await api.get('/api/public/categories')
  return data
}

export async function getPublicSellerProducts() {
  const { data } = await api.get('/api/public/seller-products')
  return data
}

export async function createSellerOrder(productId, payload) {
  const { data } = await api.post(`/api/grocery/seller-products/${productId}/order`, payload)
  return data
}

export async function createGrocery(payload) {
  const { data } = await api.post('/api/grocery', payload)
  return data
}

export async function updateGrocery(id, payload) {
  const { data } = await api.put(`/api/grocery/${id}`, payload)
  return data
}

export async function deleteGrocery(id) {
  const { data } = await api.delete(`/api/grocery/${id}`)
  return data
}

export async function getSummary() {
  const { data } = await api.get('/api/grocery/summary')
  return data
}

export async function getRecommendations() {
  const { data } = await api.get('/api/grocery/recommendations')
  return data
}

export async function getLowStock() {
  const { data } = await api.get('/api/grocery/low-stock')
  return data
}

export async function getExpiryAlerts() {
  const { data } = await api.get('/api/grocery/expiry-alerts')
  return data
}

export async function acknowledgeExpiryAlert(itemId) {
  const { data } = await api.post(`/api/grocery/${itemId}/acknowledge-expiry-alert`)
  return data
}

export async function getShoppingList() {
  const { data } = await api.get('/api/grocery/shopping-list')
  return data
}

export async function getSmartRules() {
  const { data } = await api.get('/api/grocery/smart-rules')
  return data
}

export async function parseRecipe(recipeText) {
  const { data } = await api.post('/api/recipe/parse', { recipeText })
  return data
}

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}
