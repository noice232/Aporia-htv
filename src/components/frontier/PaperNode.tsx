import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { GraphNode } from '../../stores/graph'

interface PaperNodeProps {
  node: GraphNode
  isSelected: boolean
  isHovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function PaperNode({ node, isSelected, isHovered, onSelect, onHover }: PaperNodeProps) {
  const meshRef = useRef<Mesh>(null)
  const [pulse, setPulse] = useState(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    setPulse((p) => (p + delta * 2) % (Math.PI * 2))

    const targetScale = isSelected ? 1.8 : isHovered ? 1.4 : 1.0
    const s = meshRef.current.scale.x
    const next = s + (targetScale - s) * Math.min(delta * 8, 1)
    meshRef.current.scale.setScalar(next)
  })

  const baseEmissive = isSelected ? 2.5 : isHovered ? 1.5 : 0.4 + Math.sin(pulse) * 0.15

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id) }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(node.id) }}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[node.size, 24, 24]} />
      <meshStandardMaterial
        color={node.color}
        emissive={node.color}
        emissiveIntensity={baseEmissive}
        transparent
        opacity={isSelected || isHovered ? 1 : 0.85}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}
