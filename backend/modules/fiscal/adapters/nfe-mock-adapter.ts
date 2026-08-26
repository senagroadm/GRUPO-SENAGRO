/**
 * NEXUS ERP - Mock Provider / Adapter de NF-e (SEFAZ)
 * Desacoplado de integrações reais para desenvolvimento, testes e simulações
 * Gera chave de acesso real de 44 dígitos com algoritmo Módulo 11
 */

import {
  INFeAdapter,
  StatusServicoFiscalResult,
  EmissaoFiscalResponse,
  EventoFiscalResponse,
} from './fiscal-adapter-interface';
import {
  DocumentoFiscal,
  EventoFiscal,
  AmbienteFiscal,
  IntegracaoFiscalLog,
} from '../fiscal-types';

export class NFeMockAdapter implements INFeAdapter {
  /**
   * Calcula dígito verificador da Chave de Acesso da NF-e (Módulo 11 - pesos 2 a 9)
   */
  private calcularDigitoVerificadorChave(chave43: string): number {
    let soma = 0;
    let peso = 2;
    for (let i = chave43.length - 1; i >= 0; i--) {
      soma += parseInt(chave43.charAt(i), 10) * peso;
      peso++;
      if (peso > 9) peso = 2;
    }
    const resto = soma % 11;
    const dv = 11 - resto;
    return dv >= 10 ? 0 : dv;
  }

  /**
   * Gera a chave de 44 dígitos padrão SEFAZ:
   * cUF (2) + AAMM (4) + CNPJ (14) + mod (2) + serie (3) + nNF (9) + tpEmis (1) + cNF (8) + cDV (1)
   */
  private gerarChaveAcessoNFe(
    documento: DocumentoFiscal,
    cnpjEmitente: string,
    ufCodigoIBGE: string
  ): string {
    const data = new Date(documento.dataHoraEmissao);
    const aa = data.getFullYear().toString().slice(-2);
    const mm = (data.getMonth() + 1).toString().padStart(2, '0');
    const aamm = `${aa}${mm}`;
    const cnpjNumeros = cnpjEmitente.replace(/\D/g, '').padStart(14, '0');
    const modelo = '55';
    const serie = documento.serie.toString().padStart(3, '0');
    const nNF = documento.numeroDocumento.toString().padStart(9, '0');
    const tpEmis = '1'; // 1=Normal
    // Código numérico aleatório de 8 dígitos para segurança da chave
    const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();

    const chave43 = `${ufCodigoIBGE}${aamm}${cnpjNumeros}${modelo}${serie}${nNF}${tpEmis}${cNF}`;
    const cDV = this.calcularDigitoVerificadorChave(chave43);

    return `${chave43}${cDV}`;
  }

  async consultarStatusServico(
    empresaId: string,
    uf: string,
    ambiente: AmbienteFiscal
  ): Promise<StatusServicoFiscalResult> {
    const agora = new Date().toISOString();
    return {
      online: true,
      tempoMedioRespostaMs: Math.floor(120 + Math.random() * 80),
      versaoAplicacao: 'SVRS_V4.00_MOCK',
      codigoRetorno: 107,
      mensagemRetorno: `Servico em Operacao (UF: ${uf} / Ambiente: ${ambiente})`,
      dataHoraVerificacao: agora,
    };
  }

  async transmitirNFe(
    empresaId: string,
    documento: DocumentoFiscal,
    ambiente: AmbienteFiscal,
    certificadoAlias: string
  ): Promise<EmissaoFiscalResponse> {
    const inicioTimestamp = Date.now();
    const dataHoraAut = new Date().toISOString();

    // Validação básica simulada
    if (!documento.itens || documento.itens.length === 0) {
      const tempo = Date.now() - inicioTimestamp;
      const logRejeicao: IntegracaoFiscalLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        empresaId,
        documentoFiscalId: documento.id,
        servico: 'SEFAZ_AUTORIZACAO',
        ambiente,
        idempotencyKey: documento.idempotencyKey,
        endpointChamado: `https://nfe.sefaz.gov.br/ws/NFeAutorizacao4?env=${ambiente}`,
        tempoRespostaMs: tempo,
        statusHttp: 200,
        payloadEnvioFormatado: JSON.stringify({ documentoId: documento.id, itensQtd: 0 }),
        payloadRetornoFormatado: JSON.stringify({ cStat: 778, xMotivo: 'Rejeicao: Informado tributo sem itens' }),
        sucesso: false,
        mensagemErro: 'Rejeição 778: Informado tributo sem itens',
        timestamp: dataHoraAut,
      };

      return {
        sucesso: false,
        codigoStatusSefaz: 778,
        motivoStatusSefaz: 'Rejeicao: Informado tributo sem itens',
        xmlAssinado: '',
        logsIntegracao: [logRejeicao],
      };
    }

    // Gerar Chave de Acesso se não existir
    const chaveAcesso =
      documento.chaveAcesso ||
      this.gerarChaveAcessoNFe(documento, '12345678000190', '35'); // 35=SP

    const protocolo = `1352600${Math.floor(100000000 + Math.random() * 900000000)}`;

    // Construção simulada do XML NFe 4.00 com Assinatura e Protocolo
    const xmlAssinado = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveAcesso}" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <cNF>${chaveAcesso.substring(35, 43)}</cNF>
      <natOp>${documento.naturezaOperacao}</natOp>
      <mod>55</mod>
      <serie>${documento.serie}</serie>
      <nNF>${documento.numeroDocumento}</nNF>
      <dhEmi>${documento.dataHoraEmissao}</dhEmi>
      <tpNF>${documento.tipoOperacao === 'SAIDA' ? '1' : '0'}</tpNF>
      <idDest>${documento.destinatario.endereco.uf === 'SP' ? '1' : '2'}</idDest>
      <cMunFG>${documento.destinatario.endereco.codigoMunicipioIBGE || '3550308'}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveAcesso.substring(43, 44)}</cDV>
      <tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>${documento.destinatario.indicadorIe === '9_NAO_CONTRIBUINTE' ? '1' : '0'}</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>NEXUS-ERP-V4.2</verProc>
    </ide>
    <emit>
      <CNPJ>12345678000190</CNPJ>
      <xNome>TRITECH INDUSTRIAL DO BRASIL S.A.</xNome>
      <xFant>TRITECH MATRIZ</xFant>
      <enderEmit>
        <xLgr>Av. das Nacoes Industriais</xLgr>
        <nro>1500</nro>
        <xBairro>Distrito Fabril</xBairro>
        <cMun>3550308</cMun>
        <xMun>Sao Paulo</xMun>
        <UF>SP</UF>
        <CEP>04578000</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderEmit>
      <IE>111222333444</IE>
      <CRT>3</CRT>
    </emit>
    <dest>
      <CNPJ>${documento.destinatario.cnpjCpf.replace(/\D/g, '')}</CNPJ>
      <xNome>${documento.destinatario.razaoSocialNome}</xNome>
      <enderDest>
        <xLgr>${documento.destinatario.endereco.logradouro}</xLgr>
        <nro>${documento.destinatario.endereco.numero}</nro>
        <xBairro>${documento.destinatario.endereco.bairro}</xBairro>
        <cMun>${documento.destinatario.endereco.codigoMunicipioIBGE || '3550308'}</cMun>
        <xMun>${documento.destinatario.endereco.cidade}</xMun>
        <UF>${documento.destinatario.endereco.uf}</UF>
        <CEP>${documento.destinatario.endereco.cep.replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
      </enderDest>
      <indIEDest>${documento.destinatario.indicadorIe === '1_CONTRIBUINTE' ? '1' : documento.destinatario.indicadorIe === '2_ISENTO' ? '2' : '9'}</indIEDest>
      <IE>${documento.destinatario.inscricaoEstadual || ''}</IE>
    </dest>
    <total>
      <ICMSTot>
        <vBC>${documento.totais.baseCalculoIcms.toFixed(2)}</vBC>
        <vICMS>${documento.totais.valorTotalIcms.toFixed(2)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>${documento.totais.valorTotalFcp.toFixed(2)}</vFCP>
        <vBCST>${documento.totais.baseCalculoIcmsSt.toFixed(2)}</vBCST>
        <vST>${documento.totais.valorTotalIcmsSt.toFixed(2)}</vST>
        <vProd>${documento.totais.valorProdutosServicos.toFixed(2)}</vProd>
        <vFrete>${documento.totais.valorFrete.toFixed(2)}</vFrete>
        <vSeg>${documento.totais.valorSeguro.toFixed(2)}</vSeg>
        <vDesc>${documento.totais.valorDescontos.toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>${documento.totais.valorTotalIpi.toFixed(2)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${documento.totais.valorTotalPis.toFixed(2)}</vPIS>
        <vCOFINS>${documento.totais.valorTotalCofins.toFixed(2)}</vCOFINS>
        <vOutro>${documento.totais.valorOutrasDespesas.toFixed(2)}</vOutro>
        <vNF>${documento.totais.valorTotalDocumento.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
        <Reference URI="#NFe${chaveAcesso}">
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
          <DigestValue>dGVzdGUtZGlnZXN0LXNlZmF6LW5leHVz</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>TW9ja1NpZ25hdHVyZUF1dGhTZWZheg==</SignatureValue>
      <KeyInfo>
        <X509Data>
          <X509Certificate>MIIE...[MockCertificadoRef:${certificadoAlias}]...</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>
  </infNFe>
</NFe>`;

    const xmlDistribuicaoProtocolado = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  ${xmlAssinado}
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <verAplic>SVRS_V4.00_MOCK</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${dataHoraAut}</dhRecbto>
      <nProt>${protocolo}</nProt>
      <digVal>dGVzdGUtZGlnZXN0LXNlZmF6LW5leHVz</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

    const tempoResposta = Date.now() - inicioTimestamp;

    const logIntegracao: IntegracaoFiscalLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      empresaId,
      documentoFiscalId: documento.id,
      servico: 'SEFAZ_AUTORIZACAO',
      ambiente,
      idempotencyKey: documento.idempotencyKey,
      endpointChamado: `https://nfe.sefaz.gov.br/ws/NFeAutorizacao4?env=${ambiente}`,
      tempoRespostaMs: tempoResposta,
      statusHttp: 200,
      payloadEnvioFormatado: JSON.stringify({
        acao: 'enviarLoteNFe',
        idLote: `LOT-${Date.now()}`,
        chaveAcesso,
        numeroDocumento: documento.numeroDocumento,
        serie: documento.serie,
        valorTotal: documento.totais.valorTotalDocumento,
        certificado: certificadoAlias,
      }, null, 2),
      payloadRetornoFormatado: JSON.stringify({
        tpAmb: ambiente === 'PRODUCAO' ? 1 : 2,
        verAplic: 'SVRS_V4.00_MOCK',
        cStat: 100,
        xMotivo: 'Autorizado o uso da NF-e',
        chNFe: chaveAcesso,
        dhRecbto: dataHoraAut,
        nProt: protocolo,
      }, null, 2),
      sucesso: true,
      timestamp: dataHoraAut,
    };

    return {
      sucesso: true,
      chaveAcesso,
      protocoloAutorizacao: protocolo,
      dataHoraAutorizacao: dataHoraAut,
      codigoStatusSefaz: 100,
      motivoStatusSefaz: 'Autorizado o uso da NF-e',
      xmlAssinado,
      xmlDistribuicaoProtocolado,
      pdfDanfeUrl: `/api/v1/fiscal/danfe/${chaveAcesso}.pdf`,
      logsIntegracao: [logIntegracao],
    };
  }

  async transmitirEvento(
    empresaId: string,
    evento: EventoFiscal,
    ambiente: AmbienteFiscal,
    certificadoAlias: string
  ): Promise<EventoFiscalResponse> {
    const inicio = Date.now();
    const dataHora = new Date().toISOString();
    const protocoloEvento = `1352699${Math.floor(100000000 + Math.random() * 900000000)}`;

    const xmlEventoAssinado = `<?xml version="1.0" encoding="UTF-8"?>
<procEventoNFe versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <evento versao="1.00">
    <infEvento Id="ID${evento.tipoEvento === 'CANCELAMENTO' ? '110111' : '110110'}${evento.chaveAcesso}${evento.numeroSequencialEvento.toString().padStart(2, '0')}">
      <cOrgao>35</cOrgao>
      <tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <CNPJ>12345678000190</CNPJ>
      <chNFe>${evento.chaveAcesso}</chNFe>
      <dhEvento>${evento.dataHoraEvento}</dhEvento>
      <tpEvento>${evento.tipoEvento === 'CANCELAMENTO' ? '110111' : '110110'}</tpEvento>
      <nSeqEvento>${evento.numeroSequencialEvento}</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>${evento.tipoEvento === 'CANCELAMENTO' ? 'Cancelamento' : 'Carta de Correcao'}</descEvento>
        ${evento.detalhesEvento.justificativa ? `<xJust>${evento.detalhesEvento.justificativa}</xJust>` : ''}
        ${evento.detalhesEvento.textoCorrecao ? `<xCorrecao>${evento.detalhesEvento.textoCorrecao}</xCorrecao>` : ''}
      </detEvento>
    </infEvento>
  </evento>
  <retEvento versao="1.00">
    <infEvento>
      <tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <verAplic>SVRS_EVENTOS_V1.0</verAplic>
      <cOrgao>35</cOrgao>
      <cStat>135</cStat>
      <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>
      <chNFe>${evento.chaveAcesso}</chNFe>
      <tpEvento>${evento.tipoEvento === 'CANCELAMENTO' ? '110111' : '110110'}</tpEvento>
      <nSeqEvento>${evento.numeroSequencialEvento}</nSeqEvento>
      <dhRegEvento>${dataHora}</dhRegEvento>
      <nProt>${protocoloEvento}</nProt>
    </infEvento>
  </retEvento>
</procEventoNFe>`;

    const tempo = Date.now() - inicio;

    const log: IntegracaoFiscalLog = {
      id: `log-ev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      empresaId,
      documentoFiscalId: evento.documentoFiscalId,
      eventoFiscalId: evento.id,
      servico: 'SEFAZ_EVENTO',
      ambiente,
      idempotencyKey: `idemp-ev-${evento.id}`,
      endpointChamado: `https://nfe.sefaz.gov.br/ws/NFeRecepcaoEvento4?env=${ambiente}`,
      tempoRespostaMs: tempo,
      statusHttp: 200,
      payloadEnvioFormatado: JSON.stringify(evento, null, 2),
      payloadRetornoFormatado: JSON.stringify({
        cStat: 135,
        xMotivo: 'Evento registrado e vinculado a NF-e',
        nProt: protocoloEvento,
        dhRegEvento: dataHora,
      }, null, 2),
      sucesso: true,
      timestamp: dataHora,
    };

    return {
      sucesso: true,
      protocoloEvento,
      codigoStatusSefaz: 135,
      motivoStatusSefaz: 'Evento registrado e vinculado a NF-e',
      xmlEventoAssinado,
      dataHoraEvento: dataHora,
      logsIntegracao: [log],
    };
  }

  async consultarChaveAcesso(
    empresaId: string,
    chaveAcesso: string,
    ambiente: AmbienteFiscal
  ): Promise<{ status: string; cStat: number; xMotivo: string; xml?: string }> {
    return {
      status: 'AUTORIZADO',
      cStat: 100,
      xMotivo: 'Autorizado o uso da NF-e (Consulta Protocolo)',
      xml: `<mockXmlConsulta chNFe="${chaveAcesso}" status="100"/>`,
    };
  }
}
