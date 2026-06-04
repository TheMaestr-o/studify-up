import styles from './Toggle.module.css'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <label className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles.on : ''}`}
        onClick={() => onChange(!checked)}
      />
    </label>
  )
}
