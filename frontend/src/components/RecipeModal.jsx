import { useState } from 'react'
import { Plus, X, Loader2, Check, Sparkles } from 'lucide-react'
import { parseRecipe, createGrocery } from '../services/groceryService'
import Button from './ui/Button'
import { useToast } from './ui/toast'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../utils/session'

export default function RecipeModal({ isOpen, onClose }) {
  const toast = useToast()
  const navigate = useNavigate()
  
  const { token } = getSession()
  const isLoggedIn = !!token

  const requireLogin = () => {
    if (!isLoggedIn) {
      toast.error('Please log in to use Smart Grocery features.')
      resetForm()
      navigate('/login')
      return false
    }
    return true
  }

  const [recipeText, setRecipeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Array of parsed ingredients
  const [ingredients, setIngredients] = useState([])
  
  // Track which ones the user wants to buy
  const [selectedIndices, setSelectedIndices] = useState(new Set())
  
  // 0: input, 1: review
  const [step, setStep] = useState(0)

  if (!isOpen) return null

  const handleParse = async () => {
    if (!requireLogin()) return
    if (!recipeText.trim()) return
    setLoading(true)
    
    try {
      const data = await parseRecipe(recipeText)
      if (data && data.length > 0) {
        setIngredients(data)
        // Select all by default
        setSelectedIndices(new Set(data.map((_, i) => i)))
        setStep(1)
      } else {
        toast.error('Could not extract any ingredients from that text.')
      }
    } catch (error) {
      toast.error('Failed to parse recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDirectCompare = () => {
    if (!requireLogin()) return
    if (!recipeText.trim()) return
    resetForm()
    navigate('/price-compare', { state: { queryText: recipeText } })
  }

  const handleCompareSelected = () => {
    if (!requireLogin()) return
    const selectedItems = ingredients
      .filter((_, i) => selectedIndices.has(i))
      .map(item => item.name)
    if (selectedItems.length === 0) return
    resetForm()
    navigate('/price-compare', { state: { products: selectedItems } })
  }

  const toggleSelection = (index) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleBuyAll = async () => {
    if (!requireLogin()) return
    if (selectedIndices.size === 0) return
    setSaving(true)
    
    try {
      const itemsToBuy = ingredients.filter((_, i) => selectedIndices.has(i))
      
      await Promise.all(itemsToBuy.map(item => 
        createGrocery({
          name: item.name,
          category: item.category || 'PRODUCE',
          quantity: 1,
          purchased: false,
          expiryDate: null
        })
      ))
      
      toast.success(`Added ${itemsToBuy.length} items to Buy Queue.`)
      resetForm()
      navigate('/shopping-list')
    } catch (error) {
      toast.error('Failed to add some items. Please check your Buy Queue.')
    } finally {
      setSaving(false)
    }
  }
  
  const resetForm = () => {
    setRecipeText('')
    setIngredients([])
    setStep(0)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={resetForm} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              {step === 0 ? 'Smart Price Compare & Recipe Input' : 'Review Ingredients'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition p-1">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Paste a recipe or type products below to compare live prices across Blinkit, Instamart, Zepto, Amazon & Flipkart.
                </p>
                <textarea
                  className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300 resize-none transition"
                  placeholder="E.g., 2 L Amul Taaza Milk, 1 kg Whole Wheat Atta, 500g Paneer..."
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                />
              </div>
            )}
            
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Select ingredients to compare store prices or add directly to your Buy Queue.
                </p>
                <div className="space-y-2">
                  {ingredients.map((item, index) => {
                    const isSelected = selectedIndices.has(index)
                    return (
                      <div 
                        key={index}
                        onClick={() => toggleSelection(index)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${isSelected ? 'border-sky-200 bg-sky-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                      >
                        <div>
                          <p className={`text-sm font-semibold transition ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>{item.name}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{item.category}</p>
                        </div>
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border transition ${isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 bg-slate-50'}`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            {step === 0 && (
              <>
                <Button variant="secondary" onClick={resetForm}>Cancel</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleParse} disabled={loading || !recipeText.trim()}>
                    {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Parsing...</> : 'Extract Only'}
                  </Button>
                  <Button variant="primary" onClick={handleDirectCompare} disabled={!recipeText.trim()}>
                    Compare Store Prices
                  </Button>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleCompareSelected} disabled={selectedIndices.size === 0}>
                    Compare Prices
                  </Button>
                  <Button variant="primary" onClick={handleBuyAll} disabled={saving || selectedIndices.size === 0}>
                    {saving ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...</> : `Add ${selectedIndices.size} to Buy Queue`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
