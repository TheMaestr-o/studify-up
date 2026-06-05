import { useEffect, useRef } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number | number[]
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
) {
  const ref = useRef<HTMLDivElement | null>(null)
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true
  } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('animate-in')
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          element.classList.remove('animate-in')
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return ref
}
