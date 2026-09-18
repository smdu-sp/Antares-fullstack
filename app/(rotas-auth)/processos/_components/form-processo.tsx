/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IProcesso, ICreateProcesso, IUpdateProcesso } from "@/types/processo";
import { IUsuarioTecnico } from "@/types/usuario";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as processo from "@/services/processos";
import * as usuario from "@/services/usuarios";
// Unidade remetente/destino do processo usa UnidadeGrupo (por grupo), não o
// catálogo global (usado só no cadastro de usuário).
import { listarAutocomplete as listarUnidadesAutocomplete } from "@/services/unidades-grupo";
import * as interessado from "@/services/interessados";
import { useTransition, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import DateInput from "@/components/ui/date-input";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { canAdmin } from "@/lib/access-control";
import { parseUTCDate } from "@/app/(rotas-auth)/processos/_components/utils";

const formSchema = z.object({
  numero_sei: z.string().min(3, "Número SEI deve ter ao menos 3 caracteres"),
  assunto: z.string().min(5, "Assunto deve ter ao menos 5 caracteres"),
  interessado_id: z.string().optional(),
  unidade_remetente_id: z.string().optional(),
  origem: z.string().min(2, "Unidade de origem deve ter ao menos 2 caracteres"),
  data_recebimento: z.date({
    required_error: "Data de recebimento é obrigatória",
  }),
  data_envio_unidade: z.date().optional(),
  usuario_atribuido_id: z.string().optional(),
  prazo: z.date({
    required_error: "Prazo do processo é obrigatório",
  }),
});

type InteressadoFieldProps = {
  field: ControllerRenderProps<z.infer<typeof formSchema>, "interessado_id">;
  interessados: IInteressado[];
  loadingInteressados: boolean;
};

function InteressadoField({
  field,
  interessados,
  loadingInteressados,
}: InteressadoFieldProps) {
  const [suggestionsInteressado, setSuggestionsInteressado] = useState<
    IInteressado[]
  >([]);
  const [showSuggestionsInteressado, setShowSuggestionsInteressado] =
    useState(false);
  const [inputInteressado, setInputInteressado] = useState("");
  const [selectedInteressadoId, setSelectedInteressadoId] = useState("");
  const timeoutRefInteressado = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (
      field.value &&
      field.value !== selectedInteressadoId &&
      interessados.length > 0
    ) {
      const interessadoSelecionado = interessados.find(
        (i) => i.id === field.value,
      );
      if (interessadoSelecionado) {
        setInputInteressado(interessadoSelecionado.valor);
        setSelectedInteressadoId(field.value);
      }
    }
  }, [field.value, interessados, selectedInteressadoId]);

  function fetchSuggestionsInteressado(q: string) {
    if (!q || q.length < 1) {
      setSuggestionsInteressado(interessados);
      return;
    }
    const filtrados = interessados.filter((i) =>
      i.valor.toLowerCase().includes(q.toLowerCase()),
    );
    setSuggestionsInteressado(filtrados);
  }

  function handleChangeInteressado(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputInteressado(value);
    field.onChange("");
    setSelectedInteressadoId("");
    if (timeoutRefInteressado.current) {
      clearTimeout(timeoutRefInteressado.current);
    }
    timeoutRefInteressado.current = setTimeout(() => {
      fetchSuggestionsInteressado(value);
      setShowSuggestionsInteressado(true);
    }, 250);
  }

  function handleSelectInteressado(inter: IInteressado) {
    setInputInteressado(inter.valor);
    field.onChange(inter.id);
    setSelectedInteressadoId(inter.id);
    setShowSuggestionsInteressado(false);
    setSuggestionsInteressado([]);
  }

  return (
    <FormItem className="relative">
      <FormLabel>Interessado</FormLabel>
      <FormControl>
        <div>
          {loadingInteressados ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <Input
                placeholder="Busque pelo nome do interessado"
                value={inputInteressado}
                onChange={handleChangeInteressado}
                autoComplete="off"
                onBlur={() =>
                  setTimeout(() => setShowSuggestionsInteressado(false), 200)
                }
                onFocus={() => {
                  fetchSuggestionsInteressado(inputInteressado);
                  setShowSuggestionsInteressado(true);
                }}
              />
              {showSuggestionsInteressado &&
                suggestionsInteressado.length > 0 && (
                  <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                    {suggestionsInteressado.map((inter) => (
                      <li
                        key={inter.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                        onMouseDown={() => handleSelectInteressado(inter)}
                      >
                        {inter.valor}
                      </li>
                    ))}
                  </ul>
                )}
            </>
          )}
        </div>
      </FormControl>
      <FormDescription>Interessado no processo</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

type UnidadeResumo = Pick<IUnidade, "id" | "sigla" | "nome">;

type UnidadeRemetenteFieldProps = {
  field: ControllerRenderProps<
    z.infer<typeof formSchema>,
    "unidade_remetente_id"
  >;
  token?: string;
  unidadeRemetente?: UnidadeResumo;
};

function UnidadeRemetenteField({
  field,
  token,
  unidadeRemetente,
}: UnidadeRemetenteFieldProps) {
  const [suggestionsUnidades, setSuggestionsUnidades] = useState<IUnidade[]>(
    [],
  );
  const [showSuggestionsUnidades, setShowSuggestionsUnidades] = useState(false);
  const [inputUnidade, setInputUnidade] = useState("");
  const [selectedUnidadeId, setSelectedUnidadeId] = useState("");
  const timeoutRefUnidade = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (field.value && field.value !== selectedUnidadeId && unidadeRemetente) {
      setInputUnidade(`${unidadeRemetente.sigla} - ${unidadeRemetente.nome}`);
      setSelectedUnidadeId(field.value);
    }
  }, [field.value, selectedUnidadeId, unidadeRemetente]);

  async function fetchSuggestionsUnidades(q: string) {
    if (!q || q.length < 1) {
      setSuggestionsUnidades([]);
      return;
    }
    try {
      if (!token) return;
      const resposta = await listarUnidadesAutocomplete(token, q);
      if (resposta.ok && Array.isArray(resposta.data)) {
        setSuggestionsUnidades(resposta.data as IUnidade[]);
      } else {
        setSuggestionsUnidades([]);
      }
    } catch {
      setSuggestionsUnidades([]);
    }
  }

  function handleChangeUnidade(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputUnidade(value);
    field.onChange("");
    setSelectedUnidadeId("");
    if (timeoutRefUnidade.current) {
      clearTimeout(timeoutRefUnidade.current);
    }
    timeoutRefUnidade.current = setTimeout(() => {
      fetchSuggestionsUnidades(value);
      setShowSuggestionsUnidades(true);
    }, 250);
  }

  function handleSelectUnidade(unidade: IUnidade) {
    setInputUnidade(`${unidade.sigla} - ${unidade.nome}`);
    field.onChange(unidade.id);
    setSelectedUnidadeId(unidade.id);
    setShowSuggestionsUnidades(false);
    setSuggestionsUnidades([]);
  }

  return (
    <FormItem className="relative">
      <FormLabel>Unidade Remetente</FormLabel>
      <FormControl>
        <div>
          <Input
            placeholder="Busque por sigla ou nome da unidade"
            value={inputUnidade}
            onChange={handleChangeUnidade}
            autoComplete="off"
            onBlur={() =>
              setTimeout(() => setShowSuggestionsUnidades(false), 200)
            }
            onFocus={() => {
              fetchSuggestionsUnidades(inputUnidade);
              setShowSuggestionsUnidades(true);
            }}
            style={{ appearance: "none" }}
          />
          {showSuggestionsUnidades && suggestionsUnidades.length > 0 && (
            <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
              {suggestionsUnidades.map((unidade) => (
                <li
                  key={unidade.id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                  onMouseDown={() => handleSelectUnidade(unidade)}
                >
                  {unidade.sigla} - {unidade.nome}
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormControl>
      <FormDescription>Unidade que enviou o processo</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

type OrigemFieldProps = {
  field: ControllerRenderProps<z.infer<typeof formSchema>, "origem">;
  token?: string;
};

function OrigemField({ field, token }: OrigemFieldProps) {
  const [suggestionsOrigem, setSuggestionsOrigem] = useState<IUnidade[]>([]);
  const [showSuggestionsOrigem, setShowSuggestionsOrigem] = useState(false);
  const [inputOrigem, setInputOrigem] = useState("");
  const timeoutRefOrigem = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (field.value && !inputOrigem) {
      setInputOrigem(field.value);
    }
  }, [field.value, inputOrigem]);

  async function fetchSuggestionsOrigem(q: string) {
    if (!q || q.length < 1) {
      setSuggestionsOrigem([]);
      return;
    }
    try {
      if (!token) return;
      const resposta = await listarUnidadesAutocomplete(token, q);
      if (resposta.ok && Array.isArray(resposta.data)) {
        setSuggestionsOrigem(resposta.data as IUnidade[]);
      } else {
        setSuggestionsOrigem([]);
      }
    } catch {
      setSuggestionsOrigem([]);
    }
  }

  function handleChangeOrigem(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputOrigem(value);
    field.onChange("");
    if (timeoutRefOrigem.current) {
      clearTimeout(timeoutRefOrigem.current);
    }
    timeoutRefOrigem.current = setTimeout(() => {
      fetchSuggestionsOrigem(value);
      setShowSuggestionsOrigem(true);
    }, 250);
  }

  function handleSelectOrigem(unidade: IUnidade) {
    const nomeUnidade = `${unidade.sigla} - ${unidade.nome}`;
    setInputOrigem(nomeUnidade);
    field.onChange(nomeUnidade);
    setShowSuggestionsOrigem(false);
    setSuggestionsOrigem([]);
  }

  return (
    <FormItem className="relative">
      <FormLabel>Unidade de Origem</FormLabel>
      <FormControl>
        <div>
          <Input
            placeholder="Busque por sigla ou nome da unidade"
            value={inputOrigem}
            onChange={handleChangeOrigem}
            autoComplete="off"
            onBlur={() =>
              setTimeout(() => setShowSuggestionsOrigem(false), 200)
            }
            onFocus={() => {
              fetchSuggestionsOrigem(inputOrigem);
              setShowSuggestionsOrigem(true);
            }}
            style={{ appearance: "none" }}
          />
          {showSuggestionsOrigem && suggestionsOrigem.length > 0 && (
            <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
              {suggestionsOrigem.map((unidade) => (
                <li
                  key={unidade.id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                  onMouseDown={() => handleSelectOrigem(unidade)}
                >
                  {unidade.sigla} - {unidade.nome}
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormControl>
      <FormDescription>Unidade que originou o processo</FormDescription>
      <FormMessage />
    </FormItem>
  );
}

export default function FormProcesso({
  processo: processoData,
  isUpdating,
  onSuccess,
}: {
  processo?: Partial<IProcesso>;
  isUpdating: boolean;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [interessados, setInteressados] = useState<IInteressado[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<
    IUsuarioTecnico[]
  >([]);
  const [loadingInteressados, setLoadingInteressados] = useState(true);
  const [loadingUsuariosResponsaveis, setLoadingUsuariosResponsaveis] =
    useState(true);

  useEffect(() => {
    async function carregarInteressados() {
      if (!session?.access_token) return;
      try {
        const resposta = await interessado.query.listaCompleta(
          session.access_token,
        );
        if (Array.isArray(resposta)) {
          setInteressados(resposta);
        } else {
          toast.error("Erro ao carregar interessados");
        }
      } catch (error) {
        console.error("Erro ao carregar interessados:", error);
        toast.error("Erro ao conectar com o servidor de interessados");
      } finally {
        setLoadingInteressados(false);
      }
    }
    carregarInteressados();
  }, [session?.access_token]);

  useEffect(() => {
    async function carregarUsuariosResponsaveis() {
      if (!session?.access_token) return;
      try {
        const grupoAtivoId = canAdmin(session?.usuario)
          ? undefined
          : session.grupoAtivo?.id;

        const resposta = await usuario.listaCompleta(
          session.access_token,
          grupoAtivoId,
        );
        if (resposta.ok && Array.isArray(resposta.data)) {
          setUsuariosResponsaveis(
            (resposta.data as any[])
              .map((responsavel) => ({
                id: String(responsavel?.id || ""),
                nome: String(responsavel?.nome || "").trim(),
              }))
              .filter((responsavel) => responsavel.id && responsavel.nome),
          );
        }
      } catch (error) {
        toast.error("Erro ao carregar usuarios responsaveis");
      } finally {
        setLoadingUsuariosResponsaveis(false);
      }
    }

    carregarUsuariosResponsaveis();
  }, [session?.access_token, session?.grupoAtivo?.id, session?.usuario]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_sei: processoData?.numero_sei || "",
      assunto: processoData?.assunto || "",
      interessado_id: processoData?.interessado_id || "",
      unidade_remetente_id:
        processoData?.unidadeRemetente?.id ||
        processoData?.unidade_remetente ||
        "",
      origem: processoData?.origem || "",
      data_recebimento: parseUTCDate(processoData?.data_recebimento) ?? new Date(),
      data_envio_unidade: parseUTCDate(processoData?.data_envio_unidade) ?? undefined,
      usuario_atribuido_id: processoData?.usuario_atribuido_id || "",
      prazo: parseUTCDate(processoData?.prazo) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias à frente
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Converte as datas para ISO string e mapeia os campos
      const dataFormatada: any = {
        numero_sei: data.numero_sei,
        assunto: data.assunto,
        origem: data.origem,
        data_recebimento: data.data_recebimento.toISOString(),
        prazo: data.prazo.toISOString(),
      };

      // Adiciona data_envio_unidade se fornecida
      if (data.data_envio_unidade) {
        dataFormatada.data_envio_unidade =
          data.data_envio_unidade.toISOString();
      }

      // Adiciona interessado_id e unidade_remetente_id se fornecidos
      if (data.interessado_id) {
        dataFormatada.interessado_id = data.interessado_id;
      }
      if (data.unidade_remetente_id) {
        dataFormatada.unidade_remetente_id = data.unidade_remetente_id;
      }
      if (data.usuario_atribuido_id) {
        dataFormatada.usuario_atribuido_id = data.usuario_atribuido_id;
      }

      let resp;
      if (isUpdating && processoData?.id) {
        resp = await processo.server.atualizar(processoData.id, dataFormatada);
      } else {
        resp = await processo.server.criar(dataFormatada as ICreateProcesso);
      }

      if (!resp.ok) {
        toast.error("Erro", { description: resp.error });
      } else {
        toast.success(
          isUpdating
            ? "Processo atualizado com sucesso"
            : "Processo criado com sucesso",
        );
        form.reset();
        // Limpa os filtros e busca da URL
        router.push(pathname);
        router.refresh();
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numero_sei"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número SEI</FormLabel>
              <FormControl>
                <Input placeholder="1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assunto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o assunto do processo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interessado_id"
          render={({ field }) => (
            <InteressadoField
              field={field}
              interessados={interessados}
              loadingInteressados={loadingInteressados}
            />
          )}
        />
        <FormField
          control={form.control}
          name="unidade_remetente_id"
          render={({ field }) => (
            <UnidadeRemetenteField
              field={field}
              token={session?.access_token}
              unidadeRemetente={processoData?.unidadeRemetente}
            />
          )}
        />
        <FormField
          control={form.control}
          name="origem"
          render={({ field }) => (
            <OrigemField field={field} token={session?.access_token} />
          )}
        />
        <FormField
          control={form.control}
          name="usuario_atribuido_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "__NONE__" ? "" : value)
                }
                value={field.value || "__NONE__"}
                disabled={loadingUsuariosResponsaveis}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingUsuariosResponsaveis
                          ? "Carregando usuarios..."
                          : canAdmin(session?.usuario)
                            ? "Selecione um usuário (opcional)"
                            : "Selecione você ou um usuário do grupo (opcional)"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__NONE__">Nao atribuir</SelectItem>
                  {usuariosResponsaveis.map((responsavel) => (
                    <SelectItem key={responsavel.id} value={responsavel.id}>
                      {responsavel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Se vazio, o backend pode atribuir automaticamente pelo contexto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_recebimento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Recebimento</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? new Date())}
                  placeholder="DD/MM/AAAA"
                  calendarProps={{
                    locale: ptBR,
                    initialFocus: true,
                    disabled: (date: Date) =>
                      date > new Date() || date < new Date("1900-01-01"),
                  }}
                />
              </FormControl>
              <FormDescription>
                Data em que o gabinete recebeu o processo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_envio_unidade"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Envio para Unidade</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? undefined)}
                  placeholder="DD/MM/AAAA"
                  calendarProps={{
                    locale: ptBR,
                    initialFocus: true,
                    disabled: (date: Date) =>
                      date > new Date() || date < new Date("1900-01-01"),
                  }}
                />
              </FormControl>
              <FormDescription>
                Data em que o processo foi enviado para a unidade responsável
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prazo"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Prazo do Processo</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? new Date())}
                  placeholder="DD/MM/AAAA"
                  calendarProps={{
                    locale: ptBR,
                    initialFocus: true,
                    disabled: (date: Date) => date < new Date("1900-01-01"),
                  }}
                />
              </FormControl>
              <FormDescription>
                Data limite para conclusão do processo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : isUpdating ? (
            "Atualizar"
          ) : (
            "Criar"
          )}
        </Button>
      </form>
    </Form>
  );
}
