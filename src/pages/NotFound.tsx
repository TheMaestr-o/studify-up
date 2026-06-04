import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft } from 'lucide-react'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center'
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)' }}><Search size={64} strokeWidth={1.3} /></div>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Page not found</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
        This page doesn't exist or the link has expired.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#4255FF', color: '#fff', border: 'none',
          borderRadius: 24, padding: '12px 28px', fontSize: 15,
          fontWeight: 600, cursor: 'pointer', marginTop: 8
        }}
      >
        <ChevronLeft size={14} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 2 }} /> Back home
      </button>
    </div>
  )
}
