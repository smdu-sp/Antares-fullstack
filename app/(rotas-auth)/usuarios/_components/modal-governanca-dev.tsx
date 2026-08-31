/** @format */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";
import {
  listarGruposDev,
  listarGruposUsuarioDev,
  listarPermissoesDev,
  atualizarGrupoUsuarioDev,
  atualizarPermissoesGrupoUsuarioDev,
  atualizarPermissoesGlobaisUsuarioDev,
  type GrupoDev,
  type Papel,
  type PermissaoDev,
} from "@/services/acessos-admin";
import { IUsuario } from "@/types/usuario";
import { Loader2, RotateCcw, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  user: IUsuario;
};

type Linha = {
  grupoId: string;
  nome: string;
  sigla?: string;
  papel: Papel;
  permissoesExtras: string[];
  novo: boolean;
  removida: boolean;
};

export default function ModalGovernancaDev({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [todosGrupos, setTodosGrupos] = useState<GrupoDev[]>([]);
  const [permissoesCatalogo, setPermissoesCatalogo] = useState<PermissaoDev[]>(
    [],
  );
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [permissoesGlobais, setPermissoesGlobais] = useState<string[]>([]);
  const [grupoParaAdicionar, setGrupoParaAdicionar] = useState("");

  const opcoesPermissoes = useMemo(
    () =>
      permissoesCatalogo.map((permissao) => ({
        value: permissao.codigo,
        label: permissao.descricao || permissao.codigo,
      })),
    [permissoesCatalogo],
  );

  const descricaoPermissao = (codigo: string) =>
    permissoesCatalogo.find((p) => p.codigo === codigo)?.descricao || codigo;

  const carregar = () => {
    startTransition(async () => {
      const [gruposResp, vinculosResp, permissoesResp] = await Promise.all([
        listarGruposDev(),
        listarGruposUsuarioDev(user.id),
        listarPermissoesDev(),
      ]);

      if (gruposResp.ok && gruposResp.data) {
        setTodosGrupos(gruposResp.data);
      } else {
        toast.error("Erro ao carregar grupos", {
          description: gruposResp.error || undefined,
        });
      }

      if (permissoesResp.ok && permissoesResp.data) {
        setPermissoesCatalogo(permissoesResp.data);
      } else {
        toast.error("Erro ao carregar permissões", {
          description: permissoesResp.error || undefined,
        });
      }

      if (vinculosResp.ok && vinculosResp.data) {
        const novasLinhas: Linha[] = vinculosResp.data
          .filter((v) => v.ativo)
          .map((v) => ({
            grupoId: v.grupoId,
            nome: v.nome,
            sigla: v.sigla,
            papel: v.permissaoGrupo || "USR",
            permissoesExtras: v.permissoes,
            novo: false,
            removida: false,
          }));

        setLinhas(novasLinhas);
        setPermissoesGlobais(vinculosResp.permissoesGlobais);
      } else {
        toast.error("Erro ao carregar grupos do usuário", {
          description: vinculosResp.error || undefined,
        });
        setLinhas([]);
        setPermissoesGlobais([]);
      }

      setCarregando(false);
    });
  };

  useEffect(() => {
    if (!open) return;
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.id]);

  const grupoIdsEmUso = new Set(linhas.map((l) => l.grupoId));
  const gruposDisponiveis = todosGrupos.filter((g) => !grupoIdsEmUso.has(g.id));

  const adicionarGrupo = () => {
    if (!grupoParaAdicionar) return;
    const grupo = todosGrupos.find((g) => g.id === grupoParaAdicionar);
    if (!grupo) return;

    setLinhas((prev) => [
      ...prev,
      {
        grupoId: grupo.id,
        nome: grupo.nome,
        sigla: grupo.sigla,
        papel: "USR",
        permissoesExtras: [],
        novo: true,
        removida: false,
      },
    ]);
    setGrupoParaAdicionar("");
  };

  const atualizarLinha = (grupoId: string, patch: Partial<Linha>) => {
    setLinhas((prev) =>
      prev.map((l) => (l.grupoId === grupoId ? { ...l, ...patch } : l)),
    );
  };

  const removerLinha = (grupoId: string) => {
    setLinhas((prev) =>
      prev
        .map((l) => (l.grupoId === grupoId ? { ...l, removida: true } : l))
        .filter((l) => !(l.grupoId === grupoId && l.novo)),
    );
  };

  const desfazerRemocao = (grupoId: string) => {
    atualizarLinha(grupoId, { removida: false });
  };

  const salvarAlteracoes = () => {
    startTransition(async () => {
      const ativas = linhas.filter((l) => !l.removida);
      const remocoes = linhas.filter((l) => l.removida && !l.novo);

      const chamadas = [
        ...ativas.map(async (linha) => {
          const vinculoResp = await atualizarGrupoUsuarioDev(
            user.id,
            linha.grupoId,
            {
              ativo: true,
              permissao_grupo: linha.papel,
            },
          );
          if (!vinculoResp.ok) return vinculoResp;
          return atualizarPermissoesGrupoUsuarioDev(user.id, linha.grupoId, {
            codigos: linha.permissoesExtras,
          });
        }),
        ...remocoes.map((linha) =>
          atualizarGrupoUsuarioDev(user.id, linha.grupoId, {
            ativo: false,
            permissao_grupo: linha.papel,
          }),
        ),
        atualizarPermissoesGlobaisUsuarioDev(user.id, {
          codigos: permissoesGlobais,
        }),
      ];

      const respostas = await Promise.all(chamadas);
      const erros = respostas.filter((r) => !r.ok);

      if (erros.length > 0) {
        toast.error("Algumas alterações não foram salvas", {
          description: erros[0]?.error || undefined,
        });
      } else {
        toast.success("Alterações salvas");
      }

      carregar();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Permissões do usuário">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões do usuário </DialogTitle>
          <DialogDescription>
            Grupos, papel por grupo e permissões (do grupo + extras do usuário)
            para <span className="font-medium">{user.nome}</span>.
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Grupos vinculados</Label>

              {linhas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum grupo vinculado ainda.
                </p>
              )}

              {linhas.map((linha) => {
                const baselineAtual =
                  todosGrupos.find((g) => g.id === linha.grupoId)
                    ?.permissoesBase[linha.papel] || [];

                return linha.removida ? (
                  <div
                    key={linha.grupoId}
                    className="flex items-center justify-between rounded-md border border-dashed p-3 text-sm text-muted-foreground"
                  >
                    <span>
                      {linha.sigla
                        ? `${linha.sigla} - ${linha.nome}`
                        : linha.nome}{" "}
                      será removido
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => desfazerRemocao(linha.grupoId)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Desfazer
                    </Button>
                  </div>
                ) : (
                  <div
                    key={linha.grupoId}
                    className="space-y-2 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {linha.sigla
                          ? `${linha.sigla} - ${linha.nome}`
                          : linha.nome}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerLinha(linha.grupoId)}
                      >
                        <X className="h-4 w-4 mr-1" /> Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Papel no grupo</Label>
                        <Select
                          value={linha.papel}
                          onValueChange={(v: Papel) =>
                            atualizarLinha(linha.grupoId, { papel: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADM">ADM</SelectItem>
                            <SelectItem value="TEC">TEC</SelectItem>
                            <SelectItem value="USR">USR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {baselineAtual.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Permissões do papel {linha.papel} neste grupo
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {baselineAtual.map((codigo) => (
                            <Badge key={codigo} variant="secondary">
                              {descricaoPermissao(codigo)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">
                        Permissões extras neste grupo
                      </Label>
                      <MultiSelect
                        options={opcoesPermissoes}
                        value={linha.permissoesExtras}
                        onValueChange={(codigos) =>
                          atualizarLinha(linha.grupoId, {
                            permissoesExtras: codigos,
                          })
                        }
                        placeholder="Selecione permissões extras, além do que o grupo já concede"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <Select
                  value={grupoParaAdicionar}
                  onValueChange={setGrupoParaAdicionar}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um grupo para adicionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposDisponiveis.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id}>
                        {grupo.sigla
                          ? `${grupo.sigla} - ${grupo.nome}`
                          : grupo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={adicionarGrupo}
                  disabled={!grupoParaAdicionar}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label>Permissões globais (independem do grupo ativo)</Label>
              <MultiSelect
                options={opcoesPermissoes}
                value={permissoesGlobais}
                onValueChange={setPermissoesGlobais}
                placeholder="Selecione as permissões concedidas ao usuário, em qualquer grupo"
              />
            </div>

            <Input disabled value={user.login} />

            <div className="flex justify-end">
              <Button onClick={salvarAlteracoes} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar alterações
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
