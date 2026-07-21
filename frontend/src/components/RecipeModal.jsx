import { useState } from 'react'
import { Plus, X, Loader2, Check } from 'lucide-react'
import { parseRecipe, createGrocery } from '../services/groceryService'
import Button from './ui/Button'
import { useToast } from './ui/toast'
import { useNavigate } from 'react-router-dom'

export default function RecipeModal({ isOpen, onClose }) {
  const toast = useToast()
  const navigate = useNavigate()
  
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
    if (selectedIndices.size === 0) return
    setSaving(true)
    
    try {
      const itemsToBuy = ingredients.filter((_, i) => selectedIndices.has(i))
      
      // Execute all POST requests concurrently
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
      
      // Reset state and close
      setRecipeText('')
      setIngredients([])
      setStep(0)
      onClose()
      
      // Navigate to Buy Queue
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
            <h2 className="text-xl font-semibold text-slate-900">
              {step === 0 ? 'Add from Recipe' : 'Review Ingredients'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition p-1">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Paste a recipe below, and we'll automatically extract the ingredients so you can add them to your Buy Queue.
                </p>
                <textarea
                  className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300 resize-none transition"
                  placeholder="E.g., 2 cups all-purpose flour, 1 cup sugar, 2 large eggs..."
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                />
              </div>
            )}
            
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Uncheck the items you already have at home.
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
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            {step === 0 && (
              <>
                <Button variant="secondary" onClick={resetForm}>Cancel</Button>
                <Button variant="primary" onClick={handleParse} disabled={loading || !recipeText.trim()}>
                  {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Parsing...</> : 'Extract Ingredients'}
                </Button>
              </>
            )}
            {step === 1 && (
              <>
                <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                <Button variant="primary" onClick={handleBuyAll} disabled={saving || selectedIndices.size === 0}>
                  {saving ? <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...</> : `Add ${selectedIndices.size} to Buy Queue`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
