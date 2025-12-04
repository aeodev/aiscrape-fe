import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { SOCKET_SERVER, SocketScrapeEvents } from '@/utils/api.routes'
import { getOrCreateSessionId } from '@/utils/session'
import { useScraperStore } from './scraper.store'
import type { IScrapeProgressEvent, IScrapeCompleteEvent, IScrapeErrorEvent, IScrapeActionEvent } from '@/types/scraper'

type SocketState = {
  socket: Socket | null
  connected: boolean
  connecting: boolean
  error: string | null
}

type SocketActions = {
  connect: () => void
  disconnect: () => void
  joinJobRoom: (jobId: string) => void
  leaveJobRoom: (jobId: string) => void
  subscribeToSession: (sessionId: string) => void
}

type SocketStore = SocketState & SocketActions

export const useSocketStore = create<SocketStore>((set) => {
  let socketInstance: Socket | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventHandlers: Map<string, (...args: any[]) => void> = new Map()

  const registerScrapeHandlers = (socket: Socket) => {
    const handleProgress = (event: IScrapeProgressEvent) => {
      const store = useScraperStore.getState()
      const currentJob = store.currentJob
      if (!currentJob || currentJob._id !== event.jobId) {
        store.setPendingProgress({
          jobId: event.jobId,
          progress: event.progress,
          message: event.message,
          status: event.status,
        })
      }
      store.updateJobProgress(event)
    }

    const handleComplete = async (event: IScrapeCompleteEvent) => {
      const store = useScraperStore.getState()
      store.clearPendingActions()
      if (event.jobId) {
        store.clearActions(event.jobId)
        const job = await store.fetchJob(event.jobId)
        if (job) {
          store.updateJob(event.jobId, job)
        }
      }
    }

    const handleError = (event: IScrapeErrorEvent) => {
      const store = useScraperStore.getState()
      store.setError(event.error)
      store.clearPendingActions()
      if (event.jobId) {
        store.clearActions(event.jobId)
      }
    }

    const handleAction = (event: IScrapeActionEvent) => {
      const store = useScraperStore.getState()
      const currentJob = store.currentJob
      if (!currentJob || store.loading.creating) {
        store.addPendingAction(event)
      }
      store.addAction(event.jobId, event)
    }

    socket.on(SocketScrapeEvents.PROGRESS, handleProgress)
    socket.on(SocketScrapeEvents.COMPLETE, handleComplete)
    socket.on(SocketScrapeEvents.ERROR, handleError)
    socket.on(SocketScrapeEvents.ACTION, handleAction)

    eventHandlers.set(SocketScrapeEvents.PROGRESS, handleProgress)
    eventHandlers.set(SocketScrapeEvents.COMPLETE, handleComplete)
    eventHandlers.set(SocketScrapeEvents.ERROR, handleError)
    eventHandlers.set(SocketScrapeEvents.ACTION, handleAction)
  }

  const connect = () => {
    if (socketInstance) {
      eventHandlers.forEach((handler, event) => {
        socketInstance!.off(event, handler)
      })
      eventHandlers.clear()
      socketInstance.disconnect()
      socketInstance = null
      set({ socket: null, connected: false, connecting: false, error: null })
    }

    set({ connecting: true, error: null })

    socketInstance = io(SOCKET_SERVER, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    const handleConnect = () => {
      set({ connected: true, connecting: false, error: null })
      const sessionId = getOrCreateSessionId()
      socketInstance?.emit(SocketScrapeEvents.SUBSCRIBE_SESSION, sessionId)
    }

    const handleDisconnect = () => {
      set({ connected: false, connecting: false })
    }

    const handleConnectError = (error: Error) => {
      set({ error: error.message, connecting: false, connected: false })
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('connect_error', handleConnectError)

    eventHandlers.set('connect', handleConnect)
    eventHandlers.set('disconnect', handleDisconnect)
    eventHandlers.set('connect_error', handleConnectError)

    registerScrapeHandlers(socketInstance)
    set({ socket: socketInstance })
  }

  const disconnect = () => {
    if (socketInstance) {
      eventHandlers.forEach((handler, event) => {
        socketInstance!.off(event, handler)
      })
      eventHandlers.clear()
      socketInstance.disconnect()
      socketInstance = null
      set({ socket: null, connected: false, connecting: false, error: null })
    }
  }

  const joinJobRoom = (jobId: string) => {
    socketInstance?.emit(SocketScrapeEvents.JOIN, jobId)
  }

  const leaveJobRoom = (jobId: string) => {
    socketInstance?.emit(SocketScrapeEvents.LEAVE, jobId)
  }

  const subscribeToSession = (sessionId: string) => {
    socketInstance?.emit(SocketScrapeEvents.SUBSCRIBE_SESSION, sessionId)
  }

  return {
    socket: null,
    connected: false,
    connecting: false,
    error: null,
    connect,
    disconnect,
    joinJobRoom,
    leaveJobRoom,
    subscribeToSession,
  }
})

