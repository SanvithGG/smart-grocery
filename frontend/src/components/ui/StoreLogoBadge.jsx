import React from 'react'
import { Store } from 'lucide-react'

export default function StoreLogoBadge({ storeName, className = '' }) {
  const s = (storeName || '').toLowerCase()

  if (s.includes('blinkit')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f7c500] text-slate-950 font-extrabold text-xs tracking-tight shadow-sm ${className}`}>
        <span className="bg-slate-950 text-[#f7c500] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black">b</span>
        Blinkit
      </span>
    )
  }
  if (s.includes('instamart') || s.includes('swiggy')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#fc8019] text-white font-extrabold text-xs tracking-tight shadow-sm ${className}`}>
        <span className="bg-white text-[#fc8019] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black">i</span>
        Swiggy Instamart
      </span>
    )
  }
  if (s.includes('zepto')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3b0066] text-white font-extrabold text-xs tracking-tight shadow-sm ${className}`}>
        <span className="text-amber-300 text-xs">⚡</span>
        Zepto
      </span>
    )
  }
  if (s.includes('amazon')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#131921] text-[#ff9900] font-extrabold text-xs tracking-tight shadow-sm ${className}`}>
        <span className="text-white text-xs font-black">a</span>
        Amazon India
      </span>
    )
  }
  if (s.includes('flipkart')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2874f0] text-[#ffe500] font-extrabold text-xs tracking-tight shadow-sm ${className}`}>
        <span className="bg-[#ffe500] text-[#2874f0] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black">f</span>
        Flipkart
      </span>
    )
  }
  if (s.includes('bigbasket')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#84c225] text-slate-950 font-extrabold text-xs tracking-tight shadow-sm ${className}`}>
        <span className="bg-slate-950 text-[#84c225] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black">bb</span>
        BigBasket
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-white font-bold text-xs ${className}`}>
      <Store className="w-3.5 h-3.5" />
      {storeName}
    </span>
  )
}
