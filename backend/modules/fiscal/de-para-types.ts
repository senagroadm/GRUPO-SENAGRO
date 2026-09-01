// backend/modules/fiscal/de-para-types.ts
/**
 * NEXUS ERP - Mapeamento De/Para de Produtos de Fornecedores
 * Permite associar o código de produto do fornecedor (cProd) com o item interno do catálogo NEXUS ERP
 */

export interface DeParaProdutoFornecedor {
  id: string;
  empresaId: string;
  cnpjFornecedor: string;
  razaoSocialFornecedor?: string;
  codigoProdutoFornecedor: string; // cProd do XML
  descricaoProdutoFornecedor: string; // xProd do XML
  unidadeMedidaFornecedor?: string; // uCom do XML
  
  // Vínculo no catálogo interno
  itemInternoId: string;
  codigoItemInterno: string;
  descricaoItemInterno: string;
  unidadeMedidaInterna: string;
  fatorConversaoUnidade: number; // Ex: Fornecedor vende Caixa com 10 UN, fator = 10
  
  // Auditoria
  criadoEm: string;
  atualizadoEm: string;
  usuarioId?: string;
}

export interface FornecedorCadastro {
  id: string;
  empresaId: string;
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
  origemCadastro: 'IMPORTACAO_NFE' | 'MANUAL' | 'SINCRONIZACAO';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
