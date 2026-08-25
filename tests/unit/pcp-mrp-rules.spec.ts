// tests/unit/pcp-mrp-rules.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PcpService } from '@/backend/modules/pcp/pcp-service';

describe('PCP & MRP Motor Determinístico - Regras Industriais', () => {
  let pcpService: PcpService;
  const empresaId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    pcpService = new PcpService();
  });

  it('deve deduzir reservas ativas e material bloqueado do estoque físico para cálculo do saldo disponível', () => {
    const mrp = pcpService.calcularMrp(empresaId);

    // HARDOX 450 tem 3 físicas, 2 bloqueadas em quarentena e 1 reservada -> Disponível Real = 0
    const hardox = mrp.necessidadesLiquidas.find((n) => n.codigoItem === 'MP-CHAPA-HARDOX-450');
    expect(hardox).toBeDefined();
    expect(hardox?.estoqueFisicoTotal).toBe(3);
    expect(hardox?.materialBloqueado).toBe(2);
    expect(hardox?.reservasAtivas).toBe(1);
    expect(hardox?.estoqueDisponivelReal).toBe(0);
    // Demanda = 10 + 4% perda = 10.4 + 2 segurança = 12.4 -> Necessidade Líquida = 12.4
    expect(hardox?.necessidadeLiquidaCalculada).toBeGreaterThan(10);
  });

  it('não deve gerar compra duplicada quando pedido de compra em trânsito já cobre a necessidade líquida', () => {
    const mrp = pcpService.calcularMrp(empresaId);

    // Parafuso M24 tem compra aberta de 100 unidades que cobre a demanda
    const parafuso = mrp.necessidadesLiquidas.find((n) => n.codigoItem === 'CMP-PARAF-M24-CL10.9');
    expect(parafuso).toBeDefined();
    expect(parafuso?.comprasEmTransito).toBe(100);
    expect(parafuso?.necessidadeLiquidaCalculada).toBe(0);
    expect(parafuso?.categoriaAcao).toBe('COBERTO_PEDIDOS_ABERTOS');

    // Não deve existir sugestão de compra aberta gerada para esse item
    const sugParafuso = mrp.sugestoesCompra.find((s) => s.codigoItem === 'CMP-PARAF-M24-CL10.9');
    expect(sugParafuso).toBeUndefined();
  });

  it('deve aplicar cálculo regressivo de lead time (backward scheduling) na data de disparo da compra', () => {
    const mrp = pcpService.calcularMrp(empresaId);

    const chapaHardox = mrp.sugestoesCompra.find((s) => s.codigoItem === 'MP-CHAPA-HARDOX-450');
    expect(chapaHardox).toBeDefined();
    expect(chapaHardox?.leadTimeFornecedorDias).toBe(15);

    const dataNecessidade = new Date(chapaHardox!.dataNecessidadeProducao);
    const dataDisparo = new Date(chapaHardox!.dataDisparoPedidoCompra);

    const diffDias = Math.round((dataNecessidade.getTime() - dataDisparo.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDias).toBe(15);
  });

  it('deve garantir que toda sugestão gerada pelo MRP possua rastreabilidade completa de origem', () => {
    const mrp = pcpService.calcularMrp(empresaId);

    for (const sug of mrp.sugestoesCompra) {
      expect(sug.origemRastreavel).toBeDefined();
      expect(sug.origemRastreavel.pedidoNumero).toBeDefined();
      expect(sug.origemRastreavel.motivo).toBeTruthy();
    }

    for (const sugProd of mrp.sugestoesProducao) {
      expect(sugProd.origemRastreavel).toBeDefined();
      expect(sugProd.origemRastreavel.motivo).toBeTruthy();
    }
  });

  it('deve ordenar a fila de produção corretamente pelo algoritmo Critical Ratio (CR)', () => {
    const fila = pcpService.sequenciarFilaProducao(
      empresaId,
      'maq-dobradeira-cnc-320t',
      'CRITICAL_RATIO'
    );

    expect(fila.length).toBeGreaterThan(0);
    // Primeiro item deve ter o menor ou igual CR que os subsequentes
    for (let i = 0; i < fila.length - 1; i++) {
      expect(fila[i].criticalRatio).toBeLessThanOrEqual(fila[i + 1].criticalRatio);
      expect(fila[i].posicaoFila).toBe(i + 1);
    }
  });

  it('deve apurar sobrecarga e marcar centros de trabalho gargalo quando ocupação for > 100%', () => {
    const mrp = pcpService.calcularMrp(empresaId);

    const maqLaser = mrp.capacidadeMaquinas.find((m) => m.id === 'maq-laser-fiber-12kw');
    expect(maqLaser).toBeDefined();
    expect(maqLaser?.taxaOcupacaoPercentual).toBeGreaterThan(100);
    expect(maqLaser?.statusOperacional).toBe('GARGALO');

    // Deve constar na matriz de riscos
    const riscoLaser = mrp.riscosAtraso.find((r) => r.tipoRisco === 'SOBRECARGA_MAQUINA' && r.codigoItem === maqLaser?.codigo);
    expect(riscoLaser).toBeDefined();
    expect(riscoLaser?.nivelSeveridade).toBe('CRITICO');
  });

  it('deve converter sugestão de compra em Solicitação de Compra formal com rastreabilidade', () => {
    const mrp = pcpService.calcularMrp(empresaId);
    const primeiraSugestao = mrp.sugestoesCompra[0];
    expect(primeiraSugestao).toBeDefined();

    const resultadoConversao = pcpService.converterSugestaoCompra(primeiraSugestao.id);
    expect(resultadoConversao.sucesso).toBe(true);
    expect(resultadoConversao.solicitacaoCompraNumero).toMatch(/^SC-2026-\d{4}$/);
    expect(primeiraSugestao.status).toBe('CONVERTIDA_EM_SC');
  });

  it('deve converter sugestão de produção em Ordem de Produção formal no plano mestre', () => {
    const mrp = pcpService.calcularMrp(empresaId);
    const primeiraSugestaoProd = mrp.sugestoesProducao[0];
    expect(primeiraSugestaoProd).toBeDefined();

    const resultadoConversao = pcpService.converterSugestaoProducao(primeiraSugestaoProd.id);
    expect(resultadoConversao.sucesso).toBe(true);
    expect(resultadoConversao.ordemProducaoNumero).toMatch(/^OP-2026-\d{3}$/);
    expect(primeiraSugestaoProd.status).toBe('CONVERTIDA_EM_OP');
  });
});
