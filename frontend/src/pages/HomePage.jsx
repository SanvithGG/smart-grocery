import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import SmartInsightCard from '../components/ui/SmartInsightCard'
import { useToast } from '../components/ui/toast'
import {
  createGrocery,
  createSellerOrder,
  getCatalog,
  getCategories,
  getGroceries,
  getSellerProducts,
} from '../services/groceryService'
import { getNaturalExpiryDate } from '../utils/expiry'
import { buildHomeSmartBuySuggestions } from '../utils/smartSuggestions'

const AVAILABILITY_THRESHOLD = 3
const initialQuickAddDraft = {
  quantity: 1,
  purchased: true,
  expiryDate: '',
  paymentMethod: 'GPAY',
  upiId: '',
  paymentVerified: false,
}

const initialSellerPaymentDraft = {
  paymentMethod: 'GPAY',
  upiId: '',
  paymentVerified: false,
}

const catalogCardClasses = {
  shell: 'border-sky-100',
  chip: 'bg-white/95 text-sky-700',
  button:
    'border-sky-200 bg-white text-sky-800 hover:border-sky-300 hover:bg-sky-50',
}

const quickBuyModalStyle = {
  background: '#ffffff',
}

const homeHeroStyle = {
  background:
    'linear-gradient(135deg, rgba(219,234,254,0.92) 0%, rgba(255,255,255,0.98) 54%, rgba(240,249,255,0.92) 100%)',
}

const catalogCardStyle = {
  background:
    'linear-gradient(145deg, rgba(14,165,233,0.12), rgba(255,255,255,0.96) 58%, rgba(16,185,129,0.08))',
}

const stockToneByAvailability = {
  IN_STOCK: {
    label: 'In Stock',
    badge: 'bg-emerald-50 text-emerald-700',
    quantity: 'text-emerald-700',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    badge: 'bg-amber-50 text-amber-700',
    quantity: 'text-amber-700',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badge: 'bg-rose-50 text-rose-700',
    quantity: 'text-rose-700',
  },
}

const defaultItemPrices = {
  milk: 32,
  bread: 28,
  eggs: 72,
  rice: 95,
  'wheat flour': 54,
  apples: 140,
  bananas: 48,
  tomatoes: 36,
  onions: 40,
  potatoes: 34,
  'cooking oil': 165,
  salt: 24,
  sugar: 46,
  tea: 120,
  coffee: 185,
  biscuits: 30,
  soap: 38,
  detergent: 110,
  paneer: 85,
  yogurt: 42,
  spinach: 25,
}

const defaultCategoryPrices = {
  dairy: 60,
  bakery: 35,
  fruits: 90,
  vegetables: 40,
  grains: 80,
  essentials: 75,
  beverages: 110,
  snacks: 45,
  household: 95,
}

const defaultCatalogQuantities = {
  'milk|dairy': 8,
  'bread|bakery': 0,
  'eggs|dairy': 12,
  'rice|grains': 15,
  'wheat flour|grains': 7,
  'apples|fruits': 10,
  'bananas|fruits': 9,
  'tomatoes|vegetables': 11,
  'onions|vegetables': 6,
  'potatoes|vegetables': 14,
  'cooking oil|essentials': 5,
  'salt|essentials': 18,
  'sugar|essentials': 13,
  'tea|beverages': 0,
  'coffee|beverages': 4,
  'biscuits|snacks': 16,
  'soap|household': 9,
  'detergent|household': 6,
}

const normalizeKey = (value) => (value || '').trim().toLowerCase()

const catalogKey = (name, category) => `${normalizeKey(name)}|${normalizeKey(category)}`

const formatPrice = (price, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price ?? 0)

const resolveFallbackPrice = (item) =>
  defaultItemPrices[normalizeKey(item.name)] ?? defaultCategoryPrices[normalizeKey(item.category)] ?? 99

const resolveFallbackQuantity = (item) => defaultCatalogQuantities[catalogKey(item.name, item.category)] ?? 0

const paymentMethodOptions = [
  { value: 'GPAY', label: 'Google Pay UPI' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'COD', label: 'Cash on delivery' },
]

const upiPattern = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/

const resolveAvailability = (quantity) => {
  if (quantity <= 0) {
    return 'OUT_OF_STOCK'
  }

  if (quantity <= AVAILABILITY_THRESHOLD - 1) {
    return 'LOW_STOCK'
  }

  return 'IN_STOCK'
}

function HomePage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [myItems, setMyItems] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerOrderQuantities, setSellerOrderQuantities] = useState({})
  const [sellerOrderSubmittingId, setSellerOrderSubmittingId] = useState(null)
  const [sellerOrderTarget, setSellerOrderTarget] = useState(null)
  const [sellerPaymentDraft, setSellerPaymentDraft] = useState(initialSellerPaymentDraft)
  const [sellerPaymentProcessing, setSellerPaymentProcessing] = useState(false)
  const [catalogFilters, setCatalogFilters] = useState({ category: '', search: '' })
  const [error, setError] = useState('')
  const [quickAddTarget, setQuickAddTarget] = useState(null)
  const [quickAddDraft, setQuickAddDraft] = useState(initialQuickAddDraft)
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false)
  const [quickPaymentProcessing, setQuickPaymentProcessing] = useState(false)
  const naturalQuickExpiryDate =
    quickAddDraft.purchased && quickAddTarget
      ? getNaturalExpiryDate(quickAddTarget.name, quickAddTarget.category)
      : null
  const displayedQuickExpiryDate = quickAddDraft.expiryDate || naturalQuickExpiryDate || ''
  const quickBuyPrice = quickAddTarget
    ? Number.isFinite(Number(quickAddTarget.price)) && quickAddTarget.price !== null
      ? Number(quickAddTarget.price)
      : resolveFallbackPrice(quickAddTarget)
    : 0
  const quickBuyTotal = quickBuyPrice * Math.max(Number(quickAddDraft.quantity) || 0, 0)
  const quickNeedsUpi = quickAddDraft.paymentMethod === 'UPI' || quickAddDraft.paymentMethod === 'GPAY'
  const quickNeedsMockPayment = quickAddDraft.paymentMethod === 'GPAY'
  const upiIdIsValid =
    !quickNeedsUpi || upiPattern.test(quickAddDraft.upiId.trim())
  const quickPaymentReady = !quickNeedsMockPayment || quickAddDraft.paymentVerified
  const sellerNeedsUpi =
    sellerPaymentDraft.paymentMethod === 'UPI' || sellerPaymentDraft.paymentMethod === 'GPAY'
  const sellerNeedsMockPayment = sellerPaymentDraft.paymentMethod === 'GPAY'
  const sellerUpiIdIsValid =
    !sellerNeedsUpi || upiPattern.test(sellerPaymentDraft.upiId.trim())
  const sellerPaymentReady = !sellerNeedsMockPayment || sellerPaymentDraft.paymentVerified
  const formatNaturalExpiry = (value) => {
    if (!value) {
      return 'Mark as purchased to preview expiry'
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString()
  }

  const loadHomeData = async () => {
    setError('')

    try {
        const [itemsData, categoriesData, catalogData, sellerProductsData] = await Promise.all([
          getGroceries(),
          getCategories(),
          getCatalog(),
          getSellerProducts(),
        ])

        setMyItems(itemsData)
        setCatalogCategories(categoriesData)
        setCatalogItems(catalogData)
        setSellerProducts(sellerProductsData)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load home data right now.'))
    }
  }

  const loadCatalog = async (category = '', search = '') => {
    try {
      const params = {}

      if (category) {
        params.category = category
      }

      if (search) {
        params.search = search
      }

      setCatalogItems(await getCatalog(params))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load catalog items right now.'))
      setCatalogItems([])
    }
  }

  useEffect(() => {
    loadHomeData()
  }, [])

  const handleCatalogFilterChange = (event) => {
    const { name, value } = event.target
    const nextFilters = { ...catalogFilters, [name]: value }
    setCatalogFilters(nextFilters)
    loadCatalog(nextFilters.category, nextFilters.search)
  }

  const handleOpenQuickAdd = (item) => {
    setQuickAddTarget(item)
    setQuickAddDraft(initialQuickAddDraft)
    setError('')
  }

  const handleCloseQuickAdd = () => {
    setQuickAddTarget(null)
    setQuickAddDraft(initialQuickAddDraft)
    setQuickAddSubmitting(false)
    setQuickPaymentProcessing(false)
  }

  const handleQuickAddChange = (event) => {
    const { name, value, type, checked } = event.target
    setQuickAddDraft((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'paymentMethod' || name === 'upiId' ? { paymentVerified: false } : {}),
    }))
  }

  const handleMockQuickPayment = () => {
    if (!upiIdIsValid) {
      setError('Enter a valid UPI ID to continue with Google Pay.')
      return
    }

    setError('')
    setQuickPaymentProcessing(true)

    window.setTimeout(() => {
      setQuickAddDraft((current) => ({ ...current, paymentVerified: true }))
      setQuickPaymentProcessing(false)
      toast.success('Demo Google Pay payment verified.')
    }, 1200)
  }

  const handleQuickAddSubmit = async (event) => {
    event.preventDefault()

    if (!quickAddTarget) {
      return
    }

    if (quickNeedsUpi && !upiIdIsValid) {
      setError('Enter a valid UPI ID to continue with this purchase.')
      return
    }

    if (!quickPaymentReady) {
      setError('Verify the demo Google Pay payment before completing this purchase.')
      return
    }

    setQuickAddSubmitting(true)
    setError('')

    try {
      await createGrocery({
        name: quickAddTarget.name,
        category: quickAddTarget.category,
        quantity: Number(quickAddDraft.quantity),
        purchased: quickAddDraft.purchased,
        expiryDate: quickAddDraft.purchased ? displayedQuickExpiryDate || null : null,
      })
      await loadHomeData()
      window.dispatchEvent(new Event('grocery-data-changed'))
      toast.success(
        `${quickAddTarget.name} bought with ${quickAddDraft.paymentMethod === 'COD' ? 'cash' : quickAddDraft.paymentMethod.toLowerCase()}.`,
      )
      handleCloseQuickAdd()
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          `Could not complete the purchase for ${quickAddTarget.name}.`,
        ),
      )
      toast.error(`Could not complete the purchase for ${quickAddTarget.name}.`)
    } finally {
      setQuickAddSubmitting(false)
    }
  }

  const handleSellerOrderQuantityChange = (productId, value) => {
    setSellerOrderQuantities((current) => ({
      ...current,
      [productId]: value,
    }))
  }

  const handleOpenSellerOrder = (product) => {
    setSellerOrderTarget(product)
    setSellerPaymentDraft(initialSellerPaymentDraft)
    setSellerPaymentProcessing(false)
    setSellerOrderQuantities((current) => ({
      ...current,
      [product.id]: current[product.id] ?? 1,
    }))
    setError('')
  }

  const handleCloseSellerOrder = () => {
    setSellerOrderTarget(null)
    setSellerOrderSubmittingId(null)
    setSellerPaymentDraft(initialSellerPaymentDraft)
    setSellerPaymentProcessing(false)
  }

  const handleSellerPaymentChange = (event) => {
    const { name, value } = event.target
    setSellerPaymentDraft((current) => ({
      ...current,
      [name]: value,
      ...(name === 'paymentMethod' || name === 'upiId' ? { paymentVerified: false } : {}),
    }))
  }

  const handleMockSellerPayment = () => {
    if (!sellerUpiIdIsValid) {
      setError('Enter a valid UPI ID to continue with Google Pay.')
      return
    }

    setError('')
    setSellerPaymentProcessing(true)

    window.setTimeout(() => {
      setSellerPaymentDraft((current) => ({ ...current, paymentVerified: true }))
      setSellerPaymentProcessing(false)
      toast.success('Demo Google Pay payment verified.')
    }, 1200)
  }

  const handleSellerOrder = async (product) => {
    const quantity = Math.max(Number(sellerOrderQuantities[product.id]) || 1, 1)

    if (quantity > product.stock) {
      setError(`Only ${product.stock} unit(s) of ${product.name} are available.`)
      return
    }

    if (sellerNeedsUpi && !sellerUpiIdIsValid) {
      setError('Enter a valid UPI ID to continue with this seller order.')
      return
    }

    if (!sellerPaymentReady) {
      setError('Verify the demo Google Pay payment before placing this seller order.')
      return
    }

    setSellerOrderSubmittingId(product.id)
    setError('')

    try {
      await createSellerOrder(product.id, { quantity })
      await loadHomeData()
      toast.success(`${product.name} order sent to the seller.`)
      setSellerOrderQuantities((current) => ({ ...current, [product.id]: 1 }))
      setSellerOrderTarget(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Could not order ${product.name}.`))
      toast.error(`Could not order ${product.name}.`)
    } finally {
      setSellerOrderSubmittingId(null)
    }
  }

  const availableItems = myItems
    .filter((item) => !item.purchased && item.quantity >= AVAILABILITY_THRESHOLD)
    .sort((first, second) => second.quantity - first.quantity)
  const smartBuySuggestions = buildHomeSmartBuySuggestions(myItems, sellerProducts)

  const pendingItems = myItems.filter((item) => !item.purchased)
  const purchasedItems = myItems.filter((item) => item.purchased)

  return (
    <div className="space-y-6">
      {quickAddTarget && (
        <Modal
          open={Boolean(quickAddTarget)}
          title={quickAddTarget.name}
          description={quickAddTarget.category}
          onClose={handleCloseQuickAdd}
          footer={null}
        >
          <div style={quickBuyModalStyle} className="-m-6 rounded-4xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
                    Quick Buy
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Available now: {quickAddTarget.availableQuantity ?? 0} units
                  </p>
                </div>
                <Button variant="secondary" onClick={handleCloseQuickAdd}>
                  Close
                </Button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleQuickAddSubmit}>
                <div>
                  <Input
                    label="Quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={quickAddDraft.quantity}
                    onChange={handleQuickAddChange}
                    required
                    inputClassName="mt-2 focus:border-emerald-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Stock will decrease by this quantity after purchase.
                  </p>
                </div>

                <Input
                  as="select"
                  label="Payment Method"
                  name="paymentMethod"
                  value={quickAddDraft.paymentMethod}
                  onChange={handleQuickAddChange}
                  inputClassName="focus:border-emerald-500"
                >
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Input>

                {quickNeedsUpi && (
                  <Input
                    label={quickAddDraft.paymentMethod === 'GPAY' ? 'Google Pay UPI ID' : 'UPI ID'}
                    name="upiId"
                    value={quickAddDraft.upiId}
                    onChange={handleQuickAddChange}
                    placeholder="name@bank"
                    error={
                      quickAddDraft.upiId && !upiIdIsValid ? 'Enter a valid UPI ID.' : ''
                    }
                    inputClassName="focus:border-emerald-500"
                    required
                  />
                )}

                {quickNeedsMockPayment && (
                  <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Google Pay demo</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Demo payment only. No real money is transferred.
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          quickAddDraft.paymentVerified
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white text-sky-700'
                        }`}
                      >
                        {quickAddDraft.paymentVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="sky"
                      fullWidth
                      className="mt-4 rounded-2xl"
                      disabled={quickPaymentProcessing || !upiIdIsValid}
                      onClick={handleMockQuickPayment}
                    >
                      {quickPaymentProcessing ? 'Processing Google Pay...' : 'Pay with Google Pay'}
                    </Button>
                  </div>
                )}

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">Estimated total</span>
                    <span className="text-lg font-semibold text-slate-950">
                      {formatPrice(quickBuyTotal, quickAddTarget?.currency || 'INR')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>
                      {formatPrice(quickBuyPrice, quickAddTarget?.currency || 'INR')} x{' '}
                      {quickAddDraft.quantity}
                    </span>
                    <span>
                      {quickAddDraft.paymentMethod === 'COD'
                        ? 'Cash on delivery'
                        : quickAddDraft.paymentMethod === 'GPAY'
                          ? 'Google Pay'
                          : quickAddDraft.paymentMethod}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Expected Expiry</label>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {formatNaturalExpiry(displayedQuickExpiryDate)}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    This purchase is saved as bought immediately, and expiry is calculated automatically.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={quickAddSubmitting || !upiIdIsValid || !quickPaymentReady}
                  className="rounded-2xl"
                >
                  {quickAddSubmitting ? 'Processing Purchase...' : 'Buy This Item'}
                </Button>
              </form>
          </div>
        </Modal>
      )}

      {sellerOrderTarget && (
        <Modal
          open={Boolean(sellerOrderTarget)}
          title={sellerOrderTarget.name}
          description={sellerOrderTarget.category}
          onClose={handleCloseSellerOrder}
          footer={null}
        >
          <div style={quickBuyModalStyle} className="-m-6 rounded-4xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
                  Seller Order
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Available now: {sellerOrderTarget.stock ?? 0} units
                </p>
              </div>
              <Button variant="secondary" onClick={handleCloseSellerOrder}>
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                label="Quantity"
                type="number"
                min="1"
                max={sellerOrderTarget.stock}
                value={sellerOrderQuantities[sellerOrderTarget.id] ?? 1}
                onChange={(event) =>
                  handleSellerOrderQuantityChange(sellerOrderTarget.id, event.target.value)
                }
                inputClassName="focus:border-emerald-500"
              />

              <Input
                as="select"
                label="Payment Method"
                name="paymentMethod"
                value={sellerPaymentDraft.paymentMethod}
                onChange={handleSellerPaymentChange}
                inputClassName="focus:border-emerald-500"
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Input>

              {sellerNeedsUpi && (
                <Input
                  label={sellerPaymentDraft.paymentMethod === 'GPAY' ? 'Google Pay UPI ID' : 'UPI ID'}
                  name="upiId"
                  value={sellerPaymentDraft.upiId}
                  onChange={handleSellerPaymentChange}
                  placeholder="name@bank"
                  error={sellerPaymentDraft.upiId && !sellerUpiIdIsValid ? 'Enter a valid UPI ID.' : ''}
                  inputClassName="focus:border-emerald-500"
                  required
                />
              )}

              {sellerNeedsMockPayment && (
                <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Google Pay demo</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Demo payment only. No real money is transferred.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        sellerPaymentDraft.paymentVerified
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white text-sky-700'
                      }`}
                    >
                      {sellerPaymentDraft.paymentVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="sky"
                    fullWidth
                    className="mt-4 rounded-2xl"
                    disabled={sellerPaymentProcessing || !sellerUpiIdIsValid}
                    onClick={handleMockSellerPayment}
                  >
                    {sellerPaymentProcessing ? 'Processing Google Pay...' : 'Pay with Google Pay'}
                  </Button>
                </div>
              )}

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Estimated total</span>
                  <span className="text-lg font-semibold text-slate-950">
                    {formatPrice(
                      Number(sellerOrderTarget.price) *
                        Math.max(Number(sellerOrderQuantities[sellerOrderTarget.id]) || 1, 1),
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    {formatPrice(sellerOrderTarget.price)} x{' '}
                    {sellerOrderQuantities[sellerOrderTarget.id] ?? 1}
                  </span>
                  <span>Seller stock: {sellerOrderTarget.stock}</span>
                </div>
                {sellerOrderTarget.expiryDate && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Expires {new Date(`${sellerOrderTarget.expiryDate}T00:00:00`).toLocaleDateString()}
                  </p>
                )}
              </div>

              <Button
                variant="success"
                size="lg"
                fullWidth
                className="rounded-2xl"
                disabled={
                  sellerOrderSubmittingId === sellerOrderTarget.id ||
                  sellerOrderTarget.stock <= 0 ||
                  !sellerUpiIdIsValid ||
                  !sellerPaymentReady
                }
                onClick={() => handleSellerOrder(sellerOrderTarget)}
              >
                {sellerOrderSubmittingId === sellerOrderTarget.id ? 'Sending Order...' : 'Order From Seller'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article
          style={homeHeroStyle}
          className="overflow-hidden rounded-4xl border border-sky-100 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
            Grocery Home
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
            Plan what to buy fast, then use the dashboard when you need the numbers.
          </h2>
          <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
            Browse your grocery catalog, buy items fast, and move to the dashboard for stock,
            pending items, smart recommendations, kitchen reminders, and stored notifications.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open Dashboard
            </Link>
            <Link
              to="/shopping-list"
              className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
            >
              Buy Queue
            </Link>
            <Link
              to="/inventory"
              className="rounded-full border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Manage Inventory
            </Link>
          </div>
        </article>

        <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Today
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Pending</p>
              <p className="mt-2 text-3xl font-semibold">{pendingItems.length}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Purchased</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{purchasedItems.length}</p>
            </div>
            <div className="rounded-3xl bg-sky-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-700">Available 3+</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{availableItems.length}</p>
            </div>
          </div>
        </article>
      </section>

      {error && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {smartBuySuggestions.length > 0 && (
        <section className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Smart Buy Suggestions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Useful next buys from your stock signals
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                These are generated from low stock, expiry timing, and live seller availability.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {smartBuySuggestions.length} active
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {smartBuySuggestions.map((suggestion) => (
              <SmartInsightCard
                key={suggestion.id}
                {...suggestion}
                onAction={() => {
                  if (suggestion.actionTarget === 'seller-market') {
                    document.getElementById('seller-market')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                  }

                  if (suggestion.actionTarget === 'dashboard-reminders') {
                    navigate('/dashboard', { state: { openSection: 'kitchen-reminders' } })
                    return
                  }

                  navigate('/shopping-list')
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700">
              Shop
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Pick what you want to buy
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Search grocery names or categories here and add them straight into your buying flow.
            </p>
          </div>

          <div className="mt-5 grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 sm:grid-cols-[1.35fr_0.85fr]">
            <input
              name="search"
              value={catalogFilters.search}
              onChange={handleCatalogFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              placeholder="Search catalog, like paneer, pasta, cereal, spinach..."
            />
            <select
              name="category"
              value={catalogFilters.category}
              onChange={handleCatalogFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">All Categories</option>
              {catalogCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {catalogItems.length === 0 && (
            <p className="sm:col-span-2 xl:col-span-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No catalog items found for this filter.
            </p>
          )}

          {catalogItems.map((item) => {
            const itemKey = `${item.category}-${item.name}`
            const quantity =
              Number.isFinite(Number(item.availableQuantity)) && item.availableQuantity !== null
                ? Number(item.availableQuantity)
                : resolveFallbackQuantity(item)
            const availability = item.availability || resolveAvailability(quantity)
            const stockTone =
              stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK
            const displayPrice =
              Number.isFinite(Number(item.price)) && item.price !== null
                ? Number(item.price)
                : resolveFallbackPrice(item)

            return (
              <article
                key={itemKey}
                className={`rounded-3xl border px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${catalogCardClasses.shell}`}
                style={catalogCardStyle}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${catalogCardClasses.chip}`}
                  >
                    {item.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stockTone.badge}`}
                  >
                    {stockTone.label}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.name}</h3>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      {formatPrice(displayPrice, item.currency || 'INR')}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Estimated price
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${stockTone.quantity}`}>
                      {quantity > 0 ? `${quantity} available` : '0 available'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">In your inventory</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {quantity > 0
                    ? `${quantity} store units are currently available for purchase.`
                    : 'This product is currently unavailable. It will be restocked soon.'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>UPI, card, or cash</span>
                  <span>Fast checkout</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd(item)}
                  disabled={availability === 'OUT_OF_STOCK'}
                  className={`mt-4 w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${catalogCardClasses.button} ${
                    availability === 'OUT_OF_STOCK' ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  {availability === 'OUT_OF_STOCK' ? 'Unavailable' : 'Buy Option'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section id="seller-market" className="scroll-mt-8 rounded-4xl border border-emerald-100 bg-white/85 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Seller Market
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Order directly from sellers
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              These products are listed by sellers. Orders appear in the seller dashboard as pending.
            </p>
          </div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {sellerProducts.length} live
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sellerProducts.length === 0 && (
            <p className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No seller products are available yet.
            </p>
          )}

          {sellerProducts.map((product) => {
            const isSubmitting = sellerOrderSubmittingId === product.id
            const quantity = Number(product.stock) || 0
            const availability = resolveAvailability(quantity)
            const stockTone =
              stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK

            return (
              <article
                key={product.id}
                className={`rounded-3xl border px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${catalogCardClasses.shell}`}
                style={catalogCardStyle}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${catalogCardClasses.chip}`}
                  >
                    {product.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stockTone.badge}`}
                  >
                    {stockTone.label}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-slate-900">{product.name}</h3>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      {formatPrice(product.price)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Seller price
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${stockTone.quantity}`}>
                      {quantity > 0 ? `${quantity} available` : '0 available'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Seller stock</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  {quantity > 0
                    ? `${quantity} seller units are currently available for purchase.`
                    : 'This seller product is currently unavailable.'}
                </p>

                {product.expiryDate && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Expires {new Date(`${product.expiryDate}T00:00:00`).toLocaleDateString()}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Seller order</span>
                  <span>Pending approval</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSellerOrder(product)}
                  disabled={isSubmitting || availability === 'OUT_OF_STOCK'}
                  className={`mt-4 w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${catalogCardClasses.button} ${
                    isSubmitting || availability === 'OUT_OF_STOCK' ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  {isSubmitting ? 'Sending Order...' : availability === 'OUT_OF_STOCK' ? 'Unavailable' : 'Buy Option'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default HomePage
