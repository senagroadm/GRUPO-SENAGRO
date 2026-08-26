/**
 * backend/modules/rh/rh-adapter.ts
 * NEXUS ERP (Grupo TRITECH - 5 CNPJs)
 * MÓDULO: RH OPERACIONAL & INTEGRAÇÕES EXTERNAS
 * 
 * Padrão Adapter / Service com MockProvider:
 * Desacopla o ERP industrial de sistemas especializados de Folha de Pagamento (TOTVS, Senior, ADP)
 * e Ponto Eletrônico (Secullum, REP-P/REP-A Portaria 671 MTE).
 */

import {
  RhIntegracaoFolhaPontoPayload,
  ResultadoIntegracaoExterna,
  FuncionarioEmpresa,
  Funcionario,
  ApontamentoHoras,
  Desligamento,
} from './rh-types';

export interface IRhExternalSystemAdapter {
  exportarAdmissoes(
    empresaId: string,
    cnpj: string,
    admissoes: { funcionario: Funcionario; vinculo: FuncionarioEmpresa }[]
  ): Promise<ResultadoIntegracaoExterna>;

  exportarRescisoes(
    empresaId: string,
    cnpj: string,
    rescisoes: Desligamento[]
  ): Promise<ResultadoIntegracaoExterna>;

  exportarApontamentosHorasParaCustoEFolha(
    empresaId: string,
    cnpj: string,
    apontamentos: ApontamentoHoras[]
  ): Promise<ResultadoIntegracaoExterna>;

  importarMarcacoesPonto(
    empresaId: string,
    cnpj: string,
    periodoInicio: string,
    periodoFim: string
  ): Promise<ResultadoIntegracaoExterna>;
}

export class MockRhFolhaPontoAdapter implements IRhExternalSystemAdapter {
  private readonly sistema: string;

  constructor(sistema: 'TOTVS_PROTHEUS' | 'SENIOR_HCM' | 'ADP_EXPERTISE' | 'SECULLUM_PONTO' = 'SENIOR_HCM') {
    this.sistema = sistema;
  }

  async exportarAdmissoes(
    empresaId: string,
    cnpj: string,
    admissoes: { funcionario: Funcionario; vinculo: FuncionarioEmpresa }[]
  ): Promise<ResultadoIntegracaoExterna> {
    const protocolo = `NEXUS-ADM-${Date.now().toString(36).toUpperCase()}`;
    const payloadFormatado = {
      sistemaOrigem: 'NEXUS_ERP_TRITECH',
      sistemaDestino: this.sistema,
      empresaId,
      empresaCnpj: cnpj,
      timestamp: new Date().toISOString(),
      loteAdmissoes: admissoes.map((item) => ({
        cpf: item.funcionario.cpf,
        nome: item.funcionario.nomeCompleto,
        matricula: item.vinculo.matricula,
        cargoId: item.vinculo.cargoId,
        setorId: item.vinculo.setorId,
        dataAdmissao: item.vinculo.dataAdmissao,
        salarioBase: item.vinculo.salarioBase,
        tipoContrato: item.vinculo.tipoContrato,
        insalubridade: item.vinculo.adicionalInsalubridadeGrau,
        periculosidadePerc: item.vinculo.adicionalPericulosidadePerc,
        regimeJornada: item.vinculo.regimeJornada,
      })),
    };

    return {
      sucesso: true,
      protocoloTransmissao: protocolo,
      sistemaDestino: this.sistema,
      dataHora: new Date().toISOString(),
      registrosProcessados: admissoes.length,
      mensagens: [
        `Lote de admissões integrado com sucesso ao ${this.sistema}.`,
        `${admissoes.length} contratos sincronizados no banco de dados da folha externa.`,
      ],
      payloadExportado: payloadFormatado,
    };
  }

  async exportarRescisoes(
    empresaId: string,
    cnpj: string,
    rescisoes: Desligamento[]
  ): Promise<ResultadoIntegracaoExterna> {
    const protocolo = `NEXUS-RESC-${Date.now().toString(36).toUpperCase()}`;
    const payloadFormatado = {
      sistemaOrigem: 'NEXUS_ERP_TRITECH',
      sistemaDestino: this.sistema,
      empresaId,
      empresaCnpj: cnpj,
      timestamp: new Date().toISOString(),
      loteRescisoes: rescisoes.map((r) => ({
        funcionarioId: r.funcionarioId,
        matricula: r.matricula,
        nome: r.funcionarioNome,
        tipoRescisao: r.tipoRescisao,
        dataComunicacao: r.dataComunicacao,
        dataDesligamentoEfetivo: r.dataDesligamentoEfetivo,
        avisoPrevio: r.tipoAvisoPrevio,
        cumpriuAviso: r.cumpriuAvisoPrevio,
        statusChecklist: r.progressoPercentual === 100 ? 'TOTALMENTE_HOMOLOGADO' : 'PENDENCIAS_OPERACIONAIS',
      })),
    };

    return {
      sucesso: true,
      protocoloTransmissao: protocolo,
      sistemaDestino: this.sistema,
      dataHora: new Date().toISOString(),
      registrosProcessados: rescisoes.length,
      mensagens: [
        `Lote de rescisões transmitido ao sistema ${this.sistema}.`,
        `Cálculo das verbas rescisórias liberado para conferência contábil externa.`,
      ],
      payloadExportado: payloadFormatado,
    };
  }

  async exportarApontamentosHorasParaCustoEFolha(
    empresaId: string,
    cnpj: string,
    apontamentos: ApontamentoHoras[]
  ): Promise<ResultadoIntegracaoExterna> {
    const protocolo = `NEXUS-HOURS-${Date.now().toString(36).toUpperCase()}`;
    const totalHoras = apontamentos.reduce((acc, curr) => acc + curr.quantidadeHoras, 0);
    const totalCusto = apontamentos.reduce((acc, curr) => acc + curr.custoTotalCalculado, 0);

    const payloadFormatado = {
      sistemaOrigem: 'NEXUS_ERP_TRITECH',
      sistemaDestino: this.sistema,
      empresaId,
      empresaCnpj: cnpj,
      timestamp: new Date().toISOString(),
      resumo: {
        totalApontamentos: apontamentos.length,
        totalHoras,
        totalCustoIndustrial: totalCusto,
      },
      itens: apontamentos.map((a) => ({
        matricula: a.matricula,
        funcionarioNome: a.funcionarioNome,
        data: a.dataApontamento,
        tipoHora: a.tipoHora,
        quantidadeHoras: a.quantidadeHoras,
        custoHoraAplicado: a.custoHoraAplicado,
        custoTotal: a.custoTotalCalculado,
        ordemProducaoId: a.ordemProducaoId,
        operacaoId: a.operacaoId,
        maquinaId: a.maquinaId,
        statusAprovacao: a.statusAprovacao,
      })),
    };

    return {
      sucesso: true,
      protocoloTransmissao: protocolo,
      sistemaDestino: this.sistema,
      dataHora: new Date().toISOString(),
      registrosProcessados: apontamentos.length,
      mensagens: [
        `Arquivo de eventos de ponto e horas extras (${totalHoras}h) transmitido com sucesso ao ${this.sistema}.`,
        `Horas de produção industrial conciliadas com o centro de custos da fábrica.`,
      ],
      payloadExportado: payloadFormatado,
    };
  }

  async importarMarcacoesPonto(
    empresaId: string,
    cnpj: string,
    periodoInicio: string,
    periodoFim: string
  ): Promise<ResultadoIntegracaoExterna> {
    const protocolo = `NEXUS-IMP-PONTO-${Date.now().toString(36).toUpperCase()}`;

    return {
      sucesso: true,
      protocoloTransmissao: protocolo,
      sistemaDestino: this.sistema,
      dataHora: new Date().toISOString(),
      registrosProcessados: 48,
      mensagens: [
        `Importadas marcações de ponto do relógio REP-P/Portaria 671 para o período ${periodoInicio} a ${periodoFim}.`,
        `48 batidas conciliadas com os turnos operacionais ativos.`,
      ],
      payloadExportado: {
        empresaId,
        empresaCnpj: cnpj,
        periodo: { periodoInicio, periodoFim },
        batidasSincronizadasQtd: 48,
      },
    };
  }
}

export const rhExternalAdapter = new MockRhFolhaPontoAdapter('SENIOR_HCM');
