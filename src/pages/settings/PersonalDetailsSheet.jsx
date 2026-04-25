import Sheet from './Sheet'
import sheetStyles from './Sheet.module.css'
import { ACTIVITY_LABELS } from './settingsConstants'

function DetailRow({ label, value }) {
  return (
    <div className={sheetStyles.detailRow}>
      <span className={sheetStyles.detailLabel}>{label}</span>
      <span className={sheetStyles.detailValue}>{value || '—'}</span>
    </div>
  )
}

export default function PersonalDetailsSheet({ user, settings, onClose, onEdit }) {
  return (
    <Sheet onClose={onClose} title="Personal Details">
      <div className={sheetStyles.pad}>
        <div className={sheetStyles.detailsList}>
          <DetailRow label="Name"           value={user?.name} />
          <DetailRow label="Email"          value={user?.email} />
          <DetailRow label="Age"            value={settings.age ? `${settings.age} years` : null} />
          <DetailRow label="Gender"         value={settings.gender ? settings.gender.charAt(0).toUpperCase() + settings.gender.slice(1) : null} />
          <DetailRow label="Weight"         value={settings.weightKg ? `${settings.weightKg} kg` : null} />
          <DetailRow label="Height"         value={settings.heightCm ? `${settings.heightCm} cm` : null} />
          <DetailRow label="Goal Weight"    value={settings.goalWeightKg ? `${settings.goalWeightKg} kg` : null} />
          <DetailRow label="Activity Level" value={ACTIVITY_LABELS[settings.activityLevel]} />
        </div>
        <button className={sheetStyles.primaryBtn} onClick={onEdit}>
          Edit Details
        </button>
      </div>
    </Sheet>
  )
}
