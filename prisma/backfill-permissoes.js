/**
 * Seed do catálogo de Permissoes + backfill de UsuarioPermissoes a partir das
 * antigas colunas boolean de UsuarioGrupoPermissao. Idempotente: pode rodar
 * mais de uma vez sem duplicar linhas.
 *
 * Uso: node prisma/backfill-permissoes.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SUFIXOS_BOOLEAN = [
  'visualizar_proprios',
  'visualizar_grupo',
  'modificar_proprios',
  'modificar_grupo',
  'excluir',
];

const ENTIDADES = ['processo', 'andamento'];

const DESCRICOES = {
  visualizar_proprios: 'Visualizar {entidade} próprios (atribuídos ao usuário)',
  visualizar_grupo: 'Visualizar {entidade} do grupo',
  modificar_proprios: 'Modificar {entidade} próprios',
  modificar_grupo: 'Modificar {entidade} do grupo',
  excluir: 'Excluir {entidade}',
};

const NOME_ENTIDADE = { processo: 'processos', andamento: 'andamentos' };

async function seedPermissoes() {
  const linhas = [];
  for (const entidade of ENTIDADES) {
    for (const sufixo of SUFIXOS_BOOLEAN) {
      linhas.push({
        codigo: `${entidade}.${sufixo}`,
        descricao: DESCRICOES[sufixo].replace('{entidade}', NOME_ENTIDADE[entidade]),
      });
    }
  }

  for (const linha of linhas) {
    await prisma.permissoes.upsert({
      where: { codigo: linha.codigo },
      create: linha,
      update: { descricao: linha.descricao },
    });
  }

  console.log(`Seed de permissões: ${linhas.length} códigos garantidos.`);
  return prisma.permissoes.findMany({ where: { codigo: { in: linhas.map((l) => l.codigo) } } });
}

async function backfillUsuarioPermissoes(permissoes) {
  const permissaoPorCodigo = new Map(permissoes.map((p) => [p.codigo, p]));

  const vinculosPermissao = await prisma.usuarioGrupoPermissao.findMany({
    where: { ativo: true },
    include: { usuarioGrupo: { select: { usuario_id: true, grupo_id: true, ativo: true } } },
  });

  let criadas = 0;
  let existentes = 0;

  for (const item of vinculosPermissao) {
    if (!item.usuarioGrupo?.ativo) continue;

    const { usuario_id, grupo_id } = item.usuarioGrupo;

    for (const sufixo of SUFIXOS_BOOLEAN) {
      if (!item[sufixo]) continue;

      for (const entidade of ENTIDADES) {
        const codigo = `${entidade}.${sufixo}`;
        const permissao = permissaoPorCodigo.get(codigo);
        if (!permissao) continue;

        const existente = await prisma.usuarioPermissoes.findFirst({
          where: { usuario_id, grupo_id, permissao_id: permissao.id },
          select: { id: true, ativo: true },
        });

        if (existente) {
          if (!existente.ativo) {
            await prisma.usuarioPermissoes.update({ where: { id: existente.id }, data: { ativo: true } });
          }
          existentes += 1;
        } else {
          await prisma.usuarioPermissoes.create({
            data: { usuario_id, grupo_id, permissao_id: permissao.id, ativo: true },
          });
          criadas += 1;
        }
      }
    }
  }

  console.log(`Backfill de usuarios_permissoes: ${criadas} criadas, ${existentes} já existiam.`);
}

async function main() {
  const permissoes = await seedPermissoes();
  await backfillUsuarioPermissoes(permissoes);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
