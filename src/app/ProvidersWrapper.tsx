"use client";

import { useAuth } from "@/hooks/useAuth";
import { SocketProvider } from "@/providers/SocketProvider";

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <SocketProvider user={user}>{children}</SocketProvider>;
}
