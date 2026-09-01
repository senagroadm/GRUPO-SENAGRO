// backend/modules/estoque/estoque-service.ts
import crypto from 'crypto';
import {
  Almoxarifado,
  LocalizacaoEstoque,
  SaldoEstoque,
  MovimentoEstoque,
  LoteEstoque,
  ReservaEstoque,
  ChapaEstoque,
  RetalhoChapa,
  RegistroSucata,
  InventarioSessao,
  InventarioContagemItem,
  PoliticaEstoqueEmpresa,
  TipoMovimentoEstoque,
  TipoDocumentoOrigem,
} from './estoque-types';

// In-Memory Data Store Multiempresa
class EstoqueRepository {
  private almoxarifados: Almoxarifado[] = [];
  private localizacoes: LocalizacaoEstoque[] = [];
  private saldos: SaldoEstoque[] = [];
  private movimentos: MovimentoEstoque[] = [];
  private lotes: LoteEstoque[] = [];
  private reservas: ReservaEstoque[] = [];
  private chapas: ChapaEstoque[] = [];
  private retalhos: RetalhoChapa[] = [];
  private sucatas: RegistroSucata[] = [];
  private inventarios: InventarioSessao[] = [];
  private contagensInventario: Map<string, InventarioContagemItem[]> = new Map();
  private politicas: Map<string, PoliticaEstoqueEmpresa> = new Map();

  constructor() {
    this.inicializarSeedData();
  }

  private inicializarSeedData() {
    const empresaTritech = '44444444-4444-4444-4444-444444444444'; // TRITECH_CORTE
    const empresaMwam = '11111111-1111-1111-1111-111111111111'; // MWAM
    const empresaOliveira = '22222222-2222-2222-2222-222222222222'; // OLIVEIRA_AMORIM
    const empresaSenagro = '33333333-3333-3333-3333-333333333333'; // SENAGRO
    const empresaTritechInd = '55555555-5555-5555-5555-555555555555'; // TRITECH_IND

    // 1. Políticas Padrão por Empresa
    const empresas = [empresaTritech, empresaMwam, empresaOliveira, empresaSenagro, empresaTritechInd];
    for (const empId of empresas) {
      this.politicas.set(empId, {
        empresaId: empId,
        permiteSaldoNegativo: false, // Regra estrita padrão
        limiteValorAjusteSemAprovacao: 1500, // Acima de R$ 1.500 exige aprovação de alçada
        limitePercentualDivergenciaSemAprovacao: 10, // Acima de 10% de variação exige alçada
        exigeLoteObrigatorioParaChapas: true,
        permiteConsumoRetalhoSemOp: false,
      });
    }

    // 2. Almoxarifados TRITECH_CORTE
    const almoxChapasTritech: Almoxarifado = {
      id: 'alm-chapas-tritech-01',
      empresaId: empresaTritech,
      codigo: 'ALM-MP-CHAPAS',
      nome: 'Almoxarifado Matéria-Prima (Chapas de Aço)',
      tipo: 'MATERIA_PRIMA',
      ativo: true,
      enderecoFisico: 'Galpão 01 - Baia Central de Aço',
      responsavelNome: 'Carlos Eduardo Almoxarife',
      permiteSaldoNegativo: false,
      criadoEm: '2026-01-10T08:00:00.000Z',
    };

    const almoxRetalhosTritech: Almoxarifado = {
      id: 'alm-retalhos-tritech-02',
      empresaId: empresaTritech,
      codigo: 'ALM-RETALHOS-CORTE',
      nome: 'Almoxarifado de Retalhos e Sobras Úteis de Laser/Plasma',
      tipo: 'RETALHOS',
      ativo: true,
      enderecoFisico: 'Galpão 01 - Racks Laterais de Retalhos',
      responsavelNome: 'Carlos Eduardo Almoxarife',
      permiteSaldoNegativo: false,
      criadoEm: '2026-01-10T08:00:00.000Z',
    };

    const almoxSucataTritech: Almoxarifado = {
      id: 'alm-sucata-tritech-03',
      empresaId: empresaTritech,
      codigo: 'ALM-SUCATA-METIS',
      nome: 'Pátio de Sucatas Metálicas e Caçambas',
      tipo: 'SUCATA',
      ativo: true,
      enderecoFisico: 'Pátio Externo Coberto - Caçambas 01 a 06',
      responsavelNome: 'Marcos Caldeiraria',
      permiteSaldoNegativo: false,
      criadoEm: '2026-01-10T08:00:00.000Z',
    };

    const almoxAcabadosTritech: Almoxarifado = {
      id: 'alm-acabados-tritech-04',
      empresaId: empresaTritech,
      codigo: 'ALM-EXP-ACABADOS',
      nome: 'Expedição de Peças Cortadas e Dobradas',
      tipo: 'PRODUTO_ACABADO',
      ativo: true,
      enderecoFisico: 'Galpão 02 - Doca de Expedição',
      responsavelNome: 'Juliana Logística',
      permiteSaldoNegativo: false,
      criadoEm: '2026-01-10T08:00:00.000Z',
    };

    // Almoxarifado MWAM Engenharia
    const almoxMwam: Almoxarifado = {
      id: 'alm-mwam-01',
      empresaId: empresaMwam,
      codigo: 'ALM-MWAM-INSUMOS',
      nome: 'Almoxarifado de Insumos de Montagem & Solda MWAM',
      tipo: 'CONSUMIVEIS',
      ativo: true,
      enderecoFisico: 'Oficina Central MWAM',
      responsavelNome: 'Roberto Engenharia',
      permiteSaldoNegativo: false,
      criadoEm: '2026-01-10T08:00:00.000Z',
    };

    this.almoxarifados.push(
      almoxChapasTritech,
      almoxRetalhosTritech,
      almoxSucataTritech,
      almoxAcabadosTritech,
      almoxMwam
    );

    // 3. Localizações de Estoque
    const locRackChapa1: LocalizacaoEstoque = {
      id: 'loc-rack-01',
      empresaId: empresaTritech,
      almoxarifadoId: almoxChapasTritech.id,
      codigo: 'RACK-CH-A01',
      rua: 'Rua 01',
      prateleira: 'Rack Vertical A',
      nivel: 'Nível 01',
      tipoArmazenamento: 'RACK_CHAPAS',
      capacidadePesoKg: 20000,
      ocupacaoAtualKg: 8500,
      ativo: true,
    };

    const locRackChapa2: LocalizacaoEstoque = {
      id: 'loc-rack-02',
      empresaId: empresaTritech,
      almoxarifadoId: almoxChapasTritech.id,
      codigo: 'RACK-CH-A02',
      rua: 'Rua 01',
      prateleira: 'Rack Vertical A',
      nivel: 'Nível 02',
      tipoArmazenamento: 'RACK_CHAPAS',
      capacidadePesoKg: 20000,
      ocupacaoAtualKg: 6200,
      ativo: true,
    };

    const locCanteiroRetalho1: LocalizacaoEstoque = {
      id: 'loc-retalho-01',
      empresaId: empresaTritech,
      almoxarifadoId: almoxRetalhosTritech.id,
      codigo: 'CANT-RET-B01',
      rua: 'Rua Retalhos',
      prateleira: 'Escaninho 01',
      nivel: 'Térreo',
      tipoArmazenamento: 'CANTEIRO_RETALHOS',
      capacidadePesoKg: 5000,
      ocupacaoAtualKg: 1420,
      ativo: true,
    };

    const locCacambaSucata1: LocalizacaoEstoque = {
      id: 'loc-sucata-01',
      empresaId: empresaTritech,
      almoxarifadoId: almoxSucataTritech.id,
      codigo: 'CACAMBA-ACO-01',
      rua: 'Pátio Aço Carbono',
      prateleira: 'Caçamba 01',
      nivel: 'Chão',
      tipoArmazenamento: 'CACAMBA_SUCATA',
      capacidadePesoKg: 12000,
      ocupacaoAtualKg: 4350,
      ativo: true,
    };

    this.localizacoes.push(locRackChapa1, locRackChapa2, locCanteiroRetalho1, locCacambaSucata1);

    // 4. Lotes com Certificados de Usina (Rastreabilidade Metalmecânica)
    const loteUsiminas1020: LoteEstoque = {
      id: 'lote-usiminas-1020-01',
      empresaId: empresaTritech,
      numeroLote: 'LOT-2026-USI-8841',
      numeroCorridaAco: 'CORR-992348',
      certificadoUsinaNumero: 'CERT-USIMINAS-44192/2026',
      fornecedorNome: 'Usiminas Siderúrgica S.A.',
      dataEntrada: '2026-01-15T09:00:00.000Z',
      materialTipo: 'AÇO SAE 1020',
      espessuraMm: 4.75,
      composicaoQuimica: { c: 0.19, mn: 0.45, si: 0.18, p: 0.02, s: 0.015 },
      propriedadesMecanicas: { limiteEscoamentoMpa: 260, limiteResistenciaMpa: 430, alongamentoPerc: 28 },
      statusLote: 'APROVADO',
      quantidadeOriginal: 10000, // 10.000 kg
      quantidadeAtualSaldo: 6716,
      unidadeMedida: 'KG',
    };

    const loteAperam304: LoteEstoque = {
      id: 'lote-aperam-304-02',
      empresaId: empresaTritech,
      numeroLote: 'LOT-2026-APE-3042',
      numeroCorridaAco: 'CORR-INOX-7712',
      certificadoUsinaNumero: 'CERT-APERAM-99120/2026',
      fornecedorNome: 'Aperam South America',
      dataEntrada: '2026-02-01T10:30:00.000Z',
      materialTipo: 'AÇO INOX 304',
      espessuraMm: 3.0,
      composicaoQuimica: { c: 0.04, cr: 18.2, ni: 8.1, mn: 1.2, si: 0.45 },
      propriedadesMecanicas: { limiteEscoamentoMpa: 290, limiteResistenciaMpa: 620, alongamentoPerc: 45 },
      statusLote: 'APROVADO',
      quantidadeOriginal: 5000,
      quantidadeAtualSaldo: 3500,
      unidadeMedida: 'KG',
    };

    this.lotes.push(loteUsiminas1020, loteAperam304);

    // 5. Chapas Industriais Físicas
    const chapa1: ChapaEstoque = {
      id: 'chapa-1020-475-01',
      empresaId: empresaTritech,
      codigoChapa: 'CH-1020-4.75-1500x3000-001',
      produtoId: 'prod-chapa-1020-475',
      material: 'Aço Carbono SAE 1020',
      espessuraMm: 4.75,
      larguraMm: 1500,
      comprimentoMm: 3000,
      areaM2: 4.5,
      pesoKg: 167.9,
      densidadeMaterialKgM3: 7850,
      loteId: loteUsiminas1020.id,
      numeroLote: loteUsiminas1020.numeroLote,
      numeroCorrida: loteUsiminas1020.numeroCorridaAco,
      custoPorKg: 6.8,
      custoTotalChapa: 1141.72,
      almoxarifadoId: almoxChapasTritech.id,
      localizacaoId: locRackChapa1.id,
      localizacaoCodigo: locRackChapa1.codigo,
      status: 'DISPONIVEL',
      dataRecebimento: '2026-01-15T09:00:00.000Z',
      observacoes: 'Chapa plana decapada e oleada sem oxidação',
    };

    const chapa2: ChapaEstoque = {
      id: 'chapa-1020-475-02',
      empresaId: empresaTritech,
      codigoChapa: 'CH-1020-4.75-1500x3000-002',
      produtoId: 'prod-chapa-1020-475',
      material: 'Aço Carbono SAE 1020',
      espessuraMm: 4.75,
      larguraMm: 1500,
      comprimentoMm: 3000,
      areaM2: 4.5,
      pesoKg: 167.9,
      densidadeMaterialKgM3: 7850,
      loteId: loteUsiminas1020.id,
      numeroLote: loteUsiminas1020.numeroLote,
      numeroCorrida: loteUsiminas1020.numeroCorridaAco,
      custoPorKg: 6.8,
      custoTotalChapa: 1141.72,
      almoxarifadoId: almoxChapasTritech.id,
      localizacaoId: locRackChapa1.id,
      localizacaoCodigo: locRackChapa1.codigo,
      status: 'RESERVADA',
      dataRecebimento: '2026-01-15T09:00:00.000Z',
      observacoes: 'Reservada para Pedido PV-2026-0089',
    };

    const chapaInox: ChapaEstoque = {
      id: 'chapa-304-300-01',
      empresaId: empresaTritech,
      codigoChapa: 'CH-INOX-3.00-1250x3000-001',
      produtoId: 'prod-chapa-inox-300',
      material: 'Aço Inox 304 Escovado',
      espessuraMm: 3.0,
      larguraMm: 1250,
      comprimentoMm: 3000,
      areaM2: 3.75,
      pesoKg: 89.2,
      densidadeMaterialKgM3: 7930,
      loteId: loteAperam304.id,
      numeroLote: loteAperam304.numeroLote,
      numeroCorrida: loteAperam304.numeroCorridaAco,
      custoPorKg: 28.5,
      custoTotalChapa: 2542.2,
      almoxarifadoId: almoxChapasTritech.id,
      localizacaoId: locRackChapa2.id,
      localizacaoCodigo: locRackChapa2.codigo,
      status: 'DISPONIVEL',
      dataRecebimento: '2026-02-01T10:30:00.000Z',
      observacoes: 'Película protetora laser intacta',
    };

    this.chapas.push(chapa1, chapa2, chapaInox);

    // 6. Retalhos (Sobras Úteis de Corte Laser/Nesting)
    const retalho1: RetalhoChapa = {
      id: 'ret-1020-475-01',
      empresaId: empresaTritech,
      codigoRetalho: 'RET-1020-4.75-800x1200-01',
      loteOrigemId: loteUsiminas1020.id,
      numeroLoteOrigem: loteUsiminas1020.numeroLote,
      chapaMaeId: chapa1.id,
      ordemProducaoOrigemId: 'OP-2026-0044',
      material: 'Aço Carbono SAE 1020',
      espessuraMm: 4.75,
      larguraMm: 800,
      comprimentoMm: 1200,
      formatoGeometrico: 'RETANGULAR',
      areaM2: 0.96,
      pesoKg: 35.8,
      aproveitamentoEstimadoPerc: 90,
      almoxarifadoId: almoxRetalhosTritech.id,
      localizacaoId: locCanteiroRetalho1.id,
      localizacaoCodigo: locCanteiroRetalho1.codigo,
      statusRetalho: 'DISPONIVEL',
      custoUnitarioKg: 6.8,
      custoEstimadoTotal: 243.44,
      dataCriacao: '2026-02-18T14:20:00.000Z',
      observacoes: 'Retalho íntegro do nesting da OP-2026-0044',
    };

    this.retalhos.push(retalho1);

    // 7. Registro de Sucatas Metálicas
    const sucata1: RegistroSucata = {
      id: 'suc-aco-2026-01',
      empresaId: empresaTritech,
      codigoSucata: 'SUC-ACO-001',
      tipoMaterial: 'ACO_CARBONO_OXICORTE',
      pesoKg: 4350,
      origemDescarte: 'SOBRA_CORTE_INUTILIZAVEL',
      almoxarifadoId: almoxSucataTritech.id,
      localizacaoId: locCacambaSucata1.id,
      cacambaNumero: 'CACAMBA-01',
      valorEstimadoVendaPorKg: 1.1,
      valorTotalEstimado: 4785.0,
      dataGeracao: '2026-02-20T16:00:00.000Z',
      statusSucata: 'ARMAZENADO',
      responsavelId: 'user-02',
      responsavelNome: 'Marcos Caldeiraria',
      observacoes: 'Aparas de esqueletos de corte a laser de chapas grossas',
    };

    this.sucatas.push(sucata1);

    // 8. Saldos Consolidados por Produto / Local / Lote
    const saldoChapa1020: SaldoEstoque = {
      id: 'saldo-chapa-1020-475',
      empresaId: empresaTritech,
      produtoId: 'prod-chapa-1020-475',
      codigoProduto: 'MP-CH-1020-4.75',
      descricaoProduto: 'Chapa Aço Carbono SAE 1020 4.75mm x 1500 x 3000',
      unidadeMedida: 'CHAPA',
      almoxarifadoId: almoxChapasTritech.id,
      almoxarifadoCodigo: almoxChapasTritech.codigo,
      almoxarifadoNome: almoxChapasTritech.nome,
      localizacaoId: locRackChapa1.id,
      localizacaoCodigo: locRackChapa1.codigo,
      loteId: loteUsiminas1020.id,
      numeroLote: loteUsiminas1020.numeroLote,
      statusEstoque: 'DISPONIVEL',
      quantidadeFisica: 40,
      quantidadeReservada: 5,
      quantidadeBloqueada: 0,
      quantidadeEmInspecao: 0,
      quantidadeDisponivel: 35, // 40 - 5 = 35
      custoMedioUnitario: 1141.72,
      custoTotal: 45668.8,
      categoriaItem: 'CHAPA_ACO',
      dataUltimoMovimento: '2026-02-15T11:00:00.000Z',
      atualizadoEm: '2026-02-20T17:00:00.000Z',
    };

    const saldoChapaInox: SaldoEstoque = {
      id: 'saldo-chapa-inox-300',
      empresaId: empresaTritech,
      produtoId: 'prod-chapa-inox-300',
      codigoProduto: 'MP-CH-INOX-3.00',
      descricaoProduto: 'Chapa Aço Inox 304 Escovado 3.0mm x 1250 x 3000',
      unidadeMedida: 'CHAPA',
      almoxarifadoId: almoxChapasTritech.id,
      almoxarifadoCodigo: almoxChapasTritech.codigo,
      almoxarifadoNome: almoxChapasTritech.nome,
      localizacaoId: locRackChapa2.id,
      localizacaoCodigo: locRackChapa2.codigo,
      loteId: loteAperam304.id,
      numeroLote: loteAperam304.numeroLote,
      statusEstoque: 'DISPONIVEL',
      quantidadeFisica: 25,
      quantidadeReservada: 0,
      quantidadeBloqueada: 0,
      quantidadeEmInspecao: 0,
      quantidadeDisponivel: 25,
      custoMedioUnitario: 2542.2,
      custoTotal: 63555.0,
      categoriaItem: 'CHAPA_ACO',
      dataUltimoMovimento: '2026-02-01T10:30:00.000Z',
      atualizadoEm: '2026-02-01T10:30:00.000Z',
    };

    const saldoRetalhos: SaldoEstoque = {
      id: 'saldo-ret-1020-475',
      empresaId: empresaTritech,
      produtoId: 'prod-retalho-1020-475',
      codigoProduto: 'RET-1020-4.75',
      descricaoProduto: 'Retalho Chapa Aço SAE 1020 4.75mm (Diversas Dimensões)',
      unidadeMedida: 'KG',
      almoxarifadoId: almoxRetalhosTritech.id,
      almoxarifadoCodigo: almoxRetalhosTritech.codigo,
      almoxarifadoNome: almoxRetalhosTritech.nome,
      localizacaoId: locCanteiroRetalho1.id,
      localizacaoCodigo: locCanteiroRetalho1.codigo,
      loteId: loteUsiminas1020.id,
      numeroLote: loteUsiminas1020.numeroLote,
      statusEstoque: 'RETALHO',
      quantidadeFisica: 1420,
      quantidadeReservada: 0,
      quantidadeBloqueada: 0,
      quantidadeEmInspecao: 0,
      quantidadeDisponivel: 1420,
      custoMedioUnitario: 6.8,
      custoTotal: 9656.0,
      categoriaItem: 'RETALHO_SOBRA',
      dataUltimoMovimento: '2026-02-18T14:20:00.000Z',
      atualizadoEm: '2026-02-18T14:20:00.000Z',
    };

    const saldoSucata: SaldoEstoque = {
      id: 'saldo-sucata-tritech',
      empresaId: empresaTritech,
      produtoId: 'prod-sucata-aco',
      codigoProduto: 'SUC-ACO-MISTO',
      descricaoProduto: 'Sucata de Aço Carbono para Reciclagem',
      unidadeMedida: 'KG',
      almoxarifadoId: almoxSucataTritech.id,
      almoxarifadoCodigo: almoxSucataTritech.codigo,
      almoxarifadoNome: almoxSucataTritech.nome,
      localizacaoId: locCacambaSucata1.id,
      localizacaoCodigo: locCacambaSucata1.codigo,
      statusEstoque: 'SUCATA',
      quantidadeFisica: 4350,
      quantidadeReservada: 0,
      quantidadeBloqueada: 0,
      quantidadeEmInspecao: 0,
      quantidadeDisponivel: 4350,
      custoMedioUnitario: 1.1,
      custoTotal: 4785.0,
      categoriaItem: 'SUCATA',
      dataUltimoMovimento: '2026-02-20T16:00:00.000Z',
      atualizadoEm: '2026-02-20T16:00:00.000Z',
    };

    this.saldos.push(saldoChapa1020, saldoChapaInox, saldoRetalhos, saldoSucata);

    // 9. Reservas Ativas
    const reserva1: ReservaEstoque = {
      id: 'res-pv-2026-0089',
      empresaId: empresaTritech,
      produtoId: 'prod-chapa-1020-475',
      codigoProduto: 'MP-CH-1020-4.75',
      descricaoProduto: 'Chapa Aço Carbono SAE 1020 4.75mm x 1500 x 3000',
      almoxarifadoId: almoxChapasTritech.id,
      localizacaoId: locRackChapa1.id,
      loteId: loteUsiminas1020.id,
      quantidadeReservada: 5,
      unidadeMedida: 'CHAPA',
      tipoOrigem: 'PEDIDO_VENDA',
      documentoOrigemId: 'pv-0089',
      documentoOrigemNumero: 'PV-2026-0089',
      statusReserva: 'ATIVA',
      criadoEm: '2026-02-18T10:00:00.000Z',
      usuarioId: 'user-01',
      usuarioNome: 'Vendedor Sênior',
      observacoes: 'Reserva para corte de flanges do pedido PV-2026-0089',
    };

    this.reservas.push(reserva1);

    // 10. Movimentos Históricos Iniciais (Ledger Imutável)
    const movEntrada1: MovimentoEstoque = {
      id: 'mov-ent-001',
      empresaId: empresaTritech,
      tipoMovimento: 'ENTRADA_COMPRA',
      produtoId: 'prod-chapa-1020-475',
      codigoProduto: 'MP-CH-1020-4.75',
      descricaoProduto: 'Chapa Aço Carbono SAE 1020 4.75mm x 1500 x 3000',
      quantidade: 40,
      unidadeMedida: 'CHAPA',
      custoUnitario: 1141.72,
      custoTotal: 45668.8,
      almoxarifadoDestinoId: almoxChapasTritech.id,
      localizacaoDestinoId: locRackChapa1.id,
      loteId: loteUsiminas1020.id,
      numeroLote: loteUsiminas1020.numeroLote,
      documentoOrigemTipo: 'NOTA_FISCAL_ENTRADA',
      documentoOrigemNumero: 'NF-e 882194',
      motivo: 'Recebimento de compra conforme Pedido de Compras PC-2026-012',
      estornado: false,
      usuarioId: 'user-03',
      usuarioNome: 'Almoxarife Recebimento',
      exigeAprovacao: false,
      dataHora: '2026-01-15T09:00:00.000Z',
      hashAuditoria: this.calcularHashMovimento({
        id: 'mov-ent-001',
        empresaId: empresaTritech,
        tipo: 'ENTRADA_COMPRA',
        qtd: 40,
        data: '2026-01-15T09:00:00.000Z',
      }),
    };

    this.movimentos.push(movEntrada1);

    // 11. Inventário Inicial
    const invSessao1: InventarioSessao = {
      id: 'inv-sessao-2026-01',
      empresaId: empresaTritech,
      numeroSessao: 'INV-2026-001',
      titulo: 'Inventário Geral Trimestral de Matéria-Prima & Chapas',
      tipo: 'POR_ALMOXARIFADO',
      almoxarifadoId: almoxChapasTritech.id,
      status: 'CONCILIADO',
      dataInicio: '2026-01-31T08:00:00.000Z',
      dataEncerramento: '2026-01-31T18:00:00.000Z',
      responsavelNome: 'Carlos Eduardo Almoxarife',
      totalItensContados: 2,
      totalDivergenciasEncontradas: 1,
      impactoFinanceiroTotalDivergencia: 0,
      observacoes: 'Contagem geral de chapas 100% conciliada com reconferência física.',
    };

    this.inventarios.push(invSessao1);

    const contagensItem1: InventarioContagemItem[] = [
      {
        id: 'inv-item-01',
        inventarioId: invSessao1.id,
        produtoId: 'prod-chapa-1020-475',
        codigoProduto: 'MP-CH-1020-4.75',
        descricaoProduto: 'Chapa Aço Carbono SAE 1020 4.75mm x 1500 x 3000',
        unidadeMedida: 'CHAPA',
        almoxarifadoId: almoxChapasTritech.id,
        localizacaoId: locRackChapa1.id,
        loteId: loteUsiminas1020.id,
        numeroLote: loteUsiminas1020.numeroLote,
        saldoSistemaQuantidade: 40,
        primeiraContagemQuantidade: 39,
        segundaContagemQuantidade: 40,
        contagemFinalApurada: 40,
        divergenciaQuantidade: 0,
        percentualDivergencia: 0,
        custoMedioUnitario: 1141.72,
        impactoFinanceiroDivergencia: 0,
        statusItem: 'CONFERIDO_OK',
        justificativaDivergencia: 'Reconferência confirmou 40 chapas físicas no rack vertical A.',
        aprovadoPor: 'Gerente Industrial',
      },
    ];

    this.contagensInventario.set(invSessao1.id, contagensItem1);
  }

  private calcularHashMovimento(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Métodos de Consulta
  public getAlmoxarifados(empresaId: string): Almoxarifado[] {
    return this.almoxarifados.filter((a) => a.empresaId === empresaId);
  }

  public getLocalizacoes(empresaId: string, almoxarifadoId?: string): LocalizacaoEstoque[] {
    return this.localizacoes.filter(
      (l) => l.empresaId === empresaId && (!almoxarifadoId || l.almoxarifadoId === almoxarifadoId)
    );
  }

  public getSaldos(empresaId: string, filtros?: { almoxarifadoId?: string; status?: string; categoria?: string; search?: string }): SaldoEstoque[] {
    let result = this.saldos.filter((s) => s.empresaId === empresaId);

    if (filtros?.almoxarifadoId) {
      result = result.filter((s) => s.almoxarifadoId === filtros.almoxarifadoId);
    }
    if (filtros?.status) {
      result = result.filter((s) => s.statusEstoque === filtros.status);
    }
    if (filtros?.categoria) {
      result = result.filter((s) => s.categoriaItem === filtros.categoria);
    }
    if (filtros?.search) {
      const q = filtros.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.codigoProduto.toLowerCase().includes(q) ||
          s.descricaoProduto.toLowerCase().includes(q) ||
          (s.numeroLote && s.numeroLote.toLowerCase().includes(q))
      );
    }
    return result;
  }

  public getMovimentos(empresaId: string, filtros?: { produtoId?: string; loteId?: string; tipo?: string }): MovimentoEstoque[] {
    let list = this.movimentos.filter((m) => m.empresaId === empresaId);
    if (filtros?.produtoId) list = list.filter((m) => m.produtoId === filtros.produtoId);
    if (filtros?.loteId) list = list.filter((m) => m.loteId === filtros.loteId);
    if (filtros?.tipo) list = list.filter((m) => m.tipoMovimento === filtros.tipo);
    return list.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  public getLotes(empresaId: string): LoteEstoque[] {
    return this.lotes.filter((l) => l.empresaId === empresaId);
  }

  public getReservas(empresaId: string): ReservaEstoque[] {
    return this.reservas.filter((r) => r.empresaId === empresaId);
  }

  public getChapas(empresaId: string): ChapaEstoque[] {
    return this.chapas.filter((c) => c.empresaId === empresaId);
  }

  public getRetalhos(empresaId: string): RetalhoChapa[] {
    return this.retalhos.filter((r) => r.empresaId === empresaId);
  }

  public getSucatas(empresaId: string): RegistroSucata[] {
    return this.sucatas.filter((s) => s.empresaId === empresaId);
  }

  public getInventarios(empresaId: string): InventarioSessao[] {
    return this.inventarios.filter((i) => i.empresaId === empresaId);
  }

  public getContagensInventario(inventarioId: string): InventarioContagemItem[] {
    return this.contagensInventario.get(inventarioId) || [];
  }

  public getPoliticaEstoque(empresaId: string): PoliticaEstoqueEmpresa {
    let pol = this.politicas.get(empresaId);
    if (!pol) {
      pol = {
        empresaId,
        permiteSaldoNegativo: false,
        limiteValorAjusteSemAprovacao: 1500,
        limitePercentualDivergenciaSemAprovacao: 10,
        exigeLoteObrigatorioParaChapas: true,
        permiteConsumoRetalhoSemOp: false,
      };
      this.politicas.set(empresaId, pol);
    }
    return pol;
  }

  public atualizarPoliticaEstoque(empresaId: string, dados: Partial<PoliticaEstoqueEmpresa>): PoliticaEstoqueEmpresa {
    const atual = this.getPoliticaEstoque(empresaId);
    const atualizada = { ...atual, ...dados };
    this.politicas.set(empresaId, atualizada);
    return atualizada;
  }

  // Execução de Movimentação com Validação de Saldo Negativo e Auditoria
  public executarMovimento(
    empresaId: string,
    params: {
      tipoMovimento: TipoMovimentoEstoque;
      produtoId: string;
      codigoProduto: string;
      descricaoProduto: string;
      quantidade: number;
      unidadeMedida: string;
      custoUnitario?: number;
      almoxarifadoOrigemId?: string;
      localizacaoOrigemId?: string;
      almoxarifadoDestinoId?: string;
      localizacaoDestinoId?: string;
      loteId?: string;
      numeroLote?: string;
      documentoOrigemTipo: TipoDocumentoOrigem;
      documentoOrigemId?: string;
      documentoOrigemNumero?: string;
      chaveAcessoNfe?: string;
      nfeItemId?: string;
      motivo: string;
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
      aprovadoPor?: string;
      statusEstoqueDestino?: any;
    }
  ): { sucesso: boolean; movimento: MovimentoEstoque; saldoAtualizado: SaldoEstoque; mensagem: string } {
    if (!params.motivo || params.motivo.trim().length === 0) {
      throw new Error('Regra de Estoque: Qualquer ajuste ou movimentação exige motivo obrigatório.');
    }
    if (params.quantidade <= 0) {
      throw new Error('A quantidade do movimento deve ser maior que zero.');
    }

    const politica = this.getPoliticaEstoque(empresaId);
    const isEntrada =
      params.tipoMovimento.startsWith('ENTRADA') ||
      params.tipoMovimento === 'DESBLOQUEIO_QUALIDADE';
    const isSaida =
      params.tipoMovimento.startsWith('SAIDA') ||
      params.tipoMovimento === 'BLOQUEIO_QUALIDADE';

    // Localizar ou criar registro de saldo no almoxarifado/localização/lote correspondente
    const targetAlmoxId = isEntrada ? params.almoxarifadoDestinoId : params.almoxarifadoOrigemId;
    const targetLocId = isEntrada ? params.localizacaoDestinoId : params.localizacaoOrigemId;

    if (!targetAlmoxId) {
      throw new Error('Almoxarifado não especificado para a movimentação.');
    }

    const almox = this.almoxarifados.find((a) => a.id === targetAlmoxId);
    if (!almox) throw new Error('Almoxarifado não encontrado.');

    let saldo = this.saldos.find(
      (s) =>
        s.empresaId === empresaId &&
        s.produtoId === params.produtoId &&
        s.almoxarifadoId === targetAlmoxId &&
        (!targetLocId || s.localizacaoId === targetLocId) &&
        (!params.loteId || s.loteId === params.loteId)
    );

    const custoUnit = params.custoUnitario || (saldo ? saldo.custoMedioUnitario : 10.0);
    const custoTotal = params.quantidade * custoUnit;

    // Se for saída, validar regra de saldo negativo da empresa
    if (isSaida) {
      const saldoFisicoAtual = saldo ? saldo.quantidadeFisica : 0;
      const novoSaldoFisico = saldoFisicoAtual - params.quantidade;

      if (novoSaldoFisico < 0 && !politica.permiteSaldoNegativo) {
        throw new Error(
          `Política de Estoque da Empresa Violada: Saldo negativo não permitido para ${params.codigoProduto}. Saldo Físico Atual: ${saldoFisicoAtual}, Solicitado: ${params.quantidade}.`
        );
      }
    }

    // Verificar se exige alçada de aprovação (ajuste crítico)
    const ehAjuste = params.tipoMovimento.includes('AJUSTE');
    const exigeAprovacao =
      ehAjuste &&
      (custoTotal > politica.limiteValorAjusteSemAprovacao) &&
      !params.aprovadoPor;

    if (exigeAprovacao) {
      throw new Error(
        `Ajuste Crítico de Estoque: O valor de ${custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} excede a alçada permitida de ${politica.limiteValorAjusteSemAprovacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e exige aprovação de alçada de Gerência/Diretoria.`
      );
    }

    const dataHora = new Date().toISOString();

    // Criar saldo se não existir
    if (!saldo) {
      const loc = this.localizacoes.find((l) => l.id === targetLocId);
      saldo = {
        id: `saldo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        empresaId,
        produtoId: params.produtoId,
        codigoProduto: params.codigoProduto,
        descricaoProduto: params.descricaoProduto,
        unidadeMedida: params.unidadeMedida,
        almoxarifadoId: targetAlmoxId,
        almoxarifadoCodigo: almox.codigo,
        almoxarifadoNome: almox.nome,
        localizacaoId: targetLocId || 'loc-padrao',
        localizacaoCodigo: loc ? loc.codigo : 'GERAL',
        loteId: params.loteId,
        numeroLote: params.numeroLote,
        statusEstoque: params.statusEstoqueDestino || 'DISPONIVEL',
        quantidadeFisica: 0,
        quantidadeReservada: 0,
        quantidadeBloqueada: 0,
        quantidadeEmInspecao: 0,
        quantidadeDisponivel: 0,
        custoMedioUnitario: custoUnit,
        custoTotal: 0,
        categoriaItem: 'CHAPA_ACO',
        dataUltimoMovimento: dataHora,
        atualizadoEm: dataHora,
      };
      this.saldos.push(saldo);
    }

    // Atualizar quantidades do saldo
    if (params.tipoMovimento.startsWith('ENTRADA')) {
      saldo.quantidadeFisica += params.quantidade;
      saldo.custoTotal = saldo.quantidadeFisica * saldo.custoMedioUnitario;
    } else if (params.tipoMovimento.startsWith('SAIDA')) {
      saldo.quantidadeFisica -= params.quantidade;
      saldo.custoTotal = saldo.quantidadeFisica * saldo.custoMedioUnitario;
    } else if (params.tipoMovimento === 'BLOQUEIO_QUALIDADE') {
      saldo.quantidadeBloqueada += params.quantidade;
    } else if (params.tipoMovimento === 'DESBLOQUEIO_QUALIDADE') {
      saldo.quantidadeBloqueada = Math.max(0, saldo.quantidadeBloqueada - params.quantidade);
    }

    // Regra: Disponibilidade = Física - Reservada - Bloqueada - Inspeção
    saldo.quantidadeDisponivel =
      saldo.quantidadeFisica - saldo.quantidadeReservada - saldo.quantidadeBloqueada - saldo.quantidadeEmInspecao;
    saldo.dataUltimoMovimento = dataHora;
    saldo.atualizadoEm = dataHora;

    // Atualizar saldo do lote se houver
    if (params.loteId) {
      const lote = this.lotes.find((l) => l.id === params.loteId);
      if (lote) {
        if (params.tipoMovimento.startsWith('ENTRADA')) {
          lote.quantidadeAtualSaldo += params.quantidade;
        } else if (params.tipoMovimento.startsWith('SAIDA')) {
          lote.quantidadeAtualSaldo = Math.max(0, lote.quantidadeAtualSaldo - params.quantidade);
        }
      }
    }

    // Gerar registro imutável no ledger
    const movimentoId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const hashAuditoria = this.calcularHashMovimento({
      id: movimentoId,
      empresaId,
      tipo: params.tipoMovimento,
      qtd: params.quantidade,
      custoTotal,
      dataHora,
      usuarioId: params.usuarioId,
    });

    const movimento: MovimentoEstoque = {
      id: movimentoId,
      empresaId,
      tipoMovimento: params.tipoMovimento,
      produtoId: params.produtoId,
      codigoProduto: params.codigoProduto,
      descricaoProduto: params.descricaoProduto,
      quantidade: params.quantidade,
      unidadeMedida: params.unidadeMedida,
      custoUnitario: custoUnit,
      custoTotal,
      almoxarifadoOrigemId: params.almoxarifadoOrigemId,
      localizacaoOrigemId: params.localizacaoOrigemId,
      almoxarifadoDestinoId: params.almoxarifadoDestinoId,
      localizacaoDestinoId: params.localizacaoDestinoId,
      loteId: params.loteId,
      numeroLote: params.numeroLote,
      documentoOrigemTipo: params.documentoOrigemTipo,
      documentoOrigemId: params.documentoOrigemId,
      documentoOrigemNumero: params.documentoOrigemNumero,
      chaveAcessoNfe: params.chaveAcessoNfe,
      nfeItemId: params.nfeItemId,
      motivo: params.motivo,
      observacoes: params.observacoes,
      estornado: false,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      exigeAprovacao: false,
      aprovadoPor: params.aprovadoPor,
      dataHora,
      hashAuditoria,
    };

    this.movimentos.push(movimento);

    return {
      sucesso: true,
      movimento,
      saldoAtualizado: saldo,
      mensagem: `Movimentação ${params.tipoMovimento} de ${params.quantidade} ${params.unidadeMedida} executada com sucesso.`,
    };
  }

  // Estorno / Reversão de Movimentação com Rastreabilidade
  public estornarMovimento(
    empresaId: string,
    movimentoId: string,
    motivoEstorno: string,
    usuario: { id: string; nome: string }
  ): { sucesso: boolean; movimentoEstorno: MovimentoEstoque; mensagem: string } {
    if (!motivoEstorno || motivoEstorno.trim().length === 0) {
      throw new Error('O estorno de movimentação exige justificativa / motivo obrigatório.');
    }

    const movOriginal = this.movimentos.find((m) => m.id === movimentoId && m.empresaId === empresaId);
    if (!movOriginal) {
      throw new Error('Movimentação original não encontrada.');
    }
    if (movOriginal.estornado) {
      throw new Error('Esta movimentação já foi estornada anteriormente.');
    }
    if (movOriginal.tipoMovimento === 'REVERSAO_ESTORNO') {
      throw new Error('Não é permitido estornar uma operação que já é um estorno.');
    }

    const dataHora = new Date().toISOString();
    const idEstorno = `mov-estorno-${Date.now()}`;

    // Reverter o impacto no saldo
    const targetAlmoxId = movOriginal.tipoMovimento.startsWith('ENTRADA')
      ? movOriginal.almoxarifadoDestinoId
      : movOriginal.almoxarifadoOrigemId;

    const saldo = this.saldos.find(
      (s) =>
        s.empresaId === empresaId &&
        s.produtoId === movOriginal.produtoId &&
        s.almoxarifadoId === targetAlmoxId &&
        (!movOriginal.loteId || s.loteId === movOriginal.loteId)
    );

    if (saldo) {
      if (movOriginal.tipoMovimento.startsWith('ENTRADA')) {
        saldo.quantidadeFisica -= movOriginal.quantidade;
      } else if (movOriginal.tipoMovimento.startsWith('SAIDA')) {
        saldo.quantidadeFisica += movOriginal.quantidade;
      } else if (movOriginal.tipoMovimento === 'BLOQUEIO_QUALIDADE') {
        saldo.quantidadeBloqueada -= movOriginal.quantidade;
      } else if (movOriginal.tipoMovimento === 'DESBLOQUEIO_QUALIDADE') {
        saldo.quantidadeBloqueada += movOriginal.quantidade;
      }

      saldo.quantidadeDisponivel =
        saldo.quantidadeFisica - saldo.quantidadeReservada - saldo.quantidadeBloqueada - saldo.quantidadeEmInspecao;
      saldo.custoTotal = saldo.quantidadeFisica * saldo.custoMedioUnitario;
      saldo.dataUltimoMovimento = dataHora;
      saldo.atualizadoEm = dataHora;
    }

    // Criar movimento de estorno
    const hashAuditoria = this.calcularHashMovimento({
      id: idEstorno,
      empresaId,
      tipo: 'REVERSAO_ESTORNO',
      movimentoOriginalId: movimentoId,
      qtd: movOriginal.quantidade,
      dataHora,
    });

    const movimentoEstorno: MovimentoEstoque = {
      id: idEstorno,
      empresaId,
      tipoMovimento: 'REVERSAO_ESTORNO',
      produtoId: movOriginal.produtoId,
      codigoProduto: movOriginal.codigoProduto,
      descricaoProduto: `[ESTORNO] ${movOriginal.descricaoProduto}`,
      quantidade: movOriginal.quantidade,
      unidadeMedida: movOriginal.unidadeMedida,
      custoUnitario: movOriginal.custoUnitario,
      custoTotal: movOriginal.custoTotal,
      almoxarifadoOrigemId: movOriginal.almoxarifadoDestinoId,
      almoxarifadoDestinoId: movOriginal.almoxarifadoOrigemId,
      loteId: movOriginal.loteId,
      numeroLote: movOriginal.numeroLote,
      documentoOrigemTipo: movOriginal.documentoOrigemTipo,
      documentoOrigemId: movOriginal.documentoOrigemId,
      documentoOrigemNumero: movOriginal.documentoOrigemNumero,
      motivo: `Estorno do movimento #${movOriginal.id}: ${motivoEstorno}`,
      movimentoOriginalId: movOriginal.id,
      estornado: false,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      exigeAprovacao: false,
      dataHora,
      hashAuditoria,
    };

    // Marcar original como estornado
    movOriginal.estornado = true;
    movOriginal.estornadoPorMovimentoId = idEstorno;

    this.movimentos.push(movimentoEstorno);

    return {
      sucesso: true,
      movimentoEstorno,
      mensagem: `Movimento ${movimentoId} estornado com sucesso através do movimento de reversão ${idEstorno}.`,
    };
  }

  // Gestão de Reservas (Reduz Disponibilidade, NÃO Saldo Físico)
  public criarReserva(
    empresaId: string,
    params: {
      produtoId: string;
      codigoProduto: string;
      descricaoProduto: string;
      almoxarifadoId: string;
      localizacaoId?: string;
      loteId?: string;
      quantidadeReservada: number;
      unidadeMedida: string;
      tipoOrigem: 'PEDIDO_VENDA' | 'ORDEM_PRODUCAO' | 'RESERVA_MANUAL';
      documentoOrigemId: string;
      documentoOrigemNumero: string;
      usuarioId: string;
      usuarioNome: string;
      observacoes?: string;
    }
  ): { sucesso: boolean; reserva: ReservaEstoque; saldoAtualizado: SaldoEstoque; mensagem: string } {
    if (params.quantidadeReservada <= 0) {
      throw new Error('A quantidade da reserva deve ser maior que zero.');
    }

    const saldo = this.saldos.find(
      (s) =>
        s.empresaId === empresaId &&
        s.produtoId === params.produtoId &&
        s.almoxarifadoId === params.almoxarifadoId &&
        (!params.loteId || s.loteId === params.loteId)
    );

    if (!saldo) {
      throw new Error(`Item ${params.codigoProduto} não possui registro de estoque no almoxarifado selecionado.`);
    }

    // Regra: Reserva não pode exceder o saldo disponível
    if (params.quantidadeReservada > saldo.quantidadeDisponivel) {
      throw new Error(
        `Saldo disponível insuficiente para reserva do item ${params.codigoProduto}. Disponível: ${saldo.quantidadeDisponivel} ${params.unidadeMedida}, Solicitado para Reserva: ${params.quantidadeReservada}.`
      );
    }

    const dataHora = new Date().toISOString();
    const reservaId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const reserva: ReservaEstoque = {
      id: reservaId,
      empresaId,
      produtoId: params.produtoId,
      codigoProduto: params.codigoProduto,
      descricaoProduto: params.descricaoProduto,
      almoxarifadoId: params.almoxarifadoId,
      localizacaoId: params.localizacaoId || saldo.localizacaoId,
      loteId: params.loteId,
      quantidadeReservada: params.quantidadeReservada,
      unidadeMedida: params.unidadeMedida,
      tipoOrigem: params.tipoOrigem,
      documentoOrigemId: params.documentoOrigemId,
      documentoOrigemNumero: params.documentoOrigemNumero,
      statusReserva: 'ATIVA',
      criadoEm: dataHora,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      observacoes: params.observacoes,
    };

    this.reservas.push(reserva);

    // Atualizar saldo: Aumenta reservado, reduz disponível, saldo FÍSICO PERMANECE INTACTO!
    saldo.quantidadeReservada += params.quantidadeReservada;
    saldo.quantidadeDisponivel =
      saldo.quantidadeFisica - saldo.quantidadeReservada - saldo.quantidadeBloqueada - saldo.quantidadeEmInspecao;
    saldo.atualizadoEm = dataHora;

    // Gerar registro no histórico
    const movReserva: MovimentoEstoque = {
      id: `mov-res-${Date.now()}`,
      empresaId,
      tipoMovimento: 'RESERVA_PEDIDO',
      produtoId: params.produtoId,
      codigoProduto: params.codigoProduto,
      descricaoProduto: `Reserva para ${params.documentoOrigemNumero}`,
      quantidade: params.quantidadeReservada,
      unidadeMedida: params.unidadeMedida,
      custoUnitario: saldo.custoMedioUnitario,
      custoTotal: params.quantidadeReservada * saldo.custoMedioUnitario,
      almoxarifadoOrigemId: params.almoxarifadoId,
      loteId: params.loteId,
      numeroLote: saldo.numeroLote,
      documentoOrigemTipo: params.tipoOrigem === 'PEDIDO_VENDA' ? 'PEDIDO_VENDA' : 'ORDEM_PRODUCAO',
      documentoOrigemId: params.documentoOrigemId,
      documentoOrigemNumero: params.documentoOrigemNumero,
      motivo: `Reserva de estoque vinculada a ${params.documentoOrigemNumero}`,
      estornado: false,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
      exigeAprovacao: false,
      dataHora,
      hashAuditoria: this.calcularHashMovimento({ id: reservaId, reserva: true, dataHora }),
    };
    this.movimentos.push(movReserva);

    return {
      sucesso: true,
      reserva,
      saldoAtualizado: saldo,
      mensagem: `Reserva de ${params.quantidadeReservada} ${params.unidadeMedida} criada com sucesso para ${params.documentoOrigemNumero}. Saldo físico mantido em ${saldo.quantidadeFisica} e disponível atualizado para ${saldo.quantidadeDisponivel}.`,
    };
  }

  public cancelarReserva(
    empresaId: string,
    reservaId: string,
    motivo: string,
    usuario: { id: string; nome: string }
  ): { sucesso: boolean; mensagem: string } {
    const reserva = this.reservas.find((r) => r.id === reservaId && r.empresaId === empresaId);
    if (!reserva) throw new Error('Reserva não encontrada.');
    if (reserva.statusReserva !== 'ATIVA') throw new Error('Apenas reservas ativas podem ser canceladas.');

    const saldo = this.saldos.find(
      (s) =>
        s.empresaId === empresaId &&
        s.produtoId === reserva.produtoId &&
        s.almoxarifadoId === reserva.almoxarifadoId
    );

    if (saldo) {
      saldo.quantidadeReservada = Math.max(0, saldo.quantidadeReservada - reserva.quantidadeReservada);
      saldo.quantidadeDisponivel =
        saldo.quantidadeFisica - saldo.quantidadeReservada - saldo.quantidadeBloqueada - saldo.quantidadeEmInspecao;
      saldo.atualizadoEm = new Date().toISOString();
    }

    reserva.statusReserva = 'CANCELADA';

    // Gerar registro no histórico
    const movCancel: MovimentoEstoque = {
      id: `mov-can-res-${Date.now()}`,
      empresaId,
      tipoMovimento: 'CANCELAMENTO_RESERVA',
      produtoId: reserva.produtoId,
      codigoProduto: reserva.codigoProduto,
      descricaoProduto: `Cancelamento de Reserva ${reserva.documentoOrigemNumero}`,
      quantidade: reserva.quantidadeReservada,
      unidadeMedida: reserva.unidadeMedida,
      custoUnitario: 0,
      custoTotal: 0,
      almoxarifadoOrigemId: reserva.almoxarifadoId,
      documentoOrigemTipo: 'PEDIDO_VENDA',
      documentoOrigemNumero: reserva.documentoOrigemNumero,
      motivo: `Cancelamento de reserva: ${motivo}`,
      estornado: false,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      exigeAprovacao: false,
      dataHora: new Date().toISOString(),
      hashAuditoria: this.calcularHashMovimento({ id: reservaId, cancelada: true }),
    };
    this.movimentos.push(movCancel);

    return { sucesso: true, mensagem: `Reserva ${reservaId} cancelada com sucesso.` };
  }

  // Gestão Especializada de Chapas
  public cadastrarChapa(
    empresaId: string,
    params: {
      codigoChapa: string;
      produtoId: string;
      material: string;
      espessuraMm: number;
      larguraMm: number;
      comprimentoMm: number;
      loteId: string;
      custoPorKg: number;
      almoxarifadoId: string;
      localizacaoId: string;
      observacoes?: string;
    }
  ): ChapaEstoque {
    const lote = this.lotes.find((l) => l.id === params.loteId && l.empresaId === empresaId);
    if (!lote) throw new Error('Lote/Corrida de aço não encontrado.');

    const loc = this.localizacoes.find((l) => l.id === params.localizacaoId && l.empresaId === empresaId);
    if (!loc) throw new Error('Localização física não encontrada.');

    // Cálculo da Área em m² e Peso Teórico
    const areaM2 = (params.larguraMm * params.comprimentoMm) / 1000000;
    const densidade = params.material.includes('Inox') ? 7930 : params.material.includes('Alumínio') ? 2700 : 7850;
    const pesoKg = Number(((areaM2 * params.espessuraMm * densidade) / 1000).toFixed(2));
    const custoTotalChapa = Number((pesoKg * params.custoPorKg).toFixed(2));

    const chapa: ChapaEstoque = {
      id: `chapa-${Date.now()}`,
      empresaId,
      codigoChapa: params.codigoChapa,
      produtoId: params.produtoId,
      material: params.material,
      espessuraMm: params.espessuraMm,
      larguraMm: params.larguraMm,
      comprimentoMm: params.comprimentoMm,
      areaM2,
      pesoKg,
      densidadeMaterialKgM3: densidade,
      loteId: lote.id,
      numeroLote: lote.numeroLote,
      numeroCorrida: lote.numeroCorridaAco,
      custoPorKg: params.custoPorKg,
      custoTotalChapa,
      almoxarifadoId: params.almoxarifadoId,
      localizacaoId: loc.id,
      localizacaoCodigo: loc.codigo,
      status: 'DISPONIVEL',
      dataRecebimento: new Date().toISOString(),
      observacoes: params.observacoes,
    };

    this.chapas.push(chapa);

    // Movimentar entrada no estoque
    this.executarMovimento(empresaId, {
      tipoMovimento: 'ENTRADA_COMPRA',
      produtoId: params.produtoId,
      codigoProduto: params.codigoChapa,
      descricaoProduto: `Chapa ${params.material} ${params.espessuraMm}mm (${params.larguraMm}x${params.comprimentoMm}mm)`,
      quantidade: 1,
      unidadeMedida: 'CHAPA',
      custoUnitario: custoTotalChapa,
      almoxarifadoDestinoId: params.almoxarifadoId,
      localizacaoDestinoId: params.localizacaoId,
      loteId: lote.id,
      numeroLote: lote.numeroLote,
      documentoOrigemTipo: 'NOTA_FISCAL_ENTRADA',
      documentoOrigemNumero: lote.certificadoUsinaNumero,
      motivo: 'Cadastro e tombamento de chapa individualizada no estoque.',
      usuarioId: 'user-01',
      usuarioNome: 'Almoxarifado Industrial',
    });

    return chapa;
  }

  // Gestão de Retalhos / Sobras Úteis de Laser e Plasma
  public cadastrarRetalho(
    empresaId: string,
    params: {
      codigoRetalho: string;
      loteOrigemId: string;
      chapaMaeId?: string;
      ordemProducaoOrigemId?: string;
      material: string;
      espessuraMm: number;
      larguraMm: number;
      comprimentoMm: number;
      formatoGeometrico: any;
      aproveitamentoEstimadoPerc: number;
      almoxarifadoId: string;
      localizacaoId: string;
      custoUnitarioKg: number;
      observacoes?: string;
    }
  ): RetalhoChapa {
    const lote = this.lotes.find((l) => l.id === params.loteOrigemId && l.empresaId === empresaId);
    if (!lote) throw new Error('Lote de origem não localizado.');

    const loc = this.localizacoes.find((l) => l.id === params.localizacaoId && l.empresaId === empresaId);
    if (!loc) throw new Error('Localização para retalhos não encontrada.');

    const areaM2 = (params.larguraMm * params.comprimentoMm) / 1000000;
    const densidade = params.material.includes('Inox') ? 7930 : 7850;
    const pesoKg = Number(((areaM2 * params.espessuraMm * densidade) / 1000).toFixed(2));
    const custoEstimadoTotal = Number((pesoKg * params.custoUnitarioKg).toFixed(2));

    const retalho: RetalhoChapa = {
      id: `ret-${Date.now()}`,
      empresaId,
      codigoRetalho: params.codigoRetalho,
      loteOrigemId: lote.id,
      numeroLoteOrigem: lote.numeroLote,
      chapaMaeId: params.chapaMaeId,
      ordemProducaoOrigemId: params.ordemProducaoOrigemId,
      material: params.material,
      espessuraMm: params.espessuraMm,
      larguraMm: params.larguraMm,
      comprimentoMm: params.comprimentoMm,
      formatoGeometrico: params.formatoGeometrico,
      areaM2,
      pesoKg,
      aproveitamentoEstimadoPerc: params.aproveitamentoEstimadoPerc,
      almoxarifadoId: params.almoxarifadoId,
      localizacaoId: loc.id,
      localizacaoCodigo: loc.codigo,
      statusRetalho: 'DISPONIVEL',
      custoUnitarioKg: params.custoUnitarioKg,
      custoEstimadoTotal,
      dataCriacao: new Date().toISOString(),
      observacoes: params.observacoes,
    };

    this.retalhos.push(retalho);

    // Entrada no estoque de retalhos
    this.executarMovimento(empresaId, {
      tipoMovimento: 'ENTRADA_SOBRA_RETALHO',
      produtoId: `prod-ret-${params.material}-${params.espessuraMm}`,
      codigoProduto: params.codigoRetalho,
      descricaoProduto: `Retalho ${params.material} ${params.espessuraMm}mm (${params.larguraMm}x${params.comprimentoMm}mm)`,
      quantidade: pesoKg,
      unidadeMedida: 'KG',
      custoUnitario: params.custoUnitarioKg,
      almoxarifadoDestinoId: params.almoxarifadoId,
      localizacaoDestinoId: params.localizacaoId,
      loteId: lote.id,
      numeroLote: lote.numeroLote,
      documentoOrigemTipo: 'ORDEM_PRODUCAO',
      documentoOrigemNumero: params.ordemProducaoOrigemId || 'OP-CORTE',
      motivo: 'Geração de retalho aproveitável a partir de corte a laser.',
      usuarioId: 'user-op',
      usuarioNome: 'Operador Laser/Plasma',
    });

    return retalho;
  }

  // Gestão de Sucatas Metálicas e Caçambas
  public registrarSucata(
    empresaId: string,
    params: {
      codigoSucata: string;
      tipoMaterial: any;
      pesoKg: number;
      origemDescarte: any;
      ordemProducaoId?: string;
      almoxarifadoId: string;
      localizacaoId: string;
      cacambaNumero?: string;
      valorEstimadoVendaPorKg: number;
      responsavelId: string;
      responsavelNome: string;
      observacoes?: string;
    }
  ): RegistroSucata {
    if (params.pesoKg <= 0) throw new Error('O peso da sucata deve ser maior que zero.');

    const valorTotalEstimado = Number((params.pesoKg * params.valorEstimadoVendaPorKg).toFixed(2));

    const sucata: RegistroSucata = {
      id: `suc-${Date.now()}`,
      empresaId,
      codigoSucata: params.codigoSucata,
      tipoMaterial: params.tipoMaterial,
      pesoKg: params.pesoKg,
      origemDescarte: params.origemDescarte,
      ordemProducaoId: params.ordemProducaoId,
      almoxarifadoId: params.almoxarifadoId,
      localizacaoId: params.localizacaoId,
      cacambaNumero: params.cacambaNumero,
      valorEstimadoVendaPorKg: params.valorEstimadoVendaPorKg,
      valorTotalEstimado,
      dataGeracao: new Date().toISOString(),
      statusSucata: 'ARMAZENADO',
      responsavelId: params.responsavelId,
      responsavelNome: params.responsavelNome,
      observacoes: params.observacoes,
    };

    this.sucatas.push(sucata);

    // Movimentar entrada no estoque de sucata
    this.executarMovimento(empresaId, {
      tipoMovimento: 'SAIDA_SUCATEAMENTO',
      produtoId: 'prod-sucata-met',
      codigoProduto: params.codigoSucata,
      descricaoProduto: `Sucata Metálica ${params.tipoMaterial}`,
      quantidade: params.pesoKg,
      unidadeMedida: 'KG',
      custoUnitario: params.valorEstimadoVendaPorKg,
      almoxarifadoDestinoId: params.almoxarifadoId,
      localizacaoDestinoId: params.localizacaoId,
      documentoOrigemTipo: params.ordemProducaoId ? 'ORDEM_PRODUCAO' : 'AJUSTE_MANUAL',
      documentoOrigemNumero: params.ordemProducaoId || 'DESCARTE-CORTE',
      motivo: `Pesagem e destinação para caçamba de sucata: ${params.origemDescarte}`,
      usuarioId: params.responsavelId,
      usuarioNome: params.responsavelNome,
    });

    return sucata;
  }

  // Sessões de Inventário, Contagem e Apuração de Divergências
  public iniciarInventario(
    empresaId: string,
    params: {
      titulo: string;
      tipo: any;
      almoxarifadoId?: string;
      responsavelNome: string;
      observacoes?: string;
    }
  ): { sessao: InventarioSessao; itens: InventarioContagemItem[] } {
    const sessaoId = `inv-${Date.now()}`;
    const numeroSessao = `INV-2026-${String(this.inventarios.length + 1).padStart(3, '0')}`;

    const sessao: InventarioSessao = {
      id: sessaoId,
      empresaId,
      numeroSessao,
      titulo: params.titulo,
      tipo: params.tipo,
      almoxarifadoId: params.almoxarifadoId,
      status: 'EM_CONTAGEM',
      dataInicio: new Date().toISOString(),
      responsavelNome: params.responsavelNome,
      totalItensContados: 0,
      totalDivergenciasEncontradas: 0,
      impactoFinanceiroTotalDivergencia: 0,
      observacoes: params.observacoes,
    };

    // Obter saldo dos itens no escopo para snapshot de contagem cega
    const saldosEscopo = this.saldos.filter(
      (s) => s.empresaId === empresaId && (!params.almoxarifadoId || s.almoxarifadoId === params.almoxarifadoId)
    );

    const itens: InventarioContagemItem[] = saldosEscopo.map((s) => ({
      id: `inv-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      inventarioId: sessaoId,
      produtoId: s.produtoId,
      codigoProduto: s.codigoProduto,
      descricaoProduto: s.descricaoProduto,
      unidadeMedida: s.unidadeMedida,
      almoxarifadoId: s.almoxarifadoId,
      localizacaoId: s.localizacaoId,
      loteId: s.loteId,
      numeroLote: s.numeroLote,
      saldoSistemaQuantidade: s.quantidadeFisica,
      primeiraContagemQuantidade: s.quantidadeFisica, // Inicializado para contagem
      contagemFinalApurada: s.quantidadeFisica,
      divergenciaQuantidade: 0,
      percentualDivergencia: 0,
      custoMedioUnitario: s.custoMedioUnitario,
      impactoFinanceiroDivergencia: 0,
      statusItem: 'CONFERIDO_OK',
    }));

    this.inventarios.push(sessao);
    this.contagensInventario.set(sessaoId, itens);

    return { sessao, itens };
  }

  public registrarContagemInventario(
    empresaId: string,
    inventarioId: string,
    contagens: { itemId: string; contagemFisica: number; justificativa?: string }[]
  ): { sessao: InventarioSessao; itens: InventarioContagemItem[] } {
    const sessao = this.inventarios.find((i) => i.id === inventarioId && i.empresaId === empresaId);
    if (!sessao) throw new Error('Sessão de inventário não encontrada.');

    const itens = this.contagensInventario.get(inventarioId) || [];
    let totalDivergencias = 0;
    let impactoTotal = 0;

    for (const c of contagens) {
      const item = itens.find((i) => i.id === c.itemId);
      if (item) {
        item.primeiraContagemQuantidade = c.contagemFisica;
        item.contagemFinalApurada = c.contagemFisica;
        item.divergenciaQuantidade = item.contagemFinalApurada - item.saldoSistemaQuantidade;
        item.percentualDivergencia =
          item.saldoSistemaQuantidade > 0
            ? Number(((item.divergenciaQuantidade / item.saldoSistemaQuantidade) * 100).toFixed(2))
            : item.contagemFinalApurada > 0 ? 100 : 0;
        item.impactoFinanceiroDivergencia = Number((item.divergenciaQuantidade * item.custoMedioUnitario).toFixed(2));
        item.justificativaDivergencia = c.justificativa;

        if (item.divergenciaQuantidade > 0) {
          item.statusItem = 'DIVERGENCIA_POSITIVA';
          totalDivergencias++;
        } else if (item.divergenciaQuantidade < 0) {
          item.statusItem = 'DIVERGENCIA_NEGATIVA';
          totalDivergencias++;
        } else {
          item.statusItem = 'CONFERIDO_OK';
        }

        impactoTotal += item.impactoFinanceiroDivergencia;
      }
    }

    sessao.totalItensContados = itens.length;
    sessao.totalDivergenciasEncontradas = totalDivergencias;
    sessao.impactoFinanceiroTotalDivergencia = impactoTotal;
    sessao.status = totalDivergencias > 0 ? 'APURACAO_DIVERGENCIAS' : 'AGUARDANDO_APROVACAO';

    return { sessao, itens };
  }

  public conciliarInventario(
    empresaId: string,
    inventarioId: string,
    usuario: { id: string; nome: string },
    aprovador?: string
  ): { sessao: InventarioSessao; movimentosGerados: MovimentoEstoque[]; mensagem: string } {
    const sessao = this.inventarios.find((i) => i.id === inventarioId && i.empresaId === empresaId);
    if (!sessao) throw new Error('Sessão de inventário não encontrada.');

    const itens = this.contagensInventario.get(inventarioId) || [];
    const politica = this.getPoliticaEstoque(empresaId);
    const movimentosGerados: MovimentoEstoque[] = [];

    // Validar se há itens que extrapolam limite de alçada sem aprovador
    const itensCriticos = itens.filter(
      (i) =>
        Math.abs(i.impactoFinanceiroDivergencia) > politica.limiteValorAjusteSemAprovacao ||
        Math.abs(i.percentualDivergencia) > politica.limitePercentualDivergenciaSemAprovacao
    );

    if (itensCriticos.length > 0 && !aprovador) {
      sessao.status = 'AGUARDANDO_APROVACAO';
      throw new Error(
        `Existem ${itensCriticos.length} divergência(s) crítica(s) de inventário que exigem aprovação formal da Gerência/Diretoria antes da conciliação.`
      );
    }

    // Aplicar ajustes para cada divergência
    for (const item of itens) {
      if (item.divergenciaQuantidade !== 0) {
        const isSobra = item.divergenciaQuantidade > 0;
        const qtdAjuste = Math.abs(item.divergenciaQuantidade);

        const res = this.executarMovimento(empresaId, {
          tipoMovimento: isSobra ? 'ENTRADA_AJUSTE_INVENTARIO' : 'SAIDA_AJUSTE_INVENTARIO',
          produtoId: item.produtoId,
          codigoProduto: item.codigoProduto,
          descricaoProduto: item.descricaoProduto,
          quantidade: qtdAjuste,
          unidadeMedida: item.unidadeMedida,
          custoUnitario: item.custoMedioUnitario,
          almoxarifadoDestinoId: isSobra ? item.almoxarifadoId : undefined,
          almoxarifadoOrigemId: !isSobra ? item.almoxarifadoId : undefined,
          localizacaoDestinoId: isSobra ? item.localizacaoId : undefined,
          localizacaoOrigemId: !isSobra ? item.localizacaoId : undefined,
          loteId: item.loteId,
          numeroLote: item.numeroLote,
          documentoOrigemTipo: 'INVENTARIO',
          documentoOrigemNumero: sessao.numeroSessao,
          motivo: `Ajuste automático de conciliação do inventário ${sessao.numeroSessao}. Justificativa: ${item.justificativaDivergencia || 'Ajuste físico de contagem cega.'}`,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          aprovadoPor: aprovador || 'Aprovador de Inventário',
        });

        item.statusItem = 'AJUSTE_APLICADO';
        item.aprovadoPor = aprovador || usuario.nome;
        movimentosGerados.push(res.movimento);
      }
    }

    sessao.status = 'CONCILIADO';
    sessao.dataEncerramento = new Date().toISOString();

    return {
      sessao,
      movimentosGerados,
      mensagem: `Inventário ${sessao.numeroSessao} conciliado com sucesso. ${movimentosGerados.length} ajuste(s) de estoque aplicados no ledger.`,
    };
  }
}

// Instância Singleton
export const estoqueService = new EstoqueRepository();
