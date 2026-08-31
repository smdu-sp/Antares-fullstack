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
import * as processo from "@/services/processos";
import { canAdmin } from "@/lib/access-control";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ModalDeleteProcesso({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
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
    const resp = await processo.server.remover(id);
    if (!resp.ok) {
      toast.error("Erro", { description: resp.error });
    } else {
      toast.success("Processo removido com sucesso");
      router.refresh();
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={"icon"}
          variant={"outline"}
          className="hover:bg-destructive cursor-pointer hover:text-white group transition-all ease-linear duration-200"
        >
          <Trash2
            size={24}
            className="text-destructive dark:text-white group-hover:text-white group"
          />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Processo</DialogTitle>
        </DialogHeader>
        <p>Tem certeza que deseja remover este processo?</p>
        <DialogFooter>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button id="close" variant={"outline"}>
                Voltar
              </Button>
            </DialogClose>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  handleDelete(id);
                })
              }
              type="submit"
              variant="destructive"
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Deletar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
