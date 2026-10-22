/**
 * Mobile App Deep Linking Utility for Indian Quick-Commerce and E-Commerce Platforms.
 * Seamlessly resolves native Android Intent URIs, iOS custom schemes, and desktop web URLs.
 */

export const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isAndroid = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export const isIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export const STORE_DEEP_LINKS = {
  blinkit: {
    name: 'Blinkit',
    package: 'com.grofers.customerapp',
    scheme: 'blinkit://search?q=',
    webUrl: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
    intent: (q) => `intent://search?q=${encodeURIComponent(q)}#Intent;scheme=blinkit;package=com.grofers.customerapp;S.browser_fallback_url=${encodeURIComponent(`https://blinkit.com/s/?q=${encodeURIComponent(q)}`)};end`
  },
  zepto: {
    name: 'Zepto',
    package: 'com.zeptoconsumerapp',
    scheme: 'zepto://search?query=',
    webUrl: (q) => `https://www.zepto.com/search?query=${encodeURIComponent(q)}`,
    intent: (q) => `intent://search?query=${encodeURIComponent(q)}#Intent;scheme=zepto;package=com.zeptoconsumerapp;S.browser_fallback_url=${encodeURIComponent(`https://www.zepto.com/search?query=${encodeURIComponent(q)}`)};end`
  },
  swiggy: {
    name: 'Swiggy Instamart',
    package: 'in.swiggy.android',
    scheme: 'swiggy://instamart/search?query=',
    webUrl: (q) => `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`,
    intent: (q) => `intent://instamart/search?query=${encodeURIComponent(q)}#Intent;scheme=swiggy;package=in.swiggy.android;S.browser_fallback_url=${encodeURIComponent(`https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`)};end`
  },
  instamart: {
    name: 'Swiggy Instamart',
    package: 'in.swiggy.android',
    scheme: 'swiggy://instamart/search?query=',
    webUrl: (q) => `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`,
    intent: (q) => `intent://instamart/search?query=${encodeURIComponent(q)}#Intent;scheme=swiggy;package=in.swiggy.android;S.browser_fallback_url=${encodeURIComponent(`https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`)};end`
  },
  amazon: {
    name: 'Amazon India',
    package: 'in.amazon.mShop.android.shopping',
    scheme: 'com.amazon.mobile.shopping.web://amazon.in/s?k=',
    webUrl: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
    intent: (q) => `intent://www.amazon.in/s?k=${encodeURIComponent(q)}#Intent;scheme=https;package=in.amazon.mShop.android.shopping;S.browser_fallback_url=${encodeURIComponent(`https://www.amazon.in/s?k=${encodeURIComponent(q)}`)};end`
  },
  flipkart: {
    name: 'Flipkart',
    package: 'com.flipkart.android',
    scheme: 'flipkart://search?q=',
    webUrl: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
    intent: (q) => `intent://search?q=${encodeURIComponent(q)}#Intent;scheme=flipkart;package=com.flipkart.android;S.browser_fallback_url=${encodeURIComponent(`https://www.flipkart.com/search?q=${encodeURIComponent(q)}`)};end`
  },
  bigbasket: {
    name: 'BigBasket',
    package: 'com.bigbasket.mobileapp',
    scheme: 'bb://search?q=',
    webUrl: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
    intent: (q) => `intent://search?q=${encodeURIComponent(q)}#Intent;scheme=bb;package=com.bigbasket.mobileapp;S.browser_fallback_url=${encodeURIComponent(`https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`)};end`
  }
}

/**
 * Identifies the store config from store name.
 */
export const getStoreConfig = (storeName) => {
  const s = (storeName || '').toLowerCase()
  if (s.includes('blinkit')) return STORE_DEEP_LINKS.blinkit
  if (s.includes('zepto')) return STORE_DEEP_LINKS.zepto
  if (s.includes('instamart') || s.includes('swiggy')) return STORE_DEEP_LINKS.swiggy
  if (s.includes('amazon')) return STORE_DEEP_LINKS.amazon
  if (s.includes('flipkart')) return STORE_DEEP_LINKS.flipkart
  if (s.includes('bigbasket')) return STORE_DEEP_LINKS.bigbasket
  return null
}

/**
 * Resolves the optimal target link (Android intent, iOS scheme, or web fallback).
 */
export const resolveStoreTargetUrl = (storeName, query, rawDirectUrl = '') => {
  const cleanQuery = query || ''
  const config = getStoreConfig(storeName)

  // If rawDirectUrl is an actual specific product page (e.g. from affiliate or catalog) and not a generic search
  if (rawDirectUrl && rawDirectUrl.startsWith('http') && rawDirectUrl.length > 25 &&
      !rawDirectUrl.endsWith('.com') && !rawDirectUrl.endsWith('.in') && !rawDirectUrl.endsWith('.com/')) {
    // If Android and store has package, wrap into Intent
    if (isAndroid() && config) {
      return `intent://${rawDirectUrl.replace(/^https?:\/\//, '')}#Intent;package=${config.package};S.browser_fallback_url=${encodeURIComponent(rawDirectUrl)};end`
    }
    return rawDirectUrl
  }

  if (!config) {
    return rawDirectUrl || `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`
  }

  // On Android devices, return Android Intent which opens native app with instant web fallback
  if (isAndroid()) {
    return config.intent(cleanQuery)
  }

  // On iOS devices, return custom app scheme
  if (isIOS()) {
    return `${config.scheme}${encodeURIComponent(cleanQuery)}`
  }

  // Desktop or fallback
  return config.webUrl(cleanQuery)
}

/**
 * Safe handler to launch native mobile app or web page
 */
export const openStoreTarget = (storeName, query, rawDirectUrl = '') => {
  const targetUrl = resolveStoreTargetUrl(storeName, query, rawDirectUrl)
  if (isMobileDevice()) {
    window.location.href = targetUrl
  } else {
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  }
}
