import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFoodLog } from '../context/FoodLogContext'
import styles from './Scanner.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function Scanner() {
  const navigate = useNavigate()
  const { logMeal } = useFoodLog()
  const fileInputRef = useRef(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [nutrients, setNutrients] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  const [hasAI, setHasAI] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      analyzeImage(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function analyzeImage(imageBase64) {
    setAnalyzing(true)
    setErrorMsg('')
    setHasAI(false)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/meals/analyze-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Analysis failed')
      setMealName(data.foodName || '')
      setNutrients({ calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat })
      setHasAI(true)
    } catch (err) {
      setErrorMsg(err.message || 'Could not analyze image')
    } finally {
      setAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLog() {
    if (!mealName.trim()) return
    setSaving(true)
    await logMeal({
      name: mealName.trim(),
      mealType,
      calories: Number(nutrients.calories) || 0,
      protein: Number(nutrients.protein) || 0,
      carbs: Number(nutrients.carbs) || 0,
      fat: Number(nutrients.fat) || 0,
      servingSize: '1 serving',
    })
    setSaving(false)
    navigate('/')
  }

  function setField(field, val) {
    setNutrients((prev) => ({ ...prev, [field]: val }))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>‹</button>
        <h1 className={styles.title}>Add Meal</h1>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className={styles.scrollContent}>
        {/* ── Take Photo CTA ── */}
        <button
          className={styles.photoCta}
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
        >
          {preview ? (
            <img src={preview} alt="Meal" className={styles.photoPreview} />
          ) : null}

          {/* Overlay: spinner while analyzing, or CTA when no photo */}
          <div className={`${styles.photoOverlay} ${preview && !analyzing ? styles.photoOverlayHover : ''}`}>
            {analyzing ? (
              <>
                <div className={styles.bigSpinner} />
                <span className={styles.photoCtaLabel}>Analysing…</span>
              </>
            ) : (
              <>
                <span className={styles.photoCtaIcon}>📷</span>
                <span className={styles.photoCtaLabel}>
                  {hasAI ? 'Retake Photo' : 'Take Photo'}
                </span>
                {!preview && <span className={styles.photoCtaSub}>AI will estimate nutrition</span>}
              </>
            )}
          </div>
        </button>

        {errorMsg ? (
          <p className={styles.aiError}>⚠️ {errorMsg}</p>
        ) : hasAI ? (
          <p className={styles.aiSuccess}>✓ AI estimates filled in — adjust if needed</p>
        ) : null}

        {/* ── Form (always visible) ── */}
        <div className={styles.addSection}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Meal name</label>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="e.g. Chicken salad"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
          </div>

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

          <div className={styles.editNutrients}>
            <p className={styles.editHint}>
              {hasAI ? 'AI estimates — tap to adjust' : 'Enter nutrition values'}
            </p>
            <div className={styles.editGrid}>
              {[
                { key: 'calories', label: 'Calories', unit: 'kcal' },
                { key: 'protein',  label: 'Protein',  unit: 'g'    },
                { key: 'carbs',    label: 'Carbs',    unit: 'g'    },
                { key: 'fat',      label: 'Fat',      unit: 'g'    },
              ].map(({ key, label, unit }) => (
                <div key={key} className={styles.editField}>
                  <label className={styles.label}>{label}</label>
                  <div className={styles.editInputWrap}>
                    <input
                      type="number"
                      inputMode="numeric"
                      className={styles.editInput}
                      placeholder="0"
                      value={nutrients[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      min={0}
                    />
                    <span className={styles.editUnit}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className={styles.logBtn}
            onClick={handleLog}
            disabled={saving || !mealName.trim()}
          >
            {saving ? 'Saving…' : 'Add to log'}
          </button>
        </div>
      </div>
    </div>
  )
}
