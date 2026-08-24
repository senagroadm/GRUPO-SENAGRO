import crypto from 'crypto';
import {
  PoliticaCredito,
  LimiteCredito,
  AnaliseCredito,
  ConsultaCreditoBureau,
  BloqueioCredito,
  HistoricoPagamentoItem,
  RelacionamentoClienteEmpresa,
  StatusAnaliseCredito,
  TipoGarantiaExigida,
  NivelAlcadaAprovacao,
} from './credito-types';
import { CreditProvider, CreditoCompletoBureauResponse } from './providers/credit-provider.interface';
import { MockSerasaProvider } from './providers/mock-serasa-provider';
import { IndustrialCreditEngine } from './credito-engine';

export class CreditoService {
  private creditProvider: CreditProvider;

  // In-memory repositories para simulação de produção
  private politicas: PoliticaCredito[] = [];
  private limites: LimiteCredito[] = [];
  private analises: AnaliseCredito[] = [];
  private consultasBureau: ConsultaCreditoBureau[] = [];
  private bloqueios: BloqueioCredito[] = [];
  private historicoPagamentos: HistoricoPagamentoItem[] = [];
  private relacionamentos: RelacionamentoClienteEmpresa[] = [];

  constructor(provider?: CreditProvider) {
    // Permite injeção de qualquer CreditProvider (MockSerasaProvider ou provedor real com contrato futuro)
    this.creditProvider = provider || new MockSerasaProvider();
    this.inicializarDadosDemo();
  }

  public setProvider(provider: CreditProvider) {
    this.creditProvider = provider;
  }

  public getProviderName(): string {
    return this.creditProvider.nomeProvedor;
  }

  // ---------------------------------------------------------------------------
  // POLÍTICAS DE CRÉDITO
  // ---------------------------------------------------------------------------
  public getPoliticas(empresaId?: string): PoliticaCredito[] {
    if (!empresaId) return this.politicas;
    return this.politicas.filter((p) => !p.empresaId || p.empresaId === empresaId);
  }

  public getPoliticaAtiva(empresaId?: string): PoliticaCredito {
    const especifica = this.politicas.find((p) => p.ativo && p.empresaId === empresaId);
    if (especifica) return especifica;
    const global = this.politicas.find((p) => p.ativo && !p.empresaId);
    return global || this.politicas[0];
  }

  public salvarPolitica(politica: PoliticaCredito): PoliticaCredito {
    const index = this.politicas.findIndex((p) => p.id === politica.id);
    const atualizada = {
      ...politica,
      atualizadoEm: new Date().toISOString(),
    };
    if (index >= 0) {
      this.politicas[index] = atualizada;
    } else {
      this.politicas.unshift(atualizada);
    }
    return atualizada;
  }

  // ---------------------------------------------------------------------------
  // LIMITES DE CRÉDITO (Por Empresa & Consolidado do Grupo)
  // ---------------------------------------------------------------------------
  public getLimites(empresaId?: string, filtro?: string): LimiteCredito[] {
    let list = [...this.limites];

    if (filtro) {
      const f = filtro.toLowerCase();
      list = list.filter(
        (l) =>
          l.clienteNome.toLowerCase().includes(f) ||
          l.cnpjCpf.includes(f) ||
          (l.grupoEconomicoCliente && l.grupoEconomicoCliente.toLowerCase().includes(f))
      );
    }

    if (empresaId) {
      // Retorna todos os limites que possuem alocação ou movimentação nesta empresa
      list = list.filter((l) => l.limitesPorEmpresa.some((le) => le.empresaId === empresaId));
    }

    return list;
  }

  public getLimitePorClienteId(clienteId: string): LimiteCredito | undefined {
    return this.limites.find((l) => l.clienteId === clienteId);
  }

  public getLimitePorDocumento(documento: string): LimiteCredito | undefined {
    const docLimpo = documento.replace(/\D/g, '');
    return this.limites.find((l) => l.cnpjCpf.replace(/\D/g, '') === docLimpo);
  }

  public atualizarLimite(id: string, update: Partial<LimiteCredito>): LimiteCredito {
    const index = this.limites.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Limite de crédito não encontrado.');

    const atual = this.limites[index];
    const novo: LimiteCredito = {
      ...atual,
      ...update,
      atualizadoEm: new Date().toISOString(),
    };

    // Recalcular saldo consolidado
    novo.saldoConsolidadoDisponivel = Math.max(
      0,
      novo.limiteConsolidadoGrupo - novo.exposicaoConsolidadaProjetada
    );

    this.limites[index] = novo;
    return novo;
  }

  // ---------------------------------------------------------------------------
  // CONSULTAS BUREAU EXTERNO (ADAPTER MOCK / SERASA)
  // ---------------------------------------------------------------------------
  public async realizarConsultaBureau(
    documento: string,
    empresaId: string,
    solicitanteId: string,
    solicitanteNome: string,
    tipo: 'COMPLETA_PJ' | 'SIMPLES_PF' | 'SCORE_APENAS' | 'RESTRICOES' = 'COMPLETA_PJ'
  ): Promise<{ consultaRegistro: ConsultaCreditoBureau; dadosCompletos: CreditoCompletoBureauResponse }> {
    const dadosCompletos = await this.creditProvider.consultarCredito(documento);

    const consultaRegistro: ConsultaCreditoBureau = {
      id: `cons-${crypto.randomBytes(4).toString('hex')}`,
      empresaId,
      documento: dadosCompletos.cadastro.documento,
      razaoSocialConsultada: dadosCompletos.cadastro.razaoSocialOuNome,
      provedor: this.creditProvider.nomeProvedor,
      tipoConsulta: tipo,
      scoreRetornado: dadosCompletos.score.score,
      faixaRisco: dadosCompletos.score.faixaRisco,
      probabilidadeInadimplenciaPerc: dadosCompletos.score.probabilidadeInadimplenciaPerc,
      quantidadeProtestos: dadosCompletos.restricoes.protestos.length,
      valorTotalProtestos: dadosCompletos.restricoes.protestos.reduce((a, b) => a + b.valor, 0),
      quantidadePendenciasFinanceiras:
        dadosCompletos.restricoes.pefin.length + dadosCompletos.restricoes.refin.length,
      valorTotalPendencias:
        dadosCompletos.restricoes.pefin.reduce((a, b) => a + b.valor, 0) +
        dadosCompletos.restricoes.refin.reduce((a, b) => a + b.valor, 0),
      quantidadeAcoesJudiciais: dadosCompletos.restricoes.acoesJudiciais.length,
      chequesSemFundo: dadosCompletos.restricoes.chequesSemFundoQtd,
      situacaoReceitaFederal: dadosCompletos.cadastro.situacaoCadastral,
      payloadResposta: dadosCompletos as unknown as Record<string, unknown>,
      custoConsultaEstimado: 18.5,
      usuarioSolicitanteId: solicitanteId,
      usuarioSolicitanteNome: solicitanteNome,
      dataHoraConsulta: new Date().toISOString(),
    };

    this.consultasBureau.unshift(consultaRegistro);
    return { consultaRegistro, dadosCompletos };
  }

  public getConsultasBureau(empresaId?: string, documento?: string): ConsultaCreditoBureau[] {
    let list = [...this.consultasBureau];
    if (empresaId) list = list.filter((c) => c.empresaId === empresaId);
    if (documento) {
      const docLimpo = documento.replace(/\D/g, '');
      list = list.filter((c) => c.documento.replace(/\D/g, '') === docLimpo);
    }
    return list;
  }

  // ---------------------------------------------------------------------------
  // ANÁLISES DE CRÉDITO (MOTOR + WORKFLOW HUMANO)
  // ---------------------------------------------------------------------------
  public getAnalises(empresaId?: string, status?: string): AnaliseCredito[] {
    let list = [...this.analises];
    if (empresaId) list = list.filter((a) => a.empresaId === empresaId);
    if (status && status !== 'TODOS') list = list.filter((a) => a.status === status);
    return list;
  }

  public getAnaliseById(id: string): AnaliseCredito | undefined {
    return this.analises.find((a) => a.id === id);
  }

  public async criarAnaliseCredito(dados: {
    empresaId: string;
    empresaNome: string;
    clienteId: string;
    clienteNome: string;
    cnpjCpf: string;
    limiteSolicitado: number;
    prazoPagamentoSolicitadoDias: number;
    motivoSolicitacao: 'PRIMEIRA_ANALISE' | 'AUMENTO_LIMITE' | 'REVISAO_PERIODICA' | 'NOVO_PEDIDO_GRANDE' | 'DESBLOQUEIO';
    solicitanteNome: string;
    consultarBureauAutomatico?: boolean;
  }): Promise<AnaliseCredito> {
    const politica = this.getPoliticaAtiva(dados.empresaId);
    const limiteAtual = this.getLimitePorClienteId(dados.clienteId);
    const relacoes = this.relacionamentos.filter((r) => r.clienteId === dados.clienteId);
    const pagamentos = this.historicoPagamentos.filter((p) => p.clienteId === dados.clienteId);

    // Calcular estatísticas internas
    const totalTitulosPagos = pagamentos.filter((p) => p.status === 'PAGO_EM_DIA' || p.status === 'PAGO_COM_ATRASO').length;
    const totalComAtraso = pagamentos.filter((p) => p.status === 'PAGO_COM_ATRASO').length;
    const titulosVencidos = pagamentos.filter((p) => p.status === 'VENCIDO');
    const valorTitulosVencidos = titulosVencidos.reduce((acc, t) => acc + t.valorNominal, 0);
    const maiorAtrasoDias = titulosVencidos.reduce((acc, t) => Math.max(acc, t.diasAtraso), 0);

    const faturamentoHistorico = relacoes.reduce((acc, r) => acc + r.faturamentoTotalAcumulado, 0);
    const mesesRelacionamento = relacoes.reduce((acc, r) => Math.max(acc, r.tempoRelacionamentoMeses), 0);
    const pedidosTotal = relacoes.reduce((acc, r) => acc + r.quantidadeTotalPedidos, 0);
    const maiorCompra = relacoes.reduce((acc, r) => Math.max(acc, r.maiorCompraValor), 0);
    const maiorAcumulo = relacoes.reduce((acc, r) => Math.max(acc, r.maiorAcumuloFinanceiro), 0);

    const somaDiasAtraso = pagamentos.reduce((acc, p) => acc + (p.diasAtraso || 0), 0);
    const mediaAtraso = pagamentos.length > 0 ? Number((somaDiasAtraso / pagamentos.length).toFixed(1)) : 0;
    const taxaPontualidade = pagamentos.length > 0 ? Number((((pagamentos.length - totalComAtraso) / pagamentos.length) * 100).toFixed(1)) : 100;

    // Consulta Bureau
    let consultaBureauData: CreditoCompletoBureauResponse | undefined = undefined;
    if (dados.consultarBureauAutomatico !== false) {
      const { dadosCompletos } = await this.realizarConsultaBureau(
        dados.cnpjCpf,
        dados.empresaId,
        'usr-current',
        dados.solicitanteNome
      );
      consultaBureauData = dadosCompletos;
    }

    // Exposição
    const expAtualEmpresa = limiteAtual?.limitesPorEmpresa.find((e) => e.empresaId === dados.empresaId)?.exposicaoAtual || 0;
    const expProjetadaEmpresa = limiteAtual?.limitesPorEmpresa.find((e) => e.empresaId === dados.empresaId)?.exposicaoProjetada || 0;
    const expAtualGrupo = limiteAtual?.exposicaoConsolidadaAtual || 0;
    const expProjetadaGrupo = limiteAtual?.exposicaoConsolidadaProjetada || 0;
    const limAtualEmpresa = limiteAtual?.limitesPorEmpresa.find((e) => e.empresaId === dados.empresaId)?.limiteConcedido || 0;
    const limAtualGrupo = limiteAtual?.limiteConsolidadoGrupo || 0;

    // Executar Motor de Crédito Industrial
    const resultadoMotor = IndustrialCreditEngine.avaliar({
      politica,
      dadosCadastrais: {
        razaoSocial: dados.clienteNome,
        cnpjCpf: dados.cnpjCpf,
        faturamentoMensalEstimado: consultaBureauData?.resumoFinanceiro.faturamentoEstimadoMensal || 350000,
        capitalSocial: consultaBureauData?.cadastro.capitalSocial || 500000,
      },
      historicoInterno: {
        mesesRelacionamento,
        totalFaturadoHistorico: faturamentoHistorico,
        quantidadePedidosHistorico: pedidosTotal,
        maiorCompraValor: maiorCompra,
        maiorAcumuloValor: maiorAcumulo,
        mediaAtrasoDias: mediaAtraso,
        taxaPontualidadePerc: taxaPontualidade,
        totalTitulosPagos,
        totalTitulosComAtraso: totalComAtraso,
        titulosVencidosValor: valorTitulosVencidos,
        quantidadeTitulosVencidos: titulosVencidos.length,
        diasMaiorAtrasoAtual: maiorAtrasoDias,
      },
      exposicao: {
        exposicaoAtualEmpresa: expAtualEmpresa,
        exposicaoProjetadaEmpresa: expProjetadaEmpresa,
        exposicaoAtualGrupo: expAtualGrupo,
        exposicaoProjetadaGrupo: expProjetadaGrupo,
        limiteAtualEmpresa: limAtualEmpresa,
        limiteAtualGrupo: limAtualGrupo,
        limiteSolicitado: dados.limiteSolicitado,
        pedidosEmCarteiraValor: Math.max(0, expProjetadaEmpresa - expAtualEmpresa),
      },
      consultaBureau: consultaBureauData,
    });

    const novaAnalise: AnaliseCredito = {
      id: `anl-${crypto.randomBytes(4).toString('hex')}`,
      protocolo: `AC-${new Date().getFullYear()}-${String(this.analises.length + 1).padStart(4, '0')}`,
      empresaId: dados.empresaId,
      empresaNome: dados.empresaNome,
      clienteId: dados.clienteId,
      clienteNome: dados.clienteNome,
      cnpjCpf: dados.cnpjCpf,

      dadosCadastrais: {
        razaoSocial: dados.clienteNome,
        nomeFantasia: consultaBureauData?.cadastro.nomeFantasia || dados.clienteNome,
        cnpjCpf: dados.cnpjCpf,
        inscricaoEstadual: '645.109.840.112',
        dataFundacao: consultaBureauData?.cadastro.dataAberturaOuNascimento || '2015-06-10',
        cnaePrincipal: consultaBureauData?.cadastro.cnaePrincipal || '25.11-0-00',
        ramoAtividade: consultaBureauData?.cadastro.cnaeDescricao || 'Metalurgia e Usinagem Industrial',
        cidade: consultaBureauData?.cadastro.cidade || 'Ribeirão Preto',
        uf: consultaBureauData?.cadastro.uf || 'SP',
        capitalSocial: consultaBureauData?.cadastro.capitalSocial || 800000,
        faturamentoMensalEstimado: consultaBureauData?.resumoFinanceiro.faturamentoEstimadoMensal || 350000,
        quadroSocietario: consultaBureauData?.cadastro.quadroSocietario
          ? consultaBureauData.cadastro.quadroSocietario.map((s) => ({
              nome: s.nome,
              cpfCnpj: s.documento,
              participacaoPerc: s.participacaoPerc,
              cargo: s.cargo,
            }))
          : [
              { nome: 'Carlos Eduardo Silveira', cpfCnpj: '123.456.789-00', participacaoPerc: 60, cargo: 'Sócio-Administrador' },
              { nome: 'Renata Silveira', cpfCnpj: '987.654.321-11', participacaoPerc: 40, cargo: 'Sócia' },
            ],
      },

      limiteSolicitado: dados.limiteSolicitado,
      prazoPagamentoSolicitadoDias: dados.prazoPagamentoSolicitadoDias,
      motivoSolicitacao: dados.motivoSolicitacao,
      solicitanteNome: dados.solicitanteNome,

      exposicaoNoMomento: {
        exposicaoAtualEmpresa: expAtualEmpresa,
        exposicaoProjetadaEmpresa: expProjetadaEmpresa,
        exposicaoAtualGrupo: expAtualGrupo,
        exposicaoProjetadaGrupo: expProjetadaGrupo,
        pedidosEmCarteiraValor: Math.max(0, expProjetadaEmpresa - expAtualEmpresa),
        titulosVencidosValor: valorTitulosVencidos,
        quantidadeTitulosVencidos: titulosVencidos.length,
      },

      historicoInterno: {
        mesesRelacionamento,
        totalFaturadoHistorico: faturamentoHistorico,
        quantidadePedidosHistorico: pedidosTotal,
        maiorCompraValor: maiorCompra,
        maiorAcumuloValor: maiorAcumulo,
        mediaAtrasoDias: mediaAtraso,
        taxaPontualidadePerc: taxaPontualidade,
        totalTitulosPagos,
        totalTitulosComAtraso: totalComAtraso,
      },

      consultaBureau: consultaBureauData
        ? {
            consultaId: `cons-${crypto.randomBytes(3).toString('hex')}`,
            provedor: consultaBureauData.provedorNome,
            dataHoraConsulta: consultaBureauData.consultadoEm,
            scoreBureau: consultaBureauData.score.score,
            probabilidadeInadimplencia: consultaBureauData.score.probabilidadeInadimplenciaPerc,
            faixaRiscoBureau: consultaBureauData.score.faixaRisco,
            protestosQtd: consultaBureauData.restricoes.protestos.length,
            protestosValor: consultaBureauData.restricoes.protestos.reduce((a, b) => a + b.valor, 0),
            pefinQtd: consultaBureauData.restricoes.pefin.length,
            pefinValor: consultaBureauData.restricoes.pefin.reduce((a, b) => a + b.valor, 0),
            refinQtd: consultaBureauData.restricoes.refin.length,
            refinValor: consultaBureauData.restricoes.refin.reduce((a, b) => a + b.valor, 0),
            acoesJudiciaisQtd: consultaBureauData.restricoes.acoesJudiciais.length,
            chequesSemFundoQtd: consultaBureauData.restricoes.chequesSemFundoQtd,
            falenciasOuRecuperacoes: consultaBureauData.restricoes.participacaoFalenciasOuRecuperacoes,
          }
        : undefined,

      resultadoScoreInterno: {
        scoreInternoFinal: resultadoMotor.scoreInternoFinal,
        faixaScore: resultadoMotor.faixaScore,
        pontosHistorico: resultadoMotor.pontosHistorico,
        pontosRelacionamento: resultadoMotor.pontosRelacionamento,
        pontosVolume: resultadoMotor.pontosVolume,
        pontosBureau: resultadoMotor.pontosBureau,
        pontosRestricoes: resultadoMotor.pontosRestricoes,
        limiteSugeridoMotor: resultadoMotor.limiteSugeridoMotor,
        prazoMaximoSugeridoDias: resultadoMotor.prazoMaximoSugeridoDias,
        garantiaSugerida: resultadoMotor.garantiaSugerida,
        recomendacao: resultadoMotor.recomendacao,
        motivosRecomendacao: resultadoMotor.motivosRecomendacao,
      },

      status: 'PENDENTE_APROVACAO',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    // Caso o motor exija bloqueio imediato, aplicar bloqueio automático
    if (resultadoMotor.bloqueioImediatoRequerido) {
      this.aplicarBloqueio({
        empresaId: dados.empresaId,
        clienteId: dados.clienteId,
        clienteNome: dados.clienteNome,
        cnpjCpf: dados.cnpjCpf,
        tipoBloqueio: 'AUTOMATICO_MOTOR',
        motivo: 'INADIMPLENCIA_TITULOS_VENCIDOS',
        detalhesMotivo: resultadoMotor.motivoBloqueio || 'Bloqueio preventivo gerado por análise de crédito com títulos vencidos.',
        valorTitulosVencidos,
        diasMaiorAtraso: maiorAtrasoDias,
      });
    }

    this.analises.unshift(novaAnalise);
    return novaAnalise;
  }

  public decidirAnalise(
    id: string,
    decisao: {
      status: 'APROVADO' | 'APROVADO_COM_RESTRICAO' | 'REPROVADO';
      limiteAprovado: number;
      limiteConsolidadoAprovado: number;
      prazoMaximoDias: number;
      garantiaExigida: TipoGarantiaExigida;
      parecerAprovador: string;
      aprovadorUsuarioId: string;
      aprovadorNome: string;
      aprovadorCargo: string;
      nivelAlcada: NivelAlcadaAprovacao;
      mesesValidade?: number;
    }
  ): AnaliseCredito {
    const analise = this.getAnaliseById(id);
    if (!analise) throw new Error('Análise de crédito não encontrada.');

    const dataValidade = new Date();
    dataValidade.setMonth(dataValidade.getMonth() + (decisao.mesesValidade || 6));

    analise.decisao = {
      status: decisao.status,
      limiteAprovado: decisao.limiteAprovado,
      limiteConsolidadoAprovado: decisao.limiteConsolidadoAprovado,
      prazoMaximoDias: decisao.prazoMaximoDias,
      garantiaExigida: decisao.garantiaExigida,
      parecerAprovador: decisao.parecerAprovador,
      aprovadorUsuarioId: decisao.aprovadorUsuarioId,
      aprovadorNome: decisao.aprovadorNome,
      aprovadorCargo: decisao.aprovadorCargo,
      nivelAlcada: decisao.nivelAlcada,
      decididoEm: new Date().toISOString(),
      validadeAprovacao: dataValidade.toISOString().split('T')[0],
    };

    analise.status = decisao.status;
    analise.atualizadoEm = new Date().toISOString();

    // Se aprovado ou aprovado com restrição, atualizar entidade limites_credito
    if (decisao.status === 'APROVADO' || decisao.status === 'APROVADO_COM_RESTRICAO') {
      let limiteRec = this.getLimitePorClienteId(analise.clienteId);
      if (!limiteRec) {
        limiteRec = {
          id: `lim-${crypto.randomBytes(4).toString('hex')}`,
          clienteId: analise.clienteId,
          clienteNome: analise.clienteNome,
          cnpjCpf: analise.cnpjCpf,
          limiteConsolidadoGrupo: decisao.limiteConsolidadoAprovado,
          exposicaoConsolidadaAtual: analise.exposicaoNoMomento.exposicaoAtualGrupo,
          exposicaoConsolidadaProjetada: analise.exposicaoNoMomento.exposicaoProjetadaGrupo,
          saldoConsolidadoDisponivel: Math.max(
            0,
            decisao.limiteConsolidadoAprovado - analise.exposicaoNoMomento.exposicaoProjetadaGrupo
          ),
          limitesPorEmpresa: [
            {
              empresaId: analise.empresaId,
              empresaNome: analise.empresaNome,
              limiteConcedido: decisao.limiteAprovado,
              limiteTemporario: 0,
              exposicaoAtual: analise.exposicaoNoMomento.exposicaoAtualEmpresa,
              exposicaoProjetada: analise.exposicaoNoMomento.exposicaoProjetadaEmpresa,
              saldoDisponivel: Math.max(
                0,
                decisao.limiteAprovado - analise.exposicaoNoMomento.exposicaoProjetadaEmpresa
              ),
              status: 'ATIVO',
            },
          ],
          dataConcessao: new Date().toISOString().split('T')[0],
          dataValidade: dataValidade.toISOString().split('T')[0],
          ultimaAnaliseId: analise.id,
          aprovadorId: decisao.aprovadorUsuarioId,
          aprovadorNome: decisao.aprovadorNome,
          observacoes: decisao.parecerAprovador,
          statusGeral: 'LIBERADO',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        };
        this.limites.unshift(limiteRec);
      } else {
        limiteRec.limiteConsolidadoGrupo = decisao.limiteConsolidadoAprovado;
        limiteRec.dataConcessao = new Date().toISOString().split('T')[0];
        limiteRec.dataValidade = dataValidade.toISOString().split('T')[0];
        limiteRec.ultimaAnaliseId = analise.id;
        limiteRec.aprovadorId = decisao.aprovadorUsuarioId;
        limiteRec.aprovadorNome = decisao.aprovadorNome;
        limiteRec.observacoes = decisao.parecerAprovador;
        limiteRec.statusGeral = 'LIBERADO';

        const empLim = limiteRec.limitesPorEmpresa.find((e) => e.empresaId === analise.empresaId);
        if (empLim) {
          empLim.limiteConcedido = decisao.limiteAprovado;
          empLim.saldoDisponivel = Math.max(0, decisao.limiteAprovado - empLim.exposicaoProjetada);
          empLim.status = 'ATIVO';
        } else {
          limiteRec.limitesPorEmpresa.push({
            empresaId: analise.empresaId,
            empresaNome: analise.empresaNome,
            limiteConcedido: decisao.limiteAprovado,
            limiteTemporario: 0,
            exposicaoAtual: analise.exposicaoNoMomento.exposicaoAtualEmpresa,
            exposicaoProjetada: analise.exposicaoNoMomento.exposicaoProjetadaEmpresa,
            saldoDisponivel: Math.max(
              0,
              decisao.limiteAprovado - analise.exposicaoNoMomento.exposicaoProjetadaEmpresa
            ),
            status: 'ATIVO',
          });
        }
        limiteRec.saldoConsolidadoDisponivel = Math.max(
          0,
          limiteRec.limiteConsolidadoGrupo - limiteRec.exposicaoConsolidadaProjetada
        );
        limiteRec.atualizadoEm = new Date().toISOString();
      }
    }

    return analise;
  }

  // ---------------------------------------------------------------------------
  // BLOQUEIOS DE CRÉDITO
  // ---------------------------------------------------------------------------
  public getBloqueios(empresaId?: string, apenasAtivos = false): BloqueioCredito[] {
    let list = [...this.bloqueios];
    if (empresaId) list = list.filter((b) => b.empresaId === empresaId || b.empresaId === 'GLOBAL');
    if (apenasAtivos) list = list.filter((b) => b.ativo);
    return list;
  }

  public aplicarBloqueio(dados: {
    empresaId: string;
    clienteId: string;
    clienteNome: string;
    cnpjCpf: string;
    tipoBloqueio: 'AUTOMATICO_MOTOR' | 'MANUAL_USUARIO' | 'INTEGRACAO_FINANCEIRO';
    motivo: any;
    detalhesMotivo: string;
    valorTitulosVencidos?: number;
    diasMaiorAtraso?: number;
    usuarioId?: string;
    usuarioNome?: string;
  }): BloqueioCredito {
    const novoBloqueio: BloqueioCredito = {
      id: `blq-${crypto.randomBytes(4).toString('hex')}`,
      empresaId: dados.empresaId,
      clienteId: dados.clienteId,
      clienteNome: dados.clienteNome,
      cnpjCpf: dados.cnpjCpf,
      tipoBloqueio: dados.tipoBloqueio,
      motivo: dados.motivo,
      detalhesMotivo: dados.detalhesMotivo,
      valorTitulosVencidos: dados.valorTitulosVencidos,
      diasMaiorAtraso: dados.diasMaiorAtraso,
      ativo: true,
      bloqueadoEm: new Date().toISOString(),
      bloqueadoPorUsuarioId: dados.usuarioId,
      bloqueadoPorUsuarioNome: dados.usuarioNome || 'Motor de Regras de Crédito',
    };

    this.bloqueios.unshift(novoBloqueio);

    // Atualizar status no limite de crédito
    const limiteRec = this.getLimitePorClienteId(dados.clienteId);
    if (limiteRec) {
      limiteRec.statusGeral = 'BLOQUEADO';
      const empLim = limiteRec.limitesPorEmpresa.find((e) => e.empresaId === dados.empresaId);
      if (empLim) empLim.status = 'BLOQUEADO';
    }

    return novoBloqueio;
  }

  public desbloquearCliente(
    bloqueioId: string,
    dados: { justificativa: string; usuarioId: string; usuarioNome: string }
  ): BloqueioCredito {
    const bloqueio = this.bloqueios.find((b) => b.id === bloqueioId);
    if (!bloqueio) throw new Error('Bloqueio de crédito não encontrado.');

    bloqueio.ativo = false;
    bloqueio.desbloqueadoEm = new Date().toISOString();
    bloqueio.desbloqueadoPorUsuarioId = dados.usuarioId;
    bloqueio.desbloqueadoPorUsuarioNome = dados.usuarioNome;
    bloqueio.justificativaDesbloqueio = dados.justificativa;

    // Verificar se ainda restam bloqueios ativos para o cliente
    const aindaBloqueado = this.bloqueios.some((b) => b.clienteId === bloqueio.clienteId && b.ativo);
    if (!aindaBloqueado) {
      const limiteRec = this.getLimitePorClienteId(bloqueio.clienteId);
      if (limiteRec) {
        limiteRec.statusGeral = 'LIBERADO';
        limiteRec.limitesPorEmpresa.forEach((le) => {
          if (le.status === 'BLOQUEADO') le.status = 'ATIVO';
        });
      }
    }

    return bloqueio;
  }

  // ---------------------------------------------------------------------------
  // HISTÓRICO DE PAGAMENTOS & RELACIONAMENTOS
  // ---------------------------------------------------------------------------
  public getHistoricoPagamentos(clienteId?: string, empresaId?: string): HistoricoPagamentoItem[] {
    let list = [...this.historicoPagamentos];
    if (clienteId) list = list.filter((p) => p.clienteId === clienteId);
    if (empresaId) list = list.filter((p) => p.empresaId === empresaId);
    return list;
  }

  public getRelacionamentos(clienteId?: string, empresaId?: string): RelacionamentoClienteEmpresa[] {
    let list = [...this.relacionamentos];
    if (clienteId) list = list.filter((r) => r.clienteId === clienteId);
    if (empresaId) list = list.filter((r) => r.empresaId === empresaId);
    return list;
  }

  // ---------------------------------------------------------------------------
  // SEED DE DADOS DEMO
  // ---------------------------------------------------------------------------
  private inicializarDadosDemo() {
    // 1. Políticas de Crédito
    this.politicas = [
      {
        id: 'pol-global-grupo',
        empresaId: null, // Grupo Econômico Geral
        nome: 'Política Corporativa de Crédito Industrial (Grupo)',
        descricao: 'Regra padrão consolidada para todas as empresas do grupo industrial com matriz de risco e alçadas.',
        versao: '2.4',
        ativo: true,
        pesoHistoricoInterno: 35,
        pesoTempoRelacionamento: 15,
        pesoVolumeFaturamento: 15,
        pesoScoreBureauExterno: 20,
        pesoRestricoesExternas: 15,
        diasToleranciaAtraso: 5,
        valorMaximoProtestoTolerado: 500,
        quantidadeMaxProtestos: 0,
        mesesValidadeAnalise: 6,
        faixasScore: [
          {
            faixa: 'A+',
            scoreMin: 850,
            scoreMax: 1000,
            fatorLimiteFaturamento: 0.45,
            limiteMaximoSemComite: 500000,
            prazoMaximoDias: 45,
            exigeGarantia: false,
            permiteParcelamento: true,
          },
          {
            faixa: 'A',
            scoreMin: 700,
            scoreMax: 849,
            fatorLimiteFaturamento: 0.35,
            limiteMaximoSemComite: 250000,
            prazoMaximoDias: 35,
            exigeGarantia: false,
            permiteParcelamento: true,
          },
          {
            faixa: 'B',
            scoreMin: 550,
            scoreMax: 699,
            fatorLimiteFaturamento: 0.22,
            limiteMaximoSemComite: 100000,
            prazoMaximoDias: 28,
            exigeGarantia: false,
            permiteParcelamento: true,
          },
          {
            faixa: 'C',
            scoreMin: 400,
            scoreMax: 549,
            fatorLimiteFaturamento: 0.12,
            limiteMaximoSemComite: 40000,
            prazoMaximoDias: 21,
            exigeGarantia: true,
            permiteParcelamento: false,
          },
          {
            faixa: 'D',
            scoreMin: 0,
            scoreMax: 399,
            fatorLimiteFaturamento: 0.05,
            limiteMaximoSemComite: 15000,
            prazoMaximoDias: 14,
            exigeGarantia: true,
            permiteParcelamento: false,
          },
        ],
        alcadas: [
          { nivel: 'ANALISTA_CREDITO', limiteMaximo: 50000, permiteAprovarComRestricao: false },
          { nivel: 'GERENTE_FINANCEIRO', limiteMaximo: 200000, permiteAprovarComRestricao: true },
          { nivel: 'DIRETORIA_EXECUTIVA', limiteMaximo: 500000, permiteAprovarComRestricao: true },
          { nivel: 'COMITE_CREDITO', limiteMaximo: 5000000, permiteAprovarComRestricao: true },
        ],
        criadoEm: '2026-01-10T10:00:00Z',
        atualizadoEm: '2026-08-01T14:30:00Z',
      },
    ];

    // 2. Histórico de Pagamentos de Exemplo
    this.historicoPagamentos = [
      // Cliente 1: Usina São Martinho (AAA - Pontualíssimo)
      {
        id: 'pag-001',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-001',
        numeroTitulo: 'DUP-2026-0891/1',
        documentoOrigem: 'NF-e 004523',
        valorNominal: 45000,
        valorPago: 45000,
        dataEmissao: '2026-05-10',
        dataVencimento: '2026-06-10',
        dataLiquidacao: '2026-06-08',
        diasAtraso: 0,
        status: 'PAGO_EM_DIA',
        meioPagamento: 'BOLETO',
      },
      {
        id: 'pag-002',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-001',
        numeroTitulo: 'DUP-2026-0940/1',
        documentoOrigem: 'NF-e 004612',
        valorNominal: 68400,
        valorPago: 68400,
        dataEmissao: '2026-06-15',
        dataVencimento: '2026-07-15',
        dataLiquidacao: '2026-07-15',
        diasAtraso: 0,
        status: 'PAGO_EM_DIA',
        meioPagamento: 'BOLETO',
      },
      {
        id: 'pag-003',
        empresaId: 'emp-005',
        empresaNome: 'Tritech Industrial',
        clienteId: 'cli-001',
        numeroTitulo: 'DUP-2026-1102/1',
        documentoOrigem: 'NF-e 001204',
        valorNominal: 112000,
        valorPago: 112000,
        dataEmissao: '2026-07-01',
        dataVencimento: '2026-08-01',
        dataLiquidacao: '2026-08-01',
        diasAtraso: 0,
        status: 'PAGO_EM_DIA',
        meioPagamento: 'TRANSFERENCIA',
      },
      {
        id: 'pag-004',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-001',
        numeroTitulo: 'DUP-2026-1300/1',
        documentoOrigem: 'NF-e 004890',
        valorNominal: 54000,
        dataEmissao: '2026-08-05',
        dataVencimento: '2026-09-05',
        diasAtraso: 0,
        status: 'EM_ABERTO',
        meioPagamento: 'BOLETO',
      },

      // Cliente 2: Marcopolo Sul (Bom cliente com 1 pequeno atraso)
      {
        id: 'pag-010',
        empresaId: 'emp-001',
        empresaNome: 'MWAM Participações',
        clienteId: 'cli-002',
        numeroTitulo: 'DUP-2026-0410/1',
        documentoOrigem: 'NF-e 002100',
        valorNominal: 28000,
        valorPago: 28000,
        dataEmissao: '2026-04-02',
        dataVencimento: '2026-05-02',
        dataLiquidacao: '2026-05-02',
        diasAtraso: 0,
        status: 'PAGO_EM_DIA',
        meioPagamento: 'BOLETO',
      },
      {
        id: 'pag-011',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-002',
        numeroTitulo: 'DUP-2026-0622/1',
        documentoOrigem: 'NF-e 004720',
        valorNominal: 35000,
        valorPago: 35000,
        dataEmissao: '2026-05-18',
        dataVencimento: '2026-06-18',
        dataLiquidacao: '2026-06-21',
        diasAtraso: 3,
        status: 'PAGO_COM_ATRASO',
        meioPagamento: 'BOLETO',
      },
      {
        id: 'pag-012',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-002',
        numeroTitulo: 'DUP-2026-0980/1',
        documentoOrigem: 'NF-e 004950',
        valorNominal: 42000,
        dataEmissao: '2026-08-01',
        dataVencimento: '2026-09-01',
        diasAtraso: 0,
        status: 'EM_ABERTO',
        meioPagamento: 'BOLETO',
      },

      // Cliente 3: Caldeiraria União (Cliente com título vencido)
      {
        id: 'pag-020',
        empresaId: 'emp-002',
        empresaNome: 'Oliveira e Amorim',
        clienteId: 'cli-004',
        numeroTitulo: 'DUP-2026-0512/1',
        documentoOrigem: 'NF-e 003115',
        valorNominal: 18500,
        valorPago: 18500,
        dataEmissao: '2026-04-10',
        dataVencimento: '2026-05-10',
        dataLiquidacao: '2026-05-18',
        diasAtraso: 8,
        status: 'PAGO_COM_ATRASO',
        meioPagamento: 'BOLETO',
      },
      {
        id: 'pag-021',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-004',
        numeroTitulo: 'DUP-2026-0780/1',
        documentoOrigem: 'NF-e 004810',
        valorNominal: 26400,
        dataEmissao: '2026-06-20',
        dataVencimento: '2026-07-20',
        diasAtraso: 35,
        status: 'VENCIDO',
        meioPagamento: 'BOLETO',
      },
    ];

    // 3. Relacionamento Cliente Empresa
    this.relacionamentos = [
      {
        id: 'rel-001',
        clienteId: 'cli-001',
        clienteNome: 'Usina São Martinho S/A',
        cnpjCpf: '51.800.222/0001-88',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        primeiraCompraData: '2023-03-15',
        ultimaCompraData: '2026-08-05',
        tempoRelacionamentoMeses: 41,
        faturamentoTotalAcumulado: 850000,
        quantidadeTotalPedidos: 28,
        ticketMedio: 30357,
        maiorCompraValor: 85000,
        maiorAcumuloFinanceiro: 120000,
        totalTitulosEmitidos: 32,
        totalTitulosPagosEmDia: 31,
        totalTitulosPagosComAtraso: 1,
        totalTitulosVencidosNaoPagos: 0,
        mediaDiasAtraso: 0.2,
        maiorAtrasoHistoricoDias: 2,
        indicePontualidadePerc: 97.0,
        bloqueadoNestaEmpresa: false,
        atualizadoEm: '2026-08-20T10:00:00Z',
      },
      {
        id: 'rel-002',
        clienteId: 'cli-001',
        clienteNome: 'Usina São Martinho S/A',
        cnpjCpf: '51.800.222/0001-88',
        empresaId: 'emp-005',
        empresaNome: 'Tritech Industrial',
        primeiraCompraData: '2024-01-20',
        ultimaCompraData: '2026-07-01',
        tempoRelacionamentoMeses: 31,
        faturamentoTotalAcumulado: 420000,
        quantidadeTotalPedidos: 9,
        ticketMedio: 46666,
        maiorCompraValor: 112000,
        maiorAcumuloFinanceiro: 112000,
        totalTitulosEmitidos: 12,
        totalTitulosPagosEmDia: 12,
        totalTitulosPagosComAtraso: 0,
        totalTitulosVencidosNaoPagos: 0,
        mediaDiasAtraso: 0,
        maiorAtrasoHistoricoDias: 0,
        indicePontualidadePerc: 100.0,
        bloqueadoNestaEmpresa: false,
        atualizadoEm: '2026-08-20T10:00:00Z',
      },
      {
        id: 'rel-003',
        clienteId: 'cli-002',
        clienteNome: 'Marcopolo Carrocerias e Ônibus S/A',
        cnpjCpf: '88.611.834/0001-00',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        primeiraCompraData: '2024-08-10',
        ultimaCompraData: '2026-08-01',
        tempoRelacionamentoMeses: 24,
        faturamentoTotalAcumulado: 310000,
        quantidadeTotalPedidos: 14,
        ticketMedio: 22142,
        maiorCompraValor: 48000,
        maiorAcumuloFinanceiro: 65000,
        totalTitulosEmitidos: 16,
        totalTitulosPagosEmDia: 14,
        totalTitulosPagosComAtraso: 2,
        totalTitulosVencidosNaoPagos: 0,
        mediaDiasAtraso: 1.8,
        maiorAtrasoHistoricoDias: 4,
        indicePontualidadePerc: 87.5,
        bloqueadoNestaEmpresa: false,
        atualizadoEm: '2026-08-20T10:00:00Z',
      },
      {
        id: 'rel-004',
        clienteId: 'cli-004',
        clienteNome: 'Caldeiraria União & Serviços Industriais Ltda',
        cnpjCpf: '22.333.444/0001-99',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        primeiraCompraData: '2025-02-15',
        ultimaCompraData: '2026-06-20',
        tempoRelacionamentoMeses: 18,
        faturamentoTotalAcumulado: 98000,
        quantidadeTotalPedidos: 6,
        ticketMedio: 16333,
        maiorCompraValor: 26400,
        maiorAcumuloFinanceiro: 32000,
        totalTitulosEmitidos: 8,
        totalTitulosPagosEmDia: 4,
        totalTitulosPagosComAtraso: 3,
        totalTitulosVencidosNaoPagos: 1,
        mediaDiasAtraso: 14.5,
        maiorAtrasoHistoricoDias: 35,
        indicePontualidadePerc: 50.0,
        bloqueadoNestaEmpresa: true,
        motivoBloqueio: 'Inadimplência de título DUP-2026-0780/1 há mais de 30 dias',
        atualizadoEm: '2026-08-20T10:00:00Z',
      },
    ];

    // 4. Limites de Crédito
    this.limites = [
      {
        id: 'lim-001',
        clienteId: 'cli-001',
        clienteNome: 'Usina São Martinho S/A',
        cnpjCpf: '51.800.222/0001-88',
        grupoEconomicoCliente: 'Grupo São Martinho Açúcar e Álcool',
        limiteConsolidadoGrupo: 350000,
        exposicaoConsolidadaAtual: 54000,
        exposicaoConsolidadaProjetada: 89000,
        saldoConsolidadoDisponivel: 261000,
        limitesPorEmpresa: [
          {
            empresaId: 'emp-004',
            empresaNome: 'Tritech Corte e Dobra',
            limiteConcedido: 200000,
            limiteTemporario: 0,
            exposicaoAtual: 54000,
            exposicaoProjetada: 69000,
            saldoDisponivel: 131000,
            status: 'ATIVO',
          },
          {
            empresaId: 'emp-005',
            empresaNome: 'Tritech Industrial',
            limiteConcedido: 150000,
            limiteTemporario: 0,
            exposicaoAtual: 0,
            exposicaoProjetada: 20000,
            saldoDisponivel: 130000,
            status: 'ATIVO',
          },
        ],
        dataConcessao: '2026-03-01',
        dataValidade: '2027-03-01',
        aprovadorNome: 'Eduardo Martins (Gerente Financeiro)',
        statusGeral: 'LIBERADO',
        criadoEm: '2026-03-01T09:00:00Z',
        atualizadoEm: '2026-08-10T11:00:00Z',
      },
      {
        id: 'lim-002',
        clienteId: 'cli-002',
        clienteNome: 'Marcopolo Carrocerias e Ônibus S/A',
        cnpjCpf: '88.611.834/0001-00',
        grupoEconomicoCliente: 'Marcopolo S.A.',
        limiteConsolidadoGrupo: 150000,
        exposicaoConsolidadaAtual: 42000,
        exposicaoConsolidadaProjetada: 95000,
        saldoConsolidadoDisponivel: 55000,
        limitesPorEmpresa: [
          {
            empresaId: 'emp-004',
            empresaNome: 'Tritech Corte e Dobra',
            limiteConcedido: 100000,
            limiteTemporario: 0,
            exposicaoAtual: 42000,
            exposicaoProjetada: 75000,
            saldoDisponivel: 25000,
            status: 'ATIVO',
          },
          {
            empresaId: 'emp-001',
            empresaNome: 'MWAM Participações',
            limiteConcedido: 50000,
            limiteTemporario: 0,
            exposicaoAtual: 0,
            exposicaoProjetada: 20000,
            saldoDisponivel: 30000,
            status: 'ATIVO',
          },
        ],
        dataConcessao: '2026-02-15',
        dataValidade: '2026-08-15',
        aprovadorNome: 'Roberto Souza (Analista de Crédito)',
        statusGeral: 'ALERTA_EXPOSICAO',
        criadoEm: '2026-02-15T14:00:00Z',
        atualizadoEm: '2026-08-15T16:00:00Z',
      },
      {
        id: 'lim-003',
        clienteId: 'cli-004',
        clienteNome: 'Caldeiraria União & Serviços Industriais Ltda',
        cnpjCpf: '22.333.444/0001-99',
        limiteConsolidadoGrupo: 40000,
        exposicaoConsolidadaAtual: 26400,
        exposicaoConsolidadaProjetada: 38000,
        saldoConsolidadoDisponivel: 2000,
        limitesPorEmpresa: [
          {
            empresaId: 'emp-004',
            empresaNome: 'Tritech Corte e Dobra',
            limiteConcedido: 40000,
            limiteTemporario: 0,
            exposicaoAtual: 26400,
            exposicaoProjetada: 38000,
            saldoDisponivel: 2000,
            status: 'BLOQUEADO',
          },
        ],
        dataConcessao: '2026-01-20',
        dataValidade: '2026-07-20',
        aprovadorNome: 'Roberto Souza (Analista de Crédito)',
        statusGeral: 'BLOQUEADO',
        criadoEm: '2026-01-20T10:00:00Z',
        atualizadoEm: '2026-08-20T15:00:00Z',
      },
    ];

    // 5. Bloqueios de Crédito
    this.bloqueios = [
      {
        id: 'blq-001',
        empresaId: 'emp-004',
        clienteId: 'cli-004',
        clienteNome: 'Caldeiraria União & Serviços Industriais Ltda',
        cnpjCpf: '22.333.444/0001-99',
        tipoBloqueio: 'AUTOMATICO_MOTOR',
        motivo: 'INADIMPLENCIA_TITULOS_VENCIDOS',
        detalhesMotivo: 'Título DUP-2026-0780/1 no valor de R$ 26.400,00 vencido há 35 dias (tolerância: 5 dias).',
        valorTitulosVencidos: 26400,
        diasMaiorAtraso: 35,
        ativo: true,
        bloqueadoEm: '2026-07-26T08:00:00Z',
        bloqueadoPorUsuarioNome: 'Motor Automático de Crédito',
      },
    ];

    // 6. Análises de Crédito Cadastradas
    this.analises = [
      {
        id: 'anl-001',
        protocolo: 'AC-2026-0012',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-001',
        clienteNome: 'Usina São Martinho S/A',
        cnpjCpf: '51.800.222/0001-88',
        dadosCadastrais: {
          razaoSocial: 'USINA SÃO MARTINHO S/A',
          nomeFantasia: 'São Martinho Açúcar e Álcool',
          cnpjCpf: '51.800.222/0001-88',
          inscricaoEstadual: '556.120.980.110',
          dataFundacao: '1948-04-12',
          cnaePrincipal: '10.71-6-00',
          ramoAtividade: 'Fabricação de açúcar e álcool',
          cidade: 'Pradópolis',
          uf: 'SP',
          capitalSocial: 1800000000,
          faturamentoMensalEstimado: 250000000,
          quadroSocietario: [
            { nome: 'Fabio Venturelli', cpfCnpj: '111.222.333-44', participacaoPerc: 55, cargo: 'Diretor Presidente' },
            { nome: 'Felipe Sandoval', cpfCnpj: '555.666.777-88', participacaoPerc: 45, cargo: 'Diretor Financeiro' },
          ],
        },
        limiteSolicitado: 350000,
        prazoPagamentoSolicitadoDias: 45,
        motivoSolicitacao: 'AUMENTO_LIMITE',
        solicitanteNome: 'Juliana Costa (Vendedora Técnica)',
        exposicaoNoMomento: {
          exposicaoAtualEmpresa: 54000,
          exposicaoProjetadaEmpresa: 69000,
          exposicaoAtualGrupo: 54000,
          exposicaoProjetadaGrupo: 89000,
          pedidosEmCarteiraValor: 15000,
          titulosVencidosValor: 0,
          quantidadeTitulosVencidos: 0,
        },
        historicoInterno: {
          mesesRelacionamento: 41,
          totalFaturadoHistorico: 1270000,
          quantidadePedidosHistorico: 37,
          maiorCompraValor: 112000,
          maiorAcumuloValor: 120000,
          mediaAtrasoDias: 0.1,
          taxaPontualidadePerc: 98.5,
          totalTitulosPagos: 43,
          totalTitulosComAtraso: 1,
        },
        consultaBureau: {
          consultaId: 'cons-001',
          provedor: 'MockSerasaExperian',
          dataHoraConsulta: '2026-03-01T09:15:00Z',
          scoreBureau: 920,
          probabilidadeInadimplencia: 1.1,
          faixaRiscoBureau: 'MUITO_BAIXO',
          protestosQtd: 0,
          protestosValor: 0,
          pefinQtd: 0,
          pefinValor: 0,
          refinQtd: 0,
          refinValor: 0,
          acoesJudiciaisQtd: 0,
          chequesSemFundoQtd: 0,
          falenciasOuRecuperacoes: false,
        },
        resultadoScoreInterno: {
          scoreInternoFinal: 945,
          faixaScore: 'A+',
          pontosHistorico: 980,
          pontosRelacionamento: 1000,
          pontosVolume: 1000,
          pontosBureau: 920,
          pontosRestricoes: 1000,
          limiteSugeridoMotor: 500000,
          prazoMaximoSugeridoDias: 45,
          garantiaSugerida: 'NENHUMA',
          recomendacao: 'APROVACAO_AUTOMATICA',
          motivosRecomendacao: [
            'Cliente classe A+ com histórico excelente e zero inadimplência.',
            'Score Bureau 920/1000 com risco mínimo.',
            'Mais de 3 anos de relacionamento com o grupo.',
          ],
        },
        decisao: {
          status: 'APROVADO',
          limiteAprovado: 200000,
          limiteConsolidadoAprovado: 350000,
          prazoMaximoDias: 45,
          garantiaExigida: 'NENHUMA',
          parecerAprovador: 'Limite concedido integralmente. Cliente corporativo de primeira linha com pontualidade exemplar.',
          aprovadorUsuarioId: 'usr-fin-001',
          aprovadorNome: 'Eduardo Martins',
          aprovadorCargo: 'Gerente Financeiro',
          nivelAlcada: 'GERENTE_FINANCEIRO',
          decididoEm: '2026-03-01T10:30:00Z',
          validadeAprovacao: '2027-03-01',
        },
        status: 'APROVADO',
        criadoEm: '2026-03-01T09:00:00Z',
        atualizadoEm: '2026-03-01T10:30:00Z',
      },
      {
        id: 'anl-002',
        protocolo: 'AC-2026-0025',
        empresaId: 'emp-004',
        empresaNome: 'Tritech Corte e Dobra',
        clienteId: 'cli-002',
        clienteNome: 'Marcopolo Carrocerias e Ônibus S/A',
        cnpjCpf: '88.611.834/0001-00',
        dadosCadastrais: {
          razaoSocial: 'MARCOPOLO S/A',
          nomeFantasia: 'Marcopolo',
          cnpjCpf: '88.611.834/0001-00',
          inscricaoEstadual: '096.012.333.411',
          dataFundacao: '1949-08-06',
          cnaePrincipal: '29.20-4-01',
          ramoAtividade: 'Fabricação de carrocerias para ônibus',
          cidade: 'Caxias do Sul',
          uf: 'RS',
          capitalSocial: 1300000000,
          faturamentoMensalEstimado: 450000000,
          quadroSocietario: [
            { nome: 'James Bellini', cpfCnpj: '333.444.555-66', participacaoPerc: 50, cargo: 'Diretor Presidente' },
          ],
        },
        limiteSolicitado: 180000,
        prazoPagamentoSolicitadoDias: 35,
        motivoSolicitacao: 'NOVO_PEDIDO_GRANDE',
        solicitanteNome: 'Marcelo Rezende (Engenheiro de Vendas)',
        exposicaoNoMomento: {
          exposicaoAtualEmpresa: 42000,
          exposicaoProjetadaEmpresa: 75000,
          exposicaoAtualGrupo: 42000,
          exposicaoProjetadaGrupo: 95000,
          pedidosEmCarteiraValor: 33000,
          titulosVencidosValor: 0,
          quantidadeTitulosVencidos: 0,
        },
        historicoInterno: {
          mesesRelacionamento: 24,
          totalFaturadoHistorico: 310000,
          quantidadePedidosHistorico: 14,
          maiorCompraValor: 48000,
          maiorAcumuloValor: 65000,
          mediaAtrasoDias: 1.8,
          taxaPontualidadePerc: 87.5,
          totalTitulosPagos: 14,
          totalTitulosComAtraso: 2,
        },
        consultaBureau: {
          consultaId: 'cons-002',
          provedor: 'MockSerasaExperian',
          dataHoraConsulta: '2026-08-20T14:10:00Z',
          scoreBureau: 785,
          probabilidadeInadimplencia: 4.8,
          faixaRiscoBureau: 'BAIXO',
          protestosQtd: 0,
          protestosValor: 0,
          pefinQtd: 0,
          pefinValor: 0,
          refinQtd: 0,
          refinValor: 0,
          acoesJudiciaisQtd: 0,
          chequesSemFundoQtd: 0,
          falenciasOuRecuperacoes: false,
        },
        resultadoScoreInterno: {
          scoreInternoFinal: 760,
          faixaScore: 'A',
          pontosHistorico: 820,
          pontosRelacionamento: 850,
          pontosVolume: 700,
          pontosBureau: 785,
          pontosRestricoes: 1000,
          limiteSugeridoMotor: 157500,
          prazoMaximoSugeridoDias: 35,
          garantiaSugerida: 'NENHUMA',
          recomendacao: 'RECOMENDA_APROVACAO',
          motivosRecomendacao: [
            'Cliente de bom porte com score interno 760 (Faixa A).',
            'Sem títulos vencidos atualmente.',
            'Limite solicitado de R$ 180.000,00 próximo do sugerido pelo motor.',
          ],
        },
        status: 'PENDENTE_APROVACAO',
        criadoEm: '2026-08-20T14:00:00Z',
        atualizadoEm: '2026-08-20T14:15:00Z',
      },
    ];
  }
}

// Instância singleton do serviço de crédito
export const creditoService = new CreditoService();
