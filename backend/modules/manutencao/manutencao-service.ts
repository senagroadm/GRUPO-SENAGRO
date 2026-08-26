// backend/modules/manutencao/manutencao-service.ts
// Serviço completo do Módulo 11: Gestão de Manutenção & Ativos Industriais (PCM)

import {
  AtivoIndustrial,
  ComponenteAtivo,
  PlanoManutencao,
  OrdemManutencao,
  RespostaTarefaOM,
  FalhaCatalogo,
  ParadaManutencao,
  ManutencaoItemRequisitado,
  ManutencaoServicoTerceiro,
  RegistroHorimetro,
  FerramentaIndustrial,
  MovimentoFerramenta,
  LeituraPreditivaSensor,
  IndicadoresPCM,
  TipoAtivo,
  CriticidadeAtivo,
  StatusOperacionalAtivo,
  TipoManutencao,
  PrioridadeManutencao,
  StatusOrdemManutencao,
  GatilhoPlano,
  TipoFerramenta,
  StatusFerramenta,
} from './manutencao-types';
import { comprasService } from '../compras/compras-service';
import { BadRequestError, NotFoundError } from '../../core/errors';

export class ManutencaoService {
  private ativos: Map<string, AtivoIndustrial> = new Map();
  private componentes: Map<string, ComponenteAtivo> = new Map();
  private planos: Map<string, PlanoManutencao> = new Map();
  private ordens: Map<string, OrdemManutencao> = new Map();
  private falhas: Map<string, FalhaCatalogo> = new Map();
  private paradas: Map<string, ParadaManutencao> = new Map();
  private itensRequisitados: Map<string, ManutencaoItemRequisitado> = new Map();
  private servicosTerceiros: Map<string, ManutencaoServicoTerceiro> = new Map();
  private registrosHorimetro: Map<string, RegistroHorimetro> = new Map();
  private ferramentas: Map<string, FerramentaIndustrial> = new Map();
  private movimentosFerramentas: Map<string, MovimentoFerramenta> = new Map();
  private leiturasPreditivas: Map<string, LeituraPreditivaSensor> = new Map();

  private seqOM = 100;
  private seqParada = 100;
  private seqItem = 100;
  private seqServico = 100;
  private seqHorimetro = 100;
  private seqMovFerramenta = 100;

  constructor() {
    this.seedInitialData();
  }

  // ============================================================================
  // 1. ATIVOS INDUSTRIAIS (Máquinas & Equipamentos)
  // ============================================================================

  public listarAtivos(empresaId: string, tipo?: TipoAtivo, status?: StatusOperacionalAtivo): AtivoIndustrial[] {
    return Array.from(this.ativos.values())
      .filter((a) => a.empresaId === empresaId)
      .filter((a) => (!tipo ? true : a.tipo === tipo))
      .filter((a) => (!status ? true : a.statusOperacional === status))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }

  public obterAtivoPorId(id: string, empresaId: string): AtivoIndustrial {
    const ativo = this.ativos.get(id);
    if (!ativo || ativo.empresaId !== empresaId) {
      throw new NotFoundError(`Ativo com ID "${id}" não encontrado para a empresa.`);
    }
    return ativo;
  }

  public cadastrarAtivo(
    empresaId: string,
    dados: Omit<
      AtivoIndustrial,
      | 'id'
      | 'empresaId'
      | 'totalParadasHistorico'
      | 'tempoTotalParadoMinutos'
      | 'mtbfHoras'
      | 'mttrHoras'
      | 'disponibilidadePercentual'
      | 'bloqueioPCP'
    >
  ): AtivoIndustrial {
    const id = `atv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const novoAtivo: AtivoIndustrial = {
      ...dados,
      id,
      empresaId,
      bloqueioPCP: dados.statusOperacional === 'EM_MANUTENCAO_CORRETIVA' || dados.statusOperacional === 'INDISPONIVEL_DEFEITO',
      totalParadasHistorico: 0,
      tempoTotalParadoMinutos: 0,
      mtbfHoras: 720, // Padrão inicial
      mttrHoras: 3.5,
      disponibilidadePercentual: 95.0,
    };
    this.ativos.set(id, novoAtivo);
    return novoAtivo;
  }

  public atualizarStatusOperacional(
    id: string,
    empresaId: string,
    novoStatus: StatusOperacionalAtivo,
    motivo?: string,
    usuario?: string
  ): AtivoIndustrial {
    const ativo = this.obterAtivoPorId(id, empresaId);
    ativo.statusOperacional = novoStatus;

    // Regra Crítica de Bloqueio de PCP
    if (novoStatus === 'EM_MANUTENCAO_CORRETIVA' || novoStatus === 'INDISPONIVEL_DEFEITO') {
      ativo.bloqueioPCP = true;
      ativo.motivoBloqueioPCP = motivo || `Equipamento indisponível devido a intervenção corretiva/defeito.`;
      ativo.notificacaoPCPData = new Date().toISOString();

      // Registra parada automática se não houver
      this.registrarParada(empresaId, {
        ativoId: ativo.id,
        ativoTag: ativo.tag,
        tipoParada: 'MANUTENCAO_CORRETIVA_NAO_PROGRAMADA',
        motivo: motivo || 'Parada não programada de máquina (defeito detectado).',
        bloqueouPcp: true,
        registradoPor: usuario || 'Sistema PCM Automático',
      });
    } else if (novoStatus === 'EM_MANUTENCAO_PREVENTIVA' || novoStatus === 'EM_MANUTENCAO_PREDITIVA') {
      ativo.bloqueioPCP = true;
      ativo.motivoBloqueioPCP = `Manutenção programada em andamento (${novoStatus}).`;
      ativo.notificacaoPCPData = new Date().toISOString();
    } else if (novoStatus === 'OPERACIONAL') {
      ativo.bloqueioPCP = false;
      ativo.motivoBloqueioPCP = undefined;
      ativo.notificacaoPCPData = undefined;
    }

    this.recalcularIndicadoresAtivo(ativo);
    this.ativos.set(id, ativo);
    return ativo;
  }

  // ============================================================================
  // 2. COMPONENTES & SUBCONJUNTOS
  // ============================================================================

  public listarComponentes(empresaId: string, ativoId?: string): ComponenteAtivo[] {
    return Array.from(this.componentes.values())
      .filter((c) => c.empresaId === empresaId)
      .filter((c) => (!ativoId ? true : c.ativoId === ativoId));
  }

  public cadastrarComponente(
    empresaId: string,
    dados: Omit<ComponenteAtivo, 'id' | 'empresaId'>
  ): ComponenteAtivo {
    const id = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const componente: ComponenteAtivo = {
      ...dados,
      id,
      empresaId,
    };
    this.componentes.set(id, componente);
    return componente;
  }

  // ============================================================================
  // 3. PLANOS DE MANUTENÇÃO (PMP)
  // ============================================================================

  public listarPlanos(empresaId: string, tipo?: TipoManutencao): PlanoManutencao[] {
    return Array.from(this.planos.values())
      .filter((p) => p.empresaId === empresaId)
      .filter((p) => (!tipo ? true : p.tipo === tipo));
  }

  public cadastrarPlano(
    empresaId: string,
    dados: Omit<PlanoManutencao, 'id' | 'empresaId'>
  ): PlanoManutencao {
    const id = `pln-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const plano: PlanoManutencao = {
      ...dados,
      id,
      empresaId,
    };
    this.planos.set(id, plano);
    return plano;
  }

  // ============================================================================
  // 4. ORDENS DE MANUTENÇÃO (OM)
  // ============================================================================

  public listarOrdens(
    empresaId: string,
    status?: StatusOrdemManutencao,
    tipo?: TipoManutencao,
    ativoId?: string
  ): OrdemManutencao[] {
    return Array.from(this.ordens.values())
      .filter((o) => o.empresaId === empresaId)
      .filter((o) => (!status ? true : o.status === status))
      .filter((o) => (!tipo ? true : o.tipoManutencao === tipo))
      .filter((o) => (!ativoId ? true : o.ativoId === ativoId))
      .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime());
  }

  public obterOrdemPorId(id: string, empresaId: string): OrdemManutencao {
    const om = this.ordens.get(id);
    if (!om || om.empresaId !== empresaId) {
      throw new NotFoundError(`Ordem de Manutenção "${id}" não encontrada.`);
    }
    return om;
  }

  public abrirOrdemManutencao(
    empresaId: string,
    dados: {
      tipoManutencao: TipoManutencao;
      origem: OrdemManutencao['origem'];
      prioridade: PrioridadeManutencao;
      ativoId: string;
      componenteId?: string;
      planoManutencaoId?: string;
      falhaId?: string;
      descricaoProblema: string;
      solicitanteNome: string;
      tecnicoResponsavelId?: string;
      tecnicoResponsavelNome?: string;
      dataAgendamento?: string;
      bloquearProducaoImediatamente?: boolean;
    }
  ): OrdemManutencao {
    const ativo = this.obterAtivoPorId(dados.ativoId, empresaId);
    const plano = dados.planoManutencaoId ? this.planos.get(dados.planoManutencaoId) : undefined;
    const componente = dados.componenteId ? this.componentes.get(dados.componenteId) : undefined;

    this.seqOM += 1;
    const numeroOM = `OM-${new Date().getFullYear()}-${String(this.seqOM).padStart(4, '0')}`;
    const id = `om-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Monta tarefas padrão do plano caso exista
    const tarefasExecutadas: RespostaTarefaOM[] = (plano?.tarefas || []).map((t) => ({
      tarefaId: t.id,
      descricao: t.descricao,
      concluido: false,
    }));

    const deveBloquear =
      dados.bloquearProducaoImediatamente ||
      dados.prioridade === 'EMERGENCIAL_PARADA_PRODUCAO' ||
      dados.tipoManutencao === 'CORRETIVA';

    const novaOM: OrdemManutencao = {
      id,
      empresaId,
      numeroOM,
      tipoManutencao: dados.tipoManutencao,
      origem: dados.origem,
      prioridade: dados.prioridade,
      status: 'ABERTA',
      ativoId: ativo.id,
      ativoTag: ativo.tag,
      ativoNome: ativo.nome,
      componenteId: componente?.id,
      componenteNome: componente?.nome,
      planoManutencaoId: plano?.id,
      planoManutencaoTitulo: plano?.titulo,
      falhaId: dados.falhaId,
      descricaoProblema: dados.descricaoProblema,
      solicitanteNome: dados.solicitanteNome,
      dataAbertura: new Date().toISOString(),
      dataAgendamento: dados.dataAgendamento,
      tecnicoResponsavelId: dados.tecnicoResponsavelId,
      tecnicoResponsavelNome: dados.tecnicoResponsavelNome,
      horimetroNoMomento: ativo.horimetroAtual,
      tempoParadaHoras: 0,
      tempoTrabalhoTecnicoHoras: 0,
      tarefasExecutadas,
      custoMaoDeObraInterna: 0,
      custoServicosTerceiros: 0,
      custoMateriaisPecas: 0,
      custoOportunidadeParada: 0,
      custoTotalOM: 0,
      bloqueouProducao: deveBloquear,
      notificouPCP: deveBloquear,
      solicitacoesCompraGeradas: [],
    };

    if (deveBloquear) {
      this.atualizarStatusOperacional(
        ativo.id,
        empresaId,
        dados.tipoManutencao === 'CORRETIVA' ? 'EM_MANUTENCAO_CORRETIVA' : 'EM_MANUTENCAO_PREVENTIVA',
        `Aberta Ordem de Manutenção ${numeroOM}: ${dados.descricaoProblema}`,
        dados.solicitanteNome
      );
    }

    this.ordens.set(id, novaOM);
    return novaOM;
  }

  public iniciarExecucaoOM(id: string, empresaId: string, tecnicoNome: string): OrdemManutencao {
    const om = this.obterOrdemPorId(id, empresaId);
    om.status = 'EM_EXECUCAO';
    om.dataInicioExecucao = new Date().toISOString();
    om.tecnicoResponsavelNome = tecnicoNome;
    this.ordens.set(id, om);
    return om;
  }

  public atualizarTarefaOM(
    omId: string,
    empresaId: string,
    tarefaId: string,
    dados: { concluido: boolean; observacao?: string; valorMedido?: string; executadoPor?: string }
  ): OrdemManutencao {
    const om = this.obterOrdemPorId(omId, empresaId);
    const tarefa = om.tarefasExecutadas.find((t) => t.tarefaId === tarefaId);
    if (tarefa) {
      tarefa.concluido = dados.concluido;
      tarefa.observacao = dados.observacao;
      tarefa.valorMedido = dados.valorMedido;
      tarefa.executadoPor = dados.executadoPor;
    }
    this.ordens.set(omId, om);
    return om;
  }

  public concluirOrdemManutencao(
    id: string,
    empresaId: string,
    dados: {
      causaRaizIdentificada: string;
      solucaoAplicada: string;
      tempoTrabalhoTecnicoHoras: number;
      tempoParadaHoras: number;
      observacoesFinais?: string;
      taxaHoraTecnicoInterno?: number;
    }
  ): OrdemManutencao {
    const om = this.obterOrdemPorId(id, empresaId);
    const ativo = this.obterAtivoPorId(om.ativoId, empresaId);

    om.status = 'CONCLUIDA';
    om.dataFimExecucao = new Date().toISOString();
    om.causaRaizIdentificada = dados.causaRaizIdentificada;
    om.solucaoAplicada = dados.solucaoAplicada;
    om.tempoTrabalhoTecnicoHoras = dados.tempoTrabalhoTecnicoHoras;
    om.tempoParadaHoras = dados.tempoParadaHoras;
    om.observacoesFinais = dados.observacoesFinais;

    // Cálculo de custos
    const taxaTecnico = dados.taxaHoraTecnicoInterno || 65.0; // R$ 65/hora homem
    om.custoMaoDeObraInterna = dados.tempoTrabalhoTecnicoHoras * taxaTecnico;

    // Custo de oportunidade de máquina parada
    om.custoOportunidadeParada = dados.tempoParadaHoras * ativo.custoHoraMaquina;

    // Soma peças e serviços já vinculados
    const pecasOM = Array.from(this.itensRequisitados.values()).filter((it) => it.ordemManutencaoId === om.id);
    om.custoMateriaisPecas = pecasOM.reduce((acc, p) => acc + p.custoTotal, 0);

    const servicosOM = Array.from(this.servicosTerceiros.values()).filter((s) => s.ordemManutencaoId === om.id);
    om.custoServicosTerceiros = servicosOM.reduce((acc, s) => acc + s.valorTotal, 0);

    om.custoTotalOM =
      om.custoMaoDeObraInterna +
      om.custoServicosTerceiros +
      om.custoMateriaisPecas +
      om.custoOportunidadeParada;

    // Se for preventiva, atualiza marcadores do ativo
    if (om.tipoManutencao === 'PREVENTIVA') {
      ativo.horimetroUltimaPreventiva = ativo.horimetroAtual;
      ativo.dataUltimaPreventiva = new Date().toISOString();
      ativo.proximaPreventivaHorimetro = ativo.horimetroAtual + 500; // +500h próximo ciclo
      const proxData = new Date();
      proxData.setDate(proxData.getDate() + 30);
      ativo.proximaPreventivaData = proxData.toISOString().split('T')[0];
    }

    // Libera a máquina de volta para OPERACIONAL e desfaz bloqueio de PCP
    this.atualizarStatusOperacional(
      ativo.id,
      empresaId,
      'OPERACIONAL',
      `Ordem ${om.numeroOM} concluída com sucesso. Máquina liberada.`,
      om.tecnicoResponsavelNome
    );

    this.ordens.set(id, om);
    this.recalcularIndicadoresAtivo(ativo);
    return om;
  }

  // ============================================================================
  // 5. REQUISIÇÃO DE PEÇAS / SOBRESSALENTES & COMPRAS AUTOMÁTICAS
  // ============================================================================

  public requisitarPecaParaOM(
    empresaId: string,
    dados: {
      ordemManutencaoId: string;
      produtoId: string;
      codigoProduto: string;
      descricao: string;
      quantidadeRequisitada: number;
      quantidadeEmEstoqueDisponivel: number;
      unidadeMedida: string;
      custoUnitario: number;
    }
  ): { item: ManutencaoItemRequisitado; solicitacaoCompraGerada?: any } {
    const om = this.obterOrdemPorId(dados.ordemManutencaoId, empresaId);
    this.seqItem += 1;
    const id = `mit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const custoTotal = dados.quantidadeRequisitada * dados.custoUnitario;
    const temEstoqueSuficiente = dados.quantidadeEmEstoqueDisponivel >= dados.quantidadeRequisitada;

    let statusAtendimento: ManutencaoItemRequisitado['statusAtendimento'] = 'RESERVADO_ESTOQUE';
    let solicitacaoCompraGerada: any = undefined;

    // Regra de Ouro: Se NÃO tem estoque suficiente -> Gerar Necessidade de Compra Imediata no módulo Compras!
    if (!temEstoqueSuficiente) {
      statusAtendimento = 'SOLICITACAO_COMPRA_GERADA';
      const quantidadeFaltante = dados.quantidadeRequisitada - dados.quantidadeEmEstoqueDisponivel;

      try {
        const sc = comprasService.criarSolicitacao(empresaId, {
          tipoGeracao: 'MANUTENCAO',
          prioridade: om.prioridade === 'EMERGENCIAL_PARADA_PRODUCAO' ? 'EMERGENCIAL' : 'URGENTE',
          solicitanteNome: `PCM / ${om.tecnicoResponsavelNome || 'Equipe de Manutenção'}`,
          departamento: 'MANUTENCAO_INDUSTRIAL',
          dataNecessidade: new Date().toISOString().split('T')[0],
          justificativa: `Necessidade emergencial para atendimento da ${om.numeroOM} na máquina TAG ${om.ativoTag}. Estoque atual insuficiente (${dados.quantidadeEmEstoqueDisponivel} ${dados.unidadeMedida} disponíveis vs ${dados.quantidadeRequisitada} ${dados.unidadeMedida} requisitadas).`,
          itens: [
            {
              produtoId: dados.produtoId,
              codigoProduto: dados.codigoProduto,
              descricao: dados.descricao,
              quantidade: quantidadeFaltante > 0 ? quantidadeFaltante : dados.quantidadeRequisitada,
              unidadeMedida: dados.unidadeMedida,
              precoEstimadoUnitario: dados.custoUnitario,
              maquinaTag: om.ativoTag,
            },
          ],
        });

        solicitacaoCompraGerada = sc;
        om.solicitacoesCompraGeradas.push(sc.id);
        om.status = 'AGUARDANDO_PECA';
        this.ordens.set(om.id, om);
      } catch (err) {
        console.error('Erro ao gerar solicitação de compra automática de manutenção:', err);
      }
    }

    const item: ManutencaoItemRequisitado = {
      id,
      empresaId,
      ordemManutencaoId: om.id,
      numeroOM: om.numeroOM,
      produtoId: dados.produtoId,
      codigoProduto: dados.codigoProduto,
      descricao: dados.descricao,
      quantidadeRequisitada: dados.quantidadeRequisitada,
      quantidadeEmEstoqueDisponivel: dados.quantidadeEmEstoqueDisponivel,
      unidadeMedida: dados.unidadeMedida,
      custoUnitario: dados.custoUnitario,
      custoTotal,
      statusAtendimento,
      solicitacaoCompraId: solicitacaoCompraGerada?.id,
      solicitacaoCompraNumero: solicitacaoCompraGerada?.numero,
      dataRequisicao: new Date().toISOString(),
    };

    this.itensRequisitados.set(id, item);

    // Atualiza custos na OM
    om.custoMateriaisPecas += custoTotal;
    om.custoTotalOM += custoTotal;
    this.ordens.set(om.id, om);

    return { item, solicitacaoCompraGerada };
  }

  public listarItensRequisitados(empresaId: string, ordemManutencaoId?: string): ManutencaoItemRequisitado[] {
    return Array.from(this.itensRequisitados.values())
      .filter((i) => i.empresaId === empresaId)
      .filter((i) => (!ordemManutencaoId ? true : i.ordemManutencaoId === ordemManutencaoId));
  }

  // ============================================================================
  // 6. SERVIÇOS DE TERCEIROS
  // ============================================================================

  public adicionarServicoTerceiro(
    empresaId: string,
    dados: Omit<ManutencaoServicoTerceiro, 'id' | 'empresaId' | 'numeroOM' | 'valorTotal'>
  ): ManutencaoServicoTerceiro {
    const om = this.obterOrdemPorId(dados.ordemManutencaoId, empresaId);
    this.seqServico += 1;
    const id = `mst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const valorTotal = dados.horasTrabalhadas * dados.valorHora;

    const servico: ManutencaoServicoTerceiro = {
      ...dados,
      id,
      empresaId,
      numeroOM: om.numeroOM,
      valorTotal,
    };

    this.servicosTerceiros.set(id, servico);

    // Atualiza custo na OM
    om.custoServicosTerceiros += valorTotal;
    om.custoTotalOM += valorTotal;
    if (servico.status === 'EM_EXECUCAO') {
      om.status = 'AGUARDANDO_TERCEIRO';
    }
    this.ordens.set(om.id, om);

    return servico;
  }

  public listarServicosTerceiros(empresaId: string, ordemManutencaoId?: string): ManutencaoServicoTerceiro[] {
    return Array.from(this.servicosTerceiros.values())
      .filter((s) => s.empresaId === empresaId)
      .filter((s) => (!ordemManutencaoId ? true : s.ordemManutencaoId === ordemManutencaoId));
  }

  // ============================================================================
  // 7. HORÍMETROS & DISPAROS PREVENTIVOS AUTOMÁTICOS
  // ============================================================================

  public registrarLeituraHorimetro(
    empresaId: string,
    dados: {
      ativoId: string;
      horimetroAtual: number;
      origem: RegistroHorimetro['origem'];
      registradoPor: string;
    }
  ): { registro: RegistroHorimetro; ordemPreventivaGerada?: OrdemManutencao } {
    const ativo = this.obterAtivoPorId(dados.ativoId, empresaId);
    if (dados.horimetroAtual < ativo.horimetroAtual) {
      throw new BadRequestError(
        `O horímetro informado (${dados.horimetroAtual}h) não pode ser inferior ao atual (${ativo.horimetroAtual}h).`
      );
    }

    this.seqHorimetro += 1;
    const id = `hor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const horasTrabalhadasPeriodo = dados.horimetroAtual - ativo.horimetroAtual;

    const horimetroAnterior = ativo.horimetroAtual;
    ativo.horimetroAtual = dados.horimetroAtual;

    let disparouPreventiva = false;
    let ordemPreventivaGerada: OrdemManutencao | undefined = undefined;

    // Checa gatilho de horas para manutenção preventiva
    const horasDesdeUltima = dados.horimetroAtual - ativo.horimetroUltimaPreventiva;
    if (horasDesdeUltima >= 500) {
      disparouPreventiva = true;
      // Procura plano preventivo compatível
      const plano = Array.from(this.planos.values()).find(
        (p) => p.empresaId === empresaId && (p.ativoId === ativo.id || p.tipoAtivo === ativo.tipo)
      );

      ordemPreventivaGerada = this.abrirOrdemManutencao(empresaId, {
        tipoManutencao: 'PREVENTIVA',
        origem: 'PLANO_HORIMETRO',
        prioridade: 'MEDIA',
        ativoId: ativo.id,
        planoManutencaoId: plano?.id,
        descricaoProblema: `Preventiva disparada automaticamente por atingimento de ${dados.horimetroAtual}h no horímetro (ciclo de ${horasDesdeUltima}h operadas).`,
        solicitanteNome: 'Sistema PCM Automático (Gatilho de Horímetro)',
      });
    }

    const registro: RegistroHorimetro = {
      id,
      empresaId,
      ativoId: ativo.id,
      ativoTag: ativo.tag,
      dataLeitura: new Date().toISOString(),
      horimetroAnterior,
      horimetroAtual: dados.horimetroAtual,
      horasTrabalhadasPeriodo,
      origem: dados.origem,
      disparouPreventiva,
      ordemManutencaoGeradaId: ordemPreventivaGerada?.id,
      ordemManutencaoGeradaNumero: ordemPreventivaGerada?.numeroOM,
      registradoPor: dados.registradoPor,
    };

    this.registrosHorimetro.set(id, registro);
    this.ativos.set(ativo.id, ativo);

    return { registro, ordemPreventivaGerada };
  }

  public listarLeiturasHorimetro(empresaId: string, ativoId?: string): RegistroHorimetro[] {
    return Array.from(this.registrosHorimetro.values())
      .filter((r) => r.empresaId === empresaId)
      .filter((r) => (!ativoId ? true : r.ativoId === ativoId))
      .sort((a, b) => new Date(b.dataLeitura).getTime() - new Date(a.dataLeitura).getTime());
  }

  // ============================================================================
  // 8. PARADAS DE MÁQUINA (Downtime)
  // ============================================================================

  public registrarParada(
    empresaId: string,
    dados: {
      ativoId: string;
      ativoTag: string;
      ordemManutencaoId?: string;
      ordemProducaoIdAfetada?: string;
      tipoParada: ParadaManutencao['tipoParada'];
      motivo: string;
      bloqueouPcp: boolean;
      duracaoMinutos?: number;
      registradoPor: string;
    }
  ): ParadaManutencao {
    this.seqParada += 1;
    const id = `prd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ativo = this.obterAtivoPorId(dados.ativoId, empresaId);

    const parada: ParadaManutencao = {
      id,
      empresaId,
      ativoId: dados.ativoId,
      ativoTag: dados.ativoTag,
      ordemManutencaoId: dados.ordemManutencaoId,
      ordemProducaoIdAfetada: dados.ordemProducaoIdAfetada,
      dataHoraInicio: new Date().toISOString(),
      duracaoMinutos: dados.duracaoMinutos || 45,
      tipoParada: dados.tipoParada,
      motivo: dados.motivo,
      bloqueouPcp: dados.bloqueouPcp,
      registradoPor: dados.registradoPor,
    };

    this.paradas.set(id, parada);
    ativo.totalParadasHistorico += 1;
    ativo.tempoTotalParadoMinutos += parada.duracaoMinutos;
    this.recalcularIndicadoresAtivo(ativo);
    this.ativos.set(ativo.id, ativo);

    return parada;
  }

  public listarParadas(empresaId: string, ativoId?: string): ParadaManutencao[] {
    return Array.from(this.paradas.values())
      .filter((p) => p.empresaId === empresaId)
      .filter((p) => (!ativoId ? true : p.ativoId === ativoId))
      .sort((a, b) => new Date(b.dataHoraInicio).getTime() - new Date(a.dataHoraInicio).getTime());
  }

  // ============================================================================
  // 9. GESTÃO DE FERRAMENTAL & MATRIZES
  // ============================================================================

  public listarFerramentas(empresaId: string, tipo?: TipoFerramenta, status?: StatusFerramenta): FerramentaIndustrial[] {
    return Array.from(this.ferramentas.values())
      .filter((f) => f.empresaId === empresaId)
      .filter((f) => (!tipo ? true : f.tipoFerramenta === tipo))
      .filter((f) => (!status ? true : f.status === status));
  }

  public cadastrarFerramenta(
    empresaId: string,
    dados: Omit<FerramentaIndustrial, 'id' | 'empresaId' | 'totalAfiacoesRealizadas' | 'acumuladoGolpesHoras'>
  ): FerramentaIndustrial {
    const id = `fer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ferramenta: FerramentaIndustrial = {
      ...dados,
      id,
      empresaId,
      acumuladoGolpesHoras: 0,
      totalAfiacoesRealizadas: 0,
    };
    this.ferramentas.set(id, ferramenta);
    return ferramenta;
  }

  public movimentarFerramenta(
    empresaId: string,
    dados: {
      ferramentaId: string;
      tipoMovimento: MovimentoFerramenta['tipoMovimento'];
      ativoId?: string;
      operadorNome: string;
      golpesNoSetup?: number;
      observacoes?: string;
    }
  ): MovimentoFerramenta {
    const ferramenta = this.ferramentas.get(dados.ferramentaId);
    if (!ferramenta || ferramenta.empresaId !== empresaId) {
      throw new NotFoundError(`Ferramenta "${dados.ferramentaId}" não encontrada.`);
    }

    const ativo = dados.ativoId ? this.obterAtivoPorId(dados.ativoId, empresaId) : undefined;
    this.seqMovFerramenta += 1;
    const id = `mov-fer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    switch (dados.tipoMovimento) {
      case 'CHECKOUT_MONTAGEM':
        if (!ativo) throw new BadRequestError('Informe o ativo de destino para montagem da ferramenta.');
        ferramenta.status = 'MONTADA_EM_MAQUINA';
        ferramenta.ativoAtualId = ativo.id;
        ferramenta.ativoAtualTag = ativo.tag;
        break;

      case 'CHECKIN_DESMONTAGEM':
        ferramenta.status = 'DISPONIVEL_ESTOQUE';
        ferramenta.ativoAtualId = undefined;
        ferramenta.ativoAtualTag = undefined;
        if (dados.golpesNoSetup) {
          ferramenta.acumuladoGolpesHoras += dados.golpesNoSetup;
        }
        break;

      case 'ENVIO_AFIACAO':
        ferramenta.status = 'EM_AFIACAO_EXTERNA';
        ferramenta.ativoAtualId = undefined;
        ferramenta.ativoAtualTag = undefined;
        break;

      case 'RETORNO_AFIACAO':
        ferramenta.status = 'DISPONIVEL_ESTOQUE';
        ferramenta.totalAfiacoesRealizadas += 1;
        break;

      case 'DESCARTE_SUCATA':
        ferramenta.status = 'DESGASTADA_SUCATA';
        ferramenta.ativoAtualId = undefined;
        break;
    }

    const movimento: MovimentoFerramenta = {
      id,
      empresaId,
      ferramentaId: ferramenta.id,
      ferramentaCodigo: ferramenta.codigo,
      ferramentaNome: ferramenta.nome,
      tipoMovimento: dados.tipoMovimento,
      ativoId: ativo?.id,
      ativoTag: ativo?.tag,
      operadorNome: dados.operadorNome,
      dataHora: new Date().toISOString(),
      golpesNoSetup: dados.golpesNoSetup,
      observacoes: dados.observacoes,
    };

    this.movimentosFerramentas.set(id, movimento);
    this.ferramentas.set(ferramenta.id, ferramenta);

    return movimento;
  }

  public listarMovimentosFerramenta(empresaId: string, ferramentaId?: string): MovimentoFerramenta[] {
    return Array.from(this.movimentosFerramentas.values())
      .filter((m) => m.empresaId === empresaId)
      .filter((m) => (!ferramentaId ? true : m.ferramentaId === ferramentaId))
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  // ============================================================================
  // 10. MONITORAMENTO PREDITIVO (Sensores & Telemetria)
  // ============================================================================

  public listarLeiturasPreditivas(empresaId: string, ativoId?: string): LeituraPreditivaSensor[] {
    return Array.from(this.leiturasPreditivas.values())
      .filter((l) => l.empresaId === empresaId)
      .filter((l) => (!ativoId ? true : l.ativoId === ativoId))
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  public registrarLeituraSensor(
    empresaId: string,
    dados: Omit<LeituraPreditivaSensor, 'id' | 'empresaId' | 'dataHora'>
  ): LeituraPreditivaSensor {
    const id = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const leitura: LeituraPreditivaSensor = {
      ...dados,
      id,
      empresaId,
      dataHora: new Date().toISOString(),
    };

    this.leiturasPreditivas.set(id, leitura);

    // Se sensor estiver crítico, dispara alerta preventivo
    if (leitura.statusSensor === 'CRITICO' && leitura.alertaDetectado) {
      const ativo = this.obterAtivoPorId(dados.ativoId, empresaId);
      this.abrirOrdemManutencao(empresaId, {
        tipoManutencao: 'PREDITIVA',
        origem: 'ALARME_PREDITIVO_IOT',
        prioridade: 'ALTA',
        ativoId: ativo.id,
        descricaoProblema: `Alarme de telemetria preditiva: ${dados.mensagemDiagnostico} (Temp: ${dados.temperaturaFonteGrausC}°C, Vibração: ${dados.vibracaoEixoRmsMmS} mm/s).`,
        solicitanteNome: 'Módulo IoT / Monitoramento Preditivo Automático',
      });
    }

    return leitura;
  }

  // ============================================================================
  // 11. INDICADORES CONSOLIDADOS (MTBF, MTTR, Disponibilidade, Custo/Hora)
  // ============================================================================

  public obterIndicadoresPCM(empresaId: string): IndicadoresPCM {
    const ativosEmpresa = Array.from(this.ativos.values()).filter((a) => a.empresaId === empresaId);
    const ordensEmpresa = Array.from(this.ordens.values()).filter((o) => o.empresaId === empresaId);
    const paradasEmpresa = Array.from(this.paradas.values()).filter((p) => p.empresaId === empresaId);
    const itensEmpresa = Array.from(this.itensRequisitados.values()).filter((i) => i.empresaId === empresaId);

    const totalAtivos = ativosEmpresa.length;
    const ativosOperacionais = ativosEmpresa.filter((a) => a.statusOperacional === 'OPERACIONAL').length;
    const ativosEmManutencao = totalAtivos - ativosOperacionais;

    // MTBF Global (Horas médias entre quebras corretivas)
    const ordensCorretivas = ordensEmpresa.filter((o) => o.tipoManutencao === 'CORRETIVA');
    const totalHorasOperadas = ativosEmpresa.reduce((acc, a) => acc + a.horimetroAtual, 0);
    const mtbfGlobalHoras = ordensCorretivas.length > 0 ? totalHorasOperadas / Math.max(1, ordensCorretivas.length) : 850;

    // MTTR Global (Horas médias de reparo)
    const totalHorasReparo = ordensCorretivas.reduce((acc, o) => acc + o.tempoTrabalhoTecnicoHoras, 0);
    const mttrGlobalHoras = ordensCorretivas.length > 0 ? totalHorasReparo / Math.max(1, ordensCorretivas.length) : 3.8;

    // Disponibilidade Global (%) = MTBF / (MTBF + MTTR) * 100
    const disponibilidadeGlobalPercentual = (mtbfGlobalHoras / (mtbfGlobalHoras + mttrGlobalHoras)) * 100;

    // Preventivas em Dia (%)
    const ordensPreventivas = ordensEmpresa.filter((o) => o.tipoManutencao === 'PREVENTIVA');
    const preventivasConcluidas = ordensPreventivas.filter((o) => o.status === 'CONCLUIDA').length;
    const taxaPreventivasEmDiaPercentual =
      ordensPreventivas.length > 0 ? Math.round((preventivasConcluidas / ordensPreventivas.length) * 100) : 94.5;

    // Custos
    const custoMaoDeObraInterna = ordensEmpresa.reduce((acc, o) => acc + o.custoMaoDeObraInterna, 0);
    const custoServicosTerceiros = ordensEmpresa.reduce((acc, o) => acc + o.custoServicosTerceiros, 0);
    const custoMateriaisPecas = ordensEmpresa.reduce((acc, o) => acc + o.custoMateriaisPecas, 0);
    const custoOportunidadeParadas = ordensEmpresa.reduce((acc, o) => acc + o.custoOportunidadeParada, 0);
    const custoTotalManutencaoMes =
      custoMaoDeObraInterna + custoServicosTerceiros + custoMateriaisPecas + custoOportunidadeParadas;

    const custoManutencaoPorHoraOperacional =
      totalHorasOperadas > 0 ? custoTotalManutencaoMes / totalHorasOperadas : 18.5;

    const totalHorasDowntimeMes = paradasEmpresa.reduce((acc, p) => acc + p.duracaoMinutos / 60, 0);

    // Pareto Máquinas com mais falhas
    const maquinasComMaisFalhas = ativosEmpresa
      .map((a) => {
        const falhasAtivo = ordensCorretivas.filter((o) => o.ativoId === a.id);
        const custoAtivo = ordensEmpresa.filter((o) => o.ativoId === a.id).reduce((acc, o) => acc + o.custoTotalOM, 0);
        return {
          ativoTag: a.tag,
          nome: a.nome,
          totalFalhas: falhasAtivo.length,
          horasParadas: a.tempoTotalParadoMinutos / 60,
          custoTotal: custoAtivo,
        };
      })
      .sort((a, b) => b.totalFalhas - a.totalFalhas);

    // Peças mais requisitadas
    const pecasAgrupadas: Record<string, { codigo: string; descricao: string; quantidade: number; custoTotal: number; comprasGeradas: number }> = {};
    for (const it of itensEmpresa) {
      if (!pecasAgrupadas[it.codigoProduto]) {
        pecasAgrupadas[it.codigoProduto] = {
          codigo: it.codigoProduto,
          descricao: it.descricao,
          quantidade: 0,
          custoTotal: 0,
          comprasGeradas: 0,
        };
      }
      pecasAgrupadas[it.codigoProduto].quantidade += it.quantidadeRequisitada;
      pecasAgrupadas[it.codigoProduto].custoTotal += it.custoTotal;
      if (it.statusAtendimento === 'SOLICITACAO_COMPRA_GERADA') {
        pecasAgrupadas[it.codigoProduto].comprasGeradas += 1;
      }
    }

    const pecasMaisRequisitadas = Object.values(pecasAgrupadas).sort((a, b) => b.quantidade - a.quantidade);

    return {
      empresaId,
      periodoMes: 'Agosto / 2026',
      totalAtivos,
      ativosOperacionais,
      ativosEmManutencao,
      mtbfGlobalHoras: parseFloat(mtbfGlobalHoras.toFixed(1)),
      mttrGlobalHoras: parseFloat(mttrGlobalHoras.toFixed(1)),
      disponibilidadeGlobalPercentual: parseFloat(disponibilidadeGlobalPercentual.toFixed(1)),
      taxaPreventivasEmDiaPercentual,
      custoTotalManutencaoMes,
      custoMaoDeObraInterna,
      custoServicosTerceiros,
      custoMateriaisPecas,
      custoOportunidadeParadas,
      custoManutencaoPorHoraOperacional: parseFloat(custoManutencaoPorHoraOperacional.toFixed(2)),
      totalOrdensAbertas: ordensEmpresa.filter((o) => o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA').length,
      totalOrdensConcluidas: ordensEmpresa.filter((o) => o.status === 'CONCLUIDA').length,
      ordensPreventivasExecutadas: ordensPreventivas.length,
      ordensCorretivasExecutadas: ordensCorretivas.length,
      totalHorasDowntimeMes: parseFloat(totalHorasDowntimeMes.toFixed(1)),
      maquinasComMaisFalhas,
      pecasMaisRequisitadas,
    };
  }

  private recalcularIndicadoresAtivo(ativo: AtivoIndustrial) {
    const ordensAtivo = Array.from(this.ordens.values()).filter((o) => o.ativoId === ativo.id);
    const corretivas = ordensAtivo.filter((o) => o.tipoManutencao === 'CORRETIVA');

    if (corretivas.length > 0) {
      ativo.mtbfHoras = parseFloat((ativo.horimetroAtual / corretivas.length).toFixed(1));
      const horasReparo = corretivas.reduce((acc, o) => acc + o.tempoTrabalhoTecnicoHoras, 0);
      ativo.mttrHoras = parseFloat((horasReparo / corretivas.length).toFixed(1));
      ativo.disponibilidadePercentual = parseFloat(
        ((ativo.mtbfHoras / (ativo.mtbfHoras + ativo.mttrHoras)) * 100).toFixed(1)
      );
    }
  }

  // ============================================================================
  // SEED INITIAL DATA (Parque Fabril do Grupo TRITECH)
  // ============================================================================

  private seedInitialData() {
    const empresaId = 'emp-tritech-corte';

    // 1. Ativos do Chão de Fábrica
    const ativosSeed: AtivoIndustrial[] = [
      {
        id: 'atv-laser-01',
        empresaId,
        tag: 'LASER-01',
        nome: 'Máquina de Corte Laser Fibra Óptica 6kW',
        tipo: 'CORTE_LASER',
        marca: 'Trumpf',
        modelo: 'TruLaser 3030 Fiber (6kW)',
        numeroSerie: 'TRU-2022-9481',
        anoFabricacao: 2022,
        criticidade: 'A',
        centroCusto: 'CC-CORTE-LASER',
        localizacaoSetor: 'GALPAO_1_CORTE',
        statusOperacional: 'OPERACIONAL',
        dataAquisicao: '2022-03-15',
        valorAquisicao: 1850000.0,
        custoHoraMaquina: 280.0,
        horimetroAtual: 4820,
        horimetroUltimaPreventiva: 4500,
        dataUltimaPreventiva: '2026-07-15',
        proximaPreventivaData: '2026-08-30',
        proximaPreventivaHorimetro: 5000,
        bloqueioPCP: false,
        totalParadasHistorico: 4,
        tempoTotalParadoMinutos: 380,
        mtbfHoras: 964.0,
        mttrHoras: 2.8,
        disponibilidadePercentual: 97.2,
      },
      {
        id: 'atv-dobra-01',
        empresaId,
        tag: 'DOBRA-01',
        nome: 'Prensa Dobradeira CNC Sincronizada 175T x 3200mm',
        tipo: 'DOBRADEIRA_CNC',
        marca: 'Bystronic',
        modelo: 'Xpert Pro 175/3100',
        numeroSerie: 'BYS-2023-1102',
        anoFabricacao: 2023,
        criticidade: 'A',
        centroCusto: 'CC-DOBRA-CNC',
        localizacaoSetor: 'GALPAO_1_CONFORMAÇÃO',
        statusOperacional: 'OPERACIONAL',
        dataAquisicao: '2023-01-20',
        valorAquisicao: 720000.0,
        custoHoraMaquina: 145.0,
        horimetroAtual: 3120,
        horimetroUltimaPreventiva: 3000,
        dataUltimaPreventiva: '2026-08-01',
        proximaPreventivaData: '2026-09-01',
        proximaPreventivaHorimetro: 3500,
        bloqueioPCP: false,
        totalParadasHistorico: 2,
        tempoTotalParadoMinutos: 140,
        mtbfHoras: 1560.0,
        mttrHoras: 1.5,
        disponibilidadePercentual: 99.0,
      },
      {
        id: 'atv-puncao-01',
        empresaId,
        tag: 'PUNCAO-01',
        nome: 'Puncionadeira CNC Torre Múltipla 30T',
        tipo: 'PUNCIONADEIRA',
        marca: 'Amada',
        modelo: 'EM-2510NT',
        numeroSerie: 'AMD-2020-0044',
        anoFabricacao: 2020,
        criticidade: 'B',
        centroCusto: 'CC-ESTAMPAGEM',
        localizacaoSetor: 'GALPAO_1_CORTE',
        statusOperacional: 'EM_MANUTENCAO_PREVENTIVA',
        dataAquisicao: '2020-06-10',
        valorAquisicao: 450000.0,
        custoHoraMaquina: 98.0,
        horimetroAtual: 6740,
        horimetroUltimaPreventiva: 6200,
        dataUltimaPreventiva: '2026-07-28',
        proximaPreventivaData: '2026-08-28',
        proximaPreventivaHorimetro: 6700,
        bloqueioPCP: true,
        motivoBloqueioPCP: 'Manutenção preventiva programada PMP-03 em execução.',
        notificacaoPCPData: '2026-08-25T08:00:00Z',
        totalParadasHistorico: 8,
        tempoTotalParadoMinutos: 920,
        mtbfHoras: 842.5,
        mttrHoras: 4.2,
        disponibilidadePercentual: 95.2,
      },
      {
        id: 'atv-solda-01',
        empresaId,
        tag: 'SOLDA-ROBOT-01',
        nome: 'Célula Robotizada de Solda MIG/MAG 6 Eixos',
        tipo: 'SOLDA_ROBOTICA',
        marca: 'Yaskawa Motoman',
        modelo: 'AR1440 c/ Fonte Fronius TPS 400i',
        numeroSerie: 'YAS-2024-5511',
        anoFabricacao: 2024,
        criticidade: 'A',
        centroCusto: 'CC-CALDEIRARIA',
        localizacaoSetor: 'GALPAO_2_SOLDA',
        statusOperacional: 'OPERACIONAL',
        dataAquisicao: '2024-02-10',
        valorAquisicao: 580000.0,
        custoHoraMaquina: 110.0,
        horimetroAtual: 1950,
        horimetroUltimaPreventiva: 1500,
        dataUltimaPreventiva: '2026-06-30',
        proximaPreventivaData: '2026-09-30',
        proximaPreventivaHorimetro: 2000,
        bloqueioPCP: false,
        totalParadasHistorico: 1,
        tempoTotalParadoMinutos: 60,
        mtbfHoras: 1950.0,
        mttrHoras: 1.0,
        disponibilidadePercentual: 99.5,
      },
      {
        id: 'atv-comp-01',
        empresaId,
        tag: 'COMP-01',
        nome: 'Compressor Parafuso Rotativo 50HP + Secador Integrado',
        tipo: 'COMPRESSOR_AR',
        marca: 'Atlas Copco',
        modelo: 'GA 37 VSD+ FF',
        numeroSerie: 'ATL-2021-3920',
        anoFabricacao: 2021,
        criticidade: 'A',
        centroCusto: 'CC-UTILIDADES',
        localizacaoSetor: 'SALA_COMPRESSORES',
        statusOperacional: 'OPERACIONAL',
        dataAquisicao: '2021-08-05',
        valorAquisicao: 190000.0,
        custoHoraMaquina: 45.0,
        horimetroAtual: 9850,
        horimetroUltimaPreventiva: 9000,
        dataUltimaPreventiva: '2026-05-10',
        proximaPreventivaData: '2026-11-10',
        proximaPreventivaHorimetro: 10000,
        bloqueioPCP: false,
        totalParadasHistorico: 2,
        tempoTotalParadoMinutos: 180,
        mtbfHoras: 4925.0,
        mttrHoras: 2.0,
        disponibilidadePercentual: 99.6,
      },
    ];

    for (const atv of ativosSeed) {
      this.ativos.set(atv.id, atv);
    }

    // 2. Componentes Críticos dos Ativos
    const componentesSeed: ComponenteAtivo[] = [
      {
        id: 'cmp-01',
        empresaId,
        ativoId: 'atv-laser-01',
        ativoTag: 'LASER-01',
        codigo: 'CMP-FONTE-IPG-6KW',
        nome: 'Fonte Geradora Laser de Fibra Óptica IPG YLS-6000',
        tipoComponente: 'FONTE_LASER',
        numeroSerie: 'IPG-6K-8819',
        vidaUtilEstimadaHoras: 100000,
        horasTrabalhadas: 4820,
        criticidade: 'ALTA',
        status: 'EM_OPERACAO',
        dataInstalacao: '2022-03-15',
        detalhesTecnicos: 'Potência máxima de 6000W em onda contínua (CW).',
      },
      {
        id: 'cmp-02',
        empresaId,
        ativoId: 'atv-laser-01',
        ativoTag: 'LASER-01',
        codigo: 'CMP-CABECOTE-PRECITEC',
        nome: 'Cabeçote de Corte Autofoco Precitec ProCutter 2.0',
        tipoComponente: 'CABECOTE_CORTE',
        numeroSerie: 'PCT-2022-441',
        vidaUtilEstimadaHoras: 15000,
        horasTrabalhadas: 4820,
        criticidade: 'ALTA',
        status: 'EM_OPERACAO',
        dataInstalacao: '2022-03-15',
        detalhesTecnicos: 'Foco dinâmico automático com sensor capacitivo de altura.',
      },
      {
        id: 'cmp-03',
        empresaId,
        ativoId: 'atv-dobra-01',
        ativoTag: 'DOBRA-01',
        codigo: 'CMP-BLOCO-HIDRAULICO',
        nome: 'Bloco Hidráulico Proporcional de Válvulas Rexroth',
        tipoComponente: 'SISTEMA_HIDRAULICO',
        numeroSerie: 'REX-4WRPEH-10',
        vidaUtilEstimadaHoras: 20000,
        horasTrabalhadas: 3120,
        criticidade: 'ALTA',
        status: 'EM_OPERACAO',
        dataInstalacao: '2023-01-20',
      },
    ];

    for (const cmp of componentesSeed) {
      this.componentes.set(cmp.id, cmp);
    }

    // 3. Planos de Manutenção Preventiva (PMP)
    const planosSeed: PlanoManutencao[] = [
      {
        id: 'pln-01',
        empresaId,
        codigo: 'PMP-LASER-500H',
        titulo: 'Revisão Preventiva Periódica Laser Fibra 6kW (500 Horas / Mensal)',
        tipo: 'PREVENTIVA',
        gatilho: 'HIBRIDO',
        intervaloDias: 30,
        intervaloHorimetro: 500,
        toleranciaDias: 5,
        toleranciaHoras: 50,
        tipoAtivo: 'CORTE_LASER',
        qualificacaoRequerida: 'Técnico Especialista em Óptica & Laser',
        tempoTotalEstimadoHoras: 3.5,
        ativo: true,
        tarefas: [
          {
            id: 'tar-01',
            sequencia: 1,
            descricao: 'Inspeção e limpeza ultrassônica do vidro protetor e lentes focais',
            tipoInspecao: 'VISUAL',
            tempoEstimadoMinutos: 30,
            obrigatorio: true,
          },
          {
            id: 'tar-02',
            sequencia: 2,
            descricao: 'Verificação da calibração do bico e centralização do feixe de laser',
            tipoInspecao: 'TESTE_FUNCIONAL',
            tempoEstimadoMinutos: 40,
            obrigatorio: true,
          },
          {
            id: 'tar-03',
            sequencia: 3,
            descricao: 'Conferência do nível e condutividade da água do Chiller de refrigeração',
            tipoInspecao: 'MEDICAO',
            valorReferencia: 'Condutividade < 10 µS/cm, Temp: 20°C a 22°C',
            tempoEstimadoMinutos: 25,
            obrigatorio: true,
          },
          {
            id: 'tar-04',
            sequencia: 4,
            descricao: 'Lubrificação automática de cremalheiras e fusos de esferas (Graxa NLGI 2)',
            tipoInspecao: 'LUBRIFICACAO',
            tempoEstimadoMinutos: 35,
            obrigatorio: true,
          },
        ],
        materiaisEstimados: [
          {
            produtoId: 'prod-lente-prot',
            codigoProduto: 'SOB-VIDRO-PROT-D30',
            descricao: 'Vidro de Proteção Óptico Diâmetro 30 x 1.5mm',
            quantidade: 2,
            unidadeMedida: 'UN',
            custoEstimadoUnitario: 120.0,
          },
          {
            produtoId: 'prod-graxa-nlgi2',
            codigoProduto: 'SOB-GRAXA-KLUBER-1KG',
            descricao: 'Graxa Sintética de Alta Performance Klüberplex BEM 41-132',
            quantidade: 0.5,
            unidadeMedida: 'KG',
            custoEstimadoUnitario: 380.0,
          },
        ],
      },
      {
        id: 'pln-02',
        empresaId,
        codigo: 'PMP-DOBRA-SEMESTRAL',
        titulo: 'Revisão Preventiva Sistema Hidráulico Dobradeira CNC (1000 Horas / Semestral)',
        tipo: 'PREVENTIVA',
        gatilho: 'HORIMETRO',
        intervaloHorimetro: 1000,
        toleranciaDias: 10,
        toleranciaHoras: 80,
        tipoAtivo: 'DOBRADEIRA_CNC',
        qualificacaoRequerida: 'Mecânico de Manutenção Hidráulica',
        tempoTotalEstimadoHoras: 4.0,
        ativo: true,
        tarefas: [
          {
            id: 'tar-11',
            sequencia: 1,
            descricao: 'Inspeção de vazamentos em mangueiras, cilindros Y1/Y2 e conexões',
            tipoInspecao: 'VISUAL',
            tempoEstimadoMinutos: 45,
            obrigatorio: true,
          },
          {
            id: 'tar-12',
            sequencia: 2,
            descricao: 'Verificação da pressão das válvulas de alívio e calibração das réguas ópticas',
            tipoInspecao: 'MEDICAO',
            valorReferencia: '280 bar no circuito principal',
            tempoEstimadoMinutos: 60,
            obrigatorio: true,
          },
          {
            id: 'tar-13',
            sequencia: 3,
            descricao: 'Substituição dos elementos filtrantes de retorno e sucção do reservatório',
            tipoInspecao: 'SUBSTITUICAO',
            tempoEstimadoMinutos: 50,
            obrigatorio: true,
          },
        ],
        materiaisEstimados: [
          {
            produtoId: 'prod-filtro-ret',
            codigoProduto: 'SOB-FILTRO-HYDAC-10U',
            descricao: 'Elemento Filtrante Hidráulico 10 Micron Hydac',
            quantidade: 2,
            unidadeMedida: 'UN',
            custoEstimadoUnitario: 240.0,
          },
        ],
      },
    ];

    for (const pln of planosSeed) {
      this.planos.set(pln.id, pln);
    }

    // 4. Ordens de Manutenção (OMs)
    const ordensSeed: OrdemManutencao[] = [
      {
        id: 'om-2026-001',
        empresaId,
        numeroOM: 'OM-2026-0001',
        tipoManutencao: 'PREVENTIVA',
        origem: 'PLANO_CALENDARIO',
        prioridade: 'MEDIA',
        status: 'CONCLUIDA',
        ativoId: 'atv-laser-01',
        ativoTag: 'LASER-01',
        ativoNome: 'Máquina de Corte Laser Fibra Óptica 6kW',
        planoManutencaoId: 'pln-01',
        planoManutencaoTitulo: 'Revisão Preventiva Periódica Laser Fibra 6kW',
        descricaoProblema: 'Execução do plano mestre mensal PMP-LASER-500H.',
        causaRaizIdentificada: 'Desgaste natural de vidros protetores por respingos de escória.',
        solucaoAplicada: 'Substituído vidro protetor inferior, limpo bico de corte e calibrado feixe.',
        solicitanteNome: 'PCM - Planejador Roberto Alencar',
        dataAbertura: '2026-08-10T08:00:00Z',
        dataAgendamento: '2026-08-12T07:30:00Z',
        dataInicioExecucao: '2026-08-12T07:30:00Z',
        dataFimExecucao: '2026-08-12T10:30:00Z',
        tecnicoResponsavelId: 'tec-01',
        tecnicoResponsavelNome: 'Carlos Eduardo (Técnico Mecatrônico)',
        horimetroNoMomento: 4710,
        tempoParadaHoras: 3.0,
        tempoTrabalhoTecnicoHoras: 3.0,
        tarefasExecutadas: [
          { tarefaId: 'tar-01', descricao: 'Inspeção e limpeza de lentes', concluido: true, executadoPor: 'Carlos' },
          { tarefaId: 'tar-02', descricao: 'Calibração de bico e foco', concluido: true, executadoPor: 'Carlos' },
          { tarefaId: 'tar-03', descricao: 'Conferência do Chiller', concluido: true, executadoPor: 'Carlos' },
          { tarefaId: 'tar-04', descricao: 'Lubrificação mecânica', concluido: true, executadoPor: 'Carlos' },
        ],
        custoMaoDeObraInterna: 195.0,
        custoServicosTerceiros: 0,
        custoMateriaisPecas: 240.0,
        custoOportunidadeParada: 840.0,
        custoTotalOM: 1275.0,
        bloqueouProducao: true,
        notificouPCP: true,
        solicitacoesCompraGeradas: [],
      },
      {
        id: 'om-2026-002',
        empresaId,
        numeroOM: 'OM-2026-0002',
        tipoManutencao: 'CORRETIVA',
        origem: 'SOLICITACAO_CHAO_FABRICA',
        prioridade: 'EMERGENCIAL_PARADA_PRODUCAO',
        status: 'CONCLUIDA',
        ativoId: 'atv-dobra-01',
        ativoTag: 'DOBRA-01',
        ativoNome: 'Prensa Dobradeira CNC Sincronizada 175T x 3200mm',
        descricaoProblema: 'Alarme de desvio de paralelismo nos eixos Y1 e Y2 durante dobra de chapa grossa.',
        causaRaizIdentificada: 'Contaminação de sujeira na régua óptica Heidenhain do cilindro Y2.',
        solucaoAplicada: 'Limpeza química com álcool isopropílico na régua óptica e recalibração de zero máquina.',
        solicitanteNome: 'Operador Marcos Silva (Chão de Fábrica)',
        dataAbertura: '2026-08-18T14:15:00Z',
        dataInicioExecucao: '2026-08-18T14:30:00Z',
        dataFimExecucao: '2026-08-18T16:00:00Z',
        tecnicoResponsavelId: 'tec-02',
        tecnicoResponsavelNome: 'Fábio Antunes (Eletrotécnico)',
        horimetroNoMomento: 3080,
        tempoParadaHoras: 1.75,
        tempoTrabalhoTecnicoHoras: 1.5,
        tarefasExecutadas: [
          { tarefaId: 't-corr-01', descricao: 'Diagnóstico de sincronismo CNC', concluido: true },
          { tarefaId: 't-corr-02', descricao: 'Limpeza de régua óptica Y2', concluido: true },
        ],
        custoMaoDeObraInterna: 97.5,
        custoServicosTerceiros: 0,
        custoMateriaisPecas: 45.0,
        custoOportunidadeParada: 253.75,
        custoTotalOM: 396.25,
        bloqueouProducao: true,
        notificouPCP: true,
        solicitacoesCompraGeradas: [],
      },
      {
        id: 'om-2026-003',
        empresaId,
        numeroOM: 'OM-2026-0003',
        tipoManutencao: 'PREDITIVA',
        origem: 'ALARME_PREDITIVO_IOT',
        prioridade: 'ALTA',
        status: 'EM_EXECUCAO',
        ativoId: 'atv-puncao-01',
        ativoTag: 'PUNCAO-01',
        ativoNome: 'Puncionadeira CNC Torre Múltipla 30T',
        descricaoProblema: 'Sensor de vibração no cabeçote de puncionamento acusou RMS acima de 7.5 mm/s (Desgaste no rolamento de esferas).',
        solicitanteNome: 'Sistema Telemetria Preditiva',
        dataAbertura: '2026-08-25T08:00:00Z',
        dataInicioExecucao: '2026-08-25T09:00:00Z',
        tecnicoResponsavelId: 'tec-01',
        tecnicoResponsavelNome: 'Carlos Eduardo (Técnico Mecatrônico)',
        horimetroNoMomento: 6740,
        tempoParadaHoras: 2.5,
        tempoTrabalhoTecnicoHoras: 2.0,
        tarefasExecutadas: [
          { tarefaId: 't-pred-01', descricao: 'Análise espectral de vibração', concluido: true },
          { tarefaId: 't-pred-02', descricao: 'Desmontagem da tampa da torre', concluido: false },
        ],
        custoMaoDeObraInterna: 130.0,
        custoServicosTerceiros: 0,
        custoMateriaisPecas: 0,
        custoOportunidadeParada: 245.0,
        custoTotalOM: 375.0,
        bloqueouProducao: true,
        notificouPCP: true,
        solicitacoesCompraGeradas: [],
      },
    ];

    for (const om of ordensSeed) {
      this.ordens.set(om.id, om);
    }

    // 5. Falhas Cadastradas (Catálogo ISO 14224)
    const falhasSeed: FalhaCatalogo[] = [
      {
        id: 'flh-01',
        empresaId,
        codigo: 'FLH-OPT-PERDA-POTENCIA',
        sintoma: 'Perda de corte ou rebarba excessiva na chapa cortada',
        modoFalha: 'DESALINHAMENTO_OPTICO',
        causaProvavel: 'Vidro protetor queimado por respingo ou desvio no espelho de dobra.',
        acaoPadraoRecomendada: 'Substituição imediata do vidro protetor e teste de queima em fita térmica.',
        criticidade: 'ALTA',
        totalOcorrencias: 6,
      },
      {
        id: 'flh-02',
        empresaId,
        codigo: 'FLH-HID-PERDA-PRESSAO',
        sintoma: 'Dobra incompleta ou perda de força no prensado',
        modoFalha: 'VAZAMENTO_FLUIDO',
        causaProvavel: 'Gaxeta do cilindro desgastada ou válvula direcional travada por impurezas.',
        acaoPadraoRecomendada: 'Medição da pressão na tomada de teste e substituição do kit de vedação.',
        criticidade: 'ALTA',
        totalOcorrencias: 3,
      },
    ];

    for (const f of falhasSeed) {
      this.falhas.set(f.id, f);
    }

    // 6. Ferramental Industrial
    const ferramentasSeed: FerramentaIndustrial[] = [
      {
        id: 'fer-01',
        empresaId,
        codigo: 'MATRIZ-V12-88GRAUS-1M',
        nome: 'Matriz de Dobra Multi-V V12 Abertura 88° Comprimento 1000mm',
        tipoFerramenta: 'MATRIZ_DOBRA',
        maquinasCompativeis: ['DOBRA-01'],
        vidaUtilEstimadaGolpesHoras: 150000,
        acumuladoGolpesHoras: 42000,
        limiteAlertaAfiacao: 120000,
        status: 'MONTADA_EM_MAQUINA',
        ativoAtualId: 'atv-dobra-01',
        ativoAtualTag: 'DOBRA-01',
        localizacaoArmazem: 'ARMÁRIO-FERRAMENTAL-GAVETA-3',
        totalAfiacoesRealizadas: 0,
        custoAquisicao: 4800.0,
      },
      {
        id: 'fer-02',
        empresaId,
        codigo: 'PUNCAO-GOOSENECK-R1',
        nome: 'Punção Gooseneck (Pescoço de Cisne) Raio 1.0mm 86°',
        tipoFerramenta: 'PUNCAO_DOBRA',
        maquinasCompativeis: ['DOBRA-01'],
        vidaUtilEstimadaGolpesHoras: 120000,
        acumuladoGolpesHoras: 38500,
        limiteAlertaAfiacao: 100000,
        status: 'DISPONIVEL_ESTOQUE',
        localizacaoArmazem: 'ARMÁRIO-FERRAMENTAL-GAVETA-1',
        totalAfiacoesRealizadas: 1,
        custoAquisicao: 3900.0,
      },
      {
        id: 'fer-03',
        empresaId,
        codigo: 'BICO-LASER-DUPLO-1.5',
        nome: 'Bico de Corte Laser Cromado Duplo 1.5mm',
        tipoFerramenta: 'BICO_LASER',
        maquinasCompativeis: ['LASER-01'],
        vidaUtilEstimadaGolpesHoras: 800,
        acumuladoGolpesHoras: 320,
        limiteAlertaAfiacao: 750,
        status: 'MONTADA_EM_MAQUINA',
        ativoAtualId: 'atv-laser-01',
        ativoAtualTag: 'LASER-01',
        localizacaoArmazem: 'GAVETEIRO-LASER-01',
        totalAfiacoesRealizadas: 0,
        custoAquisicao: 165.0,
      },
    ];

    for (const fer of ferramentasSeed) {
      this.ferramentas.set(fer.id, fer);
    }

    // 7. Leituras Preditivas
    const leiturasSeed: LeituraPreditivaSensor[] = [
      {
        id: 'pred-01',
        empresaId,
        ativoId: 'atv-laser-01',
        ativoTag: 'LASER-01',
        dataHora: '2026-08-26T03:30:00Z',
        temperaturaFonteGrausC: 22.4,
        vibracaoEixoRmsMmS: 1.8,
        pressaoHidraulicaBar: 6.2,
        qualidadeOleoParticulasNas: 5,
        alertaDetectado: false,
        statusSensor: 'NORMAL',
        mensagemDiagnostico: 'Todos os parâmetros térmicos e ópticos dentro do envelope seguro.',
      },
      {
        id: 'pred-02',
        empresaId,
        ativoId: 'atv-puncao-01',
        ativoTag: 'PUNCAO-01',
        dataHora: '2026-08-25T07:45:00Z',
        temperaturaFonteGrausC: 48.6,
        vibracaoEixoRmsMmS: 7.8,
        pressaoHidraulicaBar: 180.0,
        qualidadeOleoParticulasNas: 8,
        alertaDetectado: true,
        statusSensor: 'CRITICO',
        mensagemDiagnostico: 'Vibração acima do limiar crítico (7.8 mm/s > 4.5 mm/s). Risco iminente de quebra de rolamento.',
      },
    ];

    for (const l of leiturasSeed) {
      this.leiturasPreditivas.set(l.id, l);
    }
  }
}

export const manutencaoService = new ManutencaoService();
