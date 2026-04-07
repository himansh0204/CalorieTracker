import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFoodByBarcode } from '../services/foodApi'
import { useFoodLog } from '../context/FoodLogContext'
import styles from './Scanner.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Scanner() {
  const navigate = useNavigate()
  const { logMeal } = useFoodLog()
  const videoRef = useRef(null)
  const readerRef = useRef(null)

  const [status, setStatus] = useState('init') // init | scanning | found | notfound | error
  const [food, setFood] = useState(null)
  const [servings, setServings] = useState(1)
  const [mealType, setMealType] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [camError, setCamError] = useState('')

  useEffect(() => {
    let mounted = true

    async function initScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library')
        if (!mounted) return

        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader
        setStatus('scanning')

        reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          async (result) => {
            if (!result) return
            reader.reset()
            const barcode = result.getText()
            setStatus('loading')
            try {
              const product = await getFoodByBarcode(barcode)
              if (product) {
                setFood(product)
                setStatus('found')
              } else {
                setStatus('notfound')
              }
            } catch {
              setStatus('error')
            }
          }
        ).catch((e) => {
          setCamError(e.message || 'Camera access denied')
          setStatus('error')
        })
      } catch {
        setCamError('Unable to load scanner library')
        setStatus('error')
      }
    }

    initScanner()

    return () => {
      mounted = false
      readerRef.current?.reset()
    }
  }, [])

  function rescan() {
    setFood(null)
    setStatus('init')
    // Remount by navigating away and back
    navigate('/scanner', { replace: true })
  }

  function calcNutrients() {
    if (!food) return null
    const factor = (food.servingSize * servings) / 100
    return {
      calories: Math.round(food.per100g.calories * factor),
      protein: +(food.per100g.protein * factor).toFixed(1),
      carbs: +(food.per100g.carbs * factor).toFixed(1),
      fat: +(food.per100g.fat * factor).toFixed(1),
    }
  }

  async function handleLog() {
    if (!food) return
    setSaving(true)
    const n = calcNutrients()
    await logMeal({ name: food.name, brand: food.brand, mealType, ...n })
    setSaving(false)
    navigate('/')
  }

  const computed = calcNutrients()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>‹</button>
        <h1 className={styles.title}>Barcode Scanner</h1>
      </header>

      <div className={styles.viewfinder}>
        <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
        {status === 'scanning' && (
          <>
            <div className={styles.overlay} />
            <div className={styles.scanFrame}>
              <div className={styles.corner} data-pos="tl" />
              <div className={styles.corner} data-pos="tr" />
              <div className={styles.corner} data-pos="bl" />
              <div className={styles.corner} data-pos="br" />
              <div className={styles.scanLine} />
            </div>
            <p className={styles.hint}>Point at a product barcode</p>
          </>
        )}
        {status === 'loading' && (
          <div className={styles.statusOverlay}>
            <div className={styles.bigSpinner} />
            <p>Looking up product…</p>
          </div>
        )}
        {status === 'notfound' && (
          <div className={styles.statusOverlay}>
            <span className={styles.statusIcon}>😕</span>
            <p>Product not found in database</p>
            <button className={styles.retryBtn} onClick={rescan}>Try again</button>
          </div>
        )}
        {status === 'error' && (
          <div className={styles.statusOverlay}>
            <span className={styles.statusIcon}>📷</span>
            <p>{camError || 'Something went wrong'}</p>
            <button className={styles.retryBtn} onClick={rescan}>Retry</button>
          </div>
        )}
      </div>

      {status === 'found' && food && (
        <div className={styles.addSection}>
          <div className={styles.foodPill}>
            {food.imageUrl && <img src={food.imageUrl} alt="" className={styles.foodImg} />}
            <div className={styles.foodMeta}>
              <p className={styles.foodName}>{food.name}</p>
              {food.brand && <p className={styles.foodBrand}>{food.brand}</p>}
            </div>
            <button className={styles.rescan} onClick={rescan}>Rescan</button>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Meal</label>
              <select
                className={styles.select}
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Servings</label>
              <div className={styles.servingRow}>
                <button onClick={() => setServings((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}>−</button>
                <span className={styles.servingVal}>{servings}</span>
                <button onClick={() => setServings((s) => +(s + 0.5).toFixed(1))}>+</button>
              </div>
            </div>
          </div>

          {computed && (
            <div className={styles.nutrients}>
              <div className={styles.calBig}>{computed.calories} <span>kcal</span></div>
              <div className={styles.macroRow}>
                <span>P {computed.protein}g</span>
                <span>C {computed.carbs}g</span>
                <span>F {computed.fat}g</span>
              </div>
            </div>
          )}

          <button className={styles.logBtn} onClick={handleLog} disabled={saving}>
            {saving ? 'Saving…' : 'Add to log'}
          </button>
        </div>
      )}
    </div>
  )
}
