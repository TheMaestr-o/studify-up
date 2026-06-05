import { useEffect, useRef, useState } from 'react'
import './CustomCursor.css'

interface CursorPosition {
  x: number
  y: number
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef<CursorPosition>({ x: 0, y: 0 })
  const targetRef = useRef<CursorPosition>({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    // Check if touch device
    const checkMobile = () => {
      const isTouchDevice = () => {
        return (
          (navigator.maxTouchPoints > 0) ||
          ((navigator as any).msMaxTouchPoints > 0)
        )
      }
      setIsMobile(isTouchDevice())
    }

    checkMobile()

    if (isMobile) return

    // Hide default cursor
    document.body.style.cursor = 'none'

    // Smooth cursor tracking with ease-out animation
    const animate = () => {
      const dx = targetRef.current.x - positionRef.current.x
      const dy = targetRef.current.y - positionRef.current.y

      // Ease-out factor (lower = more lag, smoother feel)
      const easeOut = 0.15

      positionRef.current.x += dx * easeOut
      positionRef.current.y += dy * easeOut

      if (cursorRef.current) {
        cursorRef.current.style.left = `${positionRef.current.x}px`
        cursorRef.current.style.top = `${positionRef.current.y}px`
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX - 30 // Center cursor (60px / 2)
      targetRef.current.y = e.clientY - 30
    }

    // Handle interactive element hover
    const handleMouseEnter = (e: Element) => {
      if (
        e.tagName === 'A' ||
        e.tagName === 'BUTTON' ||
        e.classList.contains('cursor-grow') ||
        (e as HTMLElement).closest('a, button, [data-cursor-grow]')
      ) {
        setIsHovering(true)
      }
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    // Add event listeners to all interactive elements
    const setupCursorTracking = () => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], input, textarea, select, [data-cursor-grow]'
      )

      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => handleMouseEnter(el))
        el.addEventListener('mouseleave', handleMouseLeave)
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    setupCursorTracking()

    // Rerun cursor tracking setup on DOM changes
    const observer = new MutationObserver(() => {
      setupCursorTracking()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-cursor-grow']
    })

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.body.style.cursor = 'auto'
      observer.disconnect()
    }
  }, [isMobile])

  // Render only on desktop
  if (isMobile) return null

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${isHovering ? 'hovering' : ''}`}
    >
      <div className="cursor-dot" />
      <div className="cursor-glow" />
    </div>
  )
}
