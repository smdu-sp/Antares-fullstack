/** @format */

"use client";

import { Loader2 } from "lucide-react";
import { useGrupoAtivoLoading } from "./grupo-ativo-loading-context";

export function GrupoAtivoLoadingOverlay() {
  const { trocando } = useGrupoAtivoLoading();

  if (!trocando) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-5 shadow-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium">Trocando grupo ativo...</p>
      </div>
    </div>
  );
}
