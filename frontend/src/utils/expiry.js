const FALLBACK_EXPIRY_DAYS = 7

export const normalizeKey = (value) => (value || '').trim().toLowerCase()

const addDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getNaturalExpiryDate(name, category, rules) {
  const normalizedName = normalizeKey(name)
  const normalizedCategory = normalizeKey(category)

  if (!normalizedName && !normalizedCategory) {
    return null
  }

  const itemDays = rules?.expiry?.[normalizedName]
  if (itemDays) {
    return addDays(itemDays)
  }

  const categoryDays = rules?.expiry?.[normalizedCategory]
  if (categoryDays) {
    return addDays(categoryDays)
  }

  return addDays(FALLBACK_EXPIRY_DAYS)
}

export function formatExpiryDate(value, fallback = 'Mark as purchased to preview expiry') {
  if (!value) {
    return fallback
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString()
}
