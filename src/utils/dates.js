export function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function localYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateStr(d)
}
