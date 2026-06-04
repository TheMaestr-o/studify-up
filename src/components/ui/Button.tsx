import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'cta' | 'ghost'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    />
  )
}
