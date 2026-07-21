import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGroceries, getSellerProducts, updateGrocery } from '../services/groceryService'
import { findSellerMatchesForItem } from '../utils/smartSuggestions'
import { Circle } from 'lucide-react'
import Button from './ui/Button'

const LOW_STOCK_THRESHOLD = 1
const EXPIRY_WARNING_DAYS = 3

const formatExpiryDate = (value) => {
  if (!value) {
    return ''
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString()
}

const daysUntil = (expiryDateStr) => {
  if (!expiryDateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(`${expiryDateStr}T00:00:00`)
  const diffTime = expDate - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export default function ActionBoard() {
  const [watchlist, setWatchlist] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [inventoryResult, sellerProductsResult] = await Promise.all([
        getGroceries({ purchased: true }),
        getSellerProducts()
      ])
      
      const items = inventoryResult || []
      const filteredWatchlist = items.map(item => {
        let reasons = []
        let severity = 'NORMAL'
        
        if (item.quantity <= LOW_STOCK_THRESHOLD) {
          reasons.push('Low Stock')
          severity = 'WARNING'
        }
        
        const days = daysUntil(item.expiryDate)
        if (days !== null) {
          if (days < 0) {
            reasons.push('Expired')
            severity = 'DANGER'
          } else if (days <= EXPIRY_WARNING_DAYS) {
            reasons.push(`Expiring in ${days} ${days === 1 ? 'day' : 'days'}`)
            if (severity !== 'DANGER') severity = 'WARNING'
          }
        }
        
        return { ...item, reasons, severity }
      }).filter(item => item.reasons.length > 0)

      setWatchlist(filteredWatchlist)
      setSellerProducts(sellerProductsResult || [])
    } catch (error) {
      console.error('Failed to load action board data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleDataChanged = () => {
      loadData()
    }
    window.addEventListener('grocery-data-changed', handleDataChanged)
    return () => {
      window.removeEventListener('grocery-data-changed', handleDataChanged)
    }
  }, [])

  const handleTogglePurchased = async (item) => {
    try {
      await updateGrocery(item.id, {
        ...item,
        purchased: false,
        expiryDate: null,
      })
      loadData()
      window.dispatchEvent(new Event('grocery-data-changed'))
    } catch (error) {
      console.error('Could not update item status', error)
    }
  }

  const findSellerMatches = (item) => {
    const itemName = (item.name || '').trim().toLowerCase()
    const itemCategory = (item.category || '').trim().toLowerCase()
    return findSellerMatchesForItem({ ...item, name: itemName, category: itemCategory }, sellerProducts).slice(0, 3)
  }

  if (loading) {
    return (
      <article className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_15px_50px_rgba(15,23,42,0.18)]">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_15px_50px_rgba(15,23,42,0.18)] h-full">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
            Action Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Low-stock watchlist
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {watchlist.length === 0 && (
          <p className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
            No urgent restock items right now.
          </p>
        )}

        {watchlist.map((item) => {
          const matches = findSellerMatches(item)

          return (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {item.reasons.map((reason, idx) => (
                      <span key={idx} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.severity === 'DANGER' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {reason}
                      </span>
                    ))}
                  </div>
                  <p className="text-lg font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-300">{item.category}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                    Qty {item.quantity}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => handleTogglePurchased(item)}
                  variant="secondary"
                  className="w-full justify-center bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Circle size={14} className="text-white/50" />
                  Send to Buy Queue
                </Button>
              </div>

              {matches.length > 0 && (
                <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">
                        Seller match suggestions
                      </p>
                    </div>
                  </div>

                <div className="mt-3 grid gap-2">


                  {matches.map((product) => (
                    <div
                      key={`${item.id}-${product.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-white">{product.name}</span>
                      <span className="text-slate-300">
                        Rs {product.price} | {product.stock} stock
                        {product.expiryDate ? ` | Expires ${formatExpiryDate(product.expiryDate)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </article>
  )
}
