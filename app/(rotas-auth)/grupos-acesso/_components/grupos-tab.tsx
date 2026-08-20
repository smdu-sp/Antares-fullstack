/** @format */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  atualizarGrupo,
  criarGrupo,
  desativarGrupo,
  semearGruposPadrao,
} from "@/services/acessos-admin/server-functions/grupos";
import { GrupoCodigo, GrupoTipoEnum, IGrupo } from "@/types/grupo";

// GLOBAL fica de fora: não é mais um grupo de negócio criável/editável pela UI,
// é só um vínculo técnico auto-provisionado para usuários DEV.
const CODIGOS: GrupoCodigo[] = ["EXPEDIENTE", "SERVIN", "GABINETE", "OUTORGA"];
const TIPOS: GrupoTipoEnum[] = ["COORDENADORIA", "DIVISAO"];

type FormState = { codigo: GrupoCodigo; tipo: GrupoTipoEnum; nome: string };
const FORM_VAZIO: FormState = { codigo: "EXPEDIENTE", tipo: "COORDENADORIA", nome: "" };

export default function GruposTab({
  gruposIniciais,
}: {
  gruposIniciais: IGrupo[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<IGrupo | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);

  const abrirCriar = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    setDialogAberto(true);
  };

  const abrirEditar = (grupo: IGrupo) => {
    setEditando(grupo);
    setForm({ codigo: grupo.codigo, tipo: grupo.tipo, nome: grupo.nome });
    setDialogAberto(true);
  };

  const salvar = () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do grupo");
      return;
    }

    startTransition(async () => {
      const result = editando
        ? await atualizarGrupo(editando.id, form)
        : await criarGrupo(form);

      if (!result.ok) {
        toast.error("Não foi possível salvar o grupo", {
          description: result.error || "",
        });
        return;
      }

      toast.success(editando ? "Grupo atualizado" : "Grupo criado");
      setDialogAberto(false);
      router.refresh();
    });
  };

  const desativar = (id: string) => {
    startTransition(async () => {
      const result = await desativarGrupo(id);

      if (!result.ok) {
        toast.error("Não foi possível desativar o grupo", {
          description: result.error || "",
        });
        return;
      }

      toast.success("Grupo desativado");
      router.refresh();
    });
  };

  const semear = () => {
    startTransition(async () => {
      const result = await semearGruposPadrao();

      if (!result.ok) {
        toast.error("Não foi possível semear os grupos padrão", {
          description: result.error || "",
        });
        return;
      }

      toast.success("Grupos padrão criados/reativados");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Grupos cadastrados</CardTitle>
          <CardDescription>
            Grupos de acesso usados para segmentar visibilidade de processos e
            andamentos.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={semear} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Sprout />}
            Semear grupos padrão
          </Button>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button onClick={abrirCriar}>
                <Plus />
                Criar grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editando ? "Editar grupo" : "Criar grupo"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Select
                    value={form.codigo}
                    onValueChange={(v) => setForm((f) => ({ ...f, codigo: v as GrupoCodigo }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CODIGOS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as GrupoTipoEnum }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    maxLength={120}
                    placeholder="Ex.: Coordenadoria Jurídica"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={salvar} disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gruposIniciais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum grupo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              gruposIniciais.map((grupo) => (
                <TableRow key={grupo.id}>
                  <TableCell>{grupo.codigo}</TableCell>
                  <TableCell>{grupo.tipo}</TableCell>
                  <TableCell>{grupo.nome}</TableCell>
                  <TableCell>
                    <Badge variant={grupo.ativo ? "default" : "secondary"}>
                      {grupo.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(grupo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={!grupo.ativo}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desativar grupo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso desativa &quot;{grupo.nome}&quot;. Usuários vinculados a este
                            grupo deixam de contar com ele para visibilidade/permissões.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => desativar(grupo.id)}>
                            Desativar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
