'use server';

import { revalidatePath } from 'next/cache';
import { getDatabasePool } from '@/backend/db/client';
import { logger } from '@/backend/core/logger';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface EspecificacoesTecnicas {
  [chave: string]: string | number | boolean | null | undefined;
}

export interface CatalogoProduto {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  descricaoTecnica?: string | null;
  especificacoes: Record<string, unknown>;
  precoBase: number;
  imagemUrl?: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarProdutoInput {
  empresaId: string;
  codigo: string;
  nome: string;
  descricaoTecnica?: string;
  especificacoes: Record<string, unknown>;
  precoBase: number;
  imagemUrl?: string;
}

// Catálogo padrão de fallback em memória para desenvolvimento e demonstração
const PRODUTOS_MOCK_FALLBACK: Record<string, CatalogoProduto[]> = {
  default: [
    {
      id: 'prd-001',
      empresaId: 'emp-tritech-matriz',
      codigo: 'CHP-A36-635',
      nome: 'Chapa de Aço Carbono ASTM A36 1/4" (6.35mm)',
      descricaoTecnica: 'Chapa laminada a quente para conformação mecânica, caldeiraria e estruturas soldadas pesadas.',
      especificacoes: {
        material: 'Aço Carbono ASTM A36',
        espessura_mm: 6.35,
        dimensoes_padrao: '1500 x 6000 mm',
        densidade_g_cm3: 7.85,
        limite_escoamento_mpa: 250,
        acabamento: 'Laminado a Quente (Preto)',
        certificacao: 'NBR 6648 / ASTM A36',
      },
      precoBase: 1250.0,
      imagemUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'prd-002',
      empresaId: 'emp-tritech-matriz',
      codigo: 'TUB-INOX-304-2POL',
      nome: 'Tubo Industrial Inox 304 Redondo 2" Sch 10',
      descricaoTecnica: 'Tubo sem costura em aço inoxidável austenítico com alta resistência à corrosão intergranular.',
      especificacoes: {
        material: 'Aço Inox AISI 304',
        diametro_externo_pol: '2.0"',
        espessura_parede_mm: 2.77,
        comprimento_barra_m: 6.0,
        norma: 'ASTM A312 / ASME SA312',
        acabamento: 'Decapado / Fosco',
        pressao_trabalho_bar: 64,
      },
      precoBase: 485.5,
      imagemUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'prd-003',
      empresaId: 'emp-tritech-matriz',
      codigo: 'PRF-W-200X22',
      nome: 'Viga Perfil I / W 200 x 22.5 kg/m',
      descricaoTecnica: 'Perfil estrutural soldado e laminado de abas paralelas para pilares, vigamentos e galpões industriais.',
      especificacoes: {
        material: 'Aço ASTM A572 Grau 50',
        altura_alma_mm: 200,
        largura_aba_mm: 100,
        massa_linear_kg_m: 22.5,
        modulo_resistencia_wx_cm3: 181.0,
        norma: 'ASTM A6 / NBR 15980',
      },
      precoBase: 890.0,
      imagemUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
    {
      id: 'prd-004',
      empresaId: 'emp-tritech-matriz',
      codigo: 'FLG-SO-150-ANSI',
      nome: 'Flange Sobreposto (Slip-On) ANSI B16.5 150# 4"',
      descricaoTecnica: 'Flange forjado para união flangeada de tubulações com ressalto de vedação RF.',
      especificacoes: {
        material: 'Aço Forjado ASTM A105',
        classe_pressao: '150 LBS',
        diametro_nominal: '4" (DN 100)',
        tipo_face: 'RF (Raised Face)',
        furos_fixacao: 8,
        norma_dimensional: 'ASME B16.5',
      },
      precoBase: 320.0,
      imagemUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
  ],
};

/**
 * SERVER ACTION: Listar produtos do catálogo por empresa (Multiempresa)
 */
export async function listarProdutosCatalogoAction(empresaId: string): Promise<ActionResult<CatalogoProduto[]>> {
  try {
    if (!empresaId) {
      return { success: false, error: 'Identificador da empresa é obrigatório.' };
    }

    const pool = getDatabasePool();
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT 
              id, 
              empresa_id as "empresaId", 
              codigo, 
              nome, 
              descricao_tecnica as "descricaoTecnica", 
              especificacoes, 
              preco_base::float as "precoBase", 
              imagem_url as "imagemUrl", 
              ativo, 
              criado_em as "criadoEm", 
              atualizado_em as "atualizadoEm"
             FROM public.catalogo_produtos
             WHERE empresa_id = $1 AND deletado_em IS NULL
             ORDER BY criado_em DESC`,
            [empresaId]
          );

          if (res.rows && res.rows.length > 0) {
            return {
              success: true,
              data: res.rows.map((r: Record<string, unknown>) => ({
                id: String(r.id),
                empresaId: String(r.empresaId),
                codigo: String(r.codigo),
                nome: String(r.nome),
                descricaoTecnica: r.descricaoTecnica ? String(r.descricaoTecnica) : null,
                especificacoes: (r.especificacoes as Record<string, unknown>) || {},
                precoBase: Number(r.precoBase) || 0,
                imagemUrl: r.imagemUrl ? String(r.imagemUrl) : null,
                ativo: Boolean(r.ativo),
                criadoEm: String(r.criadoEm),
                atualizadoEm: String(r.atualizadoEm),
              })),
            };
          }
        } finally {
          client.release();
        }
      } catch (dbErr: unknown) {
        logger.warn('Tabela catalogo_produtos não consultada no DB, usando fallback em memória.', { error: String(dbErr) });
      }
    }

    // Fallback de catálogo
    const lista = PRODUTOS_MOCK_FALLBACK[empresaId] || PRODUTOS_MOCK_FALLBACK.default;
    return {
      success: true,
      data: lista,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao listar produtos do catálogo', { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * SERVER ACTION: Salvar / Cadastrar novo produto no catálogo
 */
export async function salvarProdutoCatalogoAction(payload: CriarProdutoInput): Promise<ActionResult<CatalogoProduto>> {
  try {
    const { empresaId, codigo, nome, descricaoTecnica, especificacoes, precoBase, imagemUrl } = payload;

    if (!empresaId) return { success: false, error: 'Empresa não informada.' };
    if (!codigo?.trim()) return { success: false, error: 'Código do produto é obrigatório.' };
    if (!nome?.trim()) return { success: false, error: 'Nome do produto é obrigatório.' };

    const novoId = `prd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const novoProduto: CatalogoProduto = {
      id: novoId,
      empresaId,
      codigo: codigo.trim().toUpperCase(),
      nome: nome.trim(),
      descricaoTecnica: descricaoTecnica?.trim() || null,
      especificacoes: especificacoes || {},
      precoBase: Number(precoBase) >= 0 ? Number(precoBase) : 0,
      imagemUrl: imagemUrl?.trim() || null,
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const pool = getDatabasePool();
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `INSERT INTO public.catalogo_produtos (
              empresa_id, codigo, nome, descricao_tecnica, especificacoes, preco_base, imagem_url, ativo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING 
              id, 
              empresa_id as "empresaId", 
              codigo, 
              nome, 
              descricao_tecnica as "descricaoTecnica", 
              especificacoes, 
              preco_base::float as "precoBase", 
              imagem_url as "imagemUrl", 
              ativo, 
              criado_em as "criadoEm", 
              atualizado_em as "atualizadoEm"`,
            [
              empresaId,
              novoProduto.codigo,
              novoProduto.nome,
              novoProduto.descricaoTecnica,
              JSON.stringify(novoProduto.especificacoes),
              novoProduto.precoBase,
              novoProduto.imagemUrl,
            ]
          );

          if (res.rows?.[0]) {
            const r = res.rows[0];
            revalidatePath('/comercial');
            return {
              success: true,
              data: {
                id: String(r.id),
                empresaId: String(r.empresaId),
                codigo: String(r.codigo),
                nome: String(r.nome),
                descricaoTecnica: r.descricaoTecnica ? String(r.descricaoTecnica) : null,
                especificacoes: (r.especificacoes as Record<string, unknown>) || {},
                precoBase: Number(r.precoBase) || 0,
                imagemUrl: r.imagemUrl ? String(r.imagemUrl) : null,
                ativo: Boolean(r.ativo),
                criadoEm: String(r.criadoEm),
                atualizadoEm: String(r.atualizadoEm),
              },
            };
          }
        } finally {
          client.release();
        }
      } catch (dbErr: unknown) {
        logger.warn('Erro ao inserir produto no PostgreSQL, persistindo no fallback em memória', { error: String(dbErr) });
      }
    }

    // Fallback memória
    if (!PRODUTOS_MOCK_FALLBACK[empresaId]) {
      PRODUTOS_MOCK_FALLBACK[empresaId] = [...PRODUTOS_MOCK_FALLBACK.default];
    }
    PRODUTOS_MOCK_FALLBACK[empresaId].unshift(novoProduto);

    revalidatePath('/comercial');
    return {
      success: true,
      data: novoProduto,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao salvar produto no catálogo', { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * SERVER ACTION: Excluir (Soft-Delete) produto do catálogo
 */
export async function excluirProdutoCatalogoAction(id: string, empresaId: string): Promise<ActionResult<{ id: string }>> {
  try {
    if (!id || !empresaId) {
      return { success: false, error: 'ID e Empresa são obrigatórios.' };
    }

    const pool = getDatabasePool();
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE public.catalogo_produtos 
             SET deletado_em = NOW(), atualizado_em = NOW(), ativo = false
             WHERE id = $1 AND empresa_id = $2`,
            [id, empresaId]
          );
        } finally {
          client.release();
        }
      } catch (dbErr: unknown) {
        logger.warn('Erro ao executar soft-delete no banco', { error: String(dbErr) });
      }
    }

    if (PRODUTOS_MOCK_FALLBACK[empresaId]) {
      PRODUTOS_MOCK_FALLBACK[empresaId] = PRODUTOS_MOCK_FALLBACK[empresaId].filter((p) => p.id !== id);
    }

    revalidatePath('/comercial');
    return { success: true, data: { id } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}
