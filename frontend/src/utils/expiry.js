const FALLBACK_EXPIRY_DAYS = 7

const ITEM_EXPIRY_DAYS = {
  milk: 3,
  bread: 5,
  eggs: 14,
  rice: 180,
  'wheat flour': 120,
  apples: 10,
  bananas: 4,
  tomatoes: 7,
  onions: 21,
  potatoes: 30,
  'cooking oil': 180,
  salt: 365,
  sugar: 365,
  tea: 180,
  coffee: 180,
  biscuits: 120,
  paneer: 7,
  yogurt: 7,
  spinach: 3,
}

const CATEGORY_EXPIRY_DAYS = {
  dairy: 7,
  bakery: 5,
  fruits: 7,
  vegetables: 7,
  grains: 180,
  essentials: 180,
  beverages: 90,
  snacks: 120,
  household: 365,
}

const normalizeKey = (value) => value.trim().toLowerCase()

const addDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getNaturalExpiryDate(name, category) {
  const normalizedName = normalizeKey(name || '')
  const normalizedCategory = normalizeKey(category || '')

  if (!normalizedName && !normalizedCategory) {
    return null
  }

  const itemDays = ITEM_EXPIRY_DAYS[normalizedName]
  if (itemDays) {
    return addDays(itemDays)
  }

  const categoryDays = CATEGORY_EXPIRY_DAYS[normalizedCategory]
  if (categoryDays) {
    return addDays(categoryDays)
  }

  return addDays(FALLBACK_EXPIRY_DAYS)
}
