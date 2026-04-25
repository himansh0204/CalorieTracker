import styles from './Skeleton.module.css'

export default function Skeleton({ width, height = '1em', radius = 6, style }) {
  return (
    <div
      className={styles.shimmer}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export function SkeletonMealCard() {
  return (
    <div className={styles.card}>
      <div className={styles.thumb} />
      <div className={styles.cardBody}>
        <div className={styles.shimmer} style={{ width: '55%', height: 13, borderRadius: 6 }} />
        <div className={styles.shimmer} style={{ width: '30%', height: 11, borderRadius: 6, marginTop: 6 }} />
        <div className={styles.shimmer} style={{ width: '70%', height: 9,  borderRadius: 6, marginTop: 5 }} />
      </div>
    </div>
  )
}

export function SkeletonHistoryRow() {
  return (
    <div className={styles.histRow}>
      <div className={styles.histInfo}>
        <div className={styles.shimmer} style={{ width: 56, height: 14, borderRadius: 6 }} />
        <div className={styles.shimmer} style={{ width: 90, height: 11, borderRadius: 6, marginTop: 5 }} />
      </div>
      <div className={styles.shimmer} style={{ width: 70, height: 14, borderRadius: 6 }} />
    </div>
  )
}
