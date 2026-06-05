import { useEffect, useRef, useState } from 'react'
import './ParticleBackground.css'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  parallaxStrength: number
}

const COLORS = [
  'rgba(124, 157, 255, ',  // Blue
  'rgba(139, 92, 246, ',   // Purple
  'rgba(168, 85, 247, ',   // Violet
  'rgba(79, 172, 254, ',   // Cyan
]

const PARTICLE_COUNT = 40

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Initialize particles
    const initParticles = () => {
      const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        parallaxStrength: Math.random() * 0.3 + 0.1
      }))
      particlesRef.current = newParticles
      setParticles(newParticles)
    }

    initParticles()

    // Handle mouse move for parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    // Animation loop using requestAnimationFrame
    const animate = () => {
      const particles = particlesRef.current
      const container = containerRef.current

      if (!container) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      particles.forEach(particle => {
        // Update position with slow drift
        particle.x += particle.vx
        particle.y += particle.vy

        // Parallax effect - gentle response to mouse
        const dx = mouseRef.current.x - particle.x
        const dy = mouseRef.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 200

        if (distance < maxDistance) {
          const factor = (1 - distance / maxDistance) * particle.parallaxStrength
          particle.x -= (dx / distance) * factor
          particle.y -= (dy / distance) * factor
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = window.innerWidth
        if (particle.x > window.innerWidth) particle.x = 0
        if (particle.y < 0) particle.y = window.innerHeight
        if (particle.y > window.innerHeight) particle.y = 0
      })

      // Update DOM using CSS transforms (GPU accelerated)
      const particleElements = container.querySelectorAll('.particle')
      particleElements.forEach((el, i) => {
        const p = particles[i]
        if (p && el instanceof HTMLElement) {
          el.style.transform = `translate(${p.x}px, ${p.y}px)`
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Handle window resize
    const handleResize = () => {
      initParticles()
    }

    document.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div ref={containerRef} className="particle-background">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: `${particle.color}${particle.opacity})`,
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            borderRadius: '50%',
            position: 'absolute',
            willChange: 'transform',
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}${particle.opacity * 0.6})`
          }}
        />
      ))}
    </div>
  )
}
