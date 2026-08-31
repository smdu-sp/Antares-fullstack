/** @format */

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { atualizarGrupoAtivo } from "@/services/grupo-ativo";
import { useGrupoAtivoLoading } from "./grupo-ativo-loading-context";

export default function GrupoAtivoSelector() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const { setTrocando } = useGrupoAtivoLoading();
  const [selected, setSelected] = useState<string>(
    session?.grupoAtivo?.id || "",
  );

  useEffect(() => {
    setTrocando(isPending);
  }, [isPending, setTrocando]);

  const grupos = useMemo(() => {
    const disponiveis = session?.grupoAtivo?.gruposDisponiveis || [];
    return disponiveis;
  }, [session?.grupoAtivo?.gruposDisponiveis]);

  useEffect(() => {
    if (session?.grupoAtivo?.id) {
      setSelected(session.grupoAtivo.id);
      return;
    }

    // Evita deadlock quando há apenas um grupo disponível e nenhum grupo ativo selecionado.
    if (!session?.access_token || grupos.length !== 1 || isPending) return;

    const unicoGrupoId = grupos[0]?.id;
    if (!unicoGrupoId) return;

    startTransition(async () => {
      const resp = await atualizarGrupoAtivo(
        session.access_token,
        unicoGrupoId,
      );
      if (!resp.ok || !resp.data) return;

      setSelected(unicoGrupoId);
      await update({
        ...session,
        grupoAtivo: resp.data,
      });
      router.refresh();
    });
  }, [
    grupos,
    isPending,
    router,
    session,
    session?.access_token,
    session?.grupoAtivo?.id,
    update,
  ]);

  if (!session?.access_token) return null;
  if (grupos.length === 0) return null;

  return (
    <div className="px-2 py-1.5">
      <p className="text-xs text-muted-foreground mb-1">Grupo ativo</p>
      <Select
        disabled={isPending}
        value={selected}
        onValueChange={(value) => {
          setSelected(value);
          startTransition(async () => {
            const resp = await atualizarGrupoAtivo(session.access_token, value);
            if (!resp.ok || !resp.data) {
              toast.error("Não foi possível trocar o grupo ativo", {
                description: resp.error || undefined,
              });
              return;
            }

            await update({
              ...session,
              grupoAtivo: resp.data,
            });

            toast.success("Grupo ativo atualizado");
            router.refresh();
          });
        }}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Selecione o grupo" />
        </SelectTrigger>
        <SelectContent>
          {grupos.map((grupo) => (
            <SelectItem key={grupo.id} value={grupo.id}>
              {grupo.sigla ? `${grupo.sigla} - ${grupo.nome}` : grupo.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
