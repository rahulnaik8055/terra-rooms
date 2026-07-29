"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface ActivityPayload {
  action: string;
  details?: Record<string, unknown>;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  emitActivity: (roomId: string, payload: ActivityPayload) => void;
  emitStatus: (roomId: string, status: string) => void;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  user: { id: string } | null;
  children: React.ReactNode;
}

export function SocketProvider({ user, children }: SocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io({
      path: "/api/socket",
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const emitActivity = useCallback(
    (roomId: string, payload: ActivityPayload) => {
      socketRef.current?.emit("room:activity", {
        roomId,
        action: payload.action,
        details: payload.details,
      });
    },
    []
  );

  const emitStatus = useCallback(
    (roomId: string, status: string) => {
      socketRef.current?.emit("room:status", { roomId, status });
    },
    []
  );

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      emitActivity,
      emitStatus,
    }),
    [connected, emitActivity, emitStatus]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
