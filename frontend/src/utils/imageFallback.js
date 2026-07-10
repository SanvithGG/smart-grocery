const fallbackImages = {
  // Specific items
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  'eggs': 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=400&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  'wheat flour': 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400&auto=format&fit=crop&q=80',
  'apples': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80',
  'bananas': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80',
  'tomatoes': 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&auto=format&fit=crop&q=80',
  'onions': 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&auto=format&fit=crop&q=80',
  'potatoes': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
  'cooking oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  'salt': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80',
  'sugar': 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400&auto=format&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
  'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80',
  'biscuits': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80',
  'soap': 'https://images.unsplash.com/photo-1607006342456-ba275cd3a7b6?w=400&auto=format&fit=crop&q=80',
  'detergent': 'https://images.unsplash.com/photo-1610557892470-76d747e49536?w=400&auto=format&fit=crop&q=80',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
  'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',
  'cheese': 'https://images.unsplash.com/photo-1486887396153-fa416526c13b?w=400&auto=format&fit=crop&q=80',
  'garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&auto=format&fit=crop&q=80',
  'ginger': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80',
  'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&auto=format&fit=crop&q=80',
  'meat': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b996a68f1f?w=400&auto=format&fit=crop&q=80',
  'lemon': 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&auto=format&fit=crop&q=80',

  // Categories fallback
  'dairy': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  'fruits': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&auto=format&fit=crop&q=80',
  'vegetables': 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&auto=format&fit=crop&q=80',
  'grains': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'essentials': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  'beverages': 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&auto=format&fit=crop&q=80',
  'snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=400&auto=format&fit=crop&q=80',
  'household': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
}

const GLOBAL_FALLBACK = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'

export function getFallbackImage(name, category) {
  const normName = (name || '').trim().toLowerCase()
  const normCategory = (category || '').trim().toLowerCase()

  // 1. Exact match for name
  if (fallbackImages[normName]) {
    return fallbackImages[normName]
  }

  // 2. Keyword/substring match for name (check specific items first to get accurate matches)
  const keywordMappings = [
    { term: 'wheat flour', img: fallbackImages['wheat flour'] },
    { term: 'cooking oil', img: fallbackImages['cooking oil'] },
    { term: 'flour', img: fallbackImages['wheat flour'] },
    { term: 'oil', img: fallbackImages['cooking oil'] },
    { term: 'milk', img: fallbackImages['milk'] },
    { term: 'bread', img: fallbackImages['bread'] },
    { term: 'eggs', img: fallbackImages['eggs'] },
    { term: 'egg', img: fallbackImages['eggs'] },
    { term: 'rice', img: fallbackImages['rice'] },
    { term: 'apples', img: fallbackImages['apples'] },
    { term: 'apple', img: fallbackImages['apples'] },
    { term: 'bananas', img: fallbackImages['bananas'] },
    { term: 'banana', img: fallbackImages['bananas'] },
    { term: 'tomatoes', img: fallbackImages['tomatoes'] },
    { term: 'tomato', img: fallbackImages['tomatoes'] },
    { term: 'onions', img: fallbackImages['onions'] },
    { term: 'onion', img: fallbackImages['onions'] },
    { term: 'potatoes', img: fallbackImages['potatoes'] },
    { term: 'potato', img: fallbackImages['potatoes'] },
    { term: 'salt', img: fallbackImages['salt'] },
    { term: 'sugar', img: fallbackImages['sugar'] },
    { term: 'tea', img: fallbackImages['tea'] },
    { term: 'coffee', img: fallbackImages['coffee'] },
    { term: 'biscuits', img: fallbackImages['biscuits'] },
    { term: 'biscuit', img: fallbackImages['biscuits'] },
    { term: 'cookies', img: fallbackImages['biscuits'] },
    { term: 'cookie', img: fallbackImages['biscuits'] },
    { term: 'soap', img: fallbackImages['soap'] },
    { term: 'detergent', img: fallbackImages['detergent'] },
    { term: 'paneer', img: fallbackImages['paneer'] },
    { term: 'cheese', img: fallbackImages['cheese'] },
    { term: 'yogurt', img: fallbackImages['yogurt'] },
    { term: 'curd', img: fallbackImages['yogurt'] },
    { term: 'spinach', img: fallbackImages['spinach'] },
    { term: 'butter', img: fallbackImages['butter'] },
    { term: 'garlic', img: fallbackImages['garlic'] },
    { term: 'ginger', img: fallbackImages['ginger'] },
    { term: 'chicken', img: fallbackImages['chicken'] },
    { term: 'meat', img: fallbackImages['meat'] },
    { term: 'beef', img: fallbackImages['meat'] },
    { term: 'mutton', img: fallbackImages['meat'] },
    { term: 'pork', img: fallbackImages['meat'] },
    { term: 'carrot', img: fallbackImages['carrot'] },
    { term: 'lemon', img: fallbackImages['lemon'] }
  ]

  for (const mapping of keywordMappings) {
    if (normName.includes(mapping.term)) {
      return mapping.img
    }
  }

  // 3. Exact match for category
  if (fallbackImages[normCategory]) {
    return fallbackImages[normCategory]
  }

  // 4. Substring match for category
  const categoryKeywordMappings = [
    { term: 'dairy', img: fallbackImages['dairy'] },
    { term: 'bakery', img: fallbackImages['bakery'] },
    { term: 'fruit', img: fallbackImages['fruits'] },
    { term: 'vegetable', img: fallbackImages['vegetables'] },
    { term: 'grain', img: fallbackImages['grains'] },
    { term: 'essential', img: fallbackImages['essentials'] },
    { term: 'beverage', img: fallbackImages['beverages'] },
    { term: 'snack', img: fallbackImages['snacks'] },
    { term: 'household', img: fallbackImages['household'] }
  ]

  for (const mapping of categoryKeywordMappings) {
    if (normCategory.includes(mapping.term)) {
      return mapping.img
    }
  }

  return GLOBAL_FALLBACK
}

export function resolveImageUrl(url, name, category) {
  if (!url) {
    return getFallbackImage(name, category)
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}${url}`
}
