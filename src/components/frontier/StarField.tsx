import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, AdditiveBlending } from 'three'
import type { Points } from 'three'

export function StarField({ count = 2000 }: { count?: number }) {
  const ref = useRef<Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200
      sizes[i] = Math.random() * 0.5 + 0.1
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geo.setAttribute('size', new Float32BufferAttribute(sizes, 1))
    return geo
  }, [count])

  const material = useMemo(() => new PointsMaterial({
    color: 0x667799,
    size: 0.15,
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), [])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.003
      ref.current.rotation.x += delta * 0.001
    }
  })

  return <points ref={ref} geometry={geometry} material={material} />
}
