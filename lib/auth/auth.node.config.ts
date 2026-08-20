/** @format */

// Config completa (Node.js) do NextAuth — usada por app/api/auth/[...nextauth]
// e por todo o resto do app (Server Components, Server Actions, Route Handlers).
// NÃO importar este arquivo a partir de middleware.ts: ele toca Prisma/LDAP/jsonwebtoken,
// que não rodam no Edge Runtime. O middleware usa a config leve em auth.config.ts.

import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { jwtDecode } from "jwt-decode";
import type { IGrupoAtivo } from "@/types/grupo-ativo";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { validateCredentials } from "@/lib/server/auth/validate-credentials";
import { getTokens } from "@/lib/server/auth/tokens";
import { obterGrupoAtivo } from "@/lib/server/auth/obter-grupo-ativo";
import { validaUsuario } from "@/lib/server/usuarios/valida-usuario";

function asNonEmptyString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function normalizarGrupoAtivo(payload: unknown): IGrupoAtivo | null {
  if (!payload || typeof payload !== "object") return null;

  const rawRoot = payload as {
    data?: unknown;
    id?: unknown;
    grupoAtivoId?: unknown;
    grupo_ativo_id?: unknown;
    grupoAtivo?: unknown;
    grupo?: unknown;
    nome?: unknown;
    sigla?: unknown;
    codigo?: unknown;
    membroAtivo?: unknown;
    membro_ativo?: unknown;
    gruposDisponiveis?: unknown;
    grupos_disponiveis?: unknown;
    grupos?: unknown;
  };

  const root =
    rawRoot.data && typeof rawRoot.data === "object"
      ? (rawRoot.data as typeof rawRoot)
      : rawRoot;

  const grupoAninhado =
    root.grupoAtivo && typeof root.grupoAtivo === "object"
      ? (root.grupoAtivo as {
          id?: unknown;
          grupoAtivoId?: unknown;
          grupo_ativo_id?: unknown;
          nome?: unknown;
          sigla?: unknown;
          codigo?: unknown;
          membroAtivo?: unknown;
          membro_ativo?: unknown;
          gruposDisponiveis?: unknown;
          grupos_disponiveis?: unknown;
        })
      : null;

  const gruposDisponiveisRaw =
    root.gruposDisponiveis ||
    root.grupos_disponiveis ||
    grupoAninhado?.gruposDisponiveis ||
    grupoAninhado?.grupos_disponiveis ||
    root.grupos ||
    [];

  const gruposDisponiveis = Array.isArray(gruposDisponiveisRaw)
    ? gruposDisponiveisRaw
        .map((grupo) => {
          if (!grupo || typeof grupo !== "object") return null;

          const g = grupo as {
            id?: unknown;
            grupoId?: unknown;
            grupo_id?: unknown;
            nome?: unknown;
            sigla?: unknown;
            codigo?: unknown;
          };

          const id =
            asNonEmptyString(g.id) ||
            asNonEmptyString(g.grupoId) ||
            asNonEmptyString(g.grupo_id) ||
            "";

          if (!id) return null;

          return {
            id,
            nome: typeof g.nome === "string" ? g.nome : id,
            sigla:
              (typeof g.sigla === "string" && g.sigla) ||
              (typeof g.codigo === "string" && g.codigo) ||
              undefined,
          };
        })
        .filter((grupo): grupo is NonNullable<typeof grupo> => !!grupo)
    : [];

  const grupoDireto =
    root.grupo && typeof root.grupo === "object"
      ? (root.grupo as { id?: unknown; nome?: unknown; sigla?: unknown; codigo?: unknown })
      : null;

  const idFromPayload =
    asNonEmptyString(root.id) ||
    asNonEmptyString(root.grupoAtivoId) ||
    asNonEmptyString(root.grupo_ativo_id) ||
    asNonEmptyString(grupoAninhado?.id) ||
    asNonEmptyString(grupoAninhado?.grupoAtivoId) ||
    asNonEmptyString(grupoAninhado?.grupo_ativo_id) ||
    asNonEmptyString(grupoDireto?.id) ||
    "";

  const idFallbackUnicoGrupo =
    gruposDisponiveis.length === 1 ? gruposDisponiveis[0]?.id || "" : "";

  const id = idFromPayload || idFallbackUnicoGrupo;
  if (!id) return null;

  return {
    id,
    nome:
      (typeof root.nome === "string" && root.nome) ||
      (typeof grupoAninhado?.nome === "string" && grupoAninhado.nome) ||
      (typeof grupoDireto?.nome === "string" && grupoDireto.nome) ||
      "",
    sigla:
      (typeof root.sigla === "string" && root.sigla) ||
      (typeof grupoAninhado?.sigla === "string" && grupoAninhado.sigla) ||
      (typeof grupoDireto?.sigla === "string" && grupoDireto.sigla) ||
      undefined,
    codigo:
      (typeof root.codigo === "string" && root.codigo) ||
      (typeof grupoAninhado?.codigo === "string" && grupoAninhado.codigo) ||
      (typeof grupoDireto?.codigo === "string" && grupoDireto.codigo) ||
      undefined,
    membroAtivo:
      (root.membroAtivo && typeof root.membroAtivo === "object"
        ? (root.membroAtivo as IGrupoAtivo["membroAtivo"])
        : root.membro_ativo && typeof root.membro_ativo === "object"
          ? (root.membro_ativo as IGrupoAtivo["membroAtivo"])
          : grupoAninhado?.membroAtivo &&
              typeof grupoAninhado.membroAtivo === "object"
            ? (grupoAninhado.membroAtivo as IGrupoAtivo["membroAtivo"])
            : grupoAninhado?.membro_ativo &&
                typeof grupoAninhado.membro_ativo === "object"
              ? (grupoAninhado.membro_ativo as IGrupoAtivo["membroAtivo"])
              : undefined) || undefined,
    gruposDisponiveis:
      gruposDisponiveis.length > 0
        ? (gruposDisponiveis as IGrupoAtivo["gruposDisponiveis"])
        : undefined,
  };
}

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      type: "credentials",
      async authorize(credentials) {
        if (credentials?.login && credentials?.senha) {
          const { login, senha } = credentials as { login: string; senha: string };
          try {
            const usuario = await validateCredentials(login, senha);
            // O shape retornado ({access_token, refresh_token}) não é o `User` padrão do
            // NextAuth — é assim desde a versão original (baseada em fetch + JSON solto).
            return getTokens(usuario) as unknown as import("next-auth").User;
          } catch (error) {
            console.error(
              "Erro na autenticação:",
              error instanceof Error ? error.message : error,
            );
            return null;
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.usuario) {
          const tokenUser = token.user as {
            usuario?: {
              avatar?: string;
              permissao?: string;
              nomeSocial?: string;
            };
            grupoAtivo?: unknown;
          };

          if (tokenUser.usuario) {
            tokenUser.usuario.avatar = session.usuario.avatar;
            tokenUser.usuario.permissao = session.usuario.permissao;
            tokenUser.usuario.nomeSocial = session.usuario.nomeSocial;
          }
          tokenUser.grupoAtivo = session.grupoAtivo;
          return token;
        }
      }
      if (user) token.user = user;

      // Mantém o grupoAtivo persistido no próprio cookie de sessão, resolvido aqui
      // (Node, com Prisma) em toda requisição — isso é o que permite o middleware
      // (Edge, sem Prisma) ler grupoAtivo direto do token, sem precisar de rede nem
      // do backend NestJS legado (ver definirGrupoAtivo/obterGrupoAtivo).
      const tokenUser = token.user as
        | { access_token?: string; grupoAtivo?: unknown }
        | undefined;

      if (tokenUser?.access_token) {
        try {
          const { sub } = jwtDecode<{ sub?: string }>(tokenUser.access_token);
          if (sub) {
            const grupoAtivoResponse = await obterGrupoAtivo(sub);
            const grupoNormalizado = normalizarGrupoAtivo(grupoAtivoResponse);
            if (grupoNormalizado) {
              tokenUser.grupoAtivo = grupoNormalizado;
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Erro ao atualizar grupo ativo no token:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session = token.user as typeof session;

      if (session.access_token && !session.usuario)
        session.usuario = jwtDecode(session.access_token);
      const now = new Date();
      if (session.usuario?.exp && session.usuario.exp * 1000 < now.getTime()) {
        // Só tenta renovar se houver refresh_token
        if (!session.refresh_token) {
          return session;
        }

        try {
          const payload = jwt.verify(session.refresh_token, process.env.RT_SECRET as string) as {
            sub: string;
          };
          const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
          if (usuario) {
            const { access_token, refresh_token } = getTokens(usuario);
            session.access_token = access_token;
            session.refresh_token = refresh_token;
            session.usuario = jwtDecode(access_token);
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Erro ao renovar token:", error);
          }
        }
      }
      if (session.access_token && session.usuario?.sub) {
        try {
          await validaUsuario(session.usuario.sub);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Erro ao validar usuário:", error);
          }
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
