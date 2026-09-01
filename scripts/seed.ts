import { getDatabasePool, closeDatabasePool } from '../backend/db/client';
import { logger } from '../backend/core/logger';
import { EMPRESAS_GRUPO } from '../backend/core/types/company';

async function runSeeds() {
  logger.info('Iniciando seed do banco de dados (5 Empresas do Grupo + Usuário SuperAdmin)...');
  const pool = getDatabasePool();
  if (!pool) {
    logger.warn('Banco de dados não configurado ou DATABASE_URL indisponível. Ignorando seed.');
    return;
  }
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed 5 Companies
    for (const emp of EMPRESAS_GRUPO) {
      await client.query(
        `
        INSERT INTO empresas (id, codigo, razao_social, nome_fantasia, cnpj, inscricao_estadual, regime_tributario, ramo_atividade, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (cnpj) DO UPDATE SET
          razao_social = EXCLUDED.razao_social,
          nome_fantasia = EXCLUDED.nome_fantasia,
          regime_tributario = EXCLUDED.regime_tributario,
          ramo_atividade = EXCLUDED.ramo_atividade;
        `,
        [
          emp.id,
          emp.codigo,
          emp.razaoSocial,
          emp.nomeFantasia,
          emp.cnpj,
          emp.inscricaoEstadual || null,
          emp.regimeTributario,
          emp.ramoAtividade,
        ]
      );
      logger.info(`Empresa seeded: [${emp.codigo}] ${emp.nomeFantasia}`);
    }

    // 2. Seed Superadmin User
    const superAdminRes = await client.query(
      `
      INSERT INTO usuarios (nome, email, senha_hash, is_super_admin, ativo)
      VALUES ($1, $2, $3, true, true)
      ON CONFLICT (email) DO UPDATE SET is_super_admin = true
      RETURNING id;
      `,
      [
        'Administrador do Sistema',
        'admin@industrialgroup.com.br',
        '$2b$12$e8Y6bMskLw2XmP8Y6bMsk.N0nCkeUvGjD5E8aH3uN9QpX.ExampleHash',
      ]
    );

    const superAdminId = superAdminRes.rows[0]?.id;

    // 3. Link Superadmin to all 5 companies
    if (superAdminId) {
      for (const emp of EMPRESAS_GRUPO) {
        await client.query(
          `
          INSERT INTO usuario_empresas (usuario_id, empresa_id, ativo)
          VALUES ($1, $2, true)
          ON CONFLICT (usuario_id, empresa_id) DO NOTHING;
          `,
          [superAdminId, emp.id]
        );
      }
    }

    await client.query('COMMIT');
    logger.info('Seed concluído com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Erro durante o seed', err);
    throw err;
  } finally {
    client.release();
    await closeDatabasePool();
  }
}

if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  runSeeds().catch((err) => {
    logger.error('Falha fatal no seed', err);
    process.exit(1);
  });
}

export { runSeeds };
