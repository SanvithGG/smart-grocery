import api from '../api/client'

export async function getSellerDashboard() {
  const { data } = await api.get('/api/seller/dashboard')
  return data
}

export async function getSellerProducts() {
  const { data } = await api.get('/api/seller/products')
  return data
}

export async function createSellerProduct(payload) {
  const { data } = await api.post('/api/seller/products', payload)
  return data
}

export async function updateSellerProduct(id, payload) {
  const { data } = await api.put(`/api/seller/products/${id}`, payload)
  return data
}

export async function deleteSellerProduct(id) {
  const { data } = await api.delete(`/api/seller/products/${id}`)
  return data
}

export async function getSellerOrders() {
  const { data } = await api.get('/api/seller/orders')
  return data
}

export async function updateSellerOrderStatus(id, status) {
  const { data } = await api.put(`/api/seller/orders/${id}/status`, { status })
  return data
}
