import { useState, useMemo } from 'react'
import {
  MapPin,
  Sparkles,
  PackageCheck,
  Split,
  TrendingDown,
  Truck,
  Check,
  ExternalLink,
  Store,
  Clock,
  Info,
  SlidersHorizontal,
  Smartphone
} from 'lucide-react'
import { resolveStoreTargetUrl, isMobileDevice } from '../utils/deepLink'
import StoreLogoBadge from './ui/StoreLogoBadge'

// Canonical store delivery metadata
const STORE_DELIVERY_INFO = {
  zepto: { name: 'Zepto', time: '⚡ 10 mins', threshold: 199, standardFee: 25 },
  blinkit: { name: 'Blinkit', time: '🚀 12 mins', threshold: 199, standardFee: 25 },
  swiggy: { name: 'Swiggy Instamart', time: '🛵 15 mins', threshold: 199, standardFee: 25 },
  instamart: { name: 'Swiggy Instamart', time: '🛵 15 mins', threshold: 199, standardFee: 25 },
  amazon: { name: 'Amazon India', time: '📦 Next-Day / 24h', threshold: 499, standardFee: 40 },
  flipkart: { name: 'Flipkart Grocery', time: '🚚 Next-Day', threshold: 499, standardFee: 40 },
  bigbasket: { name: 'BigBasket', time: '🛒 2 Hours / Slotted', threshold: 299, standardFee: 30 },
}

const getStoreInfo = (site) => {
  const s = (site || '').toLowerCase()
  if (s.includes('zepto')) return STORE_DELIVERY_INFO.zepto
  if (s.includes('blinkit')) return STORE_DELIVERY_INFO.blinkit
  if (s.includes('instamart') || s.includes('swiggy')) return STORE_DELIVERY_INFO.swiggy
  if (s.includes('amazon')) return STORE_DELIVERY_INFO.amazon
  if (s.includes('flipkart')) return STORE_DELIVERY_INFO.flipkart
  if (s.includes('bigbasket')) return STORE_DELIVERY_INFO.bigbasket
  return { name: site, time: '⏱️ Fast Delivery', threshold: 199, standardFee: 25 }
}

// uses resolveStoreTargetUrl from ../utils/deepLink

export default function SmartBasketOptimizer({
  products = [],
  selectedOffers = {},
  locationContext = null,
  onApplyStrategy,
  onBatchAddToQueue
}) {
  const [activeTab, setActiveTab] = useState('recommended') // 'recommended' | 'whole' | 'split' | 'compare'
  const [hasDeliveryPass, setHasDeliveryPass] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Recalculate basket models whenever products or pass toggles change
  const optimization = useMemo(() => {
    if (!products || products.length === 0) return null

    const validProducts = products.filter(p => p && p.options && p.options.length > 0)
    if (validProducts.length === 0) return null

    const totalProducts = validProducts.length

    // Discover all unique stores
    const storeSet = new Set(['Zepto', 'Blinkit', 'Swiggy Instamart', 'Amazon India', 'BigBasket', 'Flipkart'])
    validProducts.forEach(p => {
      p.options.forEach(opt => {
        if (opt && opt.site) storeSet.add(opt.site.trim())
      })
    })

    // Compute Single-Store Baskets
    const singleStores = []
    storeSet.forEach(storeName => {
      const storeInfo = getStoreInfo(storeName)
      const matchedItems = []
      const missingProductNames = []
      let subtotal = 0

      validProducts.forEach((p, pIdx) => {
        const match = p.options.find(opt => opt && opt.site && opt.site.toLowerCase() === storeName.toLowerCase())
        if (match && match.price > 0) {
          matchedItems.push({ ...match, productIndex: pIdx, originalProductName: p.productName })
          subtotal += match.price
        } else {
          missingProductNames.push(p.productName)
        }
      })

      if (matchedItems.length > 0) {
        const isComplete = matchedItems.length === totalProducts
        const deliveryFee = hasDeliveryPass
          ? 0
          : (subtotal >= storeInfo.threshold ? 0 : storeInfo.standardFee)
        const platformFee = 5
        const totalCost = Math.round((subtotal + deliveryFee + platformFee) * 100) / 100

        singleStores.push({
          store: storeName,
          info: storeInfo,
          itemsAvailable: matchedItems.length,
          totalProducts,
          subtotal: Math.round(subtotal * 100) / 100,
          deliveryFee,
          platformFee,
          totalCost,
          isComplete,
          items: matchedItems,
          missingProductNames
        })
      }
    })

    // Sort single stores: complete coverage first, then most items, then lowest total cost
    singleStores.sort((a, b) => {
      if (a.isComplete !== b.isComplete) return b.isComplete ? 1 : -1
      if (a.itemsAvailable !== b.itemsAvailable) return b.itemsAvailable - a.itemsAvailable
      return a.totalCost - b.totalCost
    })

    const bestSingleStore = singleStores.length > 0 ? singleStores[0] : null

    // Compute Split-Order Strategy (pick cheapest option per product)
    const storeBucketsMap = {}
    let splitSubtotal = 0

    validProducts.forEach((p, pIdx) => {
      const cheapest = [...p.options]
        .filter(opt => opt && opt.price > 0)
        .sort((a, b) => a.price - b.price)[0]

      if (cheapest) {
        const store = cheapest.site || 'Store'
        if (!storeBucketsMap[store]) storeBucketsMap[store] = []
        storeBucketsMap[store].push({ ...cheapest, productIndex: pIdx, originalProductName: p.productName })
        splitSubtotal += cheapest.price
      }
    })

    const splitBuckets = Object.entries(storeBucketsMap).map(([storeName, items]) => {
      const storeInfo = getStoreInfo(storeName)
      const bucketSubtotal = items.reduce((sum, item) => sum + item.price, 0)
      const deliveryFee = hasDeliveryPass
        ? 0
        : (bucketSubtotal >= storeInfo.threshold ? 0 : storeInfo.standardFee)
      const platformFee = 5
      const totalCost = Math.round((bucketSubtotal + deliveryFee + platformFee) * 100) / 100

      return {
        store: storeName,
        info: storeInfo,
        items,
        itemCount: items.length,
        subtotal: Math.round(bucketSubtotal * 100) / 100,
        deliveryFee,
        platformFee,
        totalCost
      }
    })

    const totalSplitDeliveryFees = splitBuckets.reduce((sum, b) => sum + b.deliveryFee, 0)
    const totalSplitPlatformFees = splitBuckets.reduce((sum, b) => sum + b.platformFee, 0)
    const splitGrandTotal = Math.round((splitSubtotal + totalSplitDeliveryFees + totalSplitPlatformFees) * 100) / 100

    const splitStrategy = {
      totalStores: splitBuckets.length,
      totalItems: totalProducts,
      itemsSubtotal: Math.round(splitSubtotal * 100) / 100,
      totalDeliveryFees: totalSplitDeliveryFees,
      totalPlatformFees: totalSplitPlatformFees,
      grandTotal: splitGrandTotal,
      buckets: splitBuckets
    }

    // Determine recommendation
    let recommendedStrategy = 'WHOLE_CART'
    let recommendationTitle = ''
    let recommendationReason = ''
    let netSavings = 0

    if (bestSingleStore && bestSingleStore.isComplete) {
      if (splitGrandTotal < bestSingleStore.totalCost - 1) {
        recommendedStrategy = 'SPLIT_ORDER'
        netSavings = Math.round((bestSingleStore.totalCost - splitGrandTotal) * 100) / 100
        recommendationTitle = 'Split Order Wins! (Max Savings)'
        recommendationReason = `Splitting your ${totalProducts} items across ${splitStrategy.totalStores} stores saves you ₹${netSavings} net, even after factoring in separate delivery fees.`
      } else {
        recommendedStrategy = 'WHOLE_CART'
        netSavings = Math.round((splitGrandTotal - bestSingleStore.totalCost) * 100) / 100
        recommendationTitle = `All-in-One Cart Wins on ${bestSingleStore.store}!`
        recommendationReason = `Buying everything on ${bestSingleStore.store} saves you ₹${netSavings} over splitting, because you avoid extra delivery & convenience fees.`
      }
    } else {
      recommendedStrategy = 'SPLIT_ORDER'
      recommendationTitle = 'Split Order Required (100% In-Stock)'
      recommendationReason = 'No single platform currently stocks every item on your list. Splitting across stores ensures complete fulfillment.'
      netSavings = 0
    }

    return {
      recommendedStrategy,
      recommendationTitle,
      recommendationReason,
      netSavings,
      bestSingleStore,
      singleStores,
      splitStrategy,
      totalProducts
    }
  }, [products, hasDeliveryPass])

  if (!optimization) return null

  const {
    recommendedStrategy,
    recommendationTitle,
    recommendationReason,
    netSavings,
    bestSingleStore,
    singleStores,
    splitStrategy,
    totalProducts
  } = optimization

  // Apply Whole Cart Strategy
  const handleApplyWholeStore = (targetStore) => {
    if (!targetStore || !onApplyStrategy) return
    const selectionMap = {}
    targetStore.items.forEach(item => {
      selectionMap[item.productIndex] = item
    })
    onApplyStrategy('WHOLE_CART', selectionMap)
  }

  // Apply Split Strategy
  const handleApplySplit = () => {
    if (!onApplyStrategy) return
    const selectionMap = {}
    splitStrategy.buckets.forEach(b => {
      b.items.forEach(item => {
        selectionMap[item.productIndex] = item
      })
    })
    onApplyStrategy('SPLIT_ORDER', selectionMap)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden transition-all duration-300">
      
      {/* Top Header & Strategy Recommendation Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
                <Sparkles size={13} className="text-emerald-400 animate-pulse" />
                Smart Basket Optimizer
              </div>
              {locationContext?.label && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
                  <MapPin size={11} className="text-emerald-400" />
                  {locationContext.label}
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              {recommendationTitle}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              {recommendationReason}
            </p>
          </div>

          {/* Quick Metrics & Settings Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {netSavings > 0 && (
              <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-black">
                <TrendingDown size={18} />
                <span>Save ₹{netSavings}</span>
              </div>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-white/10"
              title="Customize delivery fee thresholds"
            >
              <SlidersHorizontal size={14} />
              <span>Fees</span>
            </button>
          </div>
        </div>

        {/* Collapsible Fee Customizer */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-sky-400" />
              <span>Default rules: ₹25 delivery (free &gt; ₹199), ₹5 platform fee per store.</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-white hover:text-sky-300">
              <input
                type="checkbox"
                checked={hasDeliveryPass}
                onChange={(e) => setHasDeliveryPass(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 focus:ring-offset-slate-900 accent-sky-500"
              />
              <span>I have Store Pass / VIP (Assume Free Delivery)</span>
            </label>
          </div>
        )}

        {/* Strategy Mode Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recommended'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            Recommended ({recommendedStrategy === 'WHOLE_CART' ? 'Whole Cart' : 'Split Order'})
          </button>

          <button
            onClick={() => setActiveTab('whole')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'whole'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <PackageCheck size={14} />
            All-in-One Cart ({bestSingleStore ? bestSingleStore.store : '1 Store'})
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'split'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Split size={14} />
            Split Order ({splitStrategy.totalStores} Stores)
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'compare'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Store size={14} />
            Compare All Stores ({singleStores.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 md:p-8 space-y-6">

        {/* TAB 1: RECOMMENDED STRATEGY */}
        {activeTab === 'recommended' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Card 1: Best Single Store */}
              {bestSingleStore && (
                <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  recommendedStrategy === 'WHOLE_CART'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400 shadow-md'
                    : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <StoreLogoBadge storeName={bestSingleStore.store} />
                      {recommendedStrategy === 'WHOLE_CART' && (
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={12} /> Winner: All-in-One
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Whole Cart on {bestSingleStore.store}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} className="text-slate-400" />
                        Estimated delivery: {bestSingleStore.info.time}
                      </p>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Items In-Stock:</span>
                        <span className="font-bold text-slate-900">{bestSingleStore.itemsAvailable} of {totalProducts} items</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-semibold text-slate-800">₹{bestSingleStore.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className={bestSingleStore.deliveryFee === 0 ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
                          {bestSingleStore.deliveryFee === 0 ? 'FREE' : `₹${bestSingleStore.deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Convenience Fee:</span>
                        <span className="text-slate-800">₹{bestSingleStore.platformFee}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-950">
                        <span>Total Checkout Bill:</span>
                        <span className="text-base text-slate-900">₹{bestSingleStore.totalCost}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleApplyWholeStore(bestSingleStore)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <PackageCheck size={14} /> Apply Whole Cart ({bestSingleStore.store})
                    </button>
                    <a
                      href={resolveStoreTargetUrl(bestSingleStore.store, products.map(p => p.productName).join(' '))}
                      target={isMobileDevice() ? "_self" : "_blank"}
                      rel="noreferrer"
                      className="p-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 transition"
                      title={`Open ${bestSingleStore.store} Website`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              )}

              {/* Card 2: Split Strategy */}
              <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                recommendedStrategy === 'SPLIT_ORDER'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400 shadow-md'
                  : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-900 text-white font-extrabold text-xs">
                      <Split size={13} /> Split Order
                    </span>
                    {recommendedStrategy === 'SPLIT_ORDER' && (
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> Winner: Max Savings
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Split across {splitStrategy.totalStores} Stores
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Combines the lowest price for every single product
                    </p>
                  </div>

                  <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Stores involved:</span>
                      <span className="font-bold text-slate-900">
                        {splitStrategy.buckets.map(b => b.store).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span className="font-semibold text-slate-800">₹{splitStrategy.itemsSubtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Delivery Fees:</span>
                      <span className={splitStrategy.totalDeliveryFees === 0 ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
                        {splitStrategy.totalDeliveryFees === 0 ? 'FREE' : `₹${splitStrategy.totalDeliveryFees}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Platform Fees:</span>
                      <span className="text-slate-800">₹{splitStrategy.totalPlatformFees}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-950">
                      <span>Total Split Bill:</span>
                      <span className="text-base text-slate-900">₹{splitStrategy.grandTotal}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleApplySplit}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Split size={14} /> Apply Split Strategy to Products
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Action Footer */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-sky-600 shrink-0" />
                <span>
                  <strong>Tip:</strong> Selecting a strategy updates the checked store on every product below so you can checkout faster.
                </span>
              </div>
              <button
                onClick={() => {
                  if (recommendedStrategy === 'WHOLE_CART') {
                    handleApplyWholeStore(bestSingleStore)
                  } else {
                    handleApplySplit()
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <Check size={14} /> Apply Recommended Strategy
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: WHOLE CART BREAKDOWN */}
        {activeTab === 'whole' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">All-in-One Store Rankings</h3>
                <p className="text-xs text-slate-500">Pick one store to order all items together with single delivery.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {singleStores.map((st, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                    st.isComplete
                      ? 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StoreLogoBadge storeName={st.store} />
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        st.isComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {st.itemsAvailable}/{st.totalProducts} In-Stock
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={11} /> {st.info.time}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-semibold text-slate-900">₹{st.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className={st.deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                          {st.deliveryFee === 0 ? 'FREE' : `₹${st.deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 text-sm">
                        <span>Total Cost:</span>
                        <span className="text-sky-700">₹{st.totalCost}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleApplyWholeStore(st)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition"
                    >
                      Select {st.store}
                    </button>
                    <a
                      href={resolveStoreTargetUrl(st.store, products.map(p => p.productName).join(' '))}
                      target={isMobileDevice() ? "_self" : "_blank"}
                      rel="noreferrer"
                      className="p-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 transition"
                      title={`Open ${st.store}`}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SPLIT ORDER BREAKDOWN (STORE BUCKETS) */}
        {activeTab === 'split' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Split Store Buckets</h3>
                <p className="text-xs text-slate-500">
                  Each product is sourced from whichever platform lists it at the lowest price.
                </p>
              </div>
              <button
                onClick={handleApplySplit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Check size={14} /> Apply Split Selection Below
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {splitStrategy.buckets.map((bucket, bIdx) => (
                <div key={bIdx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <StoreLogoBadge storeName={bucket.store} />
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {bucket.itemCount} items • ₹{bucket.totalCost}
                    </span>
                  </div>

                  {/* Bucket items list */}
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/60 max-h-48 overflow-y-auto">
                    {bucket.items.map((it, itIdx) => (
                      <div key={itIdx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
                        <span className="text-slate-800 font-medium truncate max-w-[200px]" title={it.productTitle}>
                          {it.productTitle || it.originalProductName}
                        </span>
                        <span className="font-extrabold text-slate-900 shrink-0">₹{it.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Delivery: {bucket.deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${bucket.deliveryFee}`}</span>
                    <a
                      href={resolveStoreTargetUrl(bucket.store, bucket.items.map(i => i.originalProductName || i.productTitle).join(' '))}
                      target={isMobileDevice() ? "_self" : "_blank"}
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-900 hover:text-sky-600 font-bold transition"
                    >
                      Open {bucket.store} Cart <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Split Order Summary Bar */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Subtotal</span>
                  <span className="text-base font-extrabold">₹{splitStrategy.itemsSubtotal}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Delivery Fees</span>
                  <span className="text-base font-extrabold">₹{splitStrategy.totalDeliveryFees}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Platform Fees</span>
                  <span className="text-base font-extrabold">₹{splitStrategy.totalPlatformFees}</span>
                </div>
                <div className="pl-4 border-l border-slate-700">
                  <span className="text-emerald-400 block font-bold">Grand Total</span>
                  <span className="text-lg font-black text-emerald-300">₹{splitStrategy.grandTotal}</span>
                </div>
              </div>

              <button
                onClick={handleApplySplit}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition"
              >
                Apply Split Selections
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: COMPARE ALL STORES TABLE */}
        {activeTab === 'compare' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">In-Stock Coverage</th>
                  <th className="py-3 px-4">Items Subtotal</th>
                  <th className="py-3 px-4">Delivery Fee</th>
                  <th className="py-3 px-4">Platform Fee</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {singleStores.map((st, sIdx) => (
                  <tr key={sIdx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <StoreLogoBadge storeName={st.store} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        st.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {st.itemsAvailable}/{st.totalProducts} items ({Math.round((st.itemsAvailable / st.totalProducts) * 100)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">₹{st.subtotal}</td>
                    <td className="py-3 px-4">
                      {st.deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${st.deliveryFee}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">₹{st.platformFee}</td>
                    <td className="py-3 px-4 font-extrabold text-sm text-slate-950">₹{st.totalCost}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleApplyWholeStore(st)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] transition mr-2"
                      >
                        Select Store
                      </button>
                      <a
                        href={resolveStoreTargetUrl(st.store, products.map(p => p.productName).join(' '))}
                        target={isMobileDevice() ? "_self" : "_blank"}
                        rel="noreferrer"
                        className="inline-block p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 align-middle"
                        title={`Open ${st.store}`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  )
}
