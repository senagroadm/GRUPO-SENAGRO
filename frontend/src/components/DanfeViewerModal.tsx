/**
 * NEXUS ERP - Visualizador & Impressor de DANFE / DANFSE
 * Renderiza o layout gráfico padrão oficial SEFAZ / ABRASF para conferência e impressão
 */

import React from 'react';
import {
  X,
  Printer,
  Download,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Truck,
  DollarSign,
  Package,
} from 'lucide-react';
import { DocumentoFiscal } from '@/backend/modules/fiscal/fiscal-types';

interface DanfeViewerModalProps {
  documento: DocumentoFiscal | null;
  onClose: () => void;
}

export const DanfeViewerModal: React.FC<DanfeViewerModalProps> = ({ documento, onClose }) => {
  if (!documento) return null;

  const handleDownloadXml = () => {
    const xml = documento.xmlDistribuicaoProtocolado || documento.xmlAssinado || '';
    if (!xml) return;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFe-${documento.chaveAcesso || documento.numeroDocumento}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const isNfse = documento.modelo === 'NFSE';

  return (
    <div
      id="danfe-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="danfe-modal-container"
        className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-300 overflow-hidden"
      >
        {/* Barra Superior de Ações */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {isNfse ? 'DANFSE' : 'DANFE'}
            </span>
            <span className="font-semibold text-sm">
              Documento Auxiliar da {isNfse ? 'NFS-e' : 'NF-e'} nº {documento.numeroDocumento} (Série {documento.serie})
            </span>
            <span className="text-xs text-slate-400">
              {documento.ambiente === 'HOMOLOGACAO' ? '• Ambiente Homologação' : '• Produção'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="danfe-btn-download-xml"
              onClick={handleDownloadXml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded text-slate-200 transition"
              title="Baixar XML Protocolado"
            >
              <Download className="w-3.5 h-3.5" />
              Download XML
            </button>
            <button
              id="danfe-btn-print"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded text-white transition"
              title="Imprimir DANFE"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              id="danfe-btn-close"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área do Documento para Impressão */}
        <div id="danfe-print-area" className="p-6 overflow-y-auto bg-slate-50 font-sans text-xs space-y-3">
          {/* Canhoto de Recebimento */}
          {!isNfse && (
            <div className="border border-slate-400 bg-white p-2 rounded-xs">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-10 text-[10px] text-slate-700 leading-tight">
                  RECEBEMOS DE <strong>TRITECH INDUSTRIAL DO BRASIL S.A.</strong> OS PRODUTOS/SERVIÇOS CONSTANTES DA
                  NOTA FISCAL INDICADA AO LADO. EMISSÃO: {new Date(documento.dataHoraEmissao).toLocaleDateString('pt-BR')} - DEST/REM: {documento.destinatario.razaoSocialNome} - TOTAL: R$ {documento.totais.valorTotalDocumento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-slate-300">
                    <div>DATA DE RECEBIMENTO: _____ / _____ / _________</div>
                    <div>IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR: _________________________________________</div>
                  </div>
                </div>
                <div className="col-span-2 border-l border-slate-400 pl-2 text-center flex flex-col justify-center">
                  <div className="font-bold text-[11px]">NF-e</div>
                  <div className="font-mono font-bold text-xs">Nº {documento.numeroDocumento}</div>
                  <div className="text-[10px] text-slate-600">SÉRIE {documento.serie}</div>
                </div>
              </div>
            </div>
          )}

          {/* Cabeçalho do DANFE */}
          <div className="border border-slate-400 bg-white p-3 rounded-xs">
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Identificação Emitente */}
              <div className="col-span-4 border-r border-slate-300 pr-3">
                <div className="font-black text-sm text-slate-900 tracking-tight">TRITECH INDUSTRIAL</div>
                <div className="text-[10px] font-medium text-slate-600 uppercase">
                  Tritech Industrial do Brasil S.A.
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  Av. das Nações Industriais, 1500 - Distrito Fabril
                  <br />
                  São Paulo - SP - CEP 04578-000
                  <br />
                  Tel: (11) 3450-8900
                </div>
              </div>

              {/* Quadro DANFE */}
              <div className="col-span-3 text-center border-r border-slate-300 pr-3">
                <div className="font-black text-base tracking-wider">{isNfse ? 'DANFSE' : 'DANFE'}</div>
                <div className="text-[10px] font-semibold text-slate-700">
                  {isNfse ? 'Documento Auxiliar da NFS-e' : 'Documento Auxiliar da Nota Fiscal Eletrônica'}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] mt-1 font-semibold">
                  <div className="bg-slate-100 p-0.5 border border-slate-300">
                    0 - ENTRADA
                    <br />
                    1 - SAÍDA
                  </div>
                  <div className="bg-slate-900 text-white font-bold flex items-center justify-center text-sm rounded-xs">
                    {documento.tipoOperacao === 'SAIDA' ? '1' : '0'}
                  </div>
                </div>
                <div className="mt-1 font-mono font-bold text-xs">
                  Nº {documento.numeroDocumento.toString().padStart(9, '0')}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold">SÉRIE {documento.serie}</div>
              </div>

              {/* Chave de Acesso e Código de Barras */}
              <div className="col-span-5 pl-1">
                <div className="text-[9px] font-bold text-slate-700 uppercase">Chave de Acesso</div>
                <div className="font-mono text-[11px] font-bold tracking-wider bg-slate-100 p-1 rounded border border-slate-300 text-center break-all">
                  {documento.chaveAcesso
                    ? documento.chaveAcesso.match(/.{1,4}/g)?.join(' ')
                    : 'CHAVE GERADA NA TRANSMISSÃO SEFAZ'}
                </div>
                {/* Código de barras visual simulado */}
                <div className="mt-1 bg-slate-900 h-6 flex items-center justify-center text-white text-[9px] font-mono tracking-widest px-2">
                  |||||| |||| ||||| ||||||| ||| |||||| |||| |||| |||||| ||||| ||||
                </div>
                <div className="mt-1 text-[9px] text-slate-600 flex justify-between">
                  <span>
                    Protocolo: <strong>{documento.protocoloAutorizacao || 'AUTORIZADA'}</strong>
                  </span>
                  <span>{new Date(documento.dataHoraEmissao).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Natureza da Operação e Inscrições */}
          <div className="border border-slate-400 bg-white p-2 rounded-xs grid grid-cols-12 gap-2 text-[10px]">
            <div className="col-span-6">
              <span className="text-slate-500 font-bold">NATUREZA DA OPERAÇÃO:</span>
              <div className="font-bold text-slate-900">{documento.naturezaOperacao}</div>
            </div>
            <div className="col-span-3">
              <span className="text-slate-500 font-bold">PROTOCOLO DE AUTORIZAÇÃO:</span>
              <div className="font-mono font-bold text-slate-900">{documento.protocoloAutorizacao || 'N/A'}</div>
            </div>
            <div className="col-span-3">
              <span className="text-slate-500 font-bold">CNPJ EMITENTE:</span>
              <div className="font-mono font-bold text-slate-900">12.345.678/0001-90</div>
            </div>
          </div>

          {/* Destinatário / Tomador */}
          <div className="border border-slate-400 bg-white p-2 rounded-xs space-y-1">
            <div className="text-[10px] font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5">
              Destinatário / Remetente
            </div>
            <div className="grid grid-cols-12 gap-2 text-[10px]">
              <div className="col-span-7">
                <span className="text-slate-500">NOME / RAZÃO SOCIAL:</span>
                <div className="font-bold text-slate-900">{documento.destinatario.razaoSocialNome}</div>
              </div>
              <div className="col-span-3">
                <span className="text-slate-500">CNPJ / CPF:</span>
                <div className="font-mono font-bold text-slate-900">{documento.destinatario.cnpjCpf}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">DATA EMISSÃO:</span>
                <div className="font-bold text-slate-900">
                  {new Date(documento.dataHoraEmissao).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="col-span-5">
                <span className="text-slate-500">ENDEREÇO:</span>
                <div className="font-medium text-slate-900">
                  {documento.destinatario.endereco.logradouro}, {documento.destinatario.endereco.numero}
                </div>
              </div>
              <div className="col-span-3">
                <span className="text-slate-500">BAIRRO / DISTRITO:</span>
                <div className="font-medium text-slate-900">{documento.destinatario.endereco.bairro}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">CEP:</span>
                <div className="font-mono font-medium text-slate-900">{documento.destinatario.endereco.cep}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">UF / MUNICÍPIO:</span>
                <div className="font-medium text-slate-900">
                  {documento.destinatario.endereco.cidade} - {documento.destinatario.endereco.uf}
                </div>
              </div>
            </div>
          </div>

          {/* Faturas / Duplicatas */}
          {documento.cobranca?.duplicatas && documento.cobranca.duplicatas.length > 0 && (
            <div className="border border-slate-400 bg-white p-2 rounded-xs space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5">
                Fatura / Duplicatas
              </div>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {documento.cobranca.duplicatas.map((dup, idx) => (
                  <div key={idx} className="border border-slate-300 rounded p-1 bg-slate-50 min-w-[120px]">
                    <div className="text-slate-500 text-[9px]">Nº {dup.numeroDuplicata}</div>
                    <div className="font-bold text-slate-900">
                      Venc: {new Date(dup.dataVencimento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="font-bold text-emerald-700">
                      R$ {dup.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quadro de Cálculo de Impostos */}
          <div className="border border-slate-400 bg-white p-2 rounded-xs space-y-1">
            <div className="text-[10px] font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5">
              Cálculo do Imposto
            </div>
            <div className="grid grid-cols-6 gap-1 text-[10px] text-right">
              <div className="border border-slate-200 p-1 bg-slate-50">
                <div className="text-[8px] text-slate-500 uppercase">Base Cálc ICMS</div>
                <div className="font-mono font-bold">
                  R$ {documento.totais.baseCalculoIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="border border-slate-200 p-1 bg-slate-50">
                <div className="text-[8px] text-slate-500 uppercase">Valor ICMS</div>
                <div className="font-mono font-bold text-slate-900">
                  R$ {documento.totais.valorTotalIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="border border-slate-200 p-1 bg-slate-50">
                <div className="text-[8px] text-slate-500 uppercase">Valor do IPI</div>
                <div className="font-mono font-bold">
                  R$ {documento.totais.valorTotalIpi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="border border-slate-200 p-1 bg-slate-50">
                <div className="text-[8px] text-slate-500 uppercase">Valor PIS</div>
                <div className="font-mono font-bold">
                  R$ {documento.totais.valorTotalPis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="border border-slate-200 p-1 bg-slate-50">
                <div className="text-[8px] text-slate-500 uppercase">Valor COFINS</div>
                <div className="font-mono font-bold">
                  R$ {documento.totais.valorTotalCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="border border-emerald-300 p-1 bg-emerald-50">
                <div className="text-[8px] text-emerald-800 uppercase font-black">Total da Nota</div>
                <div className="font-mono font-black text-emerald-900 text-xs">
                  R$ {documento.totais.valorTotalDocumento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Dados dos Itens e Serviços */}
          <div className="border border-slate-400 bg-white rounded-xs overflow-hidden">
            <div className="p-1.5 bg-slate-100 text-[10px] font-black uppercase text-slate-800 border-b border-slate-300">
              Dados dos Produtos / Serviços
            </div>
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-200 font-bold text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="py-1 px-2">CÓD</th>
                  <th className="py-1 px-2">DESCRIÇÃO</th>
                  <th className="py-1 px-2">NCM</th>
                  <th className="py-1 px-2">CST</th>
                  <th className="py-1 px-2">CFOP</th>
                  <th className="py-1 px-2">UN</th>
                  <th className="py-1 px-2 text-right">QTD</th>
                  <th className="py-1 px-2 text-right">VL. UNIT</th>
                  <th className="py-1 px-2 text-right">VL. TOTAL</th>
                  <th className="py-1 px-2 text-right">BC ICMS</th>
                  <th className="py-1 px-2 text-right">ALÍQ</th>
                  <th className="py-1 px-2 text-right">VL ICMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {documento.itens.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1 px-2">{it.codigoItem}</td>
                    <td className="py-1 px-2 font-sans font-medium">{it.descricao}</td>
                    <td className="py-1 px-2">{it.ncm}</td>
                    <td className="py-1 px-2">{it.cstCsosnIcms}</td>
                    <td className="py-1 px-2 font-bold">{it.cfop}</td>
                    <td className="py-1 px-2">{it.unidadeMedida}</td>
                    <td className="py-1 px-2 text-right font-bold">{it.quantidade}</td>
                    <td className="py-1 px-2 text-right">{it.valorUnitario.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right font-bold">{it.valorTotalLiquido.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right">{it.baseCalculoIcms.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right">{it.aliquotaIcmsPercentual}%</td>
                    <td className="py-1 px-2 text-right font-bold">{it.valorIcms.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dados Adicionais / Fisco e Contribuinte */}
          <div className="border border-slate-400 bg-white p-2 rounded-xs space-y-1 text-[10px]">
            <div className="font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5">
              Dados Adicionais
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 p-1.5 bg-slate-50 rounded">
                <div className="font-bold text-slate-600 text-[9px] uppercase">Informações do Fisco:</div>
                <div className="text-slate-800 text-[9px] mt-0.5">
                  {documento.informacoesAdicionais?.dadosAdicionaisFisco || 'Sem observações fiscais específicas.'}
                </div>
              </div>
              <div className="border border-slate-200 p-1.5 bg-slate-50 rounded">
                <div className="font-bold text-slate-600 text-[9px] uppercase">Informações Complementares:</div>
                <div className="text-slate-800 text-[9px] mt-0.5">
                  {documento.informacoesAdicionais?.dadosAdicionaisContribuinte ||
                    'Documento emitido por ME ou EPP optante pelo Simples Nacional ou Lucro Real/Presumido conforme legislação vigente.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
