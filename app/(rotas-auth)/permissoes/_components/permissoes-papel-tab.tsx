/** @format */

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/multi-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { atualizarPermissoesGrupoDev } from "@/services/acessos-admin/server-functions/grupos-permissoes";
import { listarPermissoesDev } from "@/services/acessos-admin/server-functions/usuarios-grupos-dev";
import type { Papel, PermissaoDev } from "@/services/acessos-admin/server-functions/usuarios-grupos-dev";
import { IGrupo } from "@/types/grupo";

const PAPEIS: Papel[] = ["ADM", "TEC", "USR"];

export default function PermissoesPapelTab({
  gruposIniciais,
  permissoesPorGrupoIniciais,
}: {
  gruposIniciais: IGrupo[];
  permissoesPorGrupoIniciais: Record<string, Partial<Record<Papel, string[]>>>;
}) {
  const [isPending, startTransition] = useTransition();
  const [permissoesPorGrupo, setPermissoesPorGrupo] = useState(permissoesPorGrupoIniciais);
  const [permissoesCatalogo, setPermissoesCatalogo] = useState<PermissaoDev[]>([]);
  const [grupoId, setGrupoId] = useState(gruposIniciais.find((g) => g.ativo)?.id || "");
  const [permissoesPorPapel, setPermissoesPorPapel] = useState<Record<Papel, string[]>>({
    ADM: [],
    TEC: [],
    USR: [],
  });

  useEffect(() => {
    startTransition(async () => {
      const resp = await listarPermissoesDev();
      if (resp.ok && resp.data) {
        setPermissoesCatalogo(resp.data);
      } else {
        toast.error("Erro ao carregar catálogo de permissões", {
          description: resp.error || undefined,
        });
      }
    });
  }, []);

  useEffect(() => {
    const atuais = permissoesPorGrupo[grupoId] || {};
    setPermissoesPorPapel({
      ADM: atuais.ADM || [],
      TEC: atuais.TEC || [],
      USR: atuais.USR || [],
    });
  }, [grupoId, permissoesPorGrupo]);

  const opcoesPermissoes = useMemo(
    () =>
      permissoesCatalogo.map((permissao) => ({
        value: permissao.codigo,
        label: permissao.descricao || permissao.codigo,
      })),
    [permissoesCatalogo],
  );

  const grupoSelecionado = gruposIniciais.find((g) => g.id === grupoId);

  const salvar = () => {
    if (!grupoId) {
      toast.error("Selecione um grupo");
      return;
    }

    startTransition(async () => {
      const respostas = await Promise.all(
        PAPEIS.map((papel) =>
          atualizarPermissoesGrupoDev(grupoId, {
            papel,
            codigos: permissoesPorPapel[papel],
          }),
        ),
      );

      const erros = respostas.filter((r) => !r.ok);
      if (erros.length > 0) {
        toast.error("Não foi possível salvar as permissões", {
          description: erros[0]?.error || "",
        });
        return;
      }

      setPermissoesPorGrupo((prev) => ({
        ...prev,
        [grupoId]: { ...permissoesPorPapel },
      }));
      toast.success("Permissões atualizadas");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões por papel</CardTitle>
        <CardDescription>
          Define, para cada grupo, quais permissões cada papel (ADM/TEC/USR) recebe como
          baseline — além das que cada usuário tiver individualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-sm">
          <Label>Grupo</Label>
          <Select value={grupoId} onValueChange={setGrupoId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um grupo" />
            </SelectTrigger>
            <SelectContent>
              {gruposIniciais.map((grupo) => (
                <SelectItem key={grupo.id} value={grupo.id}>
                  {grupo.nome} ({grupo.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {grupoSelecionado ? (
          <>
            {PAPEIS.map((papel) => (
              <div key={papel} className="space-y-1 rounded-md border p-3">
                <Label>Papel {papel}</Label>
                <MultiSelect
                  options={opcoesPermissoes}
                  value={permissoesPorPapel[papel]}
                  onValueChange={(codigos) =>
                    setPermissoesPorPapel((prev) => ({ ...prev, [papel]: codigos }))
                  }
                  placeholder={`Permissões concedidas ao papel ${papel} em ${grupoSelecionado.nome}`}
                />
              </div>
            ))}

            <Button onClick={salvar} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum grupo cadastrado ainda — crie um na aba Grupos primeiro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
