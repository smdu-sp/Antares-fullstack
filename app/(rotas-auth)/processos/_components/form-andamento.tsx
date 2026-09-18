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
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ICreateAndamento } from "@/types/processo";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as andamento from "@/services/andamentos";
// Unidade destino do andamento usa UnidadeGrupo (por grupo), não o catálogo
// global (usado só no cadastro de usuário).
import * as unidadeGrupo from "@/services/unidades-grupo";
import { useTransition, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import DateInput from "@/components/ui/date-input";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IUnidade } from "@/types/unidade";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  destino: z.string().min(1, "Destino é obrigatório"),
  data_envio: z.date({
    required_error: "Data de envio é obrigatória",
  }),
  prazo: z.date({
    required_error: "Prazo é obrigatório",
  }),
});

type DestinoFieldProps = {
  field: ControllerRenderProps<z.infer<typeof formSchema>, "destino">;
  unidades: IUnidade[];
  loadingUnidades: boolean;
};

function DestinoField({ field, unidades, loadingUnidades }: DestinoFieldProps) {
  const [suggestionsDestino, setSuggestionsDestino] = useState<IUnidade[]>([]);
  const [showSuggestionsDestino, setShowSuggestionsDestino] = useState(false);
  const [inputDestino, setInputDestino] = useState("");
  const [selectedDestinoId, setSelectedDestinoId] = useState("");
  const timeoutRefDestino = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (field.value && field.value !== selectedDestinoId && unidades.length) {
      const unidadeSelecionada = unidades.find((u) => u.id === field.value);
      if (unidadeSelecionada) {
        setInputDestino(
          `${unidadeSelecionada.sigla} - ${unidadeSelecionada.nome}`,
        );
        setSelectedDestinoId(field.value);
      }
    }
  }, [field.value, selectedDestinoId, unidades]);

  function fetchSuggestionsDestino(q: string) {
    if (!q || q.length < 1) {
      setSuggestionsDestino(unidades);
      return;
    }
    const filtrados = unidades.filter((u) =>
      `${u.sigla} ${u.nome}`.toLowerCase().includes(q.toLowerCase()),
    );
    setSuggestionsDestino(filtrados);
  }

  function handleChangeDestino(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputDestino(value);
    field.onChange("");
    setSelectedDestinoId("");
    if (timeoutRefDestino.current) {
      clearTimeout(timeoutRefDestino.current);
    }
    timeoutRefDestino.current = setTimeout(() => {
      fetchSuggestionsDestino(value);
      setShowSuggestionsDestino(true);
    }, 250);
  }

  function handleSelectDestino(unidade: IUnidade) {
    setInputDestino(`${unidade.sigla} - ${unidade.nome}`);
    field.onChange(unidade.id);
    setSelectedDestinoId(unidade.id);
    setShowSuggestionsDestino(false);
    setSuggestionsDestino([]);
  }

  return (
    <FormItem className="relative">
      <FormLabel>Unidade de Destino</FormLabel>
      <FormControl>
        <div>
          {loadingUnidades ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Carregando unidades...
              </span>
            </div>
          ) : (
            <>
              <Input
                placeholder="Busque por sigla ou nome da unidade"
                value={inputDestino}
                onChange={handleChangeDestino}
                autoComplete="off"
                onBlur={() =>
                  setTimeout(() => setShowSuggestionsDestino(false), 200)
                }
                onFocus={() => {
                  fetchSuggestionsDestino(inputDestino);
                  setShowSuggestionsDestino(true);
                }}
                style={{ appearance: "none" }}
              />
              {showSuggestionsDestino && suggestionsDestino.length > 0 && (
                <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                  {suggestionsDestino.map((unidade) => (
                    <li
                      key={unidade.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onMouseDown={() => handleSelectDestino(unidade)}
                    >
                      {unidade.sigla} - {unidade.nome}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export default function FormAndamento({
  processoId,
  processoOrigem,
  onSuccess,
}: {
  processoId: string;
  processoOrigem: string;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { data: session } = useSession();
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destino: "",
      data_envio: new Date(), // Pré-preenchido com data atual
      prazo: undefined,
    },
  });

  // Buscar lista de unidades
  useEffect(() => {
    if (session?.access_token) {
      unidadeGrupo.listaCompleta(session.access_token).then((response) => {
        if (response.ok && response.data) {
          setUnidades(response.data as IUnidade[]);
        }
        setLoadingUnidades(false);
      });
    }
  }, [session]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Converte as datas para ISO string
      const prazoISO = data.prazo ? data.prazo.toISOString() : "";

      const dataEnvioISO = data.data_envio
        ? data.data_envio.toISOString()
        : new Date().toISOString();

      // Criar andamento
      const unidadeDestino = unidades.find((u) => u.id === data.destino);
      const result = await andamento.server.criar({
        processo_id: processoId,
        origem: processoOrigem,
        destino: unidadeDestino?.sigla || data.destino,
        data_envio: dataEnvioISO,
        prazo: prazoISO,
      } as ICreateAndamento);

      if (!result.ok) {
        toast.error("Erro", {
          description: "Não foi possível criar o andamento",
        });
      } else {
        toast.success("Andamento criado com sucesso");
        form.reset();
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
          name="destino"
          render={({ field }) => (
            <DestinoField
              field={field}
              unidades={unidades}
              loadingUnidades={loadingUnidades}
            />
          )}
        />
        <FormField
          control={form.control}
          name="data_envio"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Envio</FormLabel>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prazo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo (Data Limite)</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? undefined)}
                  placeholder="DD/MM/AAAA"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="animate-spin" /> : "Criar Andamento"}
        </Button>
      </form>
    </Form>
  );
}
