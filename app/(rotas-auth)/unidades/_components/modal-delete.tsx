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
import { remover } from "@/services/unidades/server-functions";
import { canAdmin } from "@/lib/access-control";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function ModalDelete({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  // canAdmin precisa da sessão inteira, não só session.usuario (ver mesma
  // correção em modal-delete-processo.tsx).
  const canDelete = canAdmin(session);

  // Se não tiver permissão, retornar null (não renderizar o botão)
  if (!canDelete) {
    return null;
  }

  async function handleDelete(id: string) {
    const resp = await remover(id);
    if (!resp.ok) {
      toast.error("Algo deu errado", { description: resp.error });
    } else {
      toast.success("Unidade Removida com sucesso", {
        description: "A unidade foi removida do sistema",
      });
      window.location.reload();
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
          <DialogTitle>Excluir Unidade</DialogTitle>
        </DialogHeader>
        <p>Tem certeza que deseja remover essa unidade?</p>
        <p className="text-sm text-muted-foreground">
          Esta ação não pode ser desfeita. Certifique-se de que não há usuários
          ou processos vinculados a esta unidade.
        </p>
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
