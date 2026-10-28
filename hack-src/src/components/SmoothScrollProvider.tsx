import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cancelFrame, frame } from 'framer-motion'
import { ReactLenis, type LenisRef } from 'lenis/react'
import 'lenis/dist/lenis.css'

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp)
    }

    frame.update(update, true)
    return () => cancelFrame(update)
  }, [reducedMotion])

  if (reducedMotion) return <>{children}</>

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        anchors: true,
        lerp: 0.085,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.2,
      }}
    >
      {children}
    </ReactLenis>
  )
}
