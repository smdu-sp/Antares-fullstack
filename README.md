<p align="center">
  <a href="https://www.prefeitura.sp.gov.br/cidade/secretarias/licenciamento/" target="blank"><img src="https://www.prefeitura.sp.gov.br/cidade/secretarias/upload/chamadas/URBANISMO_E_LICENCIAMENTO_HORIZONTAL_FUNDO_CLARO_1665756993.png" width="200" alt="SMUL Logo" /></a>
</p>

# Antares

Sistema de gerenciamento de processos e andamentos - SMUL/ATIC

## 📋 Sobre o Projeto

Aplicação **fullstack** em Next.js (App Router) para controle e acompanhamento de processos administrativos. Não há backend separado: Route Handlers e Server Actions falam direto com o banco via Prisma, no mesmo processo do Next.js.

### Processos e Andamentos
- ✅ **Gestão Completa**: Criação, edição e acompanhamento de processos e andamentos
- ✅ **Grid Interativa**: Visualização em tabela com AG-Grid (expandir/colapsar detalhes)
- ✅ **Seleção Múltipla**: Checkboxes para operações em lote
- ✅ **Edição em Lote**: Concluir, prorrogar ou excluir múltiplos andamentos simultaneamente
- ✅ **Resposta Final**: Conclusão automática de andamentos ao finalizar processo

### Exportação
- 📄 **Exportação Individual**: Excel ou PDF com opções de incluir/excluir andamentos
- 📦 **Exportação em Lote**: Processos selecionados ou filtros aplicados
- 🔍 **Filtros Inteligentes**: Exporta respeitando buscas e filtros ativos

### Dashboard e Relatórios
- 📊 **Métricas em Tempo Real**: Total, em andamento, vencendo hoje, atrasados e concluídos
- 📈 **Gráficos Interativos**: Visualização de dados de processos e andamentos
- 🎯 **Cards de Resumo**: Com toggle para ocultar/mostrar (padrão oculto)

### Personalização
- 🎨 **Tema Claro/Escuro**: Alternância entre temas
- 📐 **Preferências Persistentes**: Ordem, largura e visibilidade de colunas salvas no banco de dados
- 👤 **Perfil de Usuário**: Configurações individuais por usuário

### Segurança e Controle
- 🔐 **Autenticação LDAP**: Login integrado com Active Directory (`ENVIRONMENT=local` no `.env` pula o bind LDAP, útil em desenvolvimento)
- 🔑 **Autorização por grupos**: permissão de sistema (`DEV` = acesso total; qualquer outra permissão depende 100% do papel real do usuário dentro do seu grupo ativo) + papel por grupo (ADM/TEC/USR) + capacidades granulares (visualizar/modificar/excluir) por vínculo usuário-grupo
- 📝 **Sistema de Logs**: Auditoria completa de ações
- 👥 **Gerenciamento de Usuários e Grupos**: Controle de permissões, unidades e grupos de acesso (tela DEV em `/grupos-acesso`)

## 🚀 Tecnologias

### Core
- **[Next.js 15](https://nextjs.org/)** - Framework React com App Router, Server Components, Route Handlers e Server Actions
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática e segurança de código
- **[React 19](https://react.dev/)** - Biblioteca UI com hooks modernos

### Dados
- **[Prisma](https://www.prisma.io/)** - ORM sobre MySQL, usado diretamente pelos Route Handlers/Server Actions (sem API HTTP intermediária)
- **MySQL** - Banco de dados relacional

### UI/UX
- **[Shadcn/ui](https://ui.shadcn.com/)** - Componentes acessíveis e customizáveis
- **[TailwindCSS](https://tailwindcss.com/)** - Estilização utilitária responsiva
- **[AG-Grid Community](https://www.ag-grid.com/)** - Grid avançada com edição inline e expansão
- **[Recharts](https://recharts.org/)** - Gráficos e visualizações de dados
- **[Lucide React](https://lucide.dev/)** - Ícones modernos

### Estado e Dados no cliente
- **[TanStack Query](https://tanstack.com/query)** - Cache e sincronização de dados
- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[Zod](https://zod.dev/)** - Validação de schemas (nos Route Handlers/Server Actions, porta dos antigos DTOs)

### Exportação
- **[ExcelJS](https://github.com/exceljs/exceljs)** / **[PDFKit](http://pdfkit.org/)** - Geração de planilhas e PDFs, chamados diretamente das Server Actions

### Autenticação
- **[Auth.js v5](https://authjs.dev/)** - Sessão JWT, com LDAP (`ldapts`) para bind de login e busca de usuários

## 📦 Pré-requisitos

- Node.js 18+
- MySQL acessível (localmente, geralmente via Docker) apontado por `DATABASE_URL`
- Acesso ao LDAP/AD (produção) — em desenvolvimento, `ENVIRONMENT=local` dispensa isso

## 🔧 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/smdu-sp/Antares-frontend.git
cd Antares-frontend
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
copy example.env .env
```

Edite o `.env` — principais variáveis:

```properties
# Nome do projeto
NEXT_PUBLIC_PROJECT_NAME="Sistema Antares"

# Segredo de autenticação do NextAuth (gere um novo, veja abaixo)
AUTH_SECRET=

# URL do próprio frontend
AUTH_URL=http://localhost:3001

# Banco de dados
DATABASE_URL="mysql://user:pass@localhost:3306/antares"

# JWT legado (par de tokens de acesso/refresh usado pelas chamadas internas
# de services/* aos Route Handlers em app/api/**)
JWT_SECRET=
RT_SECRET=

# LDAP/AD — "local" pula o bind LDAP no login (usa só a senha cadastrada localmente)
ENVIRONMENT=local
LDAP_SERVER=
LDAP_DOMAIN=
LDAP_BASE=
USER_LDAP=
PASS_LDAP=
```

4. **Gere um `AUTH_SECRET`**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. **Prepare o banco**

```bash
npx prisma generate
npx prisma migrate deploy
```

## 🎯 Executando a Aplicação

### Modo Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3001](http://localhost:3001)

### Build de Produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
app/
├── (rotas-auth)/               # Rotas protegidas (requer autenticação)
│   ├── page.tsx                 # Dashboard com métricas e grid de processos
│   ├── processos/                # Gestão de processos e andamentos
│   ├── interessados/             # Cadastro de interessados
│   ├── usuarios/                 # Gerenciamento de usuários
│   ├── unidades/                 # Cadastro de unidades
│   ├── grupos-acesso/             # Tela DEV: grupos, vínculos processo-grupo, matriz de permissões
│   ├── perfil/                   # Perfil e configurações do usuário
│   └── logs/                     # Logs e auditoria do sistema
├── (rotas-livres)/              # Rotas públicas
│   └── login/                    # Página de autenticação
└── api/                         # Route Handlers — 1:1 com a antiga API do backend,
                                   # chamam lib/server/**/*.ts (Prisma direto)

components/
├── ui/                          # Primitivos Shadcn/ui
├── sidebar/                     # Navegação e menu lateral
├── charts/                      # Componentes de gráficos (Recharts)
├── processos-spreadsheet.tsx    # Grid principal AG-Grid
├── export-*.tsx                 # Botões de exportação (individual/lote)
├── avatar-uploader.tsx          # Upload de avatar de usuário
└── filtros.tsx                  # Componente de busca e filtros

services/<dominio>/
├── query-functions/             # Leitura, chamam app/api/** (same-origin)
├── server-functions/            # Escrita, idem
└── client-functions/            # Helpers client-side (ex.: download de blob)

lib/
├── auth/
│   ├── auth.ts                  # Instância NextAuth completa (Node: Server Components/Actions/Route Handlers)
│   ├── auth.node.config.ts       # Config completa (Prisma, LDAP, resolução de grupo ativo)
│   ├── auth.middleware.ts        # Instância NextAuth exclusiva do middleware (Edge Runtime)
│   └── auth.config.ts            # Config leve Edge-safe (sem Prisma/LDAP)
├── server/
│   ├── auth/                    # requireAuth/requirePermissoes/requireCapacidade (porte dos guards)
│   ├── <dominio>/                # Lógica de negócio por domínio, chamada pelos Route Handlers
│   └── validation/                # Schemas Zod por domínio
├── prisma.ts                    # Singleton do Prisma Client
└── access-control.ts             # canRead/canEdit/canAdmin (usados pela UI e pelo middleware)

types/
├── processo.ts                  # Tipos de processos e andamentos
├── usuario.ts                   # Tipos de usuários
├── unidade.ts                   # Tipos de unidades
└── grupo.ts / grupo-ativo.ts     # Tipos do modelo de grupos/permissões

prisma/
├── schema.prisma                # Schema do banco
└── migrations/                   # Histórico de migrações
```

## 🔐 Modelo de autorização

Três camadas, checadas nessa ordem em cada Route Handler:

1. **Permissão de sistema** (`usuario.permissao`): só `DEV` tem bypass total (acesso a tudo, em qualquer grupo). As demais (`ADM`/`TEC`/`USR`) não têm nenhum privilégio especial de sistema — todo o resto do acesso vem exclusivamente do papel do usuário dentro do seu **grupo ativo**.
2. **Papel no grupo ativo** (`usuario_grupo.permissao_grupo`: `ADM`/`TEC`/`USR`) — verificado por `requirePermissoes()`.
3. **Capacidades granulares** por vínculo usuário-grupo (`visualizar_proprios`/`visualizar_grupo`/`modificar_proprios`/`modificar_grupo`/`excluir`) — verificadas por `requireCapacidade()`. O grupo `GABINETE` tem uma regra especial: `visualizar_grupo` dá visibilidade global de processos, não só do próprio grupo.

O "grupo ativo" (qual dos grupos do usuário está em uso na sessão) é resolvido em `lib/server/auth/obter-grupo-ativo.ts` e persistido tanto em `preferencias_usuario` (chave `auth.grupo_ativo_id`) quanto no próprio cookie de sessão (via callback `jwt()`), para que o middleware (Edge Runtime, sem acesso a Prisma) consiga tomar decisões de autorização sem nenhuma chamada de rede.

Usuários com permissão `DEV` são automaticamente vinculados a um grupo técnico interno ("Grupo DEV") só para satisfazer telas que exigem um grupo ativo resolvido — esse vínculo não concede nenhuma autorização extra, o bypass de `DEV` já é incondicional.

## 🩺 Resolução de problemas comuns

**Preferências não salvam:**
- Verifique se o usuário está autenticado corretamente
- Confirme que a tabela `preferencias_usuario` existe no banco (`npx prisma migrate status`)

**Exportação não funciona:**
- Verifique o console do servidor (`npm run dev`) por erros do ExcelJS/PDFKit
- Verifique se o navegador não está bloqueando downloads

**Login falha:**
- Em desenvolvimento, confirme `ENVIRONMENT=local` no `.env` se não tiver LDAP configurado
- Em produção, confirme `LDAP_SERVER`/`LDAP_DOMAIN`/`LDAP_BASE`/`USER_LDAP`/`PASS_LDAP`

## 📝 Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento com hot-reload (porta 3001)
npm run build      # Build de produção com otimizações
npm start           # Servidor de produção (porta 3201)
npm run lint        # Executa ESLint
```

## 🔄 Fluxo de Deploy

1. Execute `npm run build` para verificar se compila sem erros
2. Corrija quaisquer erros de TypeScript ou ESLint
3. Teste localmente com `npm start`
4. Faça commit e push para o repositório
5. Configure variáveis de ambiente no servidor de produção
6. Rode `npx prisma migrate deploy` antes de subir a nova versão, se houver migração pendente
7. Execute build e start no servidor

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Faça suas alterações e teste localmente
3. Execute `npm run lint` e `npm run build` para validar
4. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
5. Push para a branch (`git push origin feature/MinhaFeature`)
6. Abra um Pull Request com descrição detalhada

**Convenções:**
- Use TypeScript para novos arquivos
- Siga os padrões de código existentes
- Ao portar/alterar lógica de autorização, verifique as três camadas descritas acima

## 📄 Licença

Este projeto é propriedade da **Prefeitura Municipal de São Paulo - SMUL (Secretaria Municipal de Urbanismo e Licenciamento)**.

Desenvolvido por: **ATIC - Assessoria Técnica de Informação e Comunicação**

## 📞 Suporte

Para dúvidas, problemas ou sugestões:
- Contate a equipe ATIC da SMUL
- Abra uma issue no repositório do GitHub

---

**Última atualização:** Agosto/2026
**Versão:** 2.0.0 (fullstack)
