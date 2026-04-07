import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchFoodByName } from '../services/foodApi'
import { useFoodLog } from '../context/FoodLogContext'
import styles from './Log.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Log() {
  const navigate = useNavigate()
  const { logMeal } = useFoodLog()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [mealType, setMealType] = useState('lunch')
  const [servings, setServings] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const debounceRef = useRef(null)

  const handleSearch = useCallback((val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchFoodByName(val)
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }, [])

  function selectFood(food) {
    setSelected(food)
    setServings(1)
  }

  function calcNutrients(food, s) {
    const factor = (food.servingSize * s) / 100
    return {
      calories: Math.round(food.per100g.calories * factor),
      protein: +(food.per100g.protein * factor).toFixed(1),
      carbs: +(food.per100g.carbs * factor).toFixed(1),
      fat: +(food.per100g.fat * factor).toFixed(1),
    }
  }

  async function handleLog() {
    if (!selected) return
    setSaving(true)
    setSaveError('')
    try {
      const nutrients = calcNutrients(selected, servings)
      await logMeal({
        name: selected.name,
        brand: selected.brand,
        mealType,
        ...nutrients,
      })
      navigate('/')
    } catch {
      setSaveError('Could not save meal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const computed = selected ? calcNutrients(selected, servings) : null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>‹</button>
        <h1 className={styles.title}>Log a meal</h1>
      </header>

      {!selected ? (
        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search foods…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {searching && <span className={styles.spinner} />}
          </div>

          {results.length > 0 && (
            <ul className={styles.results}>
              {results.map((food, i) => (
                <li key={food.barcode || i} className={styles.resultItem} onClick={() => selectFood(food)}>
                  {food.imageUrl && <img src={food.imageUrl} alt="" className={styles.thumb} />}
                  <div className={styles.resultInfo}>
                    <span className={styles.resultName}>{food.name}</span>
                    {food.brand && <span className={styles.resultBrand}>{food.brand}</span>}
                    <span className={styles.resultCal}>
                      {Math.round(food.per100g.calories)} kcal / 100g
                    </span>
                  </div>
                  <span className={styles.resultArrow}>›</span>
                </li>
              ))}
            </ul>
          )}

          {!searching && query && results.length === 0 && (
            <p className={styles.noResults}>No results for "{query}"</p>
          )}
        </div>
      ) : (
        <div className={styles.addSection}>
          <div className={styles.foodPill}>
            {selected.imageUrl && <img src={selected.imageUrl} alt="" className={styles.foodImg} />}
            <div>
              <p className={styles.foodName}>{selected.name}</p>
              {selected.brand && <p className={styles.foodBrand}>{selected.brand}</p>}
            </div>
            <button className={styles.changeBtn} onClick={() => setSelected(null)}>Change</button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Meal type</label>
            <div className={styles.mealTypes}>
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  className={`${styles.typeBtn} ${mealType === t ? styles.active : ''}`}
                  onClick={() => setMealType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Servings
              <span className={styles.servingInfo}>
                (1 serving = {selected.servingSize}{selected.servingUnit})
              </span>
            </label>
            <div className={styles.servingRow}>
              <button onClick={() => setServings((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}>−</button>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={servings}
                onChange={(e) => setServings(Math.max(0.5, parseFloat(e.target.value) || 1))}
                className={styles.servingInput}
              />
              <button onClick={() => setServings((s) => +(s + 0.5).toFixed(1))}>+</button>
            </div>
          </div>

          {computed && (
            <div className={styles.nutrientPreview}>
              <NutrientPill label="Calories" value={computed.calories} unit="kcal" highlight />
              <NutrientPill label="Protein" value={computed.protein} unit="g" />
              <NutrientPill label="Carbs" value={computed.carbs} unit="g" />
              <NutrientPill label="Fat" value={computed.fat} unit="g" />
            </div>
          )}

          <button className={styles.logBtn} onClick={handleLog} disabled={saving}>
            {saving ? 'Saving…' : 'Add to log'}
          </button>
          {saveError && (
            <div className={styles.errorToast} role="alert">
              <span>{saveError}</span>
              <button type="button" onClick={() => setSaveError('')} aria-label="Dismiss error">✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NutrientPill({ label, value, unit, highlight }) {
  return (
    <div className={`${styles.pill} ${highlight ? styles.pillHighlight : ''}`}>
      <span className={styles.pillVal}>{value}</span>
      <span className={styles.pillUnit}>{unit}</span>
      <span className={styles.pillLabel}>{label}</span>
    </div>
  )
}
