import { useEffect } from 'react'
import { useSocketStore } from '@/stores/socket.store'

export function useSocket() {
  const connect = useSocketStore((state) => state.connect)
  const disconnect = useSocketStore((state) => state.disconnect)

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])
}

