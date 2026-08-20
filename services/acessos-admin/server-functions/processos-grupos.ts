/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";
import { redirect } from "next/navigation";
import {
  IProcessoGrupo,
  IRespostaAcessosAdmin,
  NivelVisaoGrupoProcesso,
} from "@/types/grupo";

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = await response.json();
    if (data?.message && typeof data.message === "string") return data.message;
  } catch {
    // mantém fallback
  }
  return fallback;
}

export async function listarGruposProcesso(
  processoId: string,
): Promise<IRespostaAcessosAdmin<{ total: number; data: IProcessoGrupo[] }>> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/processos/${processoId}/grupos`,
      {
        method: "GET",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao listar grupos do processo"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao listar grupos do processo: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function vincularProcessoGrupo(
  processoId: string,
  grupoId: string,
  dados: { nivelVisao?: NivelVisaoGrupoProcesso; ativo?: boolean },
): Promise<IRespostaAcessosAdmin<IProcessoGrupo>> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/processos/${processoId}/grupos/${grupoId}`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        body: JSON.stringify(dados),
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao vincular processo ao grupo"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao vincular processo ao grupo: ${error}`,
      data: null,
      status: 500,
    };
  }
}
