import {
  PoliticaCredito,
  TipoGarantiaExigida,
  RecomendacaoMotor,
  StatusAnaliseCredito,
  NivelAlcadaAprovacao,
} from './credito-types';
import { CreditoCompletoBureauResponse } from './providers/credit-provider.interface';

export interface ParametrosCalculoCredito {
  politica: PoliticaCredito;
  dadosCadastrais: {
    razaoSocial: string;
    cnpjCpf: string;
    faturamentoMensalEstimado: number;
    capitalSocial?: number;
  };
  historicoInterno: {
    mesesRelacionamento: number;
    totalFaturadoHistorico: number;
    quantidadePedidosHistorico: number;
    maiorCompraValor: number;
    maiorAcumuloValor: number;
    mediaAtrasoDias: number;
    taxaPontualidadePerc: number; // 0-100
    totalTitulosPagos: number;
    totalTitulosComAtraso: number;
    titulosVencidosValor: number;
    quantidadeTitulosVencidos: number;
    diasMaiorAtrasoAtual: number;
  };
  exposicao: {
    exposicaoAtualEmpresa: number;
    exposicaoProjetadaEmpresa: number;
    exposicaoAtualGrupo: number;
    exposicaoProjetadaGrupo: number;
    limiteAtualEmpresa: number;
    limiteAtualGrupo: number;
    limiteSolicitado: number;
    pedidosEmCarteiraValor: number;
  };
  consultaBureau?: CreditoCompletoBureauResponse;
}

export interface ResultadoMotorCredito {
  scoreInternoFinal: number; // 0 a 1000
  faixaScore: string;
  pontosHistorico: number;
  pontosRelacionamento: number;
  pontosVolume: number;
  pontosBureau: number;
  pontosRestricoes: number;
  limiteSugeridoMotor: number;
  prazoMaximoSugeridoDias: number;
  garantiaSugerida: TipoGarantiaExigida;
  recomendacao: RecomendacaoMotor;
  motivosRecomendacao: string[];
  nivelAlcadaRequerida: NivelAlcadaAprovacao;
  bloqueioImediatoRequerido: boolean;
  motivoBloqueio?: string;
}

export class IndustrialCreditEngine {
  /**
   * Executa a avaliação de crédito com base na política ativa, histórico interno e dados de bureau
   */
  public static avaliar(params: ParametrosCalculoCredito): ResultadoMotorCredito {
    const { politica, historicoInterno, exposicao, dadosCadastrais, consultaBureau } = params;
    const motivos: string[] = [];

    // 1. PONTUAÇÃO DE HISTÓRICO INTERNO (0 a 1000)
    let pontosHistorico = 500; // Padrão neutro para novos clientes
    if (historicoInterno.totalTitulosPagos > 0) {
      const pontualidadePtos = Math.min(1000, historicoInterno.taxaPontualidadePerc * 10);
      const penalidadeAtraso = Math.min(500, historicoInterno.mediaAtrasoDias * 30);
      pontosHistorico = Math.max(0, Math.min(1000, pontualidadePtos - penalidadeAtraso));
    } else {
      motivos.push('Cliente sem histórico prévio de liquidação de títulos no grupo.');
    }

    // Penalidade severa para títulos vencidos atualmente
    if (historicoInterno.quantidadeTitulosVencidos > 0) {
      const penalidadeVencidos = Math.min(600, historicoInterno.quantidadeTitulosVencidos * 150);
      pontosHistorico = Math.max(0, pontosHistorico - penalidadeVencidos);
      motivos.push(
        `Possui ${historicoInterno.quantidadeTitulosVencidos} título(s) vencido(s) no valor de R$ ${historicoInterno.titulosVencidosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      );
    }

    // 2. PONTUAÇÃO DE TEMPO DE RELACIONAMENTO (0 a 1000)
    let pontosRelacionamento = 200;
    if (historicoInterno.mesesRelacionamento >= 36) pontosRelacionamento = 1000;
    else if (historicoInterno.mesesRelacionamento >= 24) pontosRelacionamento = 850;
    else if (historicoInterno.mesesRelacionamento >= 12) pontosRelacionamento = 700;
    else if (historicoInterno.mesesRelacionamento >= 6) pontosRelacionamento = 500;
    else if (historicoInterno.mesesRelacionamento >= 3) pontosRelacionamento = 350;

    // 3. PONTUAÇÃO DE VOLUME & FATURAMENTO (0 a 1000)
    let pontosVolume = 300;
    if (historicoInterno.totalFaturadoHistorico > 1000000) pontosVolume = 1000;
    else if (historicoInterno.totalFaturadoHistorico > 500000) pontosVolume = 850;
    else if (historicoInterno.totalFaturadoHistorico > 200000) pontosVolume = 700;
    else if (historicoInterno.totalFaturadoHistorico > 50000) pontosVolume = 550;
    else if (historicoInterno.totalFaturadoHistorico > 10000) pontosVolume = 400;

    // 4. PONTUAÇÃO DO BUREAU EXTERNO (0 a 1000)
    let pontosBureau = 700; // Padrão se não consultado
    if (consultaBureau) {
      pontosBureau = Math.max(0, Math.min(1000, consultaBureau.score.score));
      if (consultaBureau.score.score < 400) {
        motivos.push(`Score Serasa crítico (${consultaBureau.score.score}/1000 - ${consultaBureau.score.faixaRisco}).`);
      }
    }

    // 5. PONTUAÇÃO DE RESTRIÇÕES EXTERNAS (0 a 1000)
    let pontosRestricoes = 1000;
    let totalProtestos = 0;
    let valorProtestos = 0;
    let totalPefinRefin = 0;
    let valorPefinRefin = 0;
    let falencias = false;

    if (consultaBureau) {
      totalProtestos = consultaBureau.restricoes.protestos.length;
      valorProtestos = consultaBureau.restricoes.protestos.reduce((acc, p) => acc + p.valor, 0);
      totalPefinRefin = consultaBureau.restricoes.pefin.length + consultaBureau.restricoes.refin.length;
      valorPefinRefin =
        consultaBureau.restricoes.pefin.reduce((acc, p) => acc + p.valor, 0) +
        consultaBureau.restricoes.refin.reduce((acc, r) => acc + r.valor, 0);
      falencias = consultaBureau.restricoes.participacaoFalenciasOuRecuperacoes;

      if (falencias) {
        pontosRestricoes = 0;
        motivos.push('Apontamento de falência ou recuperação judicial no bureau.');
      } else {
        if (totalProtestos > 0) {
          pontosRestricoes -= Math.min(600, totalProtestos * 200 + valorProtestos * 0.01);
          motivos.push(
            `Constam ${totalProtestos} protesto(s) ativo(s) totalizando R$ ${valorProtestos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
          );
        }
        if (totalPefinRefin > 0) {
          pontosRestricoes -= Math.min(400, totalPefinRefin * 100 + valorPefinRefin * 0.005);
          motivos.push(`Constam pendências comerciais/bancárias (PEFIN/REFIN) de R$ ${valorPefinRefin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
        }
      }
    }
    pontosRestricoes = Math.max(0, Math.min(1000, pontosRestricoes));

    // CÁLCULO PONDERADO DO SCORE INTERNO
    const pesoHist = politica.pesoHistoricoInterno / 100;
    const pesoRel = politica.pesoTempoRelacionamento / 100;
    const pesoVol = politica.pesoVolumeFaturamento / 100;
    const pesoBur = politica.pesoScoreBureauExterno / 100;
    const pesoRest = politica.pesoRestricoesExternas / 100;

    const scorePonderado = Math.round(
      pontosHistorico * pesoHist +
      pontosRelacionamento * pesoRel +
      pontosVolume * pesoVol +
      pontosBureau * pesoBur +
      pontosRestricoes * pesoRest
    );

    const scoreInternoFinal = Math.max(0, Math.min(1000, scorePonderado));

    // Determinar Faixa da Política
    let faixaEncontrada = politica.faixasScore.find(
      (f) => scoreInternoFinal >= f.scoreMin && scoreInternoFinal <= f.scoreMax
    );
    if (!faixaEncontrada) {
      faixaEncontrada = politica.faixasScore[politica.faixasScore.length - 1];
    }

    // Cálculo do Limite Sugerido
    const faturamentoBase = Math.max(
      dadosCadastrais.faturamentoMensalEstimado || 100000,
      historicoInterno.maiorAcumuloValor > 0 ? historicoInterno.maiorAcumuloValor * 1.2 : 50000
    );
    let limiteSugerido = Math.round((faturamentoBase * faixaEncontrada.fatorLimiteFaturamento) / 1000) * 1000;
    limiteSugerido = Math.min(limiteSugerido, faixaEncontrada.limiteMaximoSemComite);

    if (historicoInterno.totalTitulosPagos === 0) {
      // Cliente novo: sugerir limite inicial conservador
      limiteSugerido = Math.min(limiteSugerido, 25000);
      motivos.push('Limite inicial conservador sugerido devido à ausência de histórico de pontualidade interno.');
    }

    // Checagem de Garantias e Prazo
    let garantiaSugerida: TipoGarantiaExigida = 'NENHUMA';
    if (faixaEncontrada.exigeGarantia) {
      garantiaSugerida = scoreInternoFinal < 400 ? 'PAGAMENTO_ANTECIPADO' : 'AVAL_SOCIOS';
    }

    const prazoMaximoSugeridoDias = faixaEncontrada.prazoMaximoDias;

    // Regras de Recomendação e Bloqueio
    let recomendacao: RecomendacaoMotor = 'RECOMENDA_APROVACAO';
    let bloqueioImediatoRequerido = false;
    let motivoBloqueio: string | undefined = undefined;

    // Condição 1: Títulos vencidos graves
    if (
      historicoInterno.diasMaiorAtrasoAtual > politica.diasToleranciaAtraso &&
      historicoInterno.titulosVencidosValor > 0
    ) {
      recomendacao = 'BLOQUEIO_IMEDIATO';
      bloqueioImediatoRequerido = true;
      motivoBloqueio = `Inadimplência interna ativa: ${historicoInterno.diasMaiorAtrasoAtual} dias de atraso (Tolerância: ${politica.diasToleranciaAtraso} dias).`;
      motivos.push(motivoBloqueio);
    }
    // Condição 2: Falência/Recuperação judicial ou Score extremamente baixo com protestos
    else if (falencias || (scoreInternoFinal < 300 && valorProtestos > politica.valorMaximoProtestoTolerado)) {
      recomendacao = 'RECOMENDA_REPROVACAO';
      motivos.push('Risco cadastral inaceitável para concessão de crédito faturado.');
    }
    // Condição 3: Score moderado com restrições leves
    else if (scoreInternoFinal < 550 || totalProtestos > 0 || totalPefinRefin > 0) {
      recomendacao = 'RECOMENDA_RESTRICAO';
      if (garantiaSugerida === 'NENHUMA') garantiaSugerida = 'AVAL_SOCIOS';
      motivos.push('Recomendada aprovação condicionada a garantias adicionais ou sinal na entrada.');
    }
    // Condição 4: Solicitação acima do limite sem comitê ou acima da alçada básica
    else if (
      exposicao.limiteSolicitado > faixaEncontrada.limiteMaximoSemComite ||
      exposicao.exposicaoProjetadaGrupo > (exposicao.limiteAtualGrupo || limiteSugerido)
    ) {
      recomendacao = 'SUBMETER_COMITE';
      motivos.push('Limite solicitado ou exposição projetada excede o teto automático da faixa de score.');
    }
    // Condição 5: Aprovação Automática / Recomendada
    else if (
      scoreInternoFinal >= 750 &&
      historicoInterno.quantidadeTitulosVencidos === 0 &&
      totalProtestos === 0 &&
      historicoInterno.totalTitulosPagos > 3
    ) {
      recomendacao = 'APROVACAO_AUTOMATICA';
      motivos.push('Cliente classe A com histórico excelente e cadastro limpo.');
    } else {
      recomendacao = 'RECOMENDA_APROVACAO';
    }

    // Determinar Alçada Requerida
    let nivelAlcadaRequerida: NivelAlcadaAprovacao = 'ANALISTA_CREDITO';
    const valorAlvo = Math.max(exposicao.limiteSolicitado, limiteSugerido);

    const alcadaAnalista = politica.alcadas.find((a) => a.nivel === 'ANALISTA_CREDITO');
    const alcadaGerente = politica.alcadas.find((a) => a.nivel === 'GERENTE_FINANCEIRO');
    const alcadaDiretoria = politica.alcadas.find((a) => a.nivel === 'DIRETORIA_EXECUTIVA');

    if (alcadaAnalista && valorAlvo <= alcadaAnalista.limiteMaximo && recomendacao !== 'SUBMETER_COMITE') {
      nivelAlcadaRequerida = 'ANALISTA_CREDITO';
    } else if (alcadaGerente && valorAlvo <= alcadaGerente.limiteMaximo) {
      nivelAlcadaRequerida = 'GERENTE_FINANCEIRO';
    } else if (alcadaDiretoria && valorAlvo <= alcadaDiretoria.limiteMaximo) {
      nivelAlcadaRequerida = 'DIRETORIA_EXECUTIVA';
    } else {
      nivelAlcadaRequerida = 'COMITE_CREDITO';
    }

    return {
      scoreInternoFinal,
      faixaScore: faixaEncontrada.faixa,
      pontosHistorico: Math.round(pontosHistorico),
      pontosRelacionamento: Math.round(pontosRelacionamento),
      pontosVolume: Math.round(pontosVolume),
      pontosBureau: Math.round(pontosBureau),
      pontosRestricoes: Math.round(pontosRestricoes),
      limiteSugeridoMotor: limiteSugerido,
      prazoMaximoSugeridoDias,
      garantiaSugerida,
      recomendacao,
      motivosRecomendacao: motivos,
      nivelAlcadaRequerida,
      bloqueioImediatoRequerido,
      motivoBloqueio,
    };
  }
}
