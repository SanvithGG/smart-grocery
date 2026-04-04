const TOKEN_KEY = 'token'
const ROLE_KEY = 'role'
const USERNAME_KEY = 'username'

export function setSession({ token, role, username }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export function getSession() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    role: localStorage.getItem(ROLE_KEY),
    username: localStorage.getItem(USERNAME_KEY),
  }
}
