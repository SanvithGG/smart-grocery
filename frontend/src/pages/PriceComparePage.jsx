import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Loader2, Sparkles, ShoppingBag, ExternalLink, Check, TrendingDown, Star, Store, ArrowRight } from 'lucide-react'
import { searchPriceCompare, getPriceAnalytics, createGrocery } from '../services/groceryService'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/toast'
import { getSession } from '../utils/session'
import StoreLogoBadge from '../components/ui/StoreLogoBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const resolveDirectStoreProductUrl = (site, productTitle, rawUrl) => {
  if (rawUrl && rawUrl.startsWith('http') && rawUrl.length > 25 && !rawUrl.endsWith('.com') && !rawUrl.endsWith('.in') && !rawUrl.endsWith('.com/')) {
    return rawUrl
  }
  const query = encodeURIComponent(productTitle || '')
  const s = (site || '').toLowerCase()
  if (s.includes('blinkit')) return `https://blinkit.com/s/?q=${query}`
  if (s.includes('instamart') || s.includes('swiggy')) return `https://www.swiggy.com/instamart/search?query=${query}`
  if (s.includes('zepto')) return `https://www.zepto.com/search?query=${query}`
  if (s.includes('amazon')) return `https://www.amazon.in/s?k=${query}`
  if (s.includes('flipkart')) return `https://www.flipkart.com/search?q=${query}`
  if (s.includes('bigbasket')) return `https://www.bigbasket.com/ps/?q=${query}`
  return rawUrl || `https://www.google.com/search?q=${query}`
}

export default function PriceComparePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()

  const { token } = getSession()
  const isLoggedIn = !!token

  const requireLogin = () => {
    if (!isLoggedIn) {
      toast.error('Please log in to use Smart Grocery features.')
      navigate('/login')
      return false
    }
    return true
  }

  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [analytics, setAnalytics] = useState(null)
  
  // Selected store option per product index: { [productIndex]: optionObject }
  const [selectedOffers, setSelectedOffers] = useState({})
  const [addingToQueue, setAddingToQueue] = useState(false)

  useEffect(() => {
    const initialText = location.state?.queryText
    const initialProducts = location.state?.products

    if (initialProducts && initialProducts.length > 0) {
      const text = initialProducts.join(', ')
      setInputQuery(text)
      executeSearch({ products: initialProducts })
    } else if (initialText) {
      setInputQuery(initialText)
      executeSearch({ text: initialText })
    } else {
      const defaultText = 'Amul Milk 1L, Whole Wheat Bread, Eggs 6 pack'
      setInputQuery(defaultText)
      executeSearch({ text: defaultText })
    }

    loadAnalytics()
  }, [location.state?.queryText, JSON.stringify(location.state?.products || [])])

  const loadAnalytics = async () => {
    try {
      const data = await getPriceAnalytics()
      setAnalytics(data)
    } catch (ignored) {
    }
  }

  const executeSearch = async (payload) => {
    setLoading(true)
    try {
      const rawData = await searchPriceCompare(payload)
      const data = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : [])
      setResults(data)
      
      // Auto-select cheapest offer for each product
      const defaultSelections = {}
      data.forEach((prod, pIdx) => {
        if (prod && prod.options && prod.options.length > 0) {
          const cheapest = prod.options.find(o => o.isCheapest) || prod.options[0]
          defaultSelections[pIdx] = cheapest
        }
      })
      setSelectedOffers(defaultSelections)
    } catch (error) {
      console.error('Price compare search error:', error)
      const errorMsg = getApiErrorMessage(error, 'Failed to fetch store price comparisons.')
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleManualSearch = (e) => {
    e.preventDefault()
    if (!requireLogin()) return
    if (!inputQuery.trim()) return
    executeSearch({ text: inputQuery })
  }

  const handleSelectOffer = (productIdx, option) => {
    setSelectedOffers(prev => ({
      ...prev,
      [productIdx]: option
    }))
  }

  const handleAddToBuyQueue = async () => {
    if (!requireLogin()) return
    const selectedList = Object.entries(selectedOffers).map(([pIdx, offer]) => {
      const product = results[pIdx]
      return {
        productName: product?.productName || offer.productTitle,
        store: offer.site,
        price: offer.price,
        productUrl: offer.productUrl
      }
    })

    if (selectedList.length === 0) {
      toast.error('Please select at least one offer.')
      return
    }

    setAddingToQueue(true)
    try {
      await Promise.all(selectedList.map(item =>
        createGrocery({
          name: `${item.productName} (${item.store} - ₹${item.price})`,
          category: 'PRODUCE',
          quantity: 1,
          purchased: false,
          expiryDate: null
        })
      ))

      toast.success(`Added ${selectedList.length} items to your Buy Queue!`)
      navigate('/shopping-list')
    } catch (error) {
      toast.error('Failed to add items to Buy Queue.')
    } finally {
      setAddingToQueue(false)
    }
  }

  // BarChart colors
  const CHART_COLORS = ['#0284c7', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1']

  const chartData = analytics?.categorySpend 
    ? Object.entries(analytics.categorySpend).map(([category, amount]) => ({ category, amount }))
    : []

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-8 md:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} /> Live E-Commerce Price Intelligence
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Compare Grocery Prices Across All Major Stores
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Instant real-time price comparison across Blinkit, Swiggy Instamart, Zepto, Amazon India, Flipkart & BigBasket. Pick the best deals and send them straight to your Buy Queue.
          </p>

          {/* Search Form */}
          <form onSubmit={handleManualSearch} className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Type products or recipe (e.g. Amul Milk, Whole Wheat Atta, Paneer)..."
                className="w-full bg-white/10 backdrop-blur-md text-white placeholder-slate-400 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/15 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Sparkles size={18} /> Compare Prices</>}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Comparison Cards Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-sky-600" />
              Store Price Comparisons
            </h2>
            {results.length > 0 && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {results.length} Products Compared
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-24 bg-slate-100 rounded-xl" />
                    <div className="h-24 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700">No Store Comparisons Yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Type grocery products or paste a recipe above to view live prices from Blinkit, Instamart, Zepto, Amazon & Flipkart.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((product, pIdx) => {
                const selectedOption = selectedOffers[pIdx]
                const cardImg = product.imageUrl || (product.options && product.options[0]?.imageUrl) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'

                const prices = (product.options || []).map(o => o.price).filter(p => p > 0)
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

                return (
                  <div key={pIdx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={cardImg} 
                          alt={product.productName} 
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0" 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' }}
                        />
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 capitalize">{product.productName}</h3>
                          <p className="text-xs text-slate-500">
                            {minPrice > 0 && maxPrice > 0 ? (
                              minPrice === maxPrice 
                                ? <>₹{minPrice} across {prices.length} stores</>
                                : <>₹{minPrice} – ₹{maxPrice} across {prices.length} stores</>
                            ) : 'Live prices across top grocery platforms'}
                          </p>
                        </div>
                      </div>
                      {selectedOption && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0">
                          <Check size={12} /> Selected: {selectedOption.site} (₹{selectedOption.price})
                        </span>
                      )}
                    </div>

                    {/* Store Offers Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.options && product.options.map((option, oIdx) => {
                        const isSelected = selectedOption?.site === option.site
                        const isCheapest = option.isCheapest

                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleSelectOffer(pIdx, option)}
                            className={`relative p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-400'
                                : isCheapest
                                ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            {/* Badges Header */}
                            <div className="flex items-start justify-between gap-2">
                              <StoreLogoBadge storeName={option.site} />

                              {isCheapest && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <TrendingDown size={10} /> Cheapest Deal
                                </span>
                              )}
                            </div>

                            {/* Product Title & Details */}
                            <div>
                              <p className="text-xs text-slate-600 line-clamp-2 font-medium">{option.productTitle}</p>
                              {option.rating && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 font-semibold">
                                  <Star size={12} className="fill-amber-400 stroke-amber-400" />
                                  <span>{option.rating}</span>
                                </div>
                              )}
                            </div>

                            {/* Price & Action Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                              <div className="text-lg font-extrabold text-slate-900">
                                ₹{option.price}
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={resolveDirectStoreProductUrl(option.site, option.productTitle || product.productName, option.productUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
                                  title={`Open direct product page on ${option.site}`}
                                >
                                  Open Page <ExternalLink size={11} />
                                </a>

                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                                  isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isSelected && <Check size={12} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Action Bar */}
              <div className="sticky bottom-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-slate-800">
                <div>
                  <p className="text-sm font-bold">Ready to Add to Buy Queue?</p>
                  <p className="text-xs text-slate-400">
                    {Object.keys(selectedOffers).length} store offers selected
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddToBuyQueue}
                  disabled={addingToQueue || Object.keys(selectedOffers).length === 0}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  {addingToQueue ? <Loader2 className="animate-spin w-4 h-4" /> : <>Add Selected to Buy Queue <ArrowRight size={16} /></>}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Analytics & Savings Sidebar (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
              Monthly Savings Insights
            </h3>

            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Total Spend</p>
                    <p className="text-xl font-black text-slate-900">₹{analytics.totalSpend || 0}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-medium">Est. Savings</p>
                    <p className="text-xl font-black text-emerald-700">₹{analytics.estimatedSavings || 0}</p>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Spend by Category</p>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => [`₹${value}`, 'Spend']} />
                          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Loading analytics summary...</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
