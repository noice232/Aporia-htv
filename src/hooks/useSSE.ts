import { useEffect } from 'react'
import { useProjectStore } from '../stores/projects'
import { connectSSE, disconnect } from '../api/sse'

export function useSSE() {
  const currentId = useProjectStore((s) => s.currentId)

  useEffect(() => {
    if (!currentId) {
      disconnect()
      return
    }
    connectSSE(currentId)
    return () => {
      disconnect()
    }
  }, [currentId])
}
