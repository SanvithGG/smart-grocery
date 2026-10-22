import { useState } from 'react'
import { MapPin, Navigation, X, Check, Building2, Loader2 } from 'lucide-react'

export const POPULAR_LOCATIONS = [
  { pincode: '560038', city: 'Indiranagar, Bangalore', state: 'Karnataka' },
  { pincode: '560034', city: 'Koramangala, Bangalore', state: 'Karnataka' },
  { pincode: '560100', city: 'Electronic City, Bangalore', state: 'Karnataka' },
  { pincode: '400050', city: 'Bandra West, Mumbai', state: 'Maharashtra' },
  { pincode: '400058', city: 'Andheri West, Mumbai', state: 'Maharashtra' },
  { pincode: '110001', city: 'Connaught Place, New Delhi', state: 'Delhi NCR' },
  { pincode: '122002', city: 'Cyber City, Gurgaon', state: 'Haryana' },
  { pincode: '500081', city: 'Hitec City, Hyderabad', state: 'Telangana' },
  { pincode: '411038', city: 'Kothrud, Pune', state: 'Maharashtra' },
  { pincode: '600017', city: 'T. Nagar, Chennai', state: 'Tamil Nadu' },
  { pincode: '700091', city: 'Salt Lake, Kolkata', state: 'West Bengal' },
]

export default function LocationSelectorModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation
}) {
  const [customPincode, setCustomPincode] = useState('')
  const [error, setError] = useState('')
  const [detecting, setDetecting] = useState(false)

  if (!isOpen) return null

  const handleApplyCustomPincode = (e) => {
    e.preventDefault()
    const cleanPin = customPincode.trim()
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setError('Please enter a valid 6-digit Indian PIN code.')
      return
    }

    // Match with popular or generate generic city label
    const match = POPULAR_LOCATIONS.find(l => l.pincode === cleanPin)
    const locationObj = {
      pincode: cleanPin,
      city: match ? match.city : `Delivery Hub (${cleanPin})`,
      label: match ? `${match.city} (${cleanPin})` : `Pincode ${cleanPin}`
    }

    onSelectLocation(locationObj)
    onClose()
  }

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setDetecting(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetecting(false)
        const lat = position.coords.latitude
        const lon = position.coords.longitude

        // Approximate nearest major metro coordinates
        let nearest = POPULAR_LOCATIONS[0]
        if (lat >= 12.8 && lat <= 13.2 && lon >= 77.4 && lon <= 77.8) {
          nearest = POPULAR_LOCATIONS[0] // Bangalore
        } else if (lat >= 18.8 && lat <= 19.3 && lon >= 72.7 && lon <= 73.1) {
          nearest = POPULAR_LOCATIONS[3] // Mumbai
        } else if (lat >= 28.4 && lat <= 28.9 && lon >= 76.9 && lon <= 77.4) {
          nearest = POPULAR_LOCATIONS[5] // Delhi
        } else if (lat >= 17.2 && lat <= 17.6 && lon >= 78.2 && lon <= 78.6) {
          nearest = POPULAR_LOCATIONS[7] // Hyderabad
        } else if (lat >= 12.9 && lat <= 13.3 && lon >= 80.1 && lon <= 80.4) {
          nearest = POPULAR_LOCATIONS[9] // Chennai
        }

        onSelectLocation({
          pincode: nearest.pincode,
          city: `${nearest.city} (GPS Detected)`,
          label: `${nearest.city} (${nearest.pincode})`
        })
        onClose()
      },
      () => {
        setDetecting(false)
        setError('Location permission denied or unavailable. Please choose from the list.')
      },
      { timeout: 7000 }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Select Delivery Location</h3>
              <p className="text-xs text-slate-400">
                Prices and dark-store stock vary by delivery pincode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Custom Pincode Input Form */}
          <form onSubmit={handleApplyCustomPincode} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Enter Indian Pincode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={customPincode}
                onChange={(e) => {
                  setCustomPincode(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                placeholder="e.g. 560038"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={customPincode.length !== 6}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
              >
                Set Pincode
              </button>
            </div>
            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
          </form>

          {/* GPS Auto-detect Button */}
          <button
            onClick={handleDetectGPS}
            disabled={detecting}
            className="w-full bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 text-slate-800 p-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {detecting ? (
              <>
                <Loader2 size={16} className="animate-spin text-sky-600" />
                <span>Locating nearby delivery hubs...</span>
              </>
            ) : (
              <>
                <Navigation size={16} className="text-sky-600" />
                <span>Use Current Device Location (Auto-detect)</span>
              </>
            )}
          </button>

          {/* Popular Hubs Grid */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={13} /> Popular Quick-Commerce Metro Hubs
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_LOCATIONS.map((loc, idx) => {
                const isSelected = currentLocation?.pincode === loc.pincode
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectLocation({
                        pincode: loc.pincode,
                        city: loc.city,
                        label: `${loc.city} (${loc.pincode})`
                      })
                      onClose()
                    }}
                    className={`text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 ring-1 ring-sky-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{loc.city}</p>
                      <p className="text-[11px] text-slate-500">{loc.state} • <strong className="text-slate-700">{loc.pincode}</strong></p>
                    </div>
                    {isSelected && (
                      <span className="text-sky-600 bg-sky-100 p-1 rounded-full shrink-0">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
