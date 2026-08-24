/**
 * PORT: IFiscalAdapter
 * Contrato de integração para emissão e recepção de documentos fiscais (NF-e, NFS-e, MDF-e, CT-e).
 * Dependência externa marcada como: TODO / decision-needed (Focus NFe vs Nuvem Fiscal vs PlugNotas vs SEFAZ direta).
 */

export interface EmitirNFeInput {
  empresaId: string;
  pedidoVendaId?: string;
  ordemServicoId?: string;
  naturezaOperacao: string;
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
    inscricaoEstadual?: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      codigoMunicipio: string;
      uf: string;
      cep: string;
    };
  };
  itens: Array<{
    itemCodigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidadeMedida: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    cstIcms: string;
    aliquotaIcms: number;
    aliquotaIpi?: number;
    aliquotaPis?: number;
    aliquotaCofins?: number;
  }>;
  informacoesAdicionais?: string;
}

export interface ResultadoEmissaoNFe {
  sucesso: boolean;
  statusSefaz: 'AUTORIZADO' | 'REJEITADO' | 'DENEGADO' | 'EM_PROCESSAMENTO';
  numero: number;
  serie: string;
  chaveAcesso?: string;
  protocolo?: string;
  xmlUrl?: string;
  danfePdfUrl?: string;
  mensagemErro?: string;
}

export interface IFiscalPort {
  emitirNFe(dados: EmitirNFeInput): Promise<ResultadoEmissaoNFe>;
  consultarStatusSefaz(empresaId: string, chaveAcesso: string): Promise<ResultadoEmissaoNFe>;
  cancelarNFe(empresaId: string, chaveAcesso: string, justificativa: string): Promise<{ cancelado: boolean; motivo?: string }>;
  importarXmlFornecedor(empresaId: string, xmlContent: string): Promise<{ chaveAcesso: string; emitenteCnpj: string; valorTotal: number }>;
}
