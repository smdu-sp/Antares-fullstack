/** @format */

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { buscarPorNumeroSei } from "@/services/processos/server-functions/buscar-por-numero-sei";
import {
  listarGruposProcesso,
  vincularProcessoGrupo,
} from "@/services/acessos-admin/server-functions/processos-grupos";
import { IGrupo, IProcessoGrupo, NivelVisaoGrupoProcesso } from "@/types/grupo";
import { IProcesso } from "@/types/processo";

const NIVEIS: NivelVisaoGrupoProcesso[] = ["TOTAL", "PARCIAL"];

export default function VincularProcessoTab({
  gruposDisponiveis,
}: {
  gruposDisponiveis: IGrupo[];
}) {
  const [isPending, startTransition] = useTransition();
  const [numeroSei, setNumeroSei] = useState("");
  const [processo, setProcesso] = useState<IProcesso | null>(null);
  const [vinculos, setVinculos] = useState<IProcessoGrupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>("");
  const [nivelVisao, setNivelVisao] = useState<NivelVisaoGrupoProcesso>("TOTAL");
  const [ativo, setAtivo] = useState(true);

  const buscar = () => {
    if (!numeroSei.trim()) {
      toast.error("Informe o número SEI do processo");
      return;
    }

    startTransition(async () => {
      const result = await buscarPorNumeroSei(numeroSei.trim());

      if (!result.ok || !result.data) {
        toast.error("Processo não encontrado", { description: result.error || "" });
        setProcesso(null);
        setVinculos([]);
        return;
      }

      const proc = result.data as IProcesso;
      setProcesso(proc);

      const vinculosRes = await listarGruposProcesso(proc.id);
      setVinculos(vinculosRes.ok ? vinculosRes.data?.data ?? [] : []);
    });
  };

  const vincular = () => {
    if (!processo || !grupoSelecionado) {
      toast.error("Busque um processo e selecione um grupo");
      return;
    }

    startTransition(async () => {
      const result = await vincularProcessoGrupo(processo.id, grupoSelecionado, {
        nivelVisao,
        ativo,
      });

      if (!result.ok) {
        toast.error("Não foi possível vincular o processo ao grupo", {
          description: result.error || "",
        });
        return;
      }

      toast.success("Vínculo salvo com sucesso");

      const vinculosRes = await listarGruposProcesso(processo.id);
      setVinculos(vinculosRes.ok ? vinculosRes.data?.data ?? [] : []);
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buscar processo</CardTitle>
          <CardDescription>
            Localize um processo pelo número SEI para gerenciar seus vínculos de grupo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 items-end">
          <div className="space-y-2 flex-1">
            <Label>Número SEI</Label>
            <Input
              value={numeroSei}
              onChange={(e) => setNumeroSei(e.target.value)}
              placeholder="Ex.: 1234567"
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
          </div>
          <Button onClick={buscar} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Search />}
            Buscar
          </Button>
        </CardContent>
      </Card>

      {processo && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{processo.numero_sei}</CardTitle>
              <CardDescription>{processo.assunto}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label>Grupo</Label>
                <Select value={grupoSelecionado} onValueChange={setGrupoSelecionado}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposDisponiveis.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id}>
                        {grupo.nome} ({grupo.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de visão</Label>
                <Select
                  value={nivelVisao}
                  onValueChange={(v) => setNivelVisao(v as NivelVisaoGrupoProcesso)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVEIS.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={ativo} onCheckedChange={setAtivo} />
                <Label>Ativo</Label>
              </div>
              <Button onClick={vincular} disabled={isPending} className="md:col-span-4">
                {isPending && <Loader2 className="animate-spin" />}
                Vincular / atualizar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vínculos atuais</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Nível de visão</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vinculos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Nenhum vínculo cadastrado para este processo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vinculos.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          {v.grupo?.nome ?? v.grupo_id} {v.grupo?.codigo && `(${v.grupo.codigo})`}
                        </TableCell>
                        <TableCell>{v.nivelVisao}</TableCell>
                        <TableCell>{v.ativo ? "Sim" : "Não"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
