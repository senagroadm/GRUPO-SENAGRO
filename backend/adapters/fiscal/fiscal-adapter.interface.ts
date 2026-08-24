import { IFiscalPort, EmitirNFeInput, ResultadoEmissaoNFe } from '../../ports/fiscal.port';

/**
 * ADAPTER: FiscalAdapter
 * Implementação padrão com desacoplamento para SEFAZ / Provedor Fiscal Homologado.
 * STATUS: TODO / decision-needed (Definir contratação: FocusNFe / PlugNotas / NuvemFiscal)
 */
export class FiscalAdapter implements IFiscalPort {
  constructor(private readonly apiKey?: string) {}

  async emitirNFe(dados: EmitirNFeInput): Promise<ResultadoEmissaoNFe> {
    // TODO / decision-needed: Conectar ao provedor fiscal escolhido ou OpenSSL para assinatura A1
    console.info(`[FiscalAdapter] Solicitada emissão de NF-e para empresa ${dados.empresaId}`);
    return {
      sucesso: true,
      statusSefaz: 'EM_PROCESSAMENTO',
      numero: Math.floor(Math.random() * 90000) + 1000,
      serie: '1',
      mensagemErro: 'Provedor fiscal em fase de homologação (TODO/decision-needed)',
    };
  }

  async consultarStatusSefaz(empresaId: string, chaveAcesso: string): Promise<ResultadoEmissaoNFe> {
    // TODO / decision-needed: Consulta de protocolo SEFAZ
    return {
      sucesso: true,
      statusSefaz: 'AUTORIZADO',
      numero: 1,
      serie: '1',
      chaveAcesso,
    };
  }

  async cancelarNFe(empresaId: string, chaveAcesso: string, justificativa: string): Promise<{ cancelado: boolean; motivo?: string }> {
    // TODO / decision-needed: Evento de cancelamento 110111
    return { cancelado: true, motivo: justificativa };
  }

  async importarXmlFornecedor(empresaId: string, xmlContent: string): Promise<{ chaveAcesso: string; emitenteCnpj: string; valorTotal: number }> {
    // TODO / decision-needed: Parser de XML padrão NFe v4.00
    return {
      chaveAcesso: '352408' + '00'.repeat(19),
      emitenteCnpj: '00.000.000/0001-00',
      valorTotal: 0,
    };
  }
}
