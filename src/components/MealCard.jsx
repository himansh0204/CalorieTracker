import { useState } from 'react'
import { useFoodLog } from '../context/FoodLogContext'
import { useToast } from '../context/ToastContext'
import styles from './MealCard.module.css'
import { CalorieIcon, ProteinIcon, CarbsIcon, FatIcon } from './NutrientIcons'
import { getMealIcon } from './MealIcons'

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MealCard({ meal }) {
  const { updateMeal, scheduleRemoveMeal, undoRemoveMeal } = useFoodLog()
  const { showToast } = useToast()
  const name = meal.food_name || meal.name || 'Meal'

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(key, val) {
    if (key !== 'name' && val !== '') {
      const n = Number(val)
      if (n < 0) return
      const max = key === 'calories' ? 9999 : 999
      if (n > max) return
    }
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast('Please enter a meal name', { type: 'error' })
      return
    }
    if (Number(form.calories) < 0 || Number(form.protein) < 0 || Number(form.carbs) < 0 || Number(form.fat) < 0) {
      showToast('Please enter correct values — no negatives', { type: 'error' })
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateMeal(meal.id, {
        foodName: form.name.trim(),
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      })
      setEditing(false)
      showToast('Changes saved')
    } catch (e) {
      setError(e.message || 'Failed to save')
      showToast(e.message || 'Failed to save changes', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    setEditing(false)
    scheduleRemoveMeal(meal.id)
    showToast('Meal deleted', {
      type: 'info',
      duration: 4000,
      undoFn: () => undoRemoveMeal(meal.id),
    })
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.thumb}>
          <span className={styles.thumbEmoji}>{getMealIcon(meal.meal_type || meal.mealType)}</span>
        </div>

        <div className={styles.info}>
          <div className={styles.topRow}>
            <span className={styles.name}>{name}</span>
            {meal.logged_at && (
              <span className={styles.time}>{timeAgo(meal.logged_at)}</span>
            )}
          </div>
          <div className={styles.calRow}>
            <span className={styles.calFire}><CalorieIcon /></span>
            <span className={styles.calories}>{Math.round(meal.calories)} kcal</span>
          </div>
          <div className={styles.macros}>
            <span><ProteinIcon /> {Math.round(meal.protein)}g</span>
            <span className={styles.macroDivider}>|</span>
            <span><CarbsIcon /> {Math.round(meal.carbs)}g</span>
            <span className={styles.macroDivider}>|</span>
            <span><FatIcon /> {Math.round(meal.fat)}g</span>
          </div>
        </div>

        <button
          className={styles.editBtn}
          onClick={() => setEditing(true)}
          aria-label="Edit meal"
        >···</button>
      </div>

      {editing && (
        <div className={styles.backdrop} onClick={() => setEditing(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHandle} />

            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Edit Meal</h2>
              <button className={styles.sheetClose} onClick={() => setEditing(false)}>✕</button>
            </div>

            <div className={styles.sheetBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Meal name</label>
                <input
                  className={styles.nameInput}
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="Meal name"
                  autoFocus
                />
              </div>

              <div className={styles.nutriGrid}>
                {[
                  { key: 'calories', label: 'Calories', unit: 'kcal' },
                  { key: 'protein',  label: 'Protein',  unit: 'g' },
                  { key: 'carbs',    label: 'Carbs',    unit: 'g' },
                  { key: 'fat',      label: 'Fat',      unit: 'g' },
                ].map(({ key, label, unit }) => (
                  <div key={key} className={styles.nutriField}>
                    <label className={styles.fieldLabel}>{label}</label>
                    <div className={styles.inputWrap}>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={styles.nutriInput}
                        value={form[key]}
                        onChange={e => setField(key, e.target.value)}
                        min={0}
                      />
                      <span className={styles.unit}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

              <div className={styles.actionRow}>
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                >
                  {saving ? 'Saving…' : 'Edit'}
                </button>
                <button className={styles.deleteBtn} onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
