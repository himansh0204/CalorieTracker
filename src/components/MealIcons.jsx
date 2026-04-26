const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function BreakfastIcon({ size = 20 }) {
  return (
    <svg {...iconProps} width={size} height={size} viewBox="0 0 24 24">
      <path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"/>
      <path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"/>
      <path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"/>
      <path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"/>
      <rect width="20" height="4" x="2" y="11" rx="1"/>
    </svg>
  )
}

export function LunchIcon({ size = 20 }) {
  return (
    <svg {...iconProps} width={size} height={size} viewBox="0 0 24 24">
      <path d="M2 12h20"/>
      <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/>
      <path d="m4 8 16-4"/>
      <path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>
    </svg>
  )
}

export function SnackIcon({ size = 20 }) {
  return (
    <svg {...iconProps} width={size} height={size} viewBox="0 0 24 24">
      <path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4"/>
      <path d="M10 22 9 8"/>
      <path d="m14 22 1-14"/>
      <path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z"/>
    </svg>
  )
}

export function DinnerIcon({ size = 20 }) {
  return (
    <svg {...iconProps} width={size} height={size} viewBox="0 0 24 24">
      <path d="M2 12h20"/>
      <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/>
      <path d="m4 8 16-4"/>
      <path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>
    </svg>
  )
}

export function getMealIcon(mealType, size = 20) {
  switch (mealType) {
    case 'breakfast': return <BreakfastIcon size={size} />
    case 'lunch':     return <LunchIcon size={size} />
    case 'snack':     return <SnackIcon size={size} />
    case 'dinner':    return <DinnerIcon size={size} />
    default:          return <LunchIcon size={size} />
  }
}
