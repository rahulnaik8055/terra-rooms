"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
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

/* Module-level socket singleton — survives component unmount/remount */
let sharedSocket: Socket | null = null;
let sharedSocketUserId: string | null = null;
let sharedConnectListeners = new Set<() => void>();
let sharedDisconnectListeners = new Set<() => void>();

function getOrCreateSocket(userId: string | null): Socket | null {
  if (!userId) {
    if (sharedSocket) {
      sharedSocket.disconnect();
      sharedSocket = null;
      sharedSocketUserId = null;
    }
    return null;
  }

  if (sharedSocket && sharedSocketUserId === userId) {
    return sharedSocket;
  }

  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  sharedSocketUserId = userId;
  sharedSocket = io({
    path: "/api/socket",
    withCredentials: true,
  });

  sharedSocket.on("connect", () => {
    sharedConnectListeners.forEach((fn) => fn());
  });

  sharedSocket.on("disconnect", () => {
    sharedDisconnectListeners.forEach((fn) => fn());
  });

  return sharedSocket;
}

export function SocketProvider({ user, children }: SocketProviderProps) {
  const userId = user?.id ?? null;
  const [connected, setConnected] = useState(false);

  const socket = getOrCreateSocket(userId);

  useEffect(() => {
    const onConnect = () => { setConnected(true); };
    const onDisconnect = () => { setConnected(false); };

    sharedConnectListeners.add(onConnect);
    sharedDisconnectListeners.add(onDisconnect);

    if (socket?.connected) {
      setConnected(true);
    }

    return () => {
      sharedConnectListeners.delete(onConnect);
      sharedDisconnectListeners.delete(onDisconnect);
    };
  }, [userId, socket]);

  const emitActivity = useCallback(
    (roomId: string, payload: ActivityPayload) => {
      sharedSocket?.emit("room:activity", {
        roomId,
        action: payload.action,
        details: payload.details,
      });
    },
    []
  );

  const emitStatus = useCallback(
    (roomId: string, status: string) => {
      sharedSocket?.emit("room:status", { roomId, status });
    },
    []
  );

  const value = useMemo(
    () => ({
      socket,
      connected,
      emitActivity,
      emitStatus,
    }),
    [socket, connected, emitActivity, emitStatus]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
