/**
 * Socket.IO Hook
 * Real-time communication with backend
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  IScrapeProgressEvent,
  IScrapeCompleteEvent,
  IScrapeErrorEvent,
} from '../types/scraper';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SocketEventHandlers {
  onProgress?: (event: IScrapeProgressEvent) => void;
  onComplete?: (event: IScrapeCompleteEvent) => void;
  onError?: (event: IScrapeErrorEvent) => void;
}

export const useSocket = (handlers: SocketEventHandlers) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Scraper events
    if (handlers.onProgress) {
      socket.on('scrape:progress', handlers.onProgress);
    }

    if (handlers.onComplete) {
      socket.on('scrape:complete', handlers.onComplete);
    }

    if (handlers.onError) {
      socket.on('scrape:error', handlers.onError);
    }

    // Cleanup
    return () => {
      socket.off('scrape:progress');
      socket.off('scrape:complete');
      socket.off('scrape:error');
      socket.close();
    };
  }, [handlers.onProgress, handlers.onComplete, handlers.onError]);

  const joinJobRoom = (jobId: string) => {
    socketRef.current?.emit('scrape:join', jobId);
  };

  const leaveJobRoom = (jobId: string) => {
    socketRef.current?.emit('scrape:leave', jobId);
  };

  const subscribeToSession = (sessionId: string) => {
    socketRef.current?.emit('scrape:subscribe:session', sessionId);
  };

  const unsubscribeFromSession = (sessionId: string) => {
    socketRef.current?.emit('scrape:unsubscribe:session', sessionId);
  };

  return {
    socket: socketRef.current,
    joinJobRoom,
    leaveJobRoom,
    subscribeToSession,
    unsubscribeFromSession,
  };
};

