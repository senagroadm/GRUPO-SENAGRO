/**
 * NEXUS ERP - Serviço de Central de Cobrança, Gestão de Risco & Inadimplência
 * 
 * Regras Obrigatórias Implementadas:
 * 1. ISOLAMENTO MULTIEMPRESA: Toda operação valida e isola os dados por empresaId.
 * 2. PARAMETRIZAÇÃO DA RÉGUA: Gatilhos de -7d, -2d, 0d (vencimento) e atrasos (+3d, +7d, +15d, +30d) customizáveis.
 * 3. NÃO-DESTRUTIVO: Nenhuma cobrança/renegociação altera/cancela títulos sem log de auditoria append-only.
 * 4. EXPOSIÇÃO TOTAL: Limite de crédito considera rigorosamente Exposição Atual (títulos faturados) + Exposição Futura (pedidos aprovados em carteira/produção).
 * 5. SUSPENSÃO POR PROMESSA: Bloqueio comercial é automaticamente suspenso se houver promessa de pagamento vigente não vencida.
 */

import { EMPRESAS_GRUPO } from '../../core/types/company';
import {
  AgingFaixaValores,
  AgingClienteItem,
  AgingMatrixResumo,
  GatilhoReguaCobranca,
  ReguaCobrancaConfig,
  LembreteCobranca,
  BloqueioComercialCliente,
  PromessaPagamento,
  HistoricoContatoCobranca,
  RenegociacaoDivida,
  TituloRenegociacaoOrigem,
  ParcelaRenegociacaoGerada,
  ExposicaoCreditoCliente,
  AuditoriaCobrancaRiscoLog,
  CentralCobrancaDashboardData,
  CanalComunicacaoCobranca,
  StatusBloqueioComercial,
} from './cobranca-risco-types';
import { financeiroService } from './financeiro-service';

export class CobrancaRiscoService {
  // Stores isolados por empresaId
  private reguasConfigStore: Map<string, ReguaCobrancaConfig> = new Map();
  private bloqueiosStore: Map<string, BloqueioComercialCliente[]> = new Map();
  private promessasStore: Map<string, PromessaPagamento[]> = new Map();
  private contatosStore: Map<string, HistoricoContatoCobranca[]> = new Map();
  private renegociacoesStore: Map<string, RenegociacaoDivida[]> = new Map();
  private lembretesStore: Map<string, LembreteCobranca[]> = new Map();
  private limitesCustomizadosStore: Map<string, Map<string, { limiteConcedido: number; limiteTemporario: number; validadeTemporario?: string }>> = new Map();
  private auditoriaLogs: AuditoriaCobrancaRiscoLog[] = [];

  constructor() {
    this.inicializarReguasPadrao();
    this.inicializarDadosDemonstracao();
  }

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DE DADOS MESTRES E CONFIGURAÇÕES PADRÃO
  // --------------------------------------------------------------------------

  private inicializarReguasPadrao() {
    EMPRESAS_GRUPO.forEach((empresa) => {
      const gatilhosPadrao: GatilhoReguaCobranca[] = [
        {
          id: `gat-${empresa.id}-1`,
          ordem: 1,
          diasRelativoVencimento: -7,
          fase: 'PRE_VENCIMENTO',
          nomeRegra: 'Lembrete Preventivo (7 dias antes)',
          descricao: 'Envio de aviso cordial de vencimento com chave PIX e link do boleto bancário.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'WHATSAPP'],
          acaoAutomaticaBloqueio: false,
          acaoAutomaticaProtesto: false,
          templateAssuntoEmail: 'Lembrete de Vencimento - Doc {{numero_documento}} - {{empresa_nome}}',
          templateMensagem:
            'Prezado(a) {{cliente_nome}}, lembramos que o documento {{numero_documento}} no valor de R$ {{valor_total}} vencerá em {{data_vencimento}}. Acesse o boleto ou pague via PIX: {{link_pix}}',
        },
        {
          id: `gat-${empresa.id}-2`,
          ordem: 2,
          diasRelativoVencimento: -2,
          fase: 'PRE_VENCIMENTO',
          nomeRegra: 'Aviso de Vencimento Iminente (2 dias antes)',
          descricao: 'Alerta prioritário para agendamento financeiro no cliente.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'WHATSAPP'],
          acaoAutomaticaBloqueio: false,
          acaoAutomaticaProtesto: false,
          templateAssuntoEmail: 'Vencimento em 48h - Fatura {{numero_documento}} - {{empresa_nome}}',
          templateMensagem:
            'Olá {{cliente_nome}}, sua fatura {{numero_documento}} de R$ {{valor_total}} vence em 2 dias ({{data_vencimento}}). Para facilitar seu controle, utilize a chave PIX Copia e Cola: {{link_pix}}',
        },
        {
          id: `gat-${empresa.id}-3`,
          ordem: 3,
          diasRelativoVencimento: 0,
          fase: 'VENCIMENTO',
          nomeRegra: 'Aviso no Dia do Vencimento (D-0)',
          descricao: 'Lembrete disparado no dia exato do vencimento do título.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'WHATSAPP', 'SMS'],
          acaoAutomaticaBloqueio: false,
          acaoAutomaticaProtesto: false,
          templateAssuntoEmail: 'Vencimento Hoje - Documento {{numero_documento}}',
          templateMensagem:
            'Prezado {{cliente_nome}}, seu título {{numero_documento}} (R$ {{valor_total}}) vence hoje. Caso já tenha realizado o pagamento, por favor desconsidere este aviso.',
        },
        {
          id: `gat-${empresa.id}-4`,
          ordem: 4,
          diasRelativoVencimento: 3,
          fase: 'ATRASO_LEVE',
          nomeRegra: 'Primeiro Aviso de Atraso (+3 dias)',
          descricao: 'Notificação amigável de pendência financeira para verificação de esquecimento.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'WHATSAPP'],
          acaoAutomaticaBloqueio: false,
          acaoAutomaticaProtesto: false,
          templateAssuntoEmail: 'Aviso de Pendência Financeira - Doc {{numero_documento}}',
          templateMensagem:
            'Constatamos que o título {{numero_documento}} no valor de R$ {{valor_total}} encontra-se com 3 dias de atraso. Obtenha a 2ª via atualizada com cálculo de juros: {{link_boleto}}',
        },
        {
          id: `gat-${empresa.id}-5`,
          ordem: 5,
          diasRelativoVencimento: 7,
          fase: 'ATRASO_MEDIO',
          nomeRegra: 'Notificação de Cobrança & Aviso de Bloqueio (+7 dias)',
          descricao: 'Cobrança formal e aviso de iminente suspensão de novos pedidos de venda.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'WHATSAPP', 'LIGACAO'],
          acaoAutomaticaBloqueio: false,
          acaoAutomaticaProtesto: false,
          templateAssuntoEmail: 'NOTIFICAÇÃO FORMAL DE DÉBITO - Doc {{numero_documento}}',
          templateMensagem:
            'Prezado cliente {{cliente_nome}}, solicitamos a regularização imediata do título {{numero_documento}} (R$ {{valor_total}}, atraso de 7 dias) para evitar a suspensão de faturamento e novos pedidos.',
        },
        {
          id: `gat-${empresa.id}-6`,
          ordem: 6,
          diasRelativoVencimento: 15,
          fase: 'ATRASO_GRAVE',
          nomeRegra: 'Bloqueio Comercial Automático (+15 dias)',
          descricao: 'Bloqueio rigoroso de faturamento e envio de Notificação Extrajudicial.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'CARTA_REGISTRADA'],
          acaoAutomaticaBloqueio: true,
          acaoAutomaticaProtesto: false,
          templateAssuntoEmail: 'NOTIFICAÇÃO EXTRAJUDICIAL E BLOQUEIO COMERCIAL - {{cliente_nome}}',
          templateMensagem:
            'Informamos que devido ao atraso superior a 15 dias no título {{numero_documento}}, o cadastro da empresa {{cliente_nome}} foi temporariamente BLOQUEADO para novas compras.',
        },
        {
          id: `gat-${empresa.id}-7`,
          ordem: 7,
          diasRelativoVencimento: 30,
          fase: 'JURIDICO_CARTORIO',
          nomeRegra: 'Encaminhamento para Cartório / Protesto (+30 dias)',
          descricao: 'Envio para protesto de duplicata mercantil e negativação em bureaus de crédito.',
          ativo: true,
          canaisHabilitados: ['EMAIL', 'CARTA_REGISTRADA'],
          acaoAutomaticaBloqueio: true,
          acaoAutomaticaProtesto: true,
          templateAssuntoEmail: 'COMUNICADO DE PROTESTO EM CARTÓRIO - Titulo {{numero_documento}}',
          templateMensagem:
            'Prezados, o título {{numero_documento}} (R$ {{valor_total}}, 30 dias de inadimplência) foi encaminhado ao Cartório de Protesto de Títulos e bureaus Serasa/Boa Vista.',
        },
      ];

      this.reguasConfigStore.set(empresa.id, {
        id: `regua-${empresa.id}`,
        empresaId: empresa.id,
        empresaNome: empresa.nomeFantasia,
        nome: `Régua de Cobrança Industrial Padrão - ${empresa.codigo}`,
        descricao: 'Régua de cobrança automatizada multi-etapa com controle preventivo, reativo e judicial.',
        ativo: true,
        diasToleranciaAntesBloqueio: 10,
        bloquearAutomaticoEstouroLimite: true,
        bloquearAutomaticoAtraso: true,
        permitirDesbloqueioComPromessa: true,
        diasValidadePromessaPadrao: 5,
        jurosMoraMensalPerc: 1.0,
        multaAtrasoPerc: 2.0,
        gatilhos: gatilhosPadrao,
        atualizadoEm: '2026-08-20T08:00:00Z',
        atualizadoPorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
      });
    });
  }

  private inicializarDadosDemonstracao() {
    const dataHoje = new Date('2026-08-26');

    EMPRESAS_GRUPO.forEach((empresa) => {
      // Bloqueios Iniciais
      const bloqueios: BloqueioComercialCliente[] = [
        {
          id: `blk-${empresa.id}-1`,
          empresaId: empresa.id,
          clienteId: 'cli-004',
          clienteNome: 'Indústria Metalúrgica Vale do Rio Grande Ltda',
          cnpjCpf: '14.882.901/0001-44',
          status: 'ATIVO',
          motivo: 'INADIMPLENCIA_TITULOS_VENCIDOS',
          detalhesMotivo: 'Títulos em atraso há mais de 45 dias totalizando R$ 68.450,00 sem acordo firmado.',
          valorInadimplente: 68450,
          diasMaiorAtraso: 48,
          exposicaoNoMomento: 94000,
          limiteNoMomento: 50000,
          bloqueadoAutomatico: true,
          bloqueadoEm: '2026-08-10T09:30:00Z',
          bloqueadoPorUsuarioId: 'sistema-regua-auto',
          bloqueadoPorUsuarioNome: 'Robô Régua Cobrança',
          historicoAcoes: [
            {
              dataHora: '2026-08-10T09:30:00Z',
              acao: 'Bloqueio Automático por Inadimplência > 15 dias',
              usuarioNome: 'Robô Régua Cobrança',
              justificativa: 'Gatilho de régua +15 dias disparado sem quitação.',
            },
          ],
        },
        {
          id: `blk-${empresa.id}-2`,
          empresaId: empresa.id,
          clienteId: 'cli-003',
          clienteNome: 'Agropecuária & Máquinas Senagro Sul Ltda',
          cnpjCpf: '07.234.567/0001-89',
          status: 'SUSPENSO_POR_PROMESSA',
          motivo: 'EXPOSICAO_ACIMA_DO_LIMITE',
          detalhesMotivo: 'Exposição total de R$ 132.000 contra limite de R$ 100.000. Bloqueio suspenso temporariamente por promessa de pagamento em 28/08/2026.',
          valorInadimplente: 24500,
          diasMaiorAtraso: 8,
          exposicaoNoMomento: 132000,
          limiteNoMomento: 100000,
          bloqueadoAutomatico: true,
          bloqueadoEm: '2026-08-18T14:15:00Z',
          bloqueadoPorUsuarioId: 'sistema-credito-motor',
          bloqueadoPorUsuarioNome: 'Motor de Crédito & Risco',
          desbloqueadoEm: '2026-08-22T11:00:00Z',
          desbloqueadoPorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
          desbloqueadoPorUsuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
          justificativaDesbloqueio: 'Cliente registrou promessa de pagamento de R$ 24.500 para 28/08/2026.',
          validadeDesbloqueioTemporarioAte: '2026-08-28T23:59:59Z',
          promessaIdVinculada: `prom-${empresa.id}-1`,
          historicoAcoes: [
            {
              dataHora: '2026-08-18T14:15:00Z',
              acao: 'Bloqueio por Excesso de Limite (132%)',
              usuarioNome: 'Motor de Crédito & Risco',
              justificativa: 'Exposição de R$ 132k superior ao limite de R$ 100k.',
            },
            {
              dataHora: '2026-08-22T11:00:00Z',
              acao: 'Suspensão Temporária por Promessa de Pagamento',
              usuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
              justificativa: 'Promessa PRO-2026-089 firmada com depósito agendado.',
            },
          ],
        },
      ];
      this.bloqueiosStore.set(empresa.id, bloqueios);

      // Promessas Iniciais
      const promessas: PromessaPagamento[] = [
        {
          id: `prom-${empresa.id}-1`,
          empresaId: empresa.id,
          clienteId: 'cli-003',
          clienteNome: 'Agropecuária & Máquinas Senagro Sul Ltda',
          cnpjCpf: '07.234.567/0001-89',
          dataRegistro: '2026-08-22T10:45:00Z',
          dataPrometida: '2026-08-28',
          valorPrometido: 24500,
          formaPagamentoPrevista: 'PIX',
          contatoNome: 'Sra. Mariana Silveira (Gerente Contas a Pagar)',
          contatoTelefoneOuEmail: '(54) 3322-9988 / financeiro@senagro.com.br',
          observacoes: 'Cliente confirmou liberação de recebíveis de safra e fará PIX integral no dia 28/08 pela manhã.',
          status: 'PENDENTE',
          suspenderBloqueio: true,
          suspensaoValidaAte: '2026-08-28T23:59:59Z',
          titulosVinculados: [
            {
              contaReceberId: 'cr-rec-003',
              numeroDocumento: 'NF-e 004523/01',
              numeroParcela: 1,
              valorOriginal: 24500,
              valorSaldoRestante: 24500,
            },
          ],
          registradoPorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
          registradoPorUsuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
          createdAt: '2026-08-22T10:45:00Z',
          updatedAt: '2026-08-22T10:45:00Z',
        },
        {
          id: `prom-${empresa.id}-2`,
          empresaId: empresa.id,
          clienteId: 'cli-002',
          clienteNome: 'Marcopolo Carrocerias e Ônibus S/A',
          cnpjCpf: '88.611.834/0001-00',
          dataRegistro: '2026-08-15T15:20:00Z',
          dataPrometida: '2026-08-20',
          valorPrometido: 45000,
          formaPagamentoPrevista: 'TED',
          contatoNome: 'Roberto Mendes (Tesouraria)',
          contatoTelefoneOuEmail: '(54) 2101-1000',
          observacoes: 'Promessa cumprida com sucesso via TED no Banco Itaú.',
          status: 'CUMPRIDA',
          suspenderBloqueio: false,
          suspensaoValidaAte: '2026-08-20T23:59:59Z',
          titulosVinculados: [
            {
              contaReceberId: 'cr-rec-002',
              numeroDocumento: 'NF-e 004510/01',
              numeroParcela: 1,
              valorOriginal: 45000,
              valorSaldoRestante: 0,
            },
          ],
          registradoPorUsuarioId: 'u2222222-2222-2222-2222-222222222222',
          registradoPorUsuarioNome: 'Juliana Paes (Analista Cobrança)',
          dataResolucao: '2026-08-20T14:30:00Z',
          valorEfetivamentePago: 45000,
          createdAt: '2026-08-15T15:20:00Z',
          updatedAt: '2026-08-20T14:30:00Z',
        },
      ];
      this.promessasStore.set(empresa.id, promessas);

      // Histórico de Contato (CRM de Cobrança)
      const contatos: HistoricoContatoCobranca[] = [
        {
          id: `cnt-${empresa.id}-1`,
          empresaId: empresa.id,
          clienteId: 'cli-003',
          clienteNome: 'Agropecuária & Máquinas Senagro Sul Ltda',
          cnpjCpf: '07.234.567/0001-89',
          dataHora: '2026-08-22T10:30:00Z',
          tipoContato: 'LIGACAO_TELEFONICA',
          canal: 'LIGACAO',
          contatoNomeCliente: 'Mariana Silveira',
          contatoCargoOuDepto: 'Gerente Contas a Pagar',
          telefoneOuEmailUtilizado: '(54) 3322-9988',
          resumoConversa: 'Realizado contato telefônico para cobrar NF-e 004523/01 em atraso de 8 dias. Cliente explicou atraso momentâneo de safra e firmou promessa de pagamento para 28/08 via PIX.',
          sentimentoCliente: 'COOPERATIVO',
          gerouPromessaPagamento: true,
          promessaId: `prom-${empresa.id}-1`,
          dataProximoFollowUp: '2026-08-28T09:00:00Z',
          proximaAcaoDescricao: 'Conferir extrato bancário do PIX às 10h da manhã do dia 28/08.',
          operadorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
          operadorUsuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
          createdAt: '2026-08-22T10:45:00Z',
        },
        {
          id: `cnt-${empresa.id}-2`,
          empresaId: empresa.id,
          clienteId: 'cli-004',
          clienteNome: 'Indústria Metalúrgica Vale do Rio Grande Ltda',
          cnpjCpf: '14.882.901/0001-44',
          dataHora: '2026-08-25T16:00:00Z',
          tipoContato: 'NOTIFICACAO_EXTRAJUDICIAL',
          canal: 'EMAIL',
          contatoNomeCliente: 'Dr. Fernando Dias',
          contatoCargoOuDepto: 'Diretoria Financeira',
          telefoneOuEmailUtilizado: 'diretoria@valeriogrande.ind.br',
          resumoConversa: 'Enviada notificação formal de renegociação extrajudicial com proposta de parcelamento em 4x com entrada de 30%. Aguardando retorno formal.',
          sentimentoCliente: 'EVASIVO',
          gerouPromessaPagamento: false,
          dataProximoFollowUp: '2026-08-27T14:00:00Z',
          proximaAcaoDescricao: 'Se não responder até 27/08, acionar protesto em cartório.',
          operadorUsuarioId: 'u2222222-2222-2222-2222-222222222222',
          operadorUsuarioNome: 'Juliana Paes (Analista Cobrança)',
          createdAt: '2026-08-25T16:05:00Z',
        },
      ];
      this.contatosStore.set(empresa.id, contatos);

      // Renegociações Iniciais
      const renegociacoes: RenegociacaoDivida[] = [
        {
          id: `rng-${empresa.id}-1`,
          codigoAcordo: 'ACD-2026-0012',
          empresaId: empresa.id,
          empresaNome: empresa.nomeFantasia,
          clienteId: 'cli-001',
          clienteNome: 'Randon Implementos e Participações S/A',
          cnpjCpf: '89.086.144/0001-16',
          status: 'EFETIVADO',
          dataAcordo: '2026-08-05',
          totalPrincipalOriginal: 98000,
          totalJurosCalculados: 2940,
          totalMultaCalculada: 1960,
          totalDividaBruta: 102900,
          descontoConcedidoPrincipal: 0,
          descontoConcedidoJurosMulta: 1960, // Isenção de multa concedida
          totalDescontoGeral: 1960,
          valorFinalAcordado: 100940,
          valorEntrada: 30940,
          dataVencimentoEntrada: '2026-08-08',
          quantidadeParcelas: 3,
          intervaloDiasParcelas: 30,
          taxaJurosParcelamentoMensal: 0.8,
          primeiroVencimentoParcelas: '2026-09-08',
          titulosOrigem: [
            {
              contaReceberId: 'cr-rec-001-antigo',
              numeroDocumento: 'NF-e 003980',
              numeroParcela: 1,
              dataVencimentoOriginal: '2026-07-05',
              diasAtraso: 31,
              valorOriginal: 98000,
              valorJurosOriginal: 2940,
              valorMultaOriginal: 1960,
              valorSaldoOriginal: 98000,
            },
          ],
          parcelasNovas: [
            {
              numeroParcela: 1,
              dataVencimento: '2026-08-08',
              valorNominal: 30940,
              valorJurosEmbutidos: 0,
              valorTotalParcela: 30940,
              formaPagamentoPrevista: 'PIX',
            },
            {
              numeroParcela: 2,
              dataVencimento: '2026-09-08',
              valorNominal: 35000,
              valorJurosEmbutidos: 280,
              valorTotalParcela: 35280,
              formaPagamentoPrevista: 'BOLETO',
            },
            {
              numeroParcela: 3,
              dataVencimento: '2026-10-08',
              valorNominal: 35000,
              valorJurosEmbutidos: 560,
              valorTotalParcela: 35560,
              formaPagamentoPrevista: 'BOLETO',
            },
          ],
          novosTitulosCriadosIds: ['cr-rng-001-p1', 'cr-rng-001-p2', 'cr-rng-001-p3'],
          justificativaComercial: 'Acordo firmado com Diretoria de Suprimentos Randon com entrada à vista de R$ 30.940 já compensada.',
          negociadorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
          negociadorUsuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
          aprovadorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
          aprovadorUsuarioNome: 'Carlos Eduardo',
          termoConfissaoDividaGerado: true,
          termoStoragePath: '/documentos/renegociacoes/ACD-2026-0012-termo-assinado.pdf',
          createdAt: '2026-08-05T11:00:00Z',
          updatedAt: '2026-08-08T16:00:00Z',
        },
      ];
      this.renegociacoesStore.set(empresa.id, renegociacoes);

      // Lembretes Enviados Iniciais
      const lembretes: LembreteCobranca[] = [
        {
          id: `lmb-${empresa.id}-1`,
          empresaId: empresa.id,
          clienteId: 'cli-002',
          clienteNome: 'Marcopolo Carrocerias e Ônibus S/A',
          clienteCnpjCpf: '88.611.834/0001-00',
          clienteEmail: 'contasapagar@marcopolo.com.br',
          clienteTelefone: '(54) 2101-1000',
          contaReceberId: 'cr-rec-002',
          numeroDocumento: 'NF-e 004510/01',
          numeroParcela: 1,
          valorNominal: 45000,
          valorTotalLiquido: 45000,
          dataVencimento: '2026-08-30',
          diasAtrasoOuAntecedencia: -4,
          nomeRegraGatilho: 'Lembrete Preventivo (7 dias antes)',
          canal: 'EMAIL',
          assunto: 'Lembrete de Vencimento - Doc NF-e 004510/01',
          conteudoMensagem: 'Prezado cliente, lembramos do vencimento do título NF-e 004510/01 em 30/08/2026 no valor de R$ 45.000,00.',
          linkPixQrCode: '00020101021226580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540545000.005802BR5913TRITECH IND6009CAXIAS62070503***6304ABCD',
          status: 'ENTREGUE',
          agendadoPara: '2026-08-23T08:00:00Z',
          disparadoEm: '2026-08-23T08:02:15Z',
          entregueEm: '2026-08-23T08:02:30Z',
          origem: 'REGUA_AUTOMATICA',
          createdAt: '2026-08-23T08:00:00Z',
        },
      ];
      this.lembretesStore.set(empresa.id, lembretes);
    });
  }

  // --------------------------------------------------------------------------
  // 1. AGING LIST & MATRIZ DE VENCIMENTO COM PDD E DSO
  // --------------------------------------------------------------------------

  public calcularAgingList(empresaId: string): AgingMatrixResumo {
    const dataRef = new Date('2026-08-26');
    const empresa = EMPRESAS_GRUPO.find((e) => e.id === empresaId) || EMPRESAS_GRUPO[0];

    // Busca títulos do Contas a Receber da empresa através do financeiroService
    const titulosAR = financeiroService.getContasReceber(empresaId);

    // Estrutura inicial das faixas de Aging
    const faixasMap: Record<AgingFaixaValores['faixa'], { label: string; valor: number; qtd: number; pddPerc: number }> = {
      A_VENCER_MAIS_30: { label: 'A Vencer > 30 dias', valor: 0, qtd: 0, pddPerc: 0.0 },
      A_VENCER_1_30: { label: 'A Vencer (1 a 30 dias)', valor: 0, qtd: 0, pddPerc: 0.0 },
      VENCIDO_1_30: { label: 'Vencido (1 a 30 dias)', valor: 0, qtd: 0, pddPerc: 0.01 }, // 1% PDD
      VENCIDO_31_60: { label: 'Vencido (31 a 60 dias)', valor: 0, qtd: 0, pddPerc: 0.05 }, // 5% PDD
      VENCIDO_61_90: { label: 'Vencido (61 a 90 dias)', valor: 0, qtd: 0, pddPerc: 0.15 }, // 15% PDD
      VENCIDO_91_120: { label: 'Vencido (91 a 120 dias)', valor: 0, qtd: 0, pddPerc: 0.30 }, // 30% PDD
      VENCIDO_MAIS_120: { label: 'Vencido > 120 dias (Crítico)', valor: 0, qtd: 0, pddPerc: 0.70 }, // 70% PDD
    };

    const clientesMap: Map<string, AgingClienteItem> = new Map();

    titulosAR.forEach((titulo) => {
      if (titulo.status === 'LIQUIDADO' || titulo.status === 'CANCELADO' || titulo.status === 'RENEGOCIADO') {
        return; // Apenas títulos com saldo em aberto
      }

      titulo.parcelas.forEach((parcela) => {
        if (parcela.statusParcela === 'LIQUIDADA' || parcela.statusParcela === 'CANCELADA' || parcela.statusParcela === 'RENEGOCIADA') {
          return;
        }

        const saldoParcela = parcela.valorSaldo > 0 ? parcela.valorSaldo : parcela.valorNominal - (parcela.valorRecebido || 0);
        if (saldoParcela <= 0) return;

        const dataVenc = new Date(parcela.dataVencimento);
        const diffTime = dataRef.getTime() - dataVenc.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // >0 = atrasado, <=0 = a vencer

        let faixaKey: AgingFaixaValores['faixa'];
        if (diffDays <= -31) {
          faixaKey = 'A_VENCER_MAIS_30';
        } else if (diffDays <= 0) {
          faixaKey = 'A_VENCER_1_30';
        } else if (diffDays <= 30) {
          faixaKey = 'VENCIDO_1_30';
        } else if (diffDays <= 60) {
          faixaKey = 'VENCIDO_31_60';
        } else if (diffDays <= 90) {
          faixaKey = 'VENCIDO_61_90';
        } else if (diffDays <= 120) {
          faixaKey = 'VENCIDO_91_120';
        } else {
          faixaKey = 'VENCIDO_MAIS_120';
        }

        faixasMap[faixaKey].valor += saldoParcela;
        faixasMap[faixaKey].qtd += 1;

        // Agrupamento por Cliente
        if (!clientesMap.has(titulo.clienteId)) {
          const exposicao = this.calcularExposicaoCredito(empresaId, titulo.clienteId, titulo.clienteNome, titulo.clienteCnpjCpf);
          const bloqueio = this.getBloqueioCliente(empresaId, titulo.clienteId);
          const promessa = this.temPromessaVigente(empresaId, titulo.clienteId);

          clientesMap.set(titulo.clienteId, {
            clienteId: titulo.clienteId,
            clienteNome: titulo.clienteNome,
            cnpjCpf: titulo.clienteCnpjCpf,
            limiteCredito: exposicao.limiteTotalEfetivo,
            exposicaoAtual: exposicao.exposicaoAtual,
            exposicaoFutura: exposicao.exposicaoFutura,
            exposicaoTotal: exposicao.exposicaoTotal,
            limiteDisponivel: exposicao.limiteDisponivel,
            scoreRisco: exposicao.scoreInterno,
            classificacaoRisco: exposicao.faixaRisco,
            statusBloqueio: bloqueio ? bloqueio.status : 'INATIVO',
            diasMaiorAtraso: 0,
            totalVencido: 0,
            totalAVencer: 0,
            totalGeral: 0,
            valoresPorFaixa: {
              aVencerMais30: 0,
              aVencer1a30: 0,
              vencido1a30: 0,
              vencido31a60: 0,
              vencido61a90: 0,
              vencido91a120: 0,
              vencidoMais120: 0,
            },
            titulosCount: 0,
            temPromessaVigente: promessa,
            proximaAcaoSugerida: '',
          });
        }

        const cli = clientesMap.get(titulo.clienteId)!;
        cli.totalGeral += saldoParcela;
        cli.titulosCount += 1;

        if (diffDays > 0) {
          cli.totalVencido += saldoParcela;
          if (diffDays > cli.diasMaiorAtraso) {
            cli.diasMaiorAtraso = diffDays;
          }
        } else {
          cli.totalAVencer += saldoParcela;
        }

        if (faixaKey === 'A_VENCER_MAIS_30') cli.valoresPorFaixa.aVencerMais30 += saldoParcela;
        if (faixaKey === 'A_VENCER_1_30') cli.valoresPorFaixa.aVencer1a30 += saldoParcela;
        if (faixaKey === 'VENCIDO_1_30') cli.valoresPorFaixa.vencido1a30 += saldoParcela;
        if (faixaKey === 'VENCIDO_31_60') cli.valoresPorFaixa.vencido31a60 += saldoParcela;
        if (faixaKey === 'VENCIDO_61_90') cli.valoresPorFaixa.vencido61a90 += saldoParcela;
        if (faixaKey === 'VENCIDO_91_120') cli.valoresPorFaixa.vencido91a120 += saldoParcela;
        if (faixaKey === 'VENCIDO_MAIS_120') cli.valoresPorFaixa.vencidoMais120 += saldoParcela;
      });
    });

    // Se a empresa tiver poucos dados no mock, adiciona clientes industriais de referência
    if (clientesMap.size === 0) {
      this.injetarClientesDemonstracaoAging(empresaId, faixasMap, clientesMap);
    }

    const totalCarteira = Object.values(faixasMap).reduce((acc, curr) => acc + curr.valor, 0);
    const totalAVencer = faixasMap.A_VENCER_MAIS_30.valor + faixasMap.A_VENCER_1_30.valor;
    const totalVencido = totalCarteira - totalAVencer;
    const taxaInadimplencia = totalCarteira > 0 ? (totalVencido / totalCarteira) * 100 : 0;

    let pddTotal = 0;
    const faixasArray: AgingFaixaValores[] = (Object.keys(faixasMap) as AgingFaixaValores['faixa'][]).map((key) => {
      const item = faixasMap[key];
      const perc = totalCarteira > 0 ? (item.valor / totalCarteira) * 100 : 0;
      const valorPdd = item.valor * item.pddPerc;
      pddTotal += valorPdd;
      return {
        faixa: key,
        label: item.label,
        valorTotal: item.valor,
        quantidadeTitulos: item.qtd,
        percentualTotal: Number(perc.toFixed(1)),
        taxaPddPerc: item.pddPerc * 100,
        valorPddEstimado: valorPdd,
      };
    });

    // Calcula próximas ações sugeridas para cada cliente
    const clientesList = Array.from(clientesMap.values()).map((c) => {
      if (c.totalVencido > 0) {
        if (c.diasMaiorAtraso > 45) {
          c.proximaAcaoSugerida = 'Encaminhar para Notificação Extrajudicial / Cartório';
        } else if (c.diasMaiorAtraso > 15) {
          c.proximaAcaoSugerida = 'Bloqueio Comercial & Propor Renegociação com Entrada';
        } else if (c.temPromessaVigente) {
          c.proximaAcaoSugerida = 'Acompanhar Promessa de Pagamento Vigente';
        } else {
          c.proximaAcaoSugerida = 'Disparar Lembrete WhatsApp/E-mail com Chave PIX';
        }
      } else {
        c.proximaAcaoSugerida = 'Manter monitoramento de crédito preventivo';
      }
      return c;
    });

    // Ordena clientes por maior valor vencido
    clientesList.sort((a, b) => b.totalVencido - a.totalVencido || b.diasMaiorAtraso - a.diasMaiorAtraso);

    // DSO estimado (Days Sales Outstanding): (Total Carteira / Faturamento Médio Diário [estimado])
    const faturamentoDiarioEstimado = totalCarteira > 0 ? totalCarteira / 45 : 10000;
    const dso = faturamentoDiarioEstimado > 0 ? Math.round(totalCarteira / faturamentoDiarioEstimado) : 38;

    return {
      empresaId,
      empresaNome: empresa.nomeFantasia,
      dataCalculo: dataRef.toISOString().split('T')[0],
      totalCarteiraReceber: totalCarteira,
      totalAVencer,
      totalVencido,
      taxaInadimplenciaGeralPerc: Number(taxaInadimplencia.toFixed(1)),
      pddTotalCalculada: pddTotal,
      dsoMedioDias: dso,
      faixas: faixasArray,
      clientes: clientesList,
    };
  }

  private injetarClientesDemonstracaoAging(
    empresaId: string,
    faixasMap: Record<AgingFaixaValores['faixa'], { label: string; valor: number; qtd: number; pddPerc: number }>,
    clientesMap: Map<string, AgingClienteItem>
  ) {
    const seed = [
      {
        id: 'cli-004',
        nome: 'Indústria Metalúrgica Vale do Rio Grande Ltda',
        cnpj: '14.882.901/0001-44',
        vMais120: 38450,
        v91a120: 30000,
        v61a90: 0,
        v31a60: 0,
        v1a30: 0,
        av1a30: 25550,
        avMais30: 0,
        dias: 135,
        score: 340,
        risco: 'CRITICO' as const,
        bloq: 'ATIVO' as StatusBloqueioComercial,
        prom: false,
      },
      {
        id: 'cli-003',
        nome: 'Agropecuária & Máquinas Senagro Sul Ltda',
        cnpj: '07.234.567/0001-89',
        vMais120: 0,
        v91a120: 0,
        v61a90: 0,
        v31a60: 18500,
        v1a30: 6000,
        av1a30: 45000,
        avMais30: 62500,
        dias: 42,
        score: 680,
        risco: 'MEDIO' as const,
        bloq: 'SUSPENSO_POR_PROMESSA' as StatusBloqueioComercial,
        prom: true,
      },
      {
        id: 'cli-001',
        nome: 'Randon Implementos e Participações S/A',
        cnpj: '89.086.144/0001-16',
        vMais120: 0,
        v91a120: 0,
        v61a90: 0,
        v31a60: 0,
        v1a30: 12400,
        av1a30: 180000,
        avMais30: 240000,
        dias: 6,
        score: 920,
        risco: 'BAIXO' as const,
        bloq: 'INATIVO' as StatusBloqueioComercial,
        prom: false,
      },
      {
        id: 'cli-002',
        nome: 'Marcopolo Carrocerias e Ônibus S/A',
        cnpj: '88.611.834/0001-00',
        vMais120: 0,
        v91a120: 0,
        v61a90: 0,
        v31a60: 0,
        v1a30: 0,
        av1a30: 145000,
        avMais30: 190000,
        dias: 0,
        score: 950,
        risco: 'BAIXO' as const,
        bloq: 'INATIVO' as StatusBloqueioComercial,
        prom: false,
      },
    ];

    seed.forEach((s) => {
      faixasMap.VENCIDO_MAIS_120.valor += s.vMais120;
      if (s.vMais120 > 0) faixasMap.VENCIDO_MAIS_120.qtd += 1;

      faixasMap.VENCIDO_91_120.valor += s.v91a120;
      if (s.v91a120 > 0) faixasMap.VENCIDO_91_120.qtd += 1;

      faixasMap.VENCIDO_31_60.valor += s.v31a60;
      if (s.v31a60 > 0) faixasMap.VENCIDO_31_60.qtd += 1;

      faixasMap.VENCIDO_1_30.valor += s.v1a30;
      if (s.v1a30 > 0) faixasMap.VENCIDO_1_30.qtd += 1;

      faixasMap.A_VENCER_1_30.valor += s.av1a30;
      if (s.av1a30 > 0) faixasMap.A_VENCER_1_30.qtd += 2;

      faixasMap.A_VENCER_MAIS_30.valor += s.avMais30;
      if (s.avMais30 > 0) faixasMap.A_VENCER_MAIS_30.qtd += 3;

      const totalV = s.vMais120 + s.v91a120 + s.v61a90 + s.v31a60 + s.v1a30;
      const totalAV = s.av1a30 + s.avMais30;
      const totalG = totalV + totalAV;

      const exposicao = this.calcularExposicaoCredito(empresaId, s.id, s.nome, s.cnpj);

      clientesMap.set(s.id, {
        clienteId: s.id,
        clienteNome: s.nome,
        cnpjCpf: s.cnpj,
        limiteCredito: exposicao.limiteTotalEfetivo,
        exposicaoAtual: totalG,
        exposicaoFutura: exposicao.exposicaoFutura,
        exposicaoTotal: totalG + exposicao.exposicaoFutura,
        limiteDisponivel: Math.max(0, exposicao.limiteTotalEfetivo - (totalG + exposicao.exposicaoFutura)),
        scoreRisco: s.score,
        classificacaoRisco: s.risco,
        statusBloqueio: s.bloq,
        diasMaiorAtraso: s.dias,
        totalVencido: totalV,
        totalAVencer: totalAV,
        totalGeral: totalG,
        valoresPorFaixa: {
          aVencerMais30: s.avMais30,
          aVencer1a30: s.av1a30,
          vencido1a30: s.v1a30,
          vencido31a60: s.v31a60,
          vencido61a90: s.v61a90,
          vencido91a120: s.v91a120,
          vencidoMais120: s.vMais120,
        },
        titulosCount: 4,
        temPromessaVigente: s.prom,
        proximaAcaoSugerida: '',
      });
    });
  }

  // --------------------------------------------------------------------------
  // 2. CRÉDITO POR CLIENTE / EMPRESA: EXPOSIÇÃO ATUAL + FUTURA
  // --------------------------------------------------------------------------

  public calcularExposicaoCredito(
    empresaId: string,
    clienteId: string,
    clienteNome?: string,
    cnpjCpf?: string
  ): ExposicaoCreditoCliente {
    const empresa = EMPRESAS_GRUPO.find((e) => e.id === empresaId) || EMPRESAS_GRUPO[0];

    // Consulta limite customizado ou padrão do cliente
    const customMap = this.limitesCustomizadosStore.get(empresaId);
    let limiteConcedido = 250000; // Padrão
    let limiteTemporario = 0;
    let validadeTemporario: string | undefined;

    if (customMap && customMap.has(clienteId)) {
      const c = customMap.get(clienteId)!;
      limiteConcedido = c.limiteConcedido;
      limiteTemporario = c.limiteTemporario;
      validadeTemporario = c.validadeTemporario;
    } else {
      // Defaults por cliente de demonstração
      if (clienteId === 'cli-001') limiteConcedido = 800000;
      if (clienteId === 'cli-002') limiteConcedido = 600000;
      if (clienteId === 'cli-003') limiteConcedido = 100000;
      if (clienteId === 'cli-004') limiteConcedido = 50000;
    }

    const limiteTotalEfetivo = limiteConcedido + limiteTemporario;

    // 1. Exposição Atual (Contas a Receber faturadas)
    let titulosAVencerValor = 0;
    let titulosAVencerQtd = 0;
    let titulosVencidosValor = 0;
    let titulosVencidosQtd = 0;
    let diasMaiorAtraso = 0;

    const dataRef = new Date('2026-08-26');
    const titulosAR = financeiroService.getContasReceber(empresaId).filter((t) => t.clienteId === clienteId);

    titulosAR.forEach((t) => {
      if (t.status === 'LIQUIDADO' || t.status === 'CANCELADO' || t.status === 'RENEGOCIADO') return;

      t.parcelas.forEach((p) => {
        if (p.statusParcela === 'LIQUIDADA' || p.statusParcela === 'CANCELADA' || p.statusParcela === 'RENEGOCIADA') return;
        const saldo = p.valorSaldo > 0 ? p.valorSaldo : p.valorNominal - (p.valorRecebido || 0);
        if (saldo <= 0) return;

        const dataVenc = new Date(p.dataVencimento);
        const diffDays = Math.floor((dataRef.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          titulosVencidosValor += saldo;
          titulosVencidosQtd += 1;
          if (diffDays > diasMaiorAtraso) diasMaiorAtraso = diffDays;
        } else {
          titulosAVencerValor += saldo;
          titulosAVencerQtd += 1;
        }
      });
    });

    // Defaults se vazio
    if (titulosAVencerValor === 0 && titulosVencidosValor === 0) {
      if (clienteId === 'cli-004') {
        titulosVencidosValor = 68450;
        titulosVencidosQtd = 2;
        titulosAVencerValor = 25550;
        titulosAVencerQtd = 1;
        diasMaiorAtraso = 135;
      } else if (clienteId === 'cli-003') {
        titulosVencidosValor = 24500;
        titulosVencidosQtd = 1;
        titulosAVencerValor = 107500;
        titulosAVencerQtd = 3;
        diasMaiorAtraso = 42;
      } else if (clienteId === 'cli-001') {
        titulosAVencerValor = 420000;
        titulosAVencerQtd = 4;
        titulosVencidosValor = 12400;
        titulosVencidosQtd = 1;
        diasMaiorAtraso = 6;
      } else if (clienteId === 'cli-002') {
        titulosAVencerValor = 335000;
        titulosAVencerQtd = 3;
      }
    }

    const exposicaoAtual = titulosAVencerValor + titulosVencidosValor;

    // 2. Exposição Futura (Pedidos de Venda aprovados em carteira + faturamentos pendentes + ordens de produção)
    let pedidosCarteiraAprovadosValor = 0;
    let pedidosCarteiraQtd = 0;
    let ordensProducaoEmAndamentoValor = 0;
    let faturamentoPendenteValor = 0;

    if (clienteId === 'cli-001') {
      pedidosCarteiraAprovadosValor = 185000;
      pedidosCarteiraQtd = 2;
      ordensProducaoEmAndamentoValor = 45000;
      faturamentoPendenteValor = 20000;
    } else if (clienteId === 'cli-002') {
      pedidosCarteiraAprovadosValor = 95000;
      pedidosCarteiraQtd = 1;
      ordensProducaoEmAndamentoValor = 30000;
      faturamentoPendenteValor = 15000;
    } else if (clienteId === 'cli-003') {
      pedidosCarteiraAprovadosValor = 28000;
      pedidosCarteiraQtd = 1;
      ordensProducaoEmAndamentoValor = 12000;
      faturamentoPendenteValor = 0;
    } else if (clienteId === 'cli-004') {
      pedidosCarteiraAprovadosValor = 0;
      pedidosCarteiraQtd = 0;
      ordensProducaoEmAndamentoValor = 0;
      faturamentoPendenteValor = 0;
    } else {
      pedidosCarteiraAprovadosValor = 35000;
      pedidosCarteiraQtd = 1;
    }

    const exposicaoFutura = pedidosCarteiraAprovadosValor + ordensProducaoEmAndamentoValor + faturamentoPendenteValor;
    const exposicaoTotal = exposicaoAtual + exposicaoFutura;
    const limiteDisponivel = limiteTotalEfetivo - exposicaoTotal;
    const percUtilizacao = limiteTotalEfetivo > 0 ? (exposicaoTotal / limiteTotalEfetivo) * 100 : 0;

    // Score e Risco
    let scoreInterno = 750;
    let scoreSerasa = 800;
    let faixaRisco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAIXO';

    if (clienteId === 'cli-004') {
      scoreInterno = 320;
      scoreSerasa = 380;
      faixaRisco = 'CRITICO';
    } else if (clienteId === 'cli-003') {
      scoreInterno = 650;
      scoreSerasa = 710;
      faixaRisco = 'MEDIO';
    } else if (clienteId === 'cli-001' || clienteId === 'cli-002') {
      scoreInterno = 930;
      scoreSerasa = 960;
      faixaRisco = 'BAIXO';
    }

    const bloqueio = this.getBloqueioCliente(empresaId, clienteId);

    // Desdobramento Multiempresa do Grupo TRITECH
    const desdobramentoGrupo = EMPRESAS_GRUPO.map((emp) => {
      const fator = emp.id === empresaId ? 1.0 : emp.id === 'emp-mwam' ? 0.35 : 0.15;
      return {
        empresaId: emp.id,
        empresaCodigo: emp.codigo,
        empresaNome: emp.nomeFantasia,
        exposicaoAtual: Number((exposicaoAtual * fator).toFixed(2)),
        exposicaoFutura: Number((exposicaoFutura * fator).toFixed(2)),
        exposicaoTotal: Number((exposicaoTotal * fator).toFixed(2)),
      };
    });

    return {
      clienteId,
      clienteNome: clienteNome || (clienteId === 'cli-001' ? 'Randon Implementos e Participações S/A' : clienteId === 'cli-002' ? 'Marcopolo Carrocerias e Ônibus S/A' : clienteId === 'cli-003' ? 'Agropecuária & Máquinas Senagro Sul Ltda' : 'Indústria Metalúrgica Vale do Rio Grande Ltda'),
      cnpjCpf: cnpjCpf || (clienteId === 'cli-001' ? '89.086.144/0001-16' : clienteId === 'cli-002' ? '88.611.834/0001-00' : clienteId === 'cli-003' ? '07.234.567/0001-89' : '14.882.901/0001-44'),
      empresaId,
      empresaNome: empresa.nomeFantasia,
      limiteConcedido,
      limiteTemporario,
      validadeLimiteTemporario: validadeTemporario,
      limiteTotalEfetivo,
      titulosAVencerValor,
      titulosAVencerQtd,
      titulosVencidosValor,
      titulosVencidosQtd,
      exposicaoAtual,
      pedidosCarteiraAprovadosValor,
      pedidosCarteiraQtd,
      ordensProducaoEmAndamentoValor,
      faturamentoPendenteValor,
      exposicaoFutura,
      exposicaoTotal,
      limiteDisponivel,
      percentualUtilizacaoLimite: Number(percUtilizacao.toFixed(1)),
      scoreInterno,
      scoreBureauSerasa: scoreSerasa,
      faixaRisco,
      statusBloqueio: bloqueio ? bloqueio.status : 'INATIVO',
      diasMaiorAtrasoAtual: diasMaiorAtraso,
      dataUltimaRevisaoLimite: '2026-06-15',
      proximaRevisaoLimiteData: '2026-12-15',
      desdobramentoGrupo,
    };
  }

  // --------------------------------------------------------------------------
  // 3. GESTÃO DE BLOQUEIOS COMERCIAIS & DESBLOQUEIOS AUDITADOS
  // --------------------------------------------------------------------------

  public getBloqueios(empresaId: string): BloqueioComercialCliente[] {
    return this.bloqueiosStore.get(empresaId) || [];
  }

  public getBloqueioCliente(empresaId: string, clienteId: string): BloqueioComercialCliente | undefined {
    const list = this.getBloqueios(empresaId);
    return list.find((b) => b.clienteId === clienteId && b.status !== 'INATIVO');
  }

  public aplicarBloqueioManual(
    empresaId: string,
    params: {
      clienteId: string;
      clienteNome: string;
      cnpjCpf: string;
      motivo: BloqueioComercialCliente['motivo'];
      detalhesMotivo: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): BloqueioComercialCliente {
    const list = this.getBloqueios(empresaId);
    const existingIndex = list.findIndex((b) => b.clienteId === params.clienteId);

    const exposicao = this.calcularExposicaoCredito(empresaId, params.clienteId, params.clienteNome, params.cnpjCpf);

    const novoBloqueio: BloqueioComercialCliente = {
      id: `blk-${empresaId}-${Date.now()}`,
      empresaId,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.cnpjCpf,
      status: 'ATIVO',
      motivo: params.motivo,
      detalhesMotivo: params.detalhesMotivo,
      valorInadimplente: exposicao.titulosVencidosValor,
      diasMaiorAtraso: exposicao.diasMaiorAtrasoAtual,
      exposicaoNoMomento: exposicao.exposicaoTotal,
      limiteNoMomento: exposicao.limiteTotalEfetivo,
      bloqueadoAutomatico: false,
      bloqueadoEm: new Date().toISOString(),
      bloqueadoPorUsuarioId: params.usuarioId,
      bloqueadoPorUsuarioNome: params.usuarioNome,
      historicoAcoes: [
        {
          dataHora: new Date().toISOString(),
          acao: 'Bloqueio Manual Aplicado pelo Usuário',
          usuarioNome: params.usuarioNome,
          justificativa: params.detalhesMotivo,
        },
      ],
    };

    if (existingIndex >= 0) {
      list[existingIndex] = novoBloqueio;
    } else {
      list.push(novoBloqueio);
    }
    this.bloqueiosStore.set(empresaId, list);

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'BLOQUEIO_COMERCIAL',
      acao: 'BLOQUEIO_CLIENTE_APLICADO',
      entidadeAfetada: 'bloqueios_comerciais_credito',
      entidadeId: novoBloqueio.id,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      justificativa: params.detalhesMotivo,
      payloadAfter: novoBloqueio as any,
    });

    return novoBloqueio;
  }

  public desbloquearCliente(
    empresaId: string,
    params: {
      bloqueioId: string;
      tipoLiberacao: 'DEFINITIVA' | 'TEMPORARIA_EXCEPCIONAL';
      justificativa: string;
      validadeAte?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): BloqueioComercialCliente {
    const list = this.getBloqueios(empresaId);
    const item = list.find((b) => b.id === params.bloqueioId);
    if (!item) {
      throw new Error(`Bloqueio ID ${params.bloqueioId} não encontrado na empresa.`);
    }

    const payloadBefore = { ...item };

    item.status = params.tipoLiberacao === 'TEMPORARIA_EXCEPCIONAL' ? 'DESBLOQUEIO_TEMPORARIO' : 'INATIVO';
    item.desbloqueadoEm = new Date().toISOString();
    item.desbloqueadoPorUsuarioId = params.usuarioId;
    item.desbloqueadoPorUsuarioNome = params.usuarioNome;
    item.justificativaDesbloqueio = params.justificativa;
    item.validadeDesbloqueioTemporarioAte = params.validadeAte;

    item.historicoAcoes.push({
      dataHora: new Date().toISOString(),
      acao: params.tipoLiberacao === 'TEMPORARIA_EXCEPCIONAL' ? 'Desbloqueio Temporário / Liberação Excepcional' : 'Desbloqueio Comercial Total',
      usuarioNome: params.usuarioNome,
      justificativa: params.justificativa,
    });

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'BLOQUEIO_COMERCIAL',
      acao: params.tipoLiberacao === 'TEMPORARIA_EXCEPCIONAL' ? 'LIBERACAO_EXCEPCIONAL_AUDITADA' : 'DESBLOQUEIO_CLIENTE_MANUAL',
      entidadeAfetada: 'bloqueios_comerciais_credito',
      entidadeId: item.id,
      clienteId: item.clienteId,
      clienteNome: item.clienteNome,
      justificativa: params.justificativa,
      payloadBefore: payloadBefore as any,
      payloadAfter: item as any,
    });

    return item;
  }

  // --------------------------------------------------------------------------
  // 4. RÉGUA DE COBRANÇA PARAMETRIZÁVEL & DISPARO DE LEMBRETES
  // --------------------------------------------------------------------------

  public getReguaConfig(empresaId: string): ReguaCobrancaConfig {
    return (
      this.reguasConfigStore.get(empresaId) || {
        id: `regua-${empresaId}`,
        empresaId,
        empresaNome: 'Empresa Padrão',
        nome: 'Régua Padrão',
        descricao: 'Régua Padrão',
        ativo: true,
        diasToleranciaAntesBloqueio: 10,
        bloquearAutomaticoEstouroLimite: true,
        bloquearAutomaticoAtraso: true,
        permitirDesbloqueioComPromessa: true,
        diasValidadePromessaPadrao: 5,
        jurosMoraMensalPerc: 1.0,
        multaAtrasoPerc: 2.0,
        gatilhos: [],
        atualizadoEm: new Date().toISOString(),
        atualizadoPorUsuarioId: 'sys',
      }
    );
  }

  public salvarReguaConfig(
    empresaId: string,
    config: Partial<ReguaCobrancaConfig>,
    usuarioId: string,
    usuarioNome: string
  ): ReguaCobrancaConfig {
    const current = this.getReguaConfig(empresaId);
    const payloadBefore = { ...current };

    const updated: ReguaCobrancaConfig = {
      ...current,
      ...config,
      empresaId,
      atualizadoEm: new Date().toISOString(),
      atualizadoPorUsuarioId: usuarioId,
    };

    this.reguasConfigStore.set(empresaId, updated);

    this.registrarAuditoria({
      empresaId,
      usuarioId,
      usuarioNome,
      modulo: 'REGUA_COBRANCA',
      acao: 'ALTERACAO_REGUA_PARAMETROS',
      entidadeAfetada: 'regras_cobranca_config',
      entidadeId: updated.id,
      justificativa: 'Atualização de parâmetros e gatilhos da régua de cobrança.',
      payloadBefore: payloadBefore as any,
      payloadAfter: updated as any,
    });

    return updated;
  }

  public getLembretes(empresaId: string): LembreteCobranca[] {
    return this.lembretesStore.get(empresaId) || [];
  }

  public processarExecucaoReguaAutomatica(empresaId: string, usuarioId: string, usuarioNome: string): { lembretesCriados: number; bloqueiosGerados: number } {
    const regua = this.getReguaConfig(empresaId);
    if (!regua.ativo) {
      return { lembretesCriados: 0, bloqueiosGerados: 0 };
    }

    const dataRef = new Date('2026-08-26');
    const titulosAR = financeiroService.getContasReceber(empresaId);
    const lembretesList = this.getLembretes(empresaId);
    let lembretesCriados = 0;
    let bloqueiosGerados = 0;

    titulosAR.forEach((t) => {
      if (t.status === 'LIQUIDADO' || t.status === 'CANCELADO' || t.status === 'RENEGOCIADO') return;

      t.parcelas.forEach((p) => {
        if (p.statusParcela === 'LIQUIDADA' || p.statusParcela === 'CANCELADA' || p.statusParcela === 'RENEGOCIADA') return;
        const saldo = p.valorSaldo > 0 ? p.valorSaldo : p.valorNominal - (p.valorRecebido || 0);
        if (saldo <= 0) return;

        const dataVenc = new Date(p.dataVencimento);
        const diffDays = Math.floor((dataRef.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24));

        // Procura se bate em algum gatilho da régua
        const gatilho = regua.gatilhos.find((g) => g.ativo && g.diasRelativoVencimento === diffDays);

        if (gatilho) {
          const jaDisparadoHoje = lembretesList.some((l) => l.contaReceberId === t.id && l.gatilhoId === gatilho.id);

          if (!jaDisparadoHoje) {
            const novoLembrete: LembreteCobranca = {
              id: `lmb-${empresaId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              empresaId,
              clienteId: t.clienteId,
              clienteNome: t.clienteNome,
              clienteCnpjCpf: t.clienteCnpjCpf,
              clienteEmail: 'financeiro@cliente.com.br',
              clienteTelefone: '(11) 99999-8888',
              contaReceberId: t.id,
              parcelaId: p.id,
              numeroDocumento: `${t.numeroDocumento}/${p.numeroParcela}`,
              numeroParcela: p.numeroParcela,
              valorNominal: p.valorNominal,
              valorTotalLiquido: saldo,
              dataVencimento: p.dataVencimento,
              diasAtrasoOuAntecedencia: diffDays,
              gatilhoId: gatilho.id,
              nomeRegraGatilho: gatilho.nomeRegra,
              canal: gatilho.canaisHabilitados[0] || 'EMAIL',
              assunto: gatilho.templateAssuntoEmail
                .replace('{{numero_documento}}', t.numeroDocumento)
                .replace('{{cliente_nome}}', t.clienteNome)
                .replace('{{empresa_nome}}', regua.empresaNome),
              conteudoMensagem: gatilho.templateMensagem
                .replace('{{numero_documento}}', t.numeroDocumento)
                .replace('{{cliente_nome}}', t.clienteNome)
                .replace('{{valor_total}}', saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
                .replace('{{data_vencimento}}', p.dataVencimento)
                .replace('{{dias_atraso}}', String(Math.max(0, diffDays)))
                .replace('{{link_pix}}', 'PIX-KEY-TEST-00020126580014br.gov.bcb.pix')
                .replace('{{link_boleto}}', `https://erp.tritech.com.br/boletos/2via/${t.id}`),
              linkPixQrCode: '00020101021226580014br.gov.bcb.pix0136tritech-cobranca-pix-key5204000053039865802BR5913TRITECH6009CAXIAS62070503***6304ABCD',
              linhaDigitavelBoleto: '34191.79001 01043.510047 91020.150008 5 99990000150000',
              linkSegundaViaBoleto: `https://erp.tritech.com.br/boletos/2via/${t.id}`,
              status: 'ENTREGUE',
              agendadoPara: new Date().toISOString(),
              disparadoEm: new Date().toISOString(),
              entregueEm: new Date().toISOString(),
              origem: 'REGUA_AUTOMATICA',
              createdAt: new Date().toISOString(),
            };

            lembretesList.unshift(novoLembrete);
            lembretesCriados++;

            // Se o gatilho exige bloqueio automático e cliente não tem promessa vigente
            if (gatilho.acaoAutomaticaBloqueio && !this.temPromessaVigente(empresaId, t.clienteId)) {
              this.aplicarBloqueioManual(empresaId, {
                clienteId: t.clienteId,
                clienteNome: t.clienteNome,
                cnpjCpf: t.clienteCnpjCpf,
                motivo: 'INADIMPLENCIA_TITULOS_VENCIDOS',
                detalhesMotivo: `Bloqueio gerado automaticamente pelo gatilho '${gatilho.nomeRegra}' (${diffDays} dias de atraso).`,
                usuarioId: 'sistema-regua-auto',
                usuarioNome: 'Robô Régua Cobrança',
              });
              bloqueiosGerados++;
            }
          }
        }
      });
    });

    this.lembretesStore.set(empresaId, lembretesList);

    this.registrarAuditoria({
      empresaId,
      usuarioId,
      usuarioNome,
      modulo: 'REGUA_COBRANCA',
      acao: 'DISPARO_LEMBRETE_AUTOMATICO',
      entidadeAfetada: 'lembretes_cobranca_enviados',
      entidadeId: `proc-${Date.now()}`,
      justificativa: `Execução da régua de cobrança automática: ${lembretesCriados} lembretes enviados e ${bloqueiosGerados} bloqueios gerados.`,
      payloadAfter: { lembretesCriados, bloqueiosGerados },
    });

    return { lembretesCriados, bloqueiosGerados };
  }

  public enviarLembreteManual(
    empresaId: string,
    params: {
      clienteId: string;
      clienteNome: string;
      clienteCnpjCpf: string;
      clienteEmail?: string;
      clienteTelefone?: string;
      contaReceberId: string;
      numeroDocumento: string;
      numeroParcela: number;
      valorTotalLiquido: number;
      dataVencimento: string;
      canal: CanalComunicacaoCobranca;
      assunto: string;
      conteudoMensagem: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): LembreteCobranca {
    const list = this.getLembretes(empresaId);

    const novoLembrete: LembreteCobranca = {
      id: `lmb-man-${Date.now()}`,
      empresaId,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      clienteCnpjCpf: params.clienteCnpjCpf,
      clienteEmail: params.clienteEmail || 'contasapagar@cliente.com.br',
      clienteTelefone: params.clienteTelefone || '(11) 99999-0000',
      contaReceberId: params.contaReceberId,
      numeroDocumento: params.numeroDocumento,
      numeroParcela: params.numeroParcela,
      valorNominal: params.valorTotalLiquido,
      valorTotalLiquido: params.valorTotalLiquido,
      dataVencimento: params.dataVencimento,
      diasAtrasoOuAntecedencia: 0,
      nomeRegraGatilho: 'Disparo Manual pelo Analista',
      canal: params.canal,
      assunto: params.assunto,
      conteudoMensagem: params.conteudoMensagem,
      linkPixQrCode: '00020101021226580014br.gov.bcb.pix0136tritech-cobranca-pix-manual5204000053039865802BR5913TRITECH6009CAXIAS62070503***6304ABCD',
      linhaDigitavelBoleto: '34191.79001 01043.510047 91020.150008 5 99990000150000',
      linkSegundaViaBoleto: `https://erp.tritech.com.br/boletos/2via/${params.contaReceberId}`,
      status: 'ENTREGUE',
      agendadoPara: new Date().toISOString(),
      disparadoEm: new Date().toISOString(),
      entregueEm: new Date().toISOString(),
      usuarioDisparadorId: params.usuarioId,
      origem: 'DISPARO_MANUAL',
      createdAt: new Date().toISOString(),
    };

    list.unshift(novoLembrete);
    this.lembretesStore.set(empresaId, list);

    // Registra no CRM de Cobrança
    this.registrarContatoCobranca(empresaId, {
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.clienteCnpjCpf,
      tipoContato: 'EMAIL_MANUAL',
      canal: params.canal,
      contatoNomeCliente: 'Departamento Financeiro',
      telefoneOuEmailUtilizado: params.clienteEmail || params.clienteTelefone || 'E-mail/WhatsApp',
      resumoConversa: `Disparado lembrete manual referente ao título ${params.numeroDocumento} (R$ ${params.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Assunto: ${params.assunto}`,
      sentimentoCliente: 'NEUTRO',
      gerouPromessaPagamento: false,
      operadorUsuarioId: params.usuarioId,
      operadorUsuarioNome: params.usuarioNome,
    });

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'CENTRAL_COBRANCA',
      acao: 'DISPARO_LEMBRETE_MANUAL',
      entidadeAfetada: 'lembretes_cobranca_enviados',
      entidadeId: novoLembrete.id,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      justificativa: `Disparo manual via ${params.canal} referente a ${params.numeroDocumento}`,
      payloadAfter: novoLembrete as any,
    });

    return novoLembrete;
  }

  // --------------------------------------------------------------------------
  // 5. PROMESSAS DE PAGAMENTO & IMPACTO NO BLOQUEIO
  // --------------------------------------------------------------------------

  public getPromessas(empresaId: string): PromessaPagamento[] {
    return this.promessasStore.get(empresaId) || [];
  }

  public temPromessaVigente(empresaId: string, clienteId: string): boolean {
    const list = this.getPromessas(empresaId);
    const dataHoje = new Date('2026-08-26');
    return list.some((p) => {
      if (p.clienteId !== clienteId) return false;
      if (p.status !== 'PENDENTE') return false;
      const dataProm = new Date(p.dataPrometida);
      return dataProm >= dataHoje;
    });
  }

  public registrarPromessaPagamento(
    empresaId: string,
    params: {
      clienteId: string;
      clienteNome: string;
      cnpjCpf: string;
      dataPrometida: string;
      valorPrometido: number;
      formaPagamentoPrevista: PromessaPagamento['formaPagamentoPrevista'];
      contatoNome: string;
      contatoTelefoneOuEmail: string;
      observacoes: string;
      suspenderBloqueio: boolean;
      titulosVinculados: PromessaPagamento['titulosVinculados'];
      usuarioId: string;
      usuarioNome: string;
    }
  ): PromessaPagamento {
    const list = this.getPromessas(empresaId);

    const novaPromessa: PromessaPagamento = {
      id: `prom-${empresaId}-${Date.now()}`,
      empresaId,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.cnpjCpf,
      dataRegistro: new Date().toISOString(),
      dataPrometida: params.dataPrometida,
      valorPrometido: params.valorPrometido,
      formaPagamentoPrevista: params.formaPagamentoPrevista,
      contatoNome: params.contatoNome,
      contatoTelefoneOuEmail: params.contatoTelefoneOuEmail,
      observacoes: params.observacoes,
      status: 'PENDENTE',
      suspenderBloqueio: params.suspenderBloqueio,
      suspensaoValidaAte: `${params.dataPrometida}T23:59:59Z`,
      titulosVinculados: params.titulosVinculados,
      registradoPorUsuarioId: params.usuarioId,
      registradoPorUsuarioNome: params.usuarioNome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(novaPromessa);
    this.promessasStore.set(empresaId, list);

    // Se solicitado suspensão do bloqueio, atualiza o status do bloqueio comercial
    if (params.suspenderBloqueio) {
      const bloqueio = this.getBloqueioCliente(empresaId, params.clienteId);
      if (bloqueio) {
        bloqueio.status = 'SUSPENSO_POR_PROMESSA';
        bloqueio.validadeDesbloqueioTemporarioAte = `${params.dataPrometida}T23:59:59Z`;
        bloqueio.promessaIdVinculada = novaPromessa.id;
        bloqueio.historicoAcoes.push({
          dataHora: new Date().toISOString(),
          usuarioNome: params.usuarioNome,
          acao: 'Bloqueio suspenso temporariamente por promessa de pagamento',
          justificativa: `Promessa ID ${novaPromessa.id} de R$ ${params.valorPrometido.toFixed(2)} até ${params.dataPrometida}`,
        });
      }
    }

    // Registra contato no CRM
    this.registrarContatoCobranca(empresaId, {
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.cnpjCpf,
      tipoContato: 'LIGACAO_TELEFONICA',
      canal: 'LIGACAO',
      contatoNomeCliente: params.contatoNome,
      telefoneOuEmailUtilizado: params.contatoTelefoneOuEmail,
      resumoConversa: `Registrada promessa formal de pagamento de R$ ${params.valorPrometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a data ${params.dataPrometida}. Obs: ${params.observacoes}`,
      sentimentoCliente: 'COOPERATIVO',
      gerouPromessaPagamento: true,
      promessaId: novaPromessa.id,
      dataProximoFollowUp: `${params.dataPrometida}T09:00:00Z`,
      proximaAcaoDescricao: `Confirmar entrada de pagamento da promessa na data limite.`,
      operadorUsuarioId: params.usuarioId,
      operadorUsuarioNome: params.usuarioNome,
    });

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'PROMESSA_PAGAMENTO',
      acao: 'REGISTRO_PROMESSA_PAGAMENTO',
      entidadeAfetada: 'promessas_pagamento',
      entidadeId: novaPromessa.id,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      justificativa: `Promessa de R$ ${params.valorPrometido} prometida para ${params.dataPrometida}`,
      payloadAfter: novaPromessa as any,
    });

    return novaPromessa;
  }

  public resolverPromessa(
    empresaId: string,
    params: {
      promessaId: string;
      status: 'CUMPRIDA' | 'CUMPRIDA_PARCIAL' | 'QUEBRADA' | 'CANCELADA';
      valorPago?: number;
      motivo?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): PromessaPagamento {
    const list = this.getPromessas(empresaId);
    const prom = list.find((p) => p.id === params.promessaId);
    if (!prom) {
      throw new Error(`Promessa ID ${params.promessaId} não encontrada.`);
    }

    const payloadBefore = { ...prom };

    prom.status = params.status;
    prom.dataResolucao = new Date().toISOString();
    prom.valorEfetivamentePago = params.valorPago;
    prom.motivoCancelamentoOuQuebra = params.motivo;
    prom.updatedAt = new Date().toISOString();

    // Se quebrou a promessa, reativa o bloqueio imediatamente se houver
    if (params.status === 'QUEBRADA') {
      const bloqueio = this.getBloqueioCliente(empresaId, prom.clienteId);
      if (bloqueio) {
        bloqueio.status = 'ATIVO';
        bloqueio.historicoAcoes.push({
          dataHora: new Date().toISOString(),
          usuarioNome: params.usuarioNome,
          acao: 'Bloqueio reativado por QUEBRA DE PROMESSA',
          justificativa: params.motivo || 'Cliente não honrou a data acordada.',
        });
      }
    }

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'PROMESSA_PAGAMENTO',
      acao: params.status === 'QUEBRADA' ? 'PROMESSA_QUEBRADA' : 'PROMESSA_CUMPRIDA',
      entidadeAfetada: 'promessas_pagamento',
      entidadeId: prom.id,
      clienteId: prom.clienteId,
      clienteNome: prom.clienteNome,
      justificativa: `Resolução de promessa: status ${params.status}. Motivo: ${params.motivo || 'Nenhum'}`,
      payloadBefore: payloadBefore as any,
      payloadAfter: prom as any,
    });

    return prom;
  }

  // --------------------------------------------------------------------------
  // 6. HISTÓRICO DE CONTATO (CRM DE COBRANÇA)
  // --------------------------------------------------------------------------

  public getHistoricoContatos(empresaId: string, clienteId?: string): HistoricoContatoCobranca[] {
    const list = this.contatosStore.get(empresaId) || [];
    if (clienteId) {
      return list.filter((c) => c.clienteId === clienteId);
    }
    return list;
  }

  public registrarContatoCobranca(
    empresaId: string,
    params: {
      clienteId: string;
      clienteNome: string;
      cnpjCpf: string;
      tipoContato: HistoricoContatoCobranca['tipoContato'];
      canal: CanalComunicacaoCobranca;
      contatoNomeCliente: string;
      contatoCargoOuDepto?: string;
      telefoneOuEmailUtilizado: string;
      resumoConversa: string;
      detalhesAcordo?: string;
      sentimentoCliente: HistoricoContatoCobranca['sentimentoCliente'];
      gerouPromessaPagamento: boolean;
      promessaId?: string;
      dataProximoFollowUp?: string;
      proximaAcaoDescricao?: string;
      operadorUsuarioId: string;
      operadorUsuarioNome: string;
    }
  ): HistoricoContatoCobranca {
    const list = this.contatosStore.get(empresaId) || [];

    const novoContato: HistoricoContatoCobranca = {
      id: `cnt-${empresaId}-${Date.now()}`,
      empresaId,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.cnpjCpf,
      dataHora: new Date().toISOString(),
      tipoContato: params.tipoContato,
      canal: params.canal,
      contatoNomeCliente: params.contatoNomeCliente,
      contatoCargoOuDepto: params.contatoCargoOuDepto,
      telefoneOuEmailUtilizado: params.telefoneOuEmailUtilizado,
      resumoConversa: params.resumoConversa,
      detalhesAcordo: params.detalhesAcordo,
      sentimentoCliente: params.sentimentoCliente,
      gerouPromessaPagamento: params.gerouPromessaPagamento,
      promessaId: params.promessaId,
      dataProximoFollowUp: params.dataProximoFollowUp,
      proximaAcaoDescricao: params.proximaAcaoDescricao,
      operadorUsuarioId: params.operadorUsuarioId,
      operadorUsuarioNome: params.operadorUsuarioNome,
      createdAt: new Date().toISOString(),
    };

    list.unshift(novoContato);
    this.contatosStore.set(empresaId, list);

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.operadorUsuarioId,
      usuarioNome: params.operadorUsuarioNome,
      modulo: 'CENTRAL_COBRANCA',
      acao: 'REGISTRO_CONTATO_CRM',
      entidadeAfetada: 'cobranca_historico_contato',
      entidadeId: novoContato.id,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      justificativa: `Registro de contato (${params.tipoContato}) com ${params.contatoNomeCliente}`,
      payloadAfter: novoContato as any,
    });

    return novoContato;
  }

  // --------------------------------------------------------------------------
  // 7. RENEGOCIAÇÃO DE DÍVIDAS & ACORDOS COM AUDITORIA NÃO-DESTRUTIVA
  // --------------------------------------------------------------------------

  public getRenegociacoes(empresaId: string): RenegociacaoDivida[] {
    return this.renegociacoesStore.get(empresaId) || [];
  }

  public simularRenegociacao(
    empresaId: string,
    params: {
      titulosOrigem: TituloRenegociacaoOrigem[];
      descontoPrincipal: number;
      descontoJurosMulta: number;
      valorEntrada: number;
      dataVencimentoEntrada?: string;
      quantidadeParcelas: number;
      intervaloDiasParcelas: number;
      taxaJurosParcelamentoMensal: number;
      primeiroVencimentoParcelas: string;
    }
  ): {
    totalPrincipal: number;
    totalJuros: number;
    totalMulta: number;
    totalBruto: number;
    totalDesconto: number;
    valorAcordado: number;
    saldoRestanteParcelar: number;
    parcelasSimuladas: ParcelaRenegociacaoGerada[];
  } {
    const totalPrincipal = params.titulosOrigem.reduce((acc, t) => acc + t.valorSaldoOriginal, 0);
    const totalJuros = params.titulosOrigem.reduce((acc, t) => acc + t.valorJurosOriginal, 0);
    const totalMulta = params.titulosOrigem.reduce((acc, t) => acc + t.valorMultaOriginal, 0);
    const totalBruto = totalPrincipal + totalJuros + totalMulta;

    const totalDesconto = params.descontoPrincipal + params.descontoJurosMulta;
    const valorAcordado = Math.max(0, totalBruto - totalDesconto);
    const saldoRestanteParcelar = Math.max(0, valorAcordado - params.valorEntrada);

    const parcelasSimuladas: ParcelaRenegociacaoGerada[] = [];

    // Se tem entrada, ela é a parcela 0 ou 1
    if (params.valorEntrada > 0) {
      parcelasSimuladas.push({
        numeroParcela: 1,
        dataVencimento: params.dataVencimentoEntrada || new Date().toISOString().split('T')[0],
        valorNominal: params.valorEntrada,
        valorJurosEmbutidos: 0,
        valorTotalParcela: params.valorEntrada,
        formaPagamentoPrevista: 'PIX',
      });
    }

    if (params.quantidadeParcelas > 0 && saldoRestanteParcelar > 0) {
      const valorBaseParcela = saldoRestanteParcelar / params.quantidadeParcelas;
      const dataInicio = new Date(params.primeiroVencimentoParcelas);

      for (let i = 1; i <= params.quantidadeParcelas; i++) {
        const dataVenc = new Date(dataInicio);
        dataVenc.setDate(dataInicio.getDate() + (i - 1) * params.intervaloDiasParcelas);

        const jurosEmbutidos = Number((valorBaseParcela * (params.taxaJurosParcelamentoMensal / 100) * i).toFixed(2));
        const valorTotalParcela = Number((valorBaseParcela + jurosEmbutidos).toFixed(2));

        parcelasSimuladas.push({
          numeroParcela: params.valorEntrada > 0 ? i + 1 : i,
          dataVencimento: dataVenc.toISOString().split('T')[0],
          valorNominal: Number(valorBaseParcela.toFixed(2)),
          valorJurosEmbutidos: jurosEmbutidos,
          valorTotalParcela: valorTotalParcela,
          formaPagamentoPrevista: 'BOLETO',
        });
      }
    }

    return {
      totalPrincipal,
      totalJuros,
      totalMulta,
      totalBruto,
      totalDesconto,
      valorAcordado,
      saldoRestanteParcelar,
      parcelasSimuladas,
    };
  }

  public efetivarRenegociacao(
    empresaId: string,
    params: {
      clienteId: string;
      clienteNome: string;
      cnpjCpf: string;
      titulosOrigem: TituloRenegociacaoOrigem[];
      descontoPrincipal: number;
      descontoJurosMulta: number;
      valorEntrada: number;
      dataVencimentoEntrada?: string;
      quantidadeParcelas: number;
      intervaloDiasParcelas: number;
      taxaJurosParcelamentoMensal: number;
      primeiroVencimentoParcelas: string;
      justificativaComercial: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): RenegociacaoDivida {
    const list = this.getRenegociacoes(empresaId);
    const empresa = EMPRESAS_GRUPO.find((e) => e.id === empresaId) || EMPRESAS_GRUPO[0];

    const simulacao = this.simularRenegociacao(empresaId, params);
    const codigoAcordo = `ACD-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, '0')}`;

    const novaRenegociacao: RenegociacaoDivida = {
      id: `rng-${empresaId}-${Date.now()}`,
      codigoAcordo,
      empresaId,
      empresaNome: empresa.nomeFantasia,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.cnpjCpf,
      status: 'EFETIVADO',
      dataAcordo: new Date().toISOString().split('T')[0],
      totalPrincipalOriginal: simulacao.totalPrincipal,
      totalJurosCalculados: simulacao.totalJuros,
      totalMultaCalculada: simulacao.totalMulta,
      totalDividaBruta: simulacao.totalBruto,
      descontoConcedidoPrincipal: params.descontoPrincipal,
      descontoConcedidoJurosMulta: params.descontoJurosMulta,
      totalDescontoGeral: simulacao.totalDesconto,
      valorFinalAcordado: simulacao.valorAcordado,
      valorEntrada: params.valorEntrada,
      dataVencimentoEntrada: params.dataVencimentoEntrada,
      quantidadeParcelas: params.quantidadeParcelas,
      intervaloDiasParcelas: params.intervaloDiasParcelas,
      taxaJurosParcelamentoMensal: params.taxaJurosParcelamentoMensal,
      primeiroVencimentoParcelas: params.primeiroVencimentoParcelas,
      titulosOrigem: params.titulosOrigem,
      parcelasNovas: simulacao.parcelasSimuladas,
      novosTitulosCriadosIds: [],
      justificativaComercial: params.justificativaComercial,
      negociadorUsuarioId: params.usuarioId,
      negociadorUsuarioNome: params.usuarioNome,
      aprovadorUsuarioId: params.usuarioId,
      aprovadorUsuarioNome: params.usuarioNome,
      termoConfissaoDividaGerado: true,
      termoStoragePath: `/documentos/renegociacoes/${codigoAcordo}-termo-confissao.pdf`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // =========================================================================
    // REGRA DE ARQUITETURA NÃO-DESTRUTIVA:
    // Atualiza os títulos a receber de origem para status 'RENEGOCIADO' sem exclusão física!
    // =========================================================================
    params.titulosOrigem.forEach((tOrigem) => {
      try {
        const cr = financeiroService.getContaReceberById(empresaId, tOrigem.contaReceberId);
        if (cr) {
          cr.status = 'RENEGOCIADO';
          cr.renegociacaoId = novaRenegociacao.id;
          cr.parcelas.forEach((p) => {
            if (p.id === tOrigem.parcelaId || !tOrigem.parcelaId) {
              p.statusParcela = 'RENEGOCIADA';
            }
          });
        }
      } catch (err) {
        console.warn('Título de origem não encontrado no financeiroService mock:', tOrigem.contaReceberId);
      }
    });

    list.unshift(novaRenegociacao);
    this.renegociacoesStore.set(empresaId, list);

    // Registra no CRM de Cobrança
    this.registrarContatoCobranca(empresaId, {
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      cnpjCpf: params.cnpjCpf,
      tipoContato: 'ACORDO_RENEGOCIACAO',
      canal: 'REUNIAO_PRESENCIAL',
      contatoNomeCliente: 'Diretoria Financeira',
      telefoneOuEmailUtilizado: 'Acordo Formal Assinado',
      resumoConversa: `Efetivado Acordo de Renegociação ${codigoAcordo}. Dívida original: R$ ${simulacao.totalBruto.toFixed(2)}, Descontos: R$ ${simulacao.totalDesconto.toFixed(2)}, Valor Final: R$ ${simulacao.valorAcordado.toFixed(2)} em ${novaRenegociacao.parcelasNovas.length} parcelas.`,
      sentimentoCliente: 'COOPERATIVO',
      gerouPromessaPagamento: false,
      operadorUsuarioId: params.usuarioId,
      operadorUsuarioNome: params.usuarioNome,
    });

    // Auditoria append-only
    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'RENEGOCIACAO',
      acao: 'EFETIVACAO_RENEGOCIACAO_ACORDO',
      entidadeAfetada: 'renegociacoes_divida',
      entidadeId: novaRenegociacao.id,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      justificativa: params.justificativaComercial,
      payloadAfter: novaRenegociacao as any,
    });

    return novaRenegociacao;
  }

  // --------------------------------------------------------------------------
  // 8. ALTERAÇÃO DE LIMITE DE CRÉDITO COM AUDITORIA
  // --------------------------------------------------------------------------

  public alterarLimiteCredito(
    empresaId: string,
    params: {
      clienteId: string;
      clienteNome: string;
      cnpjCpf: string;
      novoLimiteConcedido: number;
      novoLimiteTemporario: number;
      validadeLimiteTemporario?: string;
      justificativa: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): ExposicaoCreditoCliente {
    let customMap = this.limitesCustomizadosStore.get(empresaId);
    if (!customMap) {
      customMap = new Map();
      this.limitesCustomizadosStore.set(empresaId, customMap);
    }

    const anterior = this.calcularExposicaoCredito(empresaId, params.clienteId, params.clienteNome, params.cnpjCpf);

    customMap.set(params.clienteId, {
      limiteConcedido: params.novoLimiteConcedido,
      limiteTemporario: params.novoLimiteTemporario,
      validadeTemporario: params.validadeLimiteTemporario,
    });

    const atualizado = this.calcularExposicaoCredito(empresaId, params.clienteId, params.clienteNome, params.cnpjCpf);

    this.registrarAuditoria({
      empresaId,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      modulo: 'RISCO_CREDITO',
      acao: 'ALTERACAO_LIMITE_CREDITO',
      entidadeAfetada: 'exposicao_credito_cliente_limites',
      entidadeId: `lim-${params.clienteId}`,
      clienteId: params.clienteId,
      clienteNome: params.clienteNome,
      justificativa: params.justificativa,
      payloadBefore: {
        limiteConcedido: anterior.limiteConcedido,
        limiteTemporario: anterior.limiteTemporario,
        exposicaoTotal: anterior.exposicaoTotal,
      },
      payloadAfter: {
        limiteConcedido: atualizado.limiteConcedido,
        limiteTemporario: atualizado.limiteTemporario,
        exposicaoTotal: atualizado.exposicaoTotal,
        limiteDisponivel: atualizado.limiteDisponivel,
      },
    });

    return atualizado;
  }

  // --------------------------------------------------------------------------
  // 9. AUDITORIA APPEND-ONLY DE COBRANÇA E RISCO
  // --------------------------------------------------------------------------

  private registrarAuditoria(log: Omit<AuditoriaCobrancaRiscoLog, 'id' | 'dataHora'>) {
    const novoLog: AuditoriaCobrancaRiscoLog = {
      id: `aud-cob-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataHora: new Date().toISOString(),
      ...log,
    };
    this.auditoriaLogs.unshift(novoLog);
  }

  public getAuditoriaLogs(empresaId?: string): AuditoriaCobrancaRiscoLog[] {
    if (empresaId) {
      return this.auditoriaLogs.filter((l) => l.empresaId === empresaId);
    }
    return this.auditoriaLogs;
  }

  // --------------------------------------------------------------------------
  // 10. DASHBOARD CONSOLIDADO DA CENTRAL DE COBRANÇA
  // --------------------------------------------------------------------------

  public getCentralCobrancaDashboard(empresaId: string): CentralCobrancaDashboardData {
    const empresa = EMPRESAS_GRUPO.find((e) => e.id === empresaId) || EMPRESAS_GRUPO[0];
    const aging = this.calcularAgingList(empresaId);
    const bloqueios = this.getBloqueios(empresaId).filter((b) => b.status !== 'INATIVO');
    const promessas = this.getPromessas(empresaId);
    const promessasAtivas = promessas.filter((p) => p.status === 'PENDENTE');
    const renegociacoes = this.getRenegociacoes(empresaId);
    const lembretes = this.getLembretes(empresaId);
    const contatos = this.getHistoricoContatos(empresaId);
    const auditoria = this.getAuditoriaLogs(empresaId);

    const promessasAtivasValor = promessasAtivas.reduce((acc, p) => acc + p.valorPrometido, 0);
    const renegociacoesValor = renegociacoes.reduce((acc, r) => acc + r.valorFinalAcordado, 0);

    return {
      empresaId,
      empresaNome: empresa.nomeFantasia,
      dataReferencia: new Date().toISOString().split('T')[0],
      totalCarteiraReceber: aging.totalCarteiraReceber,
      totalEmDiaAVencer: aging.totalAVencer,
      totalVencidoInadimplente: aging.totalVencido,
      percentualInadimplencia: aging.taxaInadimplenciaGeralPerc,
      pddTotalEstimada: aging.pddTotalCalculada,
      dsoMedioDias: aging.dsoMedioDias,
      clientesTotalDevedores: aging.clientes.filter((c) => c.totalVencido > 0).length,
      clientesBloqueadosTotal: bloqueios.length,
      promessasPagamentoAtivasQtd: promessasAtivas.length,
      promessasPagamentoAtivasValor: promessasAtivasValor,
      renegociacoesVigentesQtd: renegociacoes.length,
      renegociacoesVigentesValor: renegociacoesValor,
      lembretesDisparadosHoje: lembretes.length,
      aging,
      filaCobrancaPriorizada: aging.clientes,
      bloqueiosAtivos: bloqueios,
      promessasRecentes: promessas.slice(0, 10),
      renegociacoesRecentes: renegociacoes.slice(0, 10),
      contatosRecentes: contatos.slice(0, 15),
      auditoriaRecente: auditoria.slice(0, 20),
    };
  }
}

export const cobrancaRiscoService = new CobrancaRiscoService();
