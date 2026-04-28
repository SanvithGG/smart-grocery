import api from '../api/client'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function requestPasswordReset(usernameOrEmail) {
  const { data } = await api.post('/auth/forgot-password', { usernameOrEmail })
  return data
}

export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}

export async function loginWithGoogle(credential) {
  const { data } = await api.post('/auth/google', { credential })
  return data
}
