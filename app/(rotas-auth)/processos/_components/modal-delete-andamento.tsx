/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { remover } from "@/services/andamentos/server-functions";
import { canAdmin } from "@/lib/access-control";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { IAndamento } from "@/types/processo";
import { useSession } from "next-auth/react";
import { formatarData } from "@/app/(rotas-auth)/processos/_components/utils";

export default function ModalDeleteAndamento({
  andamento: and,
  onSuccess,
}: {
  andamento: IAndamento;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  // canAdmin precisa da sessão inteira (usa session.grupoAtivo.membroAtivo.permissao
  // pra refletir o papel real do grupo ativo) — passar só session.usuario faz
  // cair sempre no fallback de DEV, escondendo o botão pra qualquer ADM real de
  // grupo que não seja também DEV.
  const canDelete = canAdmin(session);

  // Se não tiver permissão, retornar null (não renderizar o botão)
  if (!canDelete) {
    return null;
  }

  async function handleDelete(id: string) {
    const resp = await remover(id);
    if (!resp.ok) {
      toast.error("Erro", { description: resp.error });
    } else {
      toast.success("Andamento removido com sucesso");
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={"icon"}
          variant={"outline"}
          className="hover:bg-destructive cursor-pointer hover:text-white group transition-all ease-linear duration-200"
        >
          <Trash2
            size={16}
            className="text-destructive dark:text-white group-hover:text-white group"
          />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Andamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p>Tem certeza que deseja remover este andamento?</p>
          <div className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
            <p>
              <strong>Origem:</strong> {and.origem}
            </p>
            <p>
              <strong>Destino:</strong> {and.destino}
            </p>
            <p>
              <strong>Prazo:</strong>{" "}
              {formatarData(and.prazo)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <DialogFooter>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button id="close" variant={"outline"} disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  handleDelete(and.id);
                })
              }
              type="submit"
              variant="destructive"
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Excluir"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
