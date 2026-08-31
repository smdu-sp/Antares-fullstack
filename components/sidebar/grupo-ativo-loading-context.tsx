/** @format */

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface GrupoAtivoLoadingContextValue {
  trocando: boolean;
  setTrocando: (value: boolean) => void;
}

const GrupoAtivoLoadingContext =
  createContext<GrupoAtivoLoadingContextValue | null>(null);

export function GrupoAtivoLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [trocando, setTrocando] = useState(false);

  return (
    <GrupoAtivoLoadingContext.Provider value={{ trocando, setTrocando }}>
      {children}
    </GrupoAtivoLoadingContext.Provider>
  );
}

export function useGrupoAtivoLoading() {
  const ctx = useContext(GrupoAtivoLoadingContext);
  if (!ctx) {
    throw new Error(
      "useGrupoAtivoLoading deve ser usado dentro de GrupoAtivoLoadingProvider",
    );
  }
  return ctx;
}
