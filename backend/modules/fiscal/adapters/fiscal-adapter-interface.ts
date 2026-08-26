/**
 * NEXUS ERP - Contratos e Interfaces de Adapters Fiscais
 * Desacoplamento para provedores SEFAZ (NF-e, NFC-e) e Prefeituras (NFS-e)
 */

import {
  DocumentoFiscal,
  EventoFiscal,
  AmbienteFiscal,
  IntegracaoFiscalLog,
} from '../fiscal-types';

export interface StatusServicoFiscalResult {
  online: boolean;
  tempoMedioRespostaMs: number;
  versaoAplicacao: string;
  mensagemRetorno: string;
  codigoRetorno: number;
  dataHoraVerificacao: string;
}

export interface EmissaoFiscalResponse {
  sucesso: boolean;
  chaveAcesso?: string;
  protocoloAutorizacao?: string;
  dataHoraAutorizacao?: string;
  codigoStatusSefaz: number;
  motivoStatusSefaz: string;
  xmlAssinado: string;
  xmlDistribuicaoProtocolado?: string;
  pdfDanfeUrl?: string;
  codigoVerificacaoNfse?: string; // Para NFS-e
  numeroRps?: number;
  serieRps?: string;
  logsIntegracao: IntegracaoFiscalLog[];
}

export interface EventoFiscalResponse {
  sucesso: boolean;
  protocoloEvento?: string;
  codigoStatusSefaz: number;
  motivoStatusSefaz: string;
  xmlEventoAssinado: string;
  dataHoraEvento: string;
  logsIntegracao: IntegracaoFiscalLog[];
}

export interface INFeAdapter {
  consultarStatusServico(empresaId: string, uf: string, ambiente: AmbienteFiscal): Promise<StatusServicoFiscalResult>;
  
  transmitirNFe(
    empresaId: string,
    documento: DocumentoFiscal,
    ambiente: AmbienteFiscal,
    certificadoAlias: string
  ): Promise<EmissaoFiscalResponse>;

  transmitirEvento(
    empresaId: string,
    evento: EventoFiscal,
    ambiente: AmbienteFiscal,
    certificadoAlias: string
  ): Promise<EventoFiscalResponse>;

  consultarChaveAcesso(
    empresaId: string,
    chaveAcesso: string,
    ambiente: AmbienteFiscal
  ): Promise<{ status: string; cStat: number; xMotivo: string; xml?: string }>;
}

export interface INFSeAdapter {
  consultarStatusServicoMunicipal(empresaId: string, codigoMunicipioIBGE: string, ambiente: AmbienteFiscal): Promise<StatusServicoFiscalResult>;

  transmitirNFS(
    empresaId: string,
    documento: DocumentoFiscal,
    ambiente: AmbienteFiscal,
    certificadoAlias: string
  ): Promise<EmissaoFiscalResponse>;

  cancelarNFSe(
    empresaId: string,
    numeroNfse: number,
    codigoVerificacao: string,
    motivoCancelamento: string,
    ambiente: AmbienteFiscal
  ): Promise<EventoFiscalResponse>;
}
