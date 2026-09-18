import { createHash } from 'crypto';

/**
 * Hash usado só pra caber a unicidade de Interessado.valor num índice
 * composto com grupo_id (ver comentário no campo `valorHash` em
 * schema.prisma — o valor cru, até 768 chars em utf8mb4, não cabe no limite
 * de chave do InnoDB junto com grupo_id).
 *
 * Hasheia exatamente a string que vai ser gravada em `valor` — SEM nenhuma
 * normalização (nem trim, nem lowercase) — de propósito. A checagem de
 * duplicata que importa pro usuário (case/collation-insensível, replicando o
 * comportamento de sempre) continua sendo feita pela query normal em
 * criar.ts/atualizar.ts (`WHERE valor = ...`, que usa a collation
 * `_unicode_ci` da coluna); este hash é só um backstop de unicidade EXATA no
 * banco (ex.: contra corrida de duas requisições simultâneas com o texto
 * idêntico). Já tentamos normalizar aqui (trim, depois lowercase) e os dois
 * bateram de frente com dado real de produção: existem centenas de pares de
 * interessados que só diferem por um espaço no início/fim ou por
 * maiúscula/minúscula e que a collation do MySQL trata como DISTINTOS (nunca
 * foram deduplicados) — normalizar no hash colapsava esses pares.
 */
export function hashValorInteressado(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}
