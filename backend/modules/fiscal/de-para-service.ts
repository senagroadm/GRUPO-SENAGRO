// backend/modules/fiscal/de-para-service.ts
/**
 * NEXUS ERP - Serviço de Gestão de Fornecedores e Mapeamento De/Para (cProd -> Item Interno)
 * Garante o cadastro automático e resiliente de fornecedores a partir da NF-e e 
 * cruzamento inteligente com o catálogo interno do ERP.
 */

import { DeParaProdutoFornecedor, FornecedorCadastro } from './de-para-types';
import { estoqueService } from '../estoque/estoque-service';
import { EMPRESAS_GRUPO } from '../../core/types/company';

export class DeParaService {
  private fornecedoresStore: Map<string, FornecedorCadastro[]> = new Map();
  private deParaStore: Map<string, DeParaProdutoFornecedor[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    for (const emp of EMPRESAS_GRUPO) {
      // Fornecedores de Aço e Insumos
      this.fornecedoresStore.set(emp.id, [
        {
          id: `forn-usiminas-${emp.id}`,
          empresaId: emp.id,
          cnpjCpf: '60.870.004/0001-40',
          razaoSocial: 'USINAS SIDERURGICAS DE MINAS GERAIS S/A. USIMINAS',
          nomeFantasia: 'USIMINAS',
          inscricaoEstadual: '062.314.887.0012',
          logradouro: 'AV DO CONTORNO',
          numero: '3300',
          bairro: 'FUNCIONARIOS',
          municipio: 'BELO HORIZONTE',
          uf: 'MG',
          cep: '30110-017',
          origemCadastro: 'MANUAL',
          ativo: true,
          criadoEm: '2026-01-01T00:00:00Z',
          atualizadoEm: '2026-01-01T00:00:00Z',
        },
        {
          id: `forn-gerdau-${emp.id}`,
          empresaId: emp.id,
          cnpjCpf: '01.571.528/0001-80',
          razaoSocial: 'GERDAU ACOSMINAS S.A.',
          nomeFantasia: 'GERDAU',
          inscricaoEstadual: '148.229.431.110',
          municipio: 'OURO BRANCO',
          uf: 'MG',
          origemCadastro: 'MANUAL',
          ativo: true,
          criadoEm: '2026-01-01T00:00:00Z',
          atualizadoEm: '2026-01-01T00:00:00Z',
        },
      ]);

      // Mapeamento De/Para Inicial
      this.deParaStore.set(emp.id, [
        {
          id: `dp-1-${emp.id}`,
          empresaId: emp.id,
          cnpjFornecedor: '60.870.004/0001-40',
          razaoSocialFornecedor: 'USIMINAS',
          codigoProdutoFornecedor: 'CH-1020-475',
          descricaoProdutoFornecedor: 'CHAPA LAMINADA QUENTE SAE 1020 4.75 X 1500 X 3000',
          unidadeMedidaFornecedor: 'PC',
          itemInternoId: 'prod-chapa-1020-475',
          codigoItemInterno: 'MP-CH-1020-4.75',
          descricaoItemInterno: 'Chapa Aço Carbono SAE 1020 4.75mm x 1500 x 3000',
          unidadeMedidaInterna: 'CHAPA',
          fatorConversaoUnidade: 1,
          criadoEm: '2026-01-01T00:00:00Z',
          atualizadoEm: '2026-01-01T00:00:00Z',
        },
        {
          id: `dp-2-${emp.id}`,
          empresaId: emp.id,
          cnpjFornecedor: '60.870.004/0001-40',
          razaoSocialFornecedor: 'USIMINAS',
          codigoProdutoFornecedor: 'CHAPA-A36-12.7MM',
          descricaoProdutoFornecedor: 'CHAPA DE AÇO ESTRUTURAL ASTM A36 - 12.70MM X 2440MM X 6000MM',
          unidadeMedidaFornecedor: 'KG',
          itemInternoId: 'prod-chapa-a36-1270',
          codigoItemInterno: 'MP-CH-A36-12.70',
          descricaoItemInterno: 'Chapa de Aço Estrutural ASTM A36 - 12.70mm x 2440 x 6000',
          unidadeMedidaInterna: 'CHAPA',
          fatorConversaoUnidade: 1,
          criadoEm: '2026-01-01T00:00:00Z',
          atualizadoEm: '2026-01-01T00:00:00Z',
        },
      ]);
    }
  }

  /**
   * Identifica fornecedor pelo CNPJ; se não existir, realiza o cadastro de forma transparente.
   */
  public async obterOuCadastrarFornecedor(
    empresaId: string,
    dados: {
      cnpjCpf: string;
      razaoSocial: string;
      nomeFantasia?: string;
      inscricaoEstadual?: string;
      logradouro?: string;
      numero?: string;
      bairro?: string;
      municipio?: string;
      uf?: string;
      cep?: string;
      telefone?: string;
      email?: string;
    },
    usuarioId?: string
  ): Promise<{ fornecedor: FornecedorCadastro; cadastradoAgora: boolean }> {
    const cnpjLimpo = dados.cnpjCpf.replace(/\D/g, '');
    const lista = this.fornecedoresStore.get(empresaId) || [];

    const existente = lista.find(
      (f) => f.cnpjCpf.replace(/\D/g, '') === cnpjLimpo
    );

    if (existente) {
      return { fornecedor: existente, cadastradoAgora: false };
    }

    // Cadastro de novo fornecedor a partir dos dados do XML
    const novo: FornecedorCadastro = {
      id: `forn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      empresaId,
      cnpjCpf: dados.cnpjCpf,
      razaoSocial: dados.razaoSocial,
      nomeFantasia: dados.nomeFantasia || dados.razaoSocial,
      inscricaoEstadual: dados.inscricaoEstadual,
      logradouro: dados.logradouro,
      numero: dados.numero,
      bairro: dados.bairro,
      municipio: dados.municipio,
      uf: dados.uf,
      cep: dados.cep,
      telefone: dados.telefone,
      email: dados.email,
      origemCadastro: 'IMPORTACAO_NFE',
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    lista.push(novo);
    this.fornecedoresStore.set(empresaId, lista);

    return { fornecedor: novo, cadastradoAgora: true };
  }

  /**
   * Localiza o relacionamento De/Para de um produto de fornecedor (cProd) para o item interno.
   * Se não houver regra prévia, realiza busca heurística no catálogo interno (por código ou descrição).
   */
  public buscarMapeamentoDePara(
    empresaId: string,
    cnpjFornecedor: string,
    codigoProdutoFornecedor: string,
    descricaoProdutoFornecedor: string,
    unidadeMedidaFornecedor?: string
  ): {
    mapeado: boolean;
    itemInternoId?: string;
    codigoItemInterno?: string;
    descricaoItemInterno?: string;
    unidadeMedidaInterna?: string;
    fatorConversao: number;
    sugeridoAutomaticamente: boolean;
    scoreConfianca: number;
  } {
    const cnpjLimpo = cnpjFornecedor.replace(/\D/g, '');
    const deParas = this.deParaStore.get(empresaId) || [];

    // 1. Busca por regra explícita salva (CNPJ + cProd)
    const regraExplicita = deParas.find(
      (dp) =>
        dp.cnpjFornecedor.replace(/\D/g, '') === cnpjLimpo &&
        dp.codigoProdutoFornecedor.trim().toLowerCase() === codigoProdutoFornecedor.trim().toLowerCase()
    );

    if (regraExplicita) {
      return {
        mapeado: true,
        itemInternoId: regraExplicita.itemInternoId,
        codigoItemInterno: regraExplicita.codigoItemInterno,
        descricaoItemInterno: regraExplicita.descricaoItemInterno,
        unidadeMedidaInterna: regraExplicita.unidadeMedidaInterna,
        fatorConversao: regraExplicita.fatorConversaoUnidade || 1,
        sugeridoAutomaticamente: false,
        scoreConfianca: 1.0,
      };
    }

    // 2. Busca no catálogo interno de saldos e produtos do estoque
    const saldos = estoqueService.getSaldos(empresaId);
    const cProdLower = codigoProdutoFornecedor.trim().toLowerCase();
    const xProdLower = descricaoProdutoFornecedor.trim().toLowerCase();

    // 2.1 Match Exato por Código do Produto Interno
    const matchCodigo = saldos.find(
      (s) => s.codigoProduto.trim().toLowerCase() === cProdLower
    );

    if (matchCodigo) {
      return {
        mapeado: true,
        itemInternoId: matchCodigo.produtoId,
        codigoItemInterno: matchCodigo.codigoProduto,
        descricaoItemInterno: matchCodigo.descricaoProduto,
        unidadeMedidaInterna: matchCodigo.unidadeMedida,
        fatorConversao: 1,
        sugeridoAutomaticamente: true,
        scoreConfianca: 0.95,
      };
    }

    // 2.2 Match Heurístico por Similaridade de Descrição
    const matchDescricao = saldos.find((s) => {
      const descInt = s.descricaoProduto.toLowerCase();
      return descInt.includes(cProdLower) || xProdLower.includes(s.codigoProduto.toLowerCase());
    });

    if (matchDescricao) {
      return {
        mapeado: true,
        itemInternoId: matchDescricao.produtoId,
        codigoItemInterno: matchDescricao.codigoProduto,
        descricaoItemInterno: matchDescricao.descricaoProduto,
        unidadeMedidaInterna: matchDescricao.unidadeMedida,
        fatorConversao: 1,
        sugeridoAutomaticamente: true,
        scoreConfianca: 0.8,
      };
    }

    // 2.3 Não encontrado: Sugere criação ou preenchimento manual
    return {
      mapeado: false,
      codigoItemInterno: codigoProdutoFornecedor,
      descricaoItemInterno: descricaoProdutoFornecedor,
      unidadeMedidaInterna: unidadeMedidaFornecedor || 'UN',
      fatorConversao: 1,
      sugeridoAutomaticamente: false,
      scoreConfianca: 0.0,
    };
  }

  /**
   * Salva ou atualiza a regra De/Para para que futuras entradas deste mesmo fornecedor
   * sejam mapeadas automaticamente com 100% de precisão.
   */
  public salvarDePara(
    empresaId: string,
    regra: {
      cnpjFornecedor: string;
      razaoSocialFornecedor?: string;
      codigoProdutoFornecedor: string;
      descricaoProdutoFornecedor: string;
      unidadeMedidaFornecedor?: string;
      itemInternoId: string;
      codigoItemInterno: string;
      descricaoItemInterno: string;
      unidadeMedidaInterna: string;
      fatorConversaoUnidade?: number;
      usuarioId?: string;
    }
  ): DeParaProdutoFornecedor {
    const lista = this.deParaStore.get(empresaId) || [];
    const cnpjLimpo = regra.cnpjFornecedor.replace(/\D/g, '');
    const cProd = regra.codigoProdutoFornecedor.trim().toLowerCase();

    const idx = lista.findIndex(
      (dp) =>
        dp.cnpjFornecedor.replace(/\D/g, '') === cnpjLimpo &&
        dp.codigoProdutoFornecedor.trim().toLowerCase() === cProd
    );

    const agora = new Date().toISOString();
    const itemSalvo: DeParaProdutoFornecedor = {
      id: idx >= 0 ? lista[idx].id : `dp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      empresaId,
      cnpjFornecedor: regra.cnpjFornecedor,
      razaoSocialFornecedor: regra.razaoSocialFornecedor,
      codigoProdutoFornecedor: regra.codigoProdutoFornecedor,
      descricaoProdutoFornecedor: regra.descricaoProdutoFornecedor,
      unidadeMedidaFornecedor: regra.unidadeMedidaFornecedor,
      itemInternoId: regra.itemInternoId,
      codigoItemInterno: regra.codigoItemInterno,
      descricaoItemInterno: regra.descricaoItemInterno,
      unidadeMedidaInterna: regra.unidadeMedidaInterna,
      fatorConversaoUnidade: regra.fatorConversaoUnidade || 1,
      criadoEm: idx >= 0 ? lista[idx].criadoEm : agora,
      atualizadoEm: agora,
      usuarioId: regra.usuarioId,
    };

    if (idx >= 0) {
      lista[idx] = itemSalvo;
    } else {
      lista.push(itemSalvo);
    }

    this.deParaStore.set(empresaId, lista);
    return itemSalvo;
  }

  public listarFornecedores(empresaId: string): FornecedorCadastro[] {
    return this.fornecedoresStore.get(empresaId) || [];
  }

  public listarDeParas(empresaId: string, cnpjFornecedor?: string): DeParaProdutoFornecedor[] {
    const list = this.deParaStore.get(empresaId) || [];
    if (!cnpjFornecedor) return list;
    const cnpjLimpo = cnpjFornecedor.replace(/\D/g, '');
    return list.filter((dp) => dp.cnpjFornecedor.replace(/\D/g, '') === cnpjLimpo);
  }
}

export const deParaService = new DeParaService();
