import styles from './Skeleton.module.css'

interface Props {
  width?: string
  height?: string
  borderRadius?: string
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '6px' }: Props) {
  return <div className={styles.skeleton} style={{ width, height, borderRadius }} />
}
