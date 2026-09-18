/** @format */

"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as unidade from "@/services/unidades";
import { reativarUnidade } from "@/services/unidades/server-functions/listar-todas";
import { IUnidade } from "@/types/unidade";

/**
 * Catálogo GLOBAL de unidades (Unidade — usado só pro campo "unidade" do
 * cadastro de usuário). Deliberadamente separado das "Unidades" do dia a dia
 * (por grupo, usadas em processo — ver /unidades) — mesmo princípio de
 * separação usado pra Interessado/processo.grupo_id nesta sessão.
 */
export default function UnidadesCadastroTab() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<IUnidade | null>(null);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = () => {
    if (!session?.access_token) return;
    startTransition(async () => {
      const resp = await unidade.listaCompleta(session.access_token as string);
      if (resp.ok && resp.data) {
        setUnidades(resp.data as IUnidade[]);
      } else {
        toast.error("Não foi possível carregar as unidades", {
          description: resp.error || "",
        });
      }
      setLoaded(true);
    });
  };

  useEffect(() => {
    if (session?.access_token && !loaded) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const abrirCriar = () => {
    setEditando(null);
    setNome("");
    setSigla("");
    setDialogOpen(true);
  };

  const abrirEditar = (u: IUnidade) => {
    setEditando(u);
    setNome(u.nome);
    setSigla(u.sigla);
    setDialogOpen(true);
  };

  const salvar = async () => {
    if (nome.trim().length < 3) {
      toast.error("Nome deve ter ao menos 3 caracteres.");
      return;
    }
    if (sigla.trim().length < 2) {
      toast.error("Sigla deve ter ao menos 2 caracteres.");
      return;
    }

    setSalvando(true);
    const resp = editando
      ? await unidade.atualizar(editando.id, { nome, sigla })
      : await unidade.criar({ nome, sigla });
    setSalvando(false);

    if (!resp.ok) {
      toast.error(editando ? "Erro ao atualizar unidade" : "Erro ao criar unidade", {
        description: resp.error || undefined,
      });
      return;
    }

    toast.success(editando ? "Unidade atualizada" : "Unidade criada");
    setDialogOpen(false);
    carregar();
  };

  const reativar = async (u: IUnidade) => {
    const resp = await reativarUnidade(u.id, { nome: u.nome, sigla: u.sigla });
    if (!resp.ok) {
      toast.error("Erro ao reativar unidade", { description: resp.error || undefined });
      return;
    }
    toast.success("Unidade reativada");
    carregar();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unidades do cadastro de usuário</CardTitle>
          <CardDescription>
            Catálogo global de unidades organizacionais — usado só no campo
            &quot;Unidade&quot; ao cadastrar uma pessoa. Independente das
            unidades por grupo usadas em processo (ver página Unidades).
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={abrirCriar}>
              <Plus className="mr-1 size-4" /> Nova unidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar unidade" : "Nova unidade"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome</label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Sigla</label>
                <Input value={sigla} onChange={(e) => setSigla(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? <Loader2 className="animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isPending && unidades.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Sigla</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma unidade cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                unidades.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.nome}</TableCell>
                    <TableCell>{u.sigla}</TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? "default" : "secondary"}>
                        {u.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="outline" onClick={() => abrirEditar(u)}>
                        <Pencil className="size-4" />
                      </Button>
                      {!u.ativo && (
                        <Button
                          size="icon"
                          variant="outline"
                          title="Reativar"
                          onClick={() => reativar(u)}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
