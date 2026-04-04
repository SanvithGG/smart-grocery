import axios from 'axios'
import { clearSession } from '../utils/session'

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession()
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (responseData?.errors) {
    const firstFieldMessage = Object.values(responseData.errors).find(Boolean)

    if (firstFieldMessage) {
      return firstFieldMessage
    }
  }

  if (responseData?.message) {
    return responseData.message
  }

  if (error?.response?.status === 401) {
    return 'Your session expired or is invalid. Please login again.'
  }

  return fallbackMessage
}

export const getShoppingList = async () => {
  const response = await api.get('/api/grocery/shopping-list')
  return response.data
}

export default api
