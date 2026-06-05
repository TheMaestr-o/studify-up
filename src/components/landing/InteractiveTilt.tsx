import { useEffect, useRef, useState } from 'react'
import './InteractiveTilt.css'

interface TiltProps {
  children: React.ReactNode
  className?: string
  scale?: number
  speed?: number
}

export function InteractiveTilt({ children, className = '', scale = 1.05, speed = 500 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const rotationX = ((e.clientY - centerY) / (rect.height / 2)) * 15
      const rotationY = ((e.clientX - centerX) / (rect.width / 2)) * -15

      setRotation({ x: rotationX, y: rotationY })
    }

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 })
      setIsHovering(false)
    }

    const handleMouseEnter = () => {
      setIsHovering(true)
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`interactive-tilt ${className}`}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d' as any,
        transform: isHovering
          ? `
            rotateX(${rotation.x}deg)
            rotateY(${rotation.y}deg)
            scale(${scale})
          `
          : 'rotateX(0) rotateY(0) scale(1)',
        transition: isHovering ? 'none' : `transform ${speed}ms cubic-bezier(0.23, 1, 0.320, 1)`,
      }}
    >
      <div className="tilt-inner" style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>

      {/* Glow effect that moves with tilt */}
      <div
        className="tilt-glow"
        style={{
          transform: isHovering
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
            : 'rotateX(0) rotateY(0)',
          opacity: isHovering ? 1 : 0,
          transition: isHovering ? 'none' : 'opacity 300ms ease'
        }}
      />
    </div>
  )
}
