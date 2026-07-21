import { createContext, useContext, useEffect, useState } from 'react'
import { getSmartRules } from '../services/groceryService'

const SmartRulesContext = createContext()

export function SmartRulesProvider({ children }) {
  const [rules, setRules] = useState({ expiry: {}, price: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRules() {
      try {
        const data = await getSmartRules()
        const parsed = { expiry: {}, price: {} }
        
        data.forEach(rule => {
          if (!rule || !rule.itemKey || rule.value === undefined || rule.value === null) return;
          const key = rule.itemKey.toLowerCase();
          if (rule.type === 'EXPIRY') {
            const parsedVal = parseInt(rule.value, 10);
            if (!isNaN(parsedVal)) {
              parsed.expiry[key] = parsedVal;
            }
          } else if (rule.type === 'PRICE') {
            const parsedVal = parseFloat(rule.value);
            if (!isNaN(parsedVal)) {
              parsed.price[key] = parsedVal;
            }
          }
        })
        
        setRules(parsed)
      } catch (error) {
        console.error('Failed to fetch smart rules:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [])

  return (
    <SmartRulesContext.Provider value={{ rules, loading }}>
      {children}
    </SmartRulesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSmartRules = () => useContext(SmartRulesContext)

