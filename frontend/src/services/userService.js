import api from '../api/client'

export async function getUserProfile() {
  const { data } = await api.get('/api/user/profile')
  return data
}

export async function updateUserProfile(payload) {
  const { data } = await api.put('/api/user/profile', payload)
  return data
}
