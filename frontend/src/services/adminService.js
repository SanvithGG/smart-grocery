import api from '../api/client'

export async function getAdminDashboard() {
  const { data } = await api.get('/api/admin/dashboard')
  return data
}

export async function getAdminUsers() {
  const { data } = await api.get('/api/admin/users')
  return data
}

export async function updateAdminUserRole(id, role) {
  const { data } = await api.put(`/api/admin/users/${id}/role`, { role })
  return data
}

export async function deleteAdminUser(id) {
  const { data } = await api.delete(`/api/admin/users/${id}`)
  return data
}

export async function getAdminProducts() {
  const { data } = await api.get('/api/admin/products')
  return data
}

export async function updateAdminProduct(id, payload) {
  const { data } = await api.put(`/api/admin/products/${id}`, payload)
  return data
}

export async function deleteAdminProduct(id) {
  const { data } = await api.delete(`/api/admin/products/${id}`)
  return data
}

export async function getAdminCatalogStock() {
  const { data } = await api.get('/api/admin/catalog-stock')
  return data
}

export async function updateAdminCatalogStock(payload) {
  const { data } = await api.put('/api/admin/catalog-stock', payload)
  return data
}

export async function getAdminCategories() {
  const { data } = await api.get('/api/admin/categories')
  return data
}

export async function renameAdminCategory(currentName, nextName) {
  const { data } = await api.put('/api/admin/categories/rename', { currentName, nextName })
  return data
}

export async function getAdminPurchaseQueue() {
  const { data } = await api.get('/api/admin/purchase-queue')
  return data
}

export async function getAdminSellerProducts() {
  const { data } = await api.get('/api/admin/seller-products')
  return data
}

export async function getAdminSellerOrders() {
  const { data } = await api.get('/api/admin/seller-orders')
  return data
}

export async function fulfillAdminPurchase(itemId) {
  const { data } = await api.post(`/api/admin/purchase-queue/${itemId}/fulfill`)
  return data
}

export async function getAdminReports() {
  const { data } = await api.get('/api/admin/reports')
  return data
}
