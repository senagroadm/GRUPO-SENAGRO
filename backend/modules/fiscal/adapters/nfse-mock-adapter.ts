/**
 * NEXUS ERP - Mock Provider / Adapter de NFS-e (Prefeituras / Padrão Nacional / ABRASF)
 * Desacoplado de integrações reais para desenvolvimento, testes e simulações
 */

import {
  INFSeAdapter,
  StatusServicoFiscalResult,
  EmissaoFiscalResponse,
  EventoFiscalResponse,
} from './fiscal-adapter-interface';
import {
  DocumentoFiscal,
  AmbienteFiscal,
  IntegracaoFiscalLog,
} from '../fiscal-types';

export class NFSeMockAdapter implements INFSeAdapter {
  async consultarStatusServicoMunicipal(
    empresaId: string,
    codigoMunicipioIBGE: string,
    ambiente: AmbienteFiscal
  ): Promise<StatusServicoFiscalResult> {
    const agora = new Date().toISOString();
    return {
      online: true,
      tempoMedioRespostaMs: Math.floor(180 + Math.random() * 100),
      versaoAplicacao: 'NFSE_ABRASF_V2.04_MOCK',
      codigoRetorno: 1,
      mensagemRetorno: `Servico Municipal NFS-e Ativo (IBGE: ${codigoMunicipioIBGE} / ${ambiente})`,
      dataHoraVerificacao: agora,
    };
  }

  async transmitirNFS(
    empresaId: string,
    documento: DocumentoFiscal,
    ambiente: AmbienteFiscal,
    certificadoAlias: string
  ): Promise<EmissaoFiscalResponse> {
    const inicio = Date.now();
    const dataHora = new Date().toISOString();
    const codigoVerificacao = Math.random().toString(36).substring(2, 10).toUpperCase();
    const numeroRps = documento.numeroRps || documento.numeroDocumento;
    const serieRps = documento.serieRps || 'RPS1';
    const protocolo = `NFSE-${codigoVerificacao}-${Date.now()}`;

    const xmlAssinado = `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="LOTE_${numeroRps}" versao="2.04">
    <NumeroLote>${numeroRps}</NumeroLote>
    <CpfCnpj><Cnpj>12345678000190</Cnpj></CpfCnpj>
    <InscricaoMunicipal>1234567</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfDeclaracaoPrestacaoServico>
          <Rps Id="RPS_${numeroRps}">
            <IdentificacaoRps>
              <Numero>${numeroRps}</Numero>
              <Serie>${serieRps}</Serie>
              <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${documento.dataHoraEmissao}</DataEmissao>
            <Status>1</Status>
          </Rps>
          <Competencia>${documento.dataHoraEmissao.substring(0, 10)}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${documento.totais.valorProdutosServicos.toFixed(2)}</ValorServicos>
              <ValorDeducoes>0.00</ValorDeducoes>
              <ValorPis>${documento.totais.valorTotalPis.toFixed(2)}</ValorPis>
              <ValorCofins>${documento.totais.valorTotalCofins.toFixed(2)}</ValorCofins>
              <ValorInss>0.00</ValorInss>
              <ValorIr>0.00</ValorIr>
              <ValorCsll>0.00</ValorCsll>
              <IssRetido>2</IssRetido>
              <ValorIss>${(documento.totais.valorTotalIss || 0).toFixed(2)}</ValorIss>
              <BaseCalculo>${(documento.totais.valorProdutosServicos - documento.totais.valorDescontos).toFixed(2)}</BaseCalculo>
              <Aliquota>5.00</Aliquota>
              <ValorLiquidoNfse>${documento.totais.valorTotalDocumento.toFixed(2)}</ValorLiquidoNfse>
            </Valores>
            <ItemListaServico>07.02</ItemListaServico>
            <CodigoCnae>2869100</CodigoCnae>
            <CodigoTributacaoMunicipio>0702001</CodigoTributacaoMunicipio>
            <Discriminacao>${documento.naturezaOperacao} - Prestacao de Servicos Especializados</Discriminacao>
            <CodigoMunicipio>3550308</CodigoMunicipio>
          </Servico>
          <Prestador>
            <CpfCnpj><Cnpj>12345678000190</Cnpj></CpfCnpj>
            <InscricaoMunicipal>1234567</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj><Cnpj>${documento.destinatario.cnpjCpf.replace(/\D/g, '')}</Cnpj></CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${documento.destinatario.razaoSocialNome}</RazaoSocial>
          </Tomador>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;

    const tempo = Date.now() - inicio;

    const log: IntegracaoFiscalLog = {
      id: `log-nfse-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      empresaId,
      documentoFiscalId: documento.id,
      servico: 'NFSE_PREFEITURA',
      ambiente,
      idempotencyKey: documento.idempotencyKey,
      endpointChamado: `https://nfse.prefeitura.sp.gov.br/ws/v2?env=${ambiente}`,
      tempoRespostaMs: tempo,
      statusHttp: 200,
      payloadEnvioFormatado: JSON.stringify({ rps: numeroRps, serie: serieRps, tomador: documento.destinatario.cnpjCpf }, null, 2),
      payloadRetornoFormatado: JSON.stringify({
        status: 'CONVERTIDO_NFSE',
        numeroNfse: documento.numeroDocumento,
        codigoVerificacao,
        protocolo,
      }, null, 2),
      sucesso: true,
      timestamp: dataHora,
    };

    return {
      sucesso: true,
      codigoVerificacaoNfse: codigoVerificacao,
      numeroRps,
      serieRps,
      protocoloAutorizacao: protocolo,
      dataHoraAutorizacao: dataHora,
      codigoStatusSefaz: 100,
      motivoStatusSefaz: 'NFS-e Emitida com Sucesso',
      xmlAssinado,
      pdfDanfeUrl: `/api/v1/fiscal/danfse/${codigoVerificacao}.pdf`,
      logsIntegracao: [log],
    };
  }

  async cancelarNFSe(
    empresaId: string,
    numeroNfse: number,
    codigoVerificacao: string,
    motivoCancelamento: string,
    ambiente: AmbienteFiscal
  ): Promise<EventoFiscalResponse> {
    const inicio = Date.now();
    const dataHora = new Date().toISOString();
    const protocolo = `CAN-NFSE-${numeroNfse}-${Date.now()}`;

    const log: IntegracaoFiscalLog = {
      id: `log-can-nfse-${Date.now()}`,
      empresaId,
      servico: 'NFSE_PREFEITURA',
      ambiente,
      idempotencyKey: `idemp-can-nfse-${numeroNfse}`,
      endpointChamado: `https://nfse.prefeitura.sp.gov.br/ws/cancelar?env=${ambiente}`,
      tempoRespostaMs: Date.now() - inicio,
      statusHttp: 200,
      payloadEnvioFormatado: JSON.stringify({ numeroNfse, codigoVerificacao, motivo: motivoCancelamento }, null, 2),
      payloadRetornoFormatado: JSON.stringify({ status: 'CANCELAMENTO_CONFIRMADO', protocolo }, null, 2),
      sucesso: true,
      timestamp: dataHora,
    };

    return {
      sucesso: true,
      protocoloEvento: protocolo,
      codigoStatusSefaz: 135,
      motivoStatusSefaz: 'NFS-e Cancelada com Sucesso',
      xmlEventoAssinado: `<CancelarNfseResposta status="1" prot="${protocolo}"/>`,
      dataHoraEvento: dataHora,
      logsIntegracao: [log],
    };
  }
}
