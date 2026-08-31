/** @format */

"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { obterMatrizPermissoesEfetivas } from "@/services/acessos-admin/server-functions/matriz-permissoes";
import { IMatrizPermissaoLinha } from "@/types/grupo";

const TODOS = "__todos__";

export default function MatrizPermissoesTab() {
  const [isPending, startTransition] = useTransition();
  const [todasLinhas, setTodasLinhas] = useState<IMatrizPermissaoLinha[]>([]);
  const [linhasExibidas, setLinhasExibidas] = useState<IMatrizPermissaoLinha[]>([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>(TODOS);

  useEffect(() => {
    startTransition(async () => {
      const result = await obterMatrizPermissoesEfetivas();

      if (!result.ok) {
        toast.error("Não foi possível carregar a matriz de permissões", {
          description: result.error || "",
        });
        return;
      }

      const linhas = result.data?.data ?? [];
      setTodasLinhas(linhas);
      setLinhasExibidas(linhas);
    });
  }, []);

  const usuariosUnicos = Array.from(
    new Map(todasLinhas.map((l) => [l.usuario.id, l.usuario])).values(),
  );

  const filtrar = (usuarioId: string) => {
    setUsuarioFiltro(usuarioId);

    startTransition(async () => {
      const result = await obterMatrizPermissoesEfetivas(
        usuarioId === TODOS ? undefined : usuarioId,
      );

      if (!result.ok) {
        toast.error("Não foi possível filtrar a matriz de permissões", {
          description: result.error || "",
        });
        return;
      }

      setLinhasExibidas(result.data?.data ?? []);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Matriz de permissões efetivas</CardTitle>
          <CardDescription>
            Visão somente leitura dos vínculos usuário/grupo e das permissões
            resultantes.
          </CardDescription>
        </div>
        <Select value={usuarioFiltro} onValueChange={filtrar}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os usuários</SelectItem>
            {usuariosUnicos.map((usuario) => (
              <SelectItem key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.login})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isPending && linhasExibidas.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Visualizar</TableHead>
                <TableHead>Modificar</TableHead>
                <TableHead>Excluir</TableHead>
                <TableHead>Visão global (Gabinete)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasExibidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum vínculo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                linhasExibidas.map((linha, idx) => (
                  <TableRow key={`${linha.usuario.id}-${linha.grupo.id}-${idx}`}>
                    <TableCell>
                      {linha.usuario.nome}{" "}
                      <span className="text-muted-foreground">({linha.usuario.login})</span>
                    </TableCell>
                    <TableCell>
                      {linha.grupo.nome} ({linha.grupo.codigo})
                    </TableCell>
                    <TableCell>
                      <Badge variant={linha.efetivo.processo_visualizar ? "default" : "secondary"}>
                        {linha.efetivo.processo_visualizar ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={linha.efetivo.processo_modificar ? "default" : "secondary"}>
                        {linha.efetivo.processo_modificar ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={linha.efetivo.processo_excluir ? "default" : "secondary"}>
                        {linha.efetivo.processo_excluir ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={linha.efetivo.visualizacao_global_gabinete ? "default" : "secondary"}
                      >
                        {linha.efetivo.visualizacao_global_gabinete ? "Sim" : "Não"}
                      </Badge>
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
