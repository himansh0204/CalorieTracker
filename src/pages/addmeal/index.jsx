import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFoodLog } from '../../context/FoodLogContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import { IconAdd } from '../../components/icons'
import styles from './addmeal.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function AddMeal() {
  const navigate = useNavigate()
  const { logMeal } = useFoodLog()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [nutrients, setNutrients] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  const [hasAI, setHasAI] = useState(false)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      compressImage(ev.target.result, (compressed) => {
        setPreview(compressed)
        analyzeImage(compressed)
      })
    }
    reader.readAsDataURL(file)
  }

  function compressImage(dataUrl, callback, maxPx = 1920, quality = 0.85) {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      callback(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  }

  async function analyzeImage(imageBase64) {
    setAnalyzing(true)
    setHasAI(false)
    try {
      const res = await fetch(`${API_BASE}/meals/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageBase64 }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Analysis failed')
      setMealName(data.foodName || '')
      setNutrients({ calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat })
      setHasAI(true)
      showToast('AI estimates filled in — adjust if needed')
    } catch (err) {
      showToast(err.message || 'Could not analyze image', { type: 'error' })
    } finally {
      setAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLog() {
    if (!mealName.trim()) return
    setSaving(true)
    try {
      await logMeal({
        name: mealName.trim(),
        mealType,
        calories: Number(nutrients.calories) || 0,
        protein:  Number(nutrients.protein)  || 0,
        carbs:    Number(nutrients.carbs)    || 0,
        fat:      Number(nutrients.fat)      || 0,
        servingSize: '1 serving',
      })
      showToast('Meal added to log')
      navigate('/')
    } catch (err) {
      showToast(err.message || 'Failed to save meal', { type: 'error' })
      setSaving(false)
    }
  }

  function setField(field, val) {
    setNutrients((prev) => ({ ...prev, [field]: val }))
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Add Meal" icon={IconAdd} showBack />

      <div className={styles.scrollContent}>
        <label className={`${styles.photoCta} ${analyzing ? styles.photoCtaDisabled : ''}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={analyzing}
          />

          {preview ? <img src={preview} alt="Meal" className={styles.photoPreview} /> : null}

          <div className={`${styles.photoOverlay} ${preview && !analyzing ? styles.photoOverlayHover : ''}`}>
            {analyzing ? (
              <>
                <div className={styles.bigSpinner} />
                <span className={styles.photoCtaLabel}>Analysing…</span>
              </>
            ) : (
              <>
                <span className={styles.photoCtaIcon}>📷</span>
                <span className={styles.photoCtaLabel}>{hasAI ? 'Retake Photo' : 'Take Photo'}</span>
                {!preview && <span className={styles.photoCtaSub}>AI will estimate nutrition</span>}
              </>
            )}
          </div>
        </label>


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
            <div className={styles.mealTypeRow}>
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  className={`${styles.mealTypePill} ${mealType === t ? styles.mealTypePillActive : ''}`}
                  onClick={() => setMealType(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <p className={styles.editHint}>
            {hasAI ? 'AI estimates — tap to adjust' : 'Enter nutrition values'}
          </p>

          <div className={styles.editNutrients}>
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
