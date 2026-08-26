/**
 * NEXUS ERP - Módulo 14: Expedição & Logística de Cargas (TMS Fabril)
 * Service Layer com isolamento multiempresa e cálculo de OTIF e custos.
 */

import {
  Expedicao,
  ExpedicaoItem,
  SeparacaoExpedicao,
  ConferenciaExpedicao,
  VolumeExpedicao,
  CargaExpedicao,
  Transportadora,
  TabelaFrete,
  VeiculoFrota,
  Motorista,
  IndicadoresLogisticaOTIF,
  StatusExpedicao,
  ModalidadeFrete,
  TipoTransporte,
  TipoEmbalagem,
  TipoOcorrenciaTransporte,
  GravidadeOcorrencia,
  EventoRastreamento,
  OcorrenciaTransporte,
  ComprovanteEntrega,
} from './expedicao-types';

class ExpedicaoService {
  private expedicoes: Map<string, Expedicao[]> = new Map();
  private cargas: Map<string, CargaExpedicao[]> = new Map();
  private transportadoras: Map<string, Transportadora[]> = new Map();
  private tabelasFrete: Map<string, TabelaFrete[]> = new Map();
  private veiculos: Map<string, VeiculoFrota[]> = new Map();
  private motoristas: Map<string, Motorista[]> = new Map();

  constructor() {
    this.inicializarDadosDemo();
  }

  private inicializarDadosDemo() {
    const empresas = ['empresa-1', 'empresa-2', 'empresa-3', 'empresa-4', 'empresa-5'];

    empresas.forEach((empresaId, idx) => {
      // 1. Transportadoras
      const transportadorasEmpresa: Transportadora[] = [
        {
          id: `transp-${idx}-01`,
          empresaId,
          razaoSocial: 'TRANSLOG LOGÍSTICA E CARGAS PESADAS LTDA',
          nomeFantasia: 'TransLog Industrial',
          cnpj: '12.345.678/0001-90',
          rntrc: 'RNTRC-48920192',
          ie: '109.827.364.110',
          telefone: '(11) 4589-2000',
          emailOperacional: 'operacoes@translog.com.br',
          emailTracking: 'tracking@translog.com.br',
          contatoNome: 'Roberto Alcantara',
          cidade: 'São Paulo',
          uf: 'SP',
          modalidadesAtendidas: ['FRACIONADA', 'DEDICADA_LOTACAO'],
          prazoMedioDias: 3,
          taxaPontualidadePercentual: 94.5,
          ativo: true,
        },
        {
          id: `transp-${idx}-02`,
          empresaId,
          razaoSocial: 'EXPRESSO RODOVIÁRIO SUL-SUDESTE S/A',
          nomeFantasia: 'Sul-Sudeste Express',
          cnpj: '98.765.432/0001-11',
          rntrc: 'RNTRC-10928374',
          ie: '908.172.635.001',
          telefone: '(41) 3340-9000',
          emailOperacional: 'cargas@sulsudeste.com.br',
          emailTracking: 'rastreio@sulsudeste.com.br',
          contatoNome: 'Mariana Duarte',
          cidade: 'Curitiba',
          uf: 'PR',
          modalidadesAtendidas: ['FRACIONADA', 'EXPRESSA'],
          prazoMedioDias: 2,
          taxaPontualidadePercentual: 96.8,
          ativo: true,
        },
        {
          id: `transp-${idx}-03`,
          empresaId,
          razaoSocial: 'BRASIL CARGAS ESPECIAIS & PRANCHAS LTDA',
          nomeFantasia: 'Brasil Cargas Pesadas',
          cnpj: '44.332.211/0001-55',
          rntrc: 'RNTRC-99887766',
          ie: '554.433.221.778',
          telefone: '(31) 3890-4400',
          emailOperacional: 'pranchas@brasilcargas.com.br',
          contatoNome: 'Carlos Menezes',
          cidade: 'Belo Horizonte',
          uf: 'MG',
          modalidadesAtendidas: ['DEDICADA_LOTACAO'],
          prazoMedioDias: 4,
          taxaPontualidadePercentual: 91.0,
          ativo: true,
        },
      ];
      this.transportadoras.set(empresaId, transportadorasEmpresa);

      // 2. Tabelas de Frete
      const tabelasEmpresa: TabelaFrete[] = [
        {
          id: `tabfrete-${idx}-01`,
          empresaId,
          transportadoraId: `transp-${idx}-01`,
          transportadoraNome: 'TransLog Industrial',
          nomeTabela: 'TABELA GERAL SP -> SP/MG FRACIONADA',
          vigenciaInicio: '2026-01-01',
          vigenciaFim: '2026-12-31',
          ufOrigem: 'SP',
          ufDestino: 'SP',
          regiaoDestino: 'Grande SP e Interior',
          valorFixoDespacho: 45.0,
          faixasPeso: [
            { pesoAteKg: 50, valorKgOuFixo: 65.0, tipoCobranca: 'VALOR_FIXO' },
            { pesoAteKg: 200, valorKgOuFixo: 0.85, tipoCobranca: 'VALOR_POR_KG' },
            { pesoAteKg: 1000, valorKgOuFixo: 0.65, tipoCobranca: 'VALOR_POR_KG' },
            { pesoAteKg: 5000, valorKgOuFixo: 0.48, tipoCobranca: 'VALOR_POR_KG' },
          ],
          aliquotaAdValoremPercentual: 0.35, // 0.35% sobre valor NF
          aliquotaGrisPercentual: 0.15, // 0.15% GRIS
          valorPedagioPorFracao100kg: 6.5,
          fatorCubagemKgPorM3: 300, // 300 kg/m³
          prazoEstimadoDias: 2,
          ativo: true,
        },
        {
          id: `tabfrete-${idx}-02`,
          empresaId,
          transportadoraId: `transp-${idx}-02`,
          transportadoraNome: 'Sul-Sudeste Express',
          nomeTabela: 'TABELA RODOVIÁRIO SUL EXPRESS',
          vigenciaInicio: '2026-01-01',
          vigenciaFim: '2026-12-31',
          ufOrigem: 'SP',
          ufDestino: 'PR',
          regiaoDestino: 'Curitiba & Região Metropolitana',
          valorFixoDespacho: 55.0,
          faixasPeso: [
            { pesoAteKg: 50, valorKgOuFixo: 80.0, tipoCobranca: 'VALOR_FIXO' },
            { pesoAteKg: 300, valorKgOuFixo: 1.1, tipoCobranca: 'VALOR_POR_KG' },
            { pesoAteKg: 2000, valorKgOuFixo: 0.78, tipoCobranca: 'VALOR_POR_KG' },
          ],
          aliquotaAdValoremPercentual: 0.4,
          aliquotaGrisPercentual: 0.2,
          valorPedagioPorFracao100kg: 8.0,
          fatorCubagemKgPorM3: 300,
          prazoEstimadoDias: 2,
          ativo: true,
        },
      ];
      this.tabelasFrete.set(empresaId, tabelasEmpresa);

      // 3. Frota Própria (Veículos)
      const veiculosEmpresa: VeiculoFrota[] = [
        {
          id: `veic-${idx}-01`,
          empresaId,
          placa: 'TRI-4E26',
          modelo: 'Accelo 1016 Baú Alumínio',
          marca: 'Mercedes-Benz',
          anoFabricacao: 2024,
          tipoVeiculo: 'TOCO_3_4',
          capacidadeCargaKg: 5500,
          capacidadeVolumeM3: 32.0,
          tipoCombustivel: 'DIESEL',
          consumoMedioKmL: 6.8,
          rntrcProprio: 'RNTRC-88776655',
          status: 'DISPONIVEL',
          kmAtual: 42300,
          ultimaRevisaoKm: 40000,
        },
        {
          id: `veic-${idx}-02`,
          empresaId,
          placa: 'TRI-8K99',
          modelo: 'Constellation 24.280 Sider',
          marca: 'Volkswagen',
          anoFabricacao: 2023,
          tipoVeiculo: 'TRUCK',
          capacidadeCargaKg: 14000,
          capacidadeVolumeM3: 56.0,
          tipoCombustivel: 'DIESEL',
          consumoMedioKmL: 4.2,
          rntrcProprio: 'RNTRC-88776655',
          status: 'EM_VIAGEM',
          kmAtual: 118450,
          ultimaRevisaoKm: 110000,
        },
        {
          id: `veic-${idx}-03`,
          empresaId,
          placa: 'TRI-1A12',
          modelo: 'Fiorino Endurance 1.4',
          marca: 'Fiat',
          anoFabricacao: 2025,
          tipoVeiculo: 'UTILITARIO_LEVE',
          capacidadeCargaKg: 650,
          capacidadeVolumeM3: 3.3,
          tipoCombustivel: 'FLEX',
          consumoMedioKmL: 11.5,
          status: 'DISPONIVEL',
          kmAtual: 15200,
        },
      ];
      this.veiculos.set(empresaId, veiculosEmpresa);

      // 4. Motoristas
      const motoristasEmpresa: Motorista[] = [
        {
          id: `mot-${idx}-01`,
          empresaId,
          nomeCompleto: 'Vanderlei Silva Ramos',
          cpf: '123.456.789-00',
          cnhNumero: '98765432100',
          cnhCategoria: 'D',
          cnhValidade: '2028-05-15',
          celularWhatsApp: '(11) 98765-4321',
          tipoVinculo: 'CLT_PROPRIO',
          status: 'DISPONIVEL',
          veiculoFixoId: `veic-${idx}-01`,
        },
        {
          id: `mot-${idx}-02`,
          empresaId,
          nomeCompleto: 'Marcio Antonio Ferreira',
          cpf: '234.567.890-11',
          cnhNumero: '87654321099',
          cnhCategoria: 'E',
          cnhValidade: '2027-11-20',
          celularWhatsApp: '(11) 99876-5432',
          tipoVinculo: 'CLT_PROPRIO',
          status: 'EM_VIAGEM',
          veiculoFixoId: `veic-${idx}-02`,
        },
      ];
      this.motoristas.set(empresaId, motoristasEmpresa);

      // 5. Expedições em diversos estágios do fluxo
      const expedicoesEmpresa: Expedicao[] = [
        {
          id: `exp-${idx}-001`,
          empresaId,
          numeroExpedicao: 'EXP-2026-0081',
          pedidoId: `ped-${idx}-101`,
          numeroPedidoVenda: 'PED-2026-0312',
          clienteId: 'cli-01',
          clienteRazaoSocial: 'INDÚSTRIA METALÚRGICA PAULISTA S/A',
          clienteCnpjCpf: '11.222.333/0001-44',
          enderecoEntrega: {
            logradouro: 'Av. das Indústrias',
            numero: '4500',
            complemento: 'Galpão 3 - Portão B',
            bairro: 'Distrito Industrial',
            cidade: 'Campinas',
            uf: 'SP',
            cep: '13080-000',
          },
          dataEmissao: '2026-08-20T08:30:00Z',
          dataPrometidaEntrega: '2026-08-25T17:00:00Z',
          dataPrevisaoDespacho: '2026-08-22T10:00:00Z',
          dataEfetivaDespacho: '2026-08-22T11:15:00Z',
          dataEfetivaEntrega: '2026-08-24T14:30:00Z', // Entregue no prazo!
          status: 'ENTREGUE',
          modalidadeFrete: 'CIF',
          tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
          transportadoraId: `transp-${idx}-01`,
          transportadoraNome: 'TransLog Industrial',
          numeroNotaFiscal: '000.045.120',
          serieNotaFiscal: '1',
          chaveNFe: '35260812345678000190550010000451201982736411',
          valorMercadorias: 68500.0,
          valorTotalExpedicao: 69850.0,
          pesoLiquidoTotalKg: 1420.0,
          pesoBrutoTotalKg: 1540.0,
          volumeM3Total: 4.8,
          quantidadeTotalVolumes: 3,
          itens: [
            {
              id: `item-${idx}-01`,
              expedicaoId: `exp-${idx}-001`,
              pedidoId: `ped-${idx}-101`,
              pedidoItemId: `pitem-01`,
              codigoProduto: 'EST-IND-500',
              descricao: 'Estrutura Metálica Modular Estampada 500mm',
              unidadeMedida: 'UN',
              quantidadePedida: 20,
              quantidadeSeparada: 20,
              quantidadeConferida: 20,
              quantidadeExpedida: 20,
              pesoUnitarioKg: 45.0,
              pesoTotalKg: 900.0,
              volumeM3Unitario: 0.15,
              loteNumero: 'LOT-2026-08A',
              localizacaoEstoque: 'RUA-A-04',
              precoUnitario: 2200.0,
              valorTotalItem: 44000.0,
              volumeId: `vol-${idx}-001-1`,
            },
            {
              id: `item-${idx}-02`,
              expedicaoId: `exp-${idx}-001`,
              pedidoId: `ped-${idx}-101`,
              pedidoItemId: `pitem-02`,
              codigoProduto: 'PAINEL-CMD-AUTO',
              descricao: 'Painel Elétrico de Automação CNC NR-12',
              unidadeMedida: 'CJ',
              quantidadePedida: 5,
              quantidadeSeparada: 5,
              quantidadeConferida: 5,
              quantidadeExpedida: 5,
              pesoUnitarioKg: 104.0,
              pesoTotalKg: 520.0,
              volumeM3Unitario: 0.36,
              loteNumero: 'LOT-2026-08B',
              localizacaoEstoque: 'RUA-C-12',
              precoUnitario: 4900.0,
              valorTotalItem: 24500.0,
              volumeId: `vol-${idx}-001-2`,
            },
          ],
          separacao: {
            id: `sep-${idx}-01`,
            empresaId,
            expedicaoId: `exp-${idx}-001`,
            codigoSeparacao: 'SEP-2026-0081',
            status: 'CONCLUIDA',
            operadorId: 'op-log-01',
            operadorNome: 'Danilo Siqueira (Expedição)',
            dataInicio: '2026-08-21T09:00:00Z',
            dataConclusao: '2026-08-21T10:15:00Z',
            tempoGastoMinutos: 75,
            itens: [
              {
                itemId: `item-${idx}-01`,
                codigoProduto: 'EST-IND-500',
                descricao: 'Estrutura Metálica Modular Estampada 500mm',
                localizacao: 'RUA-A-04',
                lote: 'LOT-2026-08A',
                quantidadeSugerida: 20,
                quantidadeColetada: 20,
                bipado: true,
              },
              {
                itemId: `item-${idx}-02`,
                codigoProduto: 'PAINEL-CMD-AUTO',
                descricao: 'Painel Elétrico de Automação CNC NR-12',
                localizacao: 'RUA-C-12',
                lote: 'LOT-2026-08B',
                quantidadeSugerida: 5,
                quantidadeColetada: 5,
                bipado: true,
              },
            ],
          },
          conferencia: {
            id: `conf-${idx}-01`,
            empresaId,
            expedicaoId: `exp-${idx}-001`,
            codigoConferencia: 'CONF-2026-0081',
            status: 'APROVADA',
            conferenteId: 'conf-log-01',
            conferenteNome: 'Juliana Pires (CQ Expedição)',
            metodo: 'BIPAGEM_CODIGO_BARRAS',
            dataInicio: '2026-08-21T10:30:00Z',
            dataConclusao: '2026-08-21T11:10:00Z',
            pesoTeoricoTotalKg: 1540.0,
            pesoAferidoBalancaKg: 1538.5,
            diferencaPesoPercentual: -0.1,
            divergencias: [],
            itensConferidos: [
              {
                codigoProduto: 'EST-IND-500',
                codigoBarrasLido: '7891234500018',
                quantidadeLida: 20,
                timestamp: '2026-08-21T10:45:00Z',
              },
              {
                codigoProduto: 'PAINEL-CMD-AUTO',
                codigoBarrasLido: '7891234500025',
                quantidadeLida: 5,
                timestamp: '2026-08-21T11:00:00Z',
              },
            ],
          },
          volumes: [
            {
              id: `vol-${idx}-001-1`,
              empresaId,
              expedicaoId: `exp-${idx}-001`,
              numeroVolume: 1,
              totalVolumesExpedicao: 3,
              codigoVolume: 'VOL-0081-01/03',
              codigoBarrasEtiqueta: '7890001008101',
              tipoEmbalagem: 'PALLET_MADEIRA',
              dimensoesCm: { comprimento: 120, largura: 100, altura: 140 },
              volumeM3: 1.68,
              pesoLiquidoKg: 450.0,
              pesoBrutoKg: 490.0,
              pesoCubadoKg: 504.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-01`,
                  codigoProduto: 'EST-IND-500',
                  descricao: 'Estrutura Metálica Modular 500mm',
                  quantidade: 10,
                },
              ],
              etiquetaGerada: true,
              lacreSegurancaNumero: 'LAC-77881',
            },
            {
              id: `vol-${idx}-001-2`,
              empresaId,
              expedicaoId: `exp-${idx}-001`,
              numeroVolume: 2,
              totalVolumesExpedicao: 3,
              codigoVolume: 'VOL-0081-02/03',
              codigoBarrasEtiqueta: '7890001008102',
              tipoEmbalagem: 'PALLET_MADEIRA',
              dimensoesCm: { comprimento: 120, largura: 100, altura: 140 },
              volumeM3: 1.68,
              pesoLiquidoKg: 450.0,
              pesoBrutoKg: 490.0,
              pesoCubadoKg: 504.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-01`,
                  codigoProduto: 'EST-IND-500',
                  descricao: 'Estrutura Metálica Modular 500mm',
                  quantidade: 10,
                },
              ],
              etiquetaGerada: true,
              lacreSegurancaNumero: 'LAC-77882',
            },
            {
              id: `vol-${idx}-001-3`,
              empresaId,
              expedicaoId: `exp-${idx}-001`,
              numeroVolume: 3,
              totalVolumesExpedicao: 3,
              codigoVolume: 'VOL-0081-03/03',
              codigoBarrasEtiqueta: '7890001008103',
              tipoEmbalagem: 'ENGRADADO_ACO',
              dimensoesCm: { comprimento: 140, largura: 110, altura: 95 },
              volumeM3: 1.46,
              pesoLiquidoKg: 520.0,
              pesoBrutoKg: 560.0,
              pesoCubadoKg: 438.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-02`,
                  codigoProduto: 'PAINEL-CMD-AUTO',
                  descricao: 'Painel Elétrico de Automação CNC NR-12',
                  quantidade: 5,
                },
              ],
              etiquetaGerada: true,
              lacreSegurancaNumero: 'LAC-77883',
            },
          ],
          frete: {
            modalidade: 'CIF',
            transportadoraId: `transp-${idx}-01`,
            transportadoraNome: 'TransLog Industrial',
            tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
            tabelaFreteId: `tabfrete-${idx}-01`,
            valorFretePrevisto: 1350.0,
            valorFreteReal: 1350.0,
            variacaoValor: 0.0,
            variacaoPercentual: 0.0,
            baseCalculoKg: 1540.0,
            pesoCubadoTotalKg: 1446.0,
            pesoRealTotalKg: 1540.0,
            adValoremValor: 239.75,
            grisValor: 102.75,
            pedagioValor: 104.0,
            taxaDespachoValor: 45.0,
            outrasTaxas: 0.0,
            numeroCTe: '004.912',
            chaveAcessoCTe: '35260812345678000190570010000049121827364510',
          },
          rastreamento: [
            {
              id: `tr-${idx}-01`,
              expedicaoId: `exp-${idx}-001`,
              timestamp: '2026-08-22T11:15:00Z',
              etapa: 'DESPACHO_FABRICA',
              cidade: 'Sorocaba',
              uf: 'SP',
              descricao: 'Carga coletada na fábrica NEXUS e liberada com Romaneio/NFe.',
              responsavelNome: 'TransLog Motorista Paulo',
            },
            {
              id: `tr-${idx}-02`,
              expedicaoId: `exp-${idx}-001`,
              timestamp: '2026-08-23T04:20:00Z',
              etapa: 'CD_TRANSPORTADORA',
              cidade: 'Campinas',
              uf: 'SP',
              descricao: 'Volumes recebidos no Centro de Distribuição Regional de Campinas.',
            },
            {
              id: `tr-${idx}-03`,
              expedicaoId: `exp-${idx}-001`,
              timestamp: '2026-08-24T08:00:00Z',
              etapa: 'SAIU_ENTREGA',
              cidade: 'Campinas',
              uf: 'SP',
              descricao: 'Em rota de entrega para o cliente (Veículo Placa ABC-4455).',
            },
            {
              id: `tr-${idx}-04`,
              expedicaoId: `exp-${idx}-001`,
              timestamp: '2026-08-24T14:30:00Z',
              etapa: 'ENTREGUE',
              cidade: 'Campinas',
              uf: 'SP',
              descricao: 'Entregue com sucesso. Canhoto assinado e registrado.',
            },
          ],
          ocorrencias: [],
          comprovanteEntrega: {
            id: `comp-${idx}-01`,
            empresaId,
            expedicaoId: `exp-${idx}-001`,
            dataHoraEntrega: '2026-08-24T14:30:00Z',
            nomeRecebedor: 'Carlos Eduardo Nogueira',
            documentoRecebedor: '28.910.455-8 (RG)',
            parentescoOuCargo: 'Supervisor de Recebimento e Almoxarifado',
            assinaturaDigitalUrl: '/assets/canhotos/assinatura_carlos_nogueira.png',
            canhotoFotoUrl: '/assets/canhotos/canhoto_nfe_045120.jpg',
            geolocalizacao: {
              latitude: -22.9056,
              longitude: -47.0608,
              precisaoMetros: 8.5,
            },
            ressalvasCliente: 'Nenhuma. Volumes recebidos intactos com lacres conferidos.',
            entregueNoPrazo: true,
            entregueCompleto: true,
            otifConforme: true,
          },
          observacoes: 'Entrega prioritária para linha de montagem automotiva.',
          criadoEm: '2026-08-20T08:30:00Z',
          atualizadoEm: '2026-08-24T14:35:00Z',
          criadoPor: 'sistema_pcp_auto',
        },
        {
          id: `exp-${idx}-002`,
          empresaId,
          numeroExpedicao: 'EXP-2026-0082',
          pedidoId: `ped-${idx}-102`,
          numeroPedidoVenda: 'PED-2026-0315',
          clienteId: 'cli-02',
          clienteRazaoSocial: 'ELETRO-MECÂNICA PARANAENSE LTDA',
          clienteCnpjCpf: '22.333.444/0001-55',
          enderecoEntrega: {
            logradouro: 'Rua Marechal Deodoro',
            numero: '1200',
            bairro: 'Centro Cívico',
            cidade: 'Curitiba',
            uf: 'PR',
            cep: '80010-010',
          },
          dataEmissao: '2026-08-22T10:00:00Z',
          dataPrometidaEntrega: '2026-08-27T18:00:00Z',
          dataPrevisaoDespacho: '2026-08-24T14:00:00Z',
          dataEfetivaDespacho: '2026-08-24T16:20:00Z',
          status: 'EM_TRANSITO',
          modalidadeFrete: 'CIF',
          tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
          transportadoraId: `transp-${idx}-02`,
          transportadoraNome: 'Sul-Sudeste Express',
          cargaId: `carga-${idx}-01`,
          numeroCarga: 'CARGA-2026-041',
          numeroNotaFiscal: '000.045.188',
          serieNotaFiscal: '1',
          chaveNFe: '35260898765432000111550010000451881827364123',
          valorMercadorias: 42300.0,
          valorTotalExpedicao: 43250.0,
          pesoLiquidoTotalKg: 850.0,
          pesoBrutoTotalKg: 910.0,
          volumeM3Total: 2.9,
          quantidadeTotalVolumes: 2,
          itens: [
            {
              id: `item-${idx}-03`,
              expedicaoId: `exp-${idx}-002`,
              pedidoId: `ped-${idx}-102`,
              pedidoItemId: `pitem-03`,
              codigoProduto: 'MOTOR-SERV-2000',
              descricao: 'Servomotor Industrial Brushless 2.0kW',
              unidadeMedida: 'UN',
              quantidadePedida: 8,
              quantidadeSeparada: 8,
              quantidadeConferida: 8,
              quantidadeExpedida: 8,
              pesoUnitarioKg: 35.0,
              pesoTotalKg: 280.0,
              volumeM3Unitario: 0.08,
              precoUnitario: 3200.0,
              valorTotalItem: 25600.0,
              volumeId: `vol-${idx}-002-1`,
            },
            {
              id: `item-${idx}-04`,
              expedicaoId: `exp-${idx}-002`,
              pedidoId: `ped-${idx}-102`,
              pedidoItemId: `pitem-04`,
              codigoProduto: 'REDU-PLANET-10',
              descricao: 'Redutor Planetário de Precisão 10:1',
              unidadeMedida: 'UN',
              quantidadePedida: 8,
              quantidadeSeparada: 8,
              quantidadeConferida: 8,
              quantidadeExpedida: 8,
              pesoUnitarioKg: 71.25,
              pesoTotalKg: 570.0,
              volumeM3Unitario: 0.12,
              precoUnitario: 2087.5,
              valorTotalItem: 16700.0,
              volumeId: `vol-${idx}-002-2`,
            },
          ],
          volumes: [
            {
              id: `vol-${idx}-002-1`,
              empresaId,
              expedicaoId: `exp-${idx}-002`,
              numeroVolume: 1,
              totalVolumesExpedicao: 2,
              codigoVolume: 'VOL-0082-01/02',
              codigoBarrasEtiqueta: '7890001008201',
              tipoEmbalagem: 'CAIXA_PAPELAO',
              dimensoesCm: { comprimento: 100, largura: 80, altura: 80 },
              volumeM3: 0.64,
              pesoLiquidoKg: 280.0,
              pesoBrutoKg: 300.0,
              pesoCubadoKg: 192.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-03`,
                  codigoProduto: 'MOTOR-SERV-2000',
                  descricao: 'Servomotor Industrial Brushless 2.0kW',
                  quantidade: 8,
                },
              ],
              etiquetaGerada: true,
            },
            {
              id: `vol-${idx}-002-2`,
              empresaId,
              expedicaoId: `exp-${idx}-002`,
              numeroVolume: 2,
              totalVolumesExpedicao: 2,
              codigoVolume: 'VOL-0082-02/02',
              codigoBarrasEtiqueta: '7890001008202',
              tipoEmbalagem: 'PALLET_MADEIRA',
              dimensoesCm: { comprimento: 120, largura: 100, altura: 90 },
              volumeM3: 1.08,
              pesoLiquidoKg: 570.0,
              pesoBrutoKg: 610.0,
              pesoCubadoKg: 324.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-04`,
                  codigoProduto: 'REDU-PLANET-10',
                  descricao: 'Redutor Planetário de Precisão 10:1',
                  quantidade: 8,
                },
              ],
              etiquetaGerada: true,
            },
          ],
          frete: {
            modalidade: 'CIF',
            transportadoraId: `transp-${idx}-02`,
            transportadoraNome: 'Sul-Sudeste Express',
            tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
            tabelaFreteId: `tabfrete-${idx}-02`,
            valorFretePrevisto: 950.0,
            valorFreteReal: 1020.0, // Variação de pedágio adicional
            variacaoValor: 70.0,
            variacaoPercentual: 7.37,
            baseCalculoKg: 910.0,
            pesoCubadoTotalKg: 516.0,
            pesoRealTotalKg: 910.0,
            adValoremValor: 169.2,
            grisValor: 84.6,
            pedagioValor: 72.8,
            taxaDespachoValor: 55.0,
            outrasTaxas: 0.0,
            numeroCTe: '009.844',
            chaveAcessoCTe: '41260898765432000111570010000098441928374650',
          },
          rastreamento: [
            {
              id: `tr-${idx}-05`,
              expedicaoId: `exp-${idx}-002`,
              timestamp: '2026-08-24T16:20:00Z',
              etapa: 'DESPACHO_FABRICA',
              cidade: 'Sorocaba',
              uf: 'SP',
              descricao: 'Carga despachada da planta fabril via Sul-Sudeste Express.',
            },
            {
              id: `tr-${idx}-06`,
              expedicaoId: `exp-${idx}-002`,
              timestamp: '2026-08-25T01:30:00Z',
              etapa: 'POSTO_FISCAL',
              cidade: 'Registro',
              uf: 'SP',
              descricao: 'Liberação SEFAZ no Posto Fiscal BR-116 sem divergências.',
            },
            {
              id: `tr-${idx}-07`,
              expedicaoId: `exp-${idx}-002`,
              timestamp: '2026-08-25T11:00:00Z',
              etapa: 'CD_TRANSPORTADORA',
              cidade: 'Curitiba',
              uf: 'PR',
              descricao: 'Entrada na filial destino Curitiba para triagem da última milha.',
            },
          ],
          ocorrencias: [],
          criadoEm: '2026-08-22T10:00:00Z',
          atualizadoEm: '2026-08-25T11:05:00Z',
          criadoPor: 'danilo_expedicao',
        },
        {
          id: `exp-${idx}-003`,
          empresaId,
          numeroExpedicao: 'EXP-2026-0083',
          pedidoId: `ped-${idx}-103`,
          numeroPedidoVenda: 'PED-2026-0320',
          clienteId: 'cli-03',
          clienteRazaoSocial: 'TRITURADORES & MOAGEM DO BRASIL S/A',
          clienteCnpjCpf: '33.444.555/0001-66',
          enderecoEntrega: {
            logradouro: 'Rodovia Anhanguera',
            numero: 'KM 142',
            bairro: 'Zona Rural',
            cidade: 'Limeira',
            uf: 'SP',
            cep: '13480-970',
          },
          dataEmissao: '2026-08-23T14:00:00Z',
          dataPrometidaEntrega: '2026-08-26T17:00:00Z',
          dataPrevisaoDespacho: '2026-08-25T16:00:00Z',
          status: 'EM_CONFERENCIA',
          modalidadeFrete: 'FOB',
          tipoTransporte: 'CLIENTE_RETIRA',
          valorMercadorias: 94800.0,
          valorTotalExpedicao: 94800.0,
          pesoLiquidoTotalKg: 2800.0,
          pesoBrutoTotalKg: 2950.0,
          volumeM3Total: 6.2,
          quantidadeTotalVolumes: 4,
          itens: [
            {
              id: `item-${idx}-05`,
              expedicaoId: `exp-${idx}-003`,
              pedidoId: `ped-${idx}-103`,
              pedidoItemId: `pitem-05`,
              codigoProduto: 'ROTOR-MOAGEM-80',
              descricao: 'Rotor de Moagem Aço Forjado Usinado 800mm',
              unidadeMedida: 'UN',
              quantidadePedida: 2,
              quantidadeSeparada: 2,
              quantidadeConferida: 1, // 1 ainda em conferência
              quantidadeExpedida: 0,
              pesoUnitarioKg: 1400.0,
              pesoTotalKg: 2800.0,
              volumeM3Unitario: 3.1,
              precoUnitario: 47400.0,
              valorTotalItem: 94800.0,
            },
          ],
          separacao: {
            id: `sep-${idx}-03`,
            empresaId,
            expedicaoId: `exp-${idx}-003`,
            codigoSeparacao: 'SEP-2026-0083',
            status: 'CONCLUIDA',
            operadorId: 'op-log-02',
            operadorNome: 'Valmir Teixeira',
            dataInicio: '2026-08-24T08:00:00Z',
            dataConclusao: '2026-08-24T09:30:00Z',
            itens: [
              {
                itemId: `item-${idx}-05`,
                codigoProduto: 'ROTOR-MOAGEM-80',
                descricao: 'Rotor de Moagem Aço Forjado Usinado 800mm',
                localizacao: 'PATIO-PESADO-G2',
                quantidadeSugerida: 2,
                quantidadeColetada: 2,
                bipado: true,
              },
            ],
          },
          conferencia: {
            id: `conf-${idx}-03`,
            empresaId,
            expedicaoId: `exp-${idx}-003`,
            codigoConferencia: 'CONF-2026-0083',
            status: 'EM_ANDAMENTO',
            conferenteId: 'conf-log-01',
            conferenteNome: 'Juliana Pires (CQ Expedição)',
            metodo: 'CONFERENCIA_CEGA_MANUAL',
            dataInicio: '2026-08-25T13:45:00Z',
            pesoTeoricoTotalKg: 2950.0,
            divergencias: [],
            itensConferidos: [
              {
                codigoProduto: 'ROTOR-MOAGEM-80',
                codigoBarrasLido: 'ROTOR-80-001',
                quantidadeLida: 1,
                timestamp: '2026-08-25T14:00:00Z',
              },
            ],
          },
          volumes: [],
          frete: {
            modalidade: 'FOB',
            tipoTransporte: 'CLIENTE_RETIRA',
            valorFretePrevisto: 0.0,
            valorFreteReal: 0.0,
            variacaoValor: 0.0,
            variacaoPercentual: 0.0,
            baseCalculoKg: 2950.0,
            pesoCubadoTotalKg: 1860.0,
            pesoRealTotalKg: 2950.0,
            adValoremValor: 0,
            grisValor: 0,
            pedagioValor: 0,
            taxaDespachoValor: 0,
            outrasTaxas: 0,
          },
          rastreamento: [],
          ocorrencias: [],
          criadoEm: '2026-08-23T14:00:00Z',
          atualizadoEm: '2026-08-25T14:00:00Z',
          criadoPor: 'vendas_portal',
        },
        {
          id: `exp-${idx}-004`,
          empresaId,
          numeroExpedicao: 'EXP-2026-0084',
          pedidoId: `ped-${idx}-104`,
          numeroPedidoVenda: 'PED-2026-0322',
          clienteId: 'cli-04',
          clienteRazaoSocial: 'AGRO-MAQ EQUIPAMENTOS AGRÍCOLAS S/A',
          clienteCnpjCpf: '55.666.777/0001-88',
          enderecoEntrega: {
            logradouro: 'Av. Brasil Oeste',
            numero: '3800',
            bairro: 'Industrial',
            cidade: 'Ribeirão Preto',
            uf: 'SP',
            cep: '14095-000',
          },
          dataEmissao: '2026-08-24T09:00:00Z',
          dataPrometidaEntrega: '2026-08-28T18:00:00Z',
          dataPrevisaoDespacho: '2026-08-26T11:00:00Z',
          status: 'PENDENTE',
          modalidadeFrete: 'CIF',
          tipoTransporte: 'FROTA_PROPRIA',
          veiculoId: `veic-${idx}-01`,
          veiculoPlaca: 'TRI-4E26',
          motoristaId: `mot-${idx}-01`,
          motoristaNome: 'Vanderlei Silva Ramos',
          valorMercadorias: 38200.0,
          valorTotalExpedicao: 38200.0,
          pesoLiquidoTotalKg: 740.0,
          pesoBrutoTotalKg: 790.0,
          volumeM3Total: 3.5,
          quantidadeTotalVolumes: 0,
          itens: [
            {
              id: `item-${idx}-06`,
              expedicaoId: `exp-${idx}-004`,
              pedidoId: `ped-${idx}-104`,
              pedidoItemId: `pitem-06`,
              codigoProduto: 'CHASSI-COLH-12',
              descricao: 'Conjunto Chassi Soldado para Colheitadeira Grãos',
              unidadeMedida: 'UN',
              quantidadePedida: 4,
              quantidadeSeparada: 0,
              quantidadeConferida: 0,
              quantidadeExpedida: 0,
              pesoUnitarioKg: 185.0,
              pesoTotalKg: 740.0,
              volumeM3Unitario: 0.875,
              precoUnitario: 9550.0,
              valorTotalItem: 38200.0,
            },
          ],
          volumes: [],
          frete: {
            modalidade: 'CIF',
            tipoTransporte: 'FROTA_PROPRIA',
            valorFretePrevisto: 620.0,
            valorFreteReal: 580.0, // Economia com veículo próprio
            variacaoValor: -40.0,
            variacaoPercentual: -6.45,
            baseCalculoKg: 790.0,
            pesoCubadoTotalKg: 1050.0,
            pesoRealTotalKg: 790.0,
            adValoremValor: 0,
            grisValor: 0,
            pedagioValor: 48.0,
            taxaDespachoValor: 0,
            outrasTaxas: 0,
          },
          rastreamento: [],
          ocorrencias: [],
          criadoEm: '2026-08-24T09:00:00Z',
          atualizadoEm: '2026-08-24T09:00:00Z',
          criadoPor: 'pcp_auto',
        },
        {
          id: `exp-${idx}-005`,
          empresaId,
          numeroExpedicao: 'EXP-2026-0080',
          pedidoId: `ped-${idx}-100`,
          numeroPedidoVenda: 'PED-2026-0305',
          clienteId: 'cli-05',
          clienteRazaoSocial: 'AUTOPEÇAS VALE DO PARAÍBA LTDA',
          clienteCnpjCpf: '77.888.999/0001-22',
          enderecoEntrega: {
            logradouro: 'Av. Andrômeda',
            numero: '890',
            bairro: 'Jardim Satélite',
            cidade: 'São José dos Campos',
            uf: 'SP',
            cep: '12230-000',
          },
          dataEmissao: '2026-08-15T08:00:00Z',
          dataPrometidaEntrega: '2026-08-19T17:00:00Z',
          dataPrevisaoDespacho: '2026-08-17T10:00:00Z',
          dataEfetivaDespacho: '2026-08-17T11:00:00Z',
          dataEfetivaEntrega: '2026-08-21T16:00:00Z', // Atrasou por avaria no percurso!
          status: 'ENTREGUE_PARCIAL',
          modalidadeFrete: 'CIF',
          tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
          transportadoraId: `transp-${idx}-01`,
          transportadoraNome: 'TransLog Industrial',
          numeroNotaFiscal: '000.044.990',
          serieNotaFiscal: '1',
          valorMercadorias: 28000.0,
          valorTotalExpedicao: 28600.0,
          pesoLiquidoTotalKg: 600.0,
          pesoBrutoTotalKg: 640.0,
          volumeM3Total: 1.8,
          quantidadeTotalVolumes: 2,
          itens: [
            {
              id: `item-${idx}-07`,
              expedicaoId: `exp-${idx}-005`,
              pedidoId: `ped-${idx}-100`,
              pedidoItemId: `pitem-07`,
              codigoProduto: 'FLANGE-INOX-316',
              descricao: 'Flange Cega Inox 316L 4 Polegadas ANSI 150',
              unidadeMedida: 'PC',
              quantidadePedida: 40,
              quantidadeSeparada: 40,
              quantidadeConferida: 40,
              quantidadeExpedida: 36, // 4 avariadas no transporte
              pesoUnitarioKg: 15.0,
              pesoTotalKg: 600.0,
              volumeM3Unitario: 0.045,
              precoUnitario: 700.0,
              valorTotalItem: 28000.0,
            },
          ],
          volumes: [
            {
              id: `vol-${idx}-005-1`,
              empresaId,
              expedicaoId: `exp-${idx}-005`,
              numeroVolume: 1,
              totalVolumesExpedicao: 2,
              codigoVolume: 'VOL-0080-01/02',
              codigoBarrasEtiqueta: '7890001008001',
              tipoEmbalagem: 'CAIXA_PAPELAO',
              dimensoesCm: { comprimento: 80, largura: 60, altura: 50 },
              volumeM3: 0.24,
              pesoLiquidoKg: 300.0,
              pesoBrutoKg: 320.0,
              pesoCubadoKg: 72.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-07`,
                  codigoProduto: 'FLANGE-INOX-316',
                  descricao: 'Flange Cega Inox 316L 4 Pol',
                  quantidade: 20,
                },
              ],
              etiquetaGerada: true,
            },
            {
              id: `vol-${idx}-005-2`,
              empresaId,
              expedicaoId: `exp-${idx}-005`,
              numeroVolume: 2,
              totalVolumesExpedicao: 2,
              codigoVolume: 'VOL-0080-02/02',
              codigoBarrasEtiqueta: '7890001008002',
              tipoEmbalagem: 'CAIXA_PAPELAO',
              dimensoesCm: { comprimento: 80, largura: 60, altura: 50 },
              volumeM3: 0.24,
              pesoLiquidoKg: 300.0,
              pesoBrutoKg: 320.0,
              pesoCubadoKg: 72.0,
              itensContidos: [
                {
                  expedicaoItemId: `item-${idx}-07`,
                  codigoProduto: 'FLANGE-INOX-316',
                  descricao: 'Flange Cega Inox 316L 4 Pol',
                  quantidade: 16,
                },
              ],
              etiquetaGerada: true,
            },
          ],
          frete: {
            modalidade: 'CIF',
            transportadoraId: `transp-${idx}-01`,
            transportadoraNome: 'TransLog Industrial',
            tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
            valorFretePrevisto: 520.0,
            valorFreteReal: 600.0,
            variacaoValor: 80.0,
            variacaoPercentual: 15.38,
            baseCalculoKg: 640.0,
            pesoCubadoTotalKg: 144.0,
            pesoRealTotalKg: 640.0,
            adValoremValor: 98.0,
            grisValor: 42.0,
            pedagioValor: 40.0,
            taxaDespachoValor: 45.0,
            outrasTaxas: 0,
          },
          rastreamento: [
            {
              id: `tr-${idx}-08`,
              expedicaoId: `exp-${idx}-005`,
              timestamp: '2026-08-17T11:00:00Z',
              etapa: 'DESPACHO_FABRICA',
              cidade: 'Sorocaba',
              uf: 'SP',
              descricao: 'Despachado com NFe 044.990.',
            },
            {
              id: `tr-${idx}-09`,
              expedicaoId: `exp-${idx}-005`,
              timestamp: '2026-08-18T14:30:00Z',
              etapa: 'OCORRENCIA',
              cidade: 'Jacareí',
              uf: 'SP',
              descricao: 'Volume 02/02 sofreu queda na doca de transbordo com avaria em 4 peças.',
            },
            {
              id: `tr-${idx}-10`,
              expedicaoId: `exp-${idx}-005`,
              timestamp: '2026-08-21T16:00:00Z',
              etapa: 'ENTREGUE',
              cidade: 'São José dos Campos',
              uf: 'SP',
              descricao: 'Entrega realizada com ressalva no verso da NFe e devolução de 4 peças avariadas.',
            },
          ],
          ocorrencias: [
            {
              id: `oco-${idx}-01`,
              empresaId,
              expedicaoId: `exp-${idx}-005`,
              codigoOcorrencia: 'OCO-2026-0012',
              tipo: 'AVARIA_PARCIAL',
              gravidade: 'ALTA',
              dataHora: '2026-08-18T14:30:00Z',
              descricaoDetalhada:
                'Caixa 02/02 sofreu queda durante descarregamento na filial Jacareí da transportadora. 4 flanges apresentaram amassamento severo na face de vedação e ranhuras profundas.',
              acaoTomada:
                'Emissão de NFe de Devolução / Logística Reversa para as 4 peças e acionamento do seguro de carga da transportadora TransLog.',
              valorPrejuizoEstimado: 2800.0,
              gerouLogisticaReversa: true,
              gerouRncQualidade: true,
              rncQualidadeId: 'RNC-2026-0045',
              resolvido: true,
              dataResolucao: '2026-08-22T10:00:00Z',
              responsavelResolucao: 'Gerência de Logística & Seguros',
            },
          ],
          comprovanteEntrega: {
            id: `comp-${idx}-02`,
            empresaId,
            expedicaoId: `exp-${idx}-005`,
            dataHoraEntrega: '2026-08-21T16:00:00Z',
            nomeRecebedor: 'Marcos Vinicius de Souza',
            documentoRecebedor: '34.567.890-1 (RG)',
            parentescoOuCargo: 'Analista de Suprimentos',
            ressalvasCliente: 'Recebidas 36 unidades perfeitas. 4 unidades devolvidas por avaria na face de assentamento.',
            entregueNoPrazo: false, // Entregue com atraso
            entregueCompleto: false, // Entregue incompleto
            otifConforme: false, // Perda OTIF
          },
          criadoEm: '2026-08-15T08:00:00Z',
          atualizadoEm: '2026-08-22T10:00:00Z',
          criadoPor: 'sistema_vendas',
        },
      ];
      this.expedicoes.set(empresaId, expedicoesEmpresa);

      // 6. Carga Consolidada Demo
      const cargasEmpresa: CargaExpedicao[] = [
        {
          id: `carga-${idx}-01`,
          empresaId,
          numeroCarga: 'CARGA-2026-041',
          dataCriacao: '2026-08-24T08:00:00Z',
          dataCarregamentoPrevisto: '2026-08-24T14:00:00Z',
          dataSaidaEfetiva: '2026-08-24T16:20:00Z',
          status: 'EM_VIAGEM',
          tipoTransporte: 'TRANSPORTADORA_TERCEIRA',
          transportadoraId: `transp-${idx}-02`,
          transportadoraNome: 'Sul-Sudeste Express',
          veiculoPlaca: 'SUL-9922',
          veiculoModelo: 'Scania R450 Baú 28 Pallets',
          motoristaNome: 'Ademir de Oliveira',
          motoristaCelular: '(41) 98877-1122',
          rotaNome: 'ROTA SUL 01 - SP -> PR (Curitiba/São José dos Pinhais)',
          cidadesAtendidas: ['Curitiba', 'São José dos Pinhais', 'Araucária'],
          capacidadeVeiculoKg: 24000,
          capacidadeVeiculoM3: 90.0,
          pesoTotalCargaKg: 18450.0,
          volumeTotalCargaM3: 68.5,
          ocupacaoPesoPercentual: 76.88,
          ocupacaoVolumePercentual: 76.11,
          valorTotalMercadoriasCarga: 485000.0,
          quantidadeTotalVolumesCarga: 26,
          pedidosVinculados: [
            {
              expedicaoId: `exp-${idx}-002`,
              pedidoId: `ped-${idx}-102`,
              numeroPedido: 'PED-2026-0315',
              clienteNome: 'ELETRO-MECÂNICA PARANAENSE LTDA',
              cidadeUf: 'Curitiba/PR',
              ordemEntrega: 1,
              pesoKg: 910.0,
              volumeM3: 2.9,
              quantidadeVolumes: 2,
              valorMercadorias: 42300.0,
              statusEntrega: 'EM_TRANSITO',
            },
          ],
          observacoes: 'Carga com seguro RCF-DC e rastreamento via satélite Sascar.',
          criadoPor: 'supervisor_expedicao',
        },
      ];
      this.cargas.set(empresaId, cargasEmpresa);
    });
  }

  // ==========================================
  // MÉTODOS DE EXPEDIÇÃO & FLUXO OPERACIONAL
  // ==========================================

  public getExpedicoes(empresaId: string, status?: StatusExpedicao, search?: string): Expedicao[] {
    const list = this.expedicoes.get(empresaId) || [];
    return list.filter((exp) => {
      if (status && exp.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          exp.numeroExpedicao.toLowerCase().includes(q) ||
          exp.numeroPedidoVenda.toLowerCase().includes(q) ||
          exp.clienteRazaoSocial.toLowerCase().includes(q) ||
          (exp.numeroNotaFiscal && exp.numeroNotaFiscal.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }

  public getExpedicaoById(empresaId: string, expedicaoId: string): Expedicao | undefined {
    const list = this.expedicoes.get(empresaId) || [];
    return list.find((e) => e.id === expedicaoId);
  }

  public criarExpedicao(
    empresaId: string,
    payload: {
      pedidoId: string;
      numeroPedidoVenda: string;
      clienteId: string;
      clienteRazaoSocial: string;
      clienteCnpjCpf: string;
      enderecoEntrega: Expedicao['enderecoEntrega'];
      dataPrometidaEntrega: string;
      modalidadeFrete: ModalidadeFrete;
      tipoTransporte: TipoTransporte;
      transportadoraId?: string;
      transportadoraNome?: string;
      itens: Omit<ExpedicaoItem, 'id' | 'expedicaoId'>[];
      observacoes?: string;
      criadoPor: string;
    }
  ): Expedicao {
    const list = this.expedicoes.get(empresaId) || [];
    const seq = list.length + 85;
    const numeroExpedicao = `EXP-2026-00${seq}`;
    const id = `exp-${empresaId}-${Date.now()}`;

    const itensMapeados: ExpedicaoItem[] = payload.itens.map((it, i) => ({
      ...it,
      id: `item-${id}-${i + 1}`,
      expedicaoId: id,
      quantidadeSeparada: 0,
      quantidadeConferida: 0,
      quantidadeExpedida: 0,
    }));

    const pesoLiq = itensMapeados.reduce((acc, it) => acc + it.pesoTotalKg, 0);
    const pesoBruto = pesoLiq * 1.08; // estimativa com embalagem
    const volM3 = itensMapeados.reduce((acc, it) => acc + (it.volumeM3Unitario * it.quantidadePedida || 0.05), 0);
    const valMerc = itensMapeados.reduce((acc, it) => acc + it.valorTotalItem, 0);

    // Pré-cálculo frete
    const freteCalculado = this.simularCalculoFrete(
      empresaId,
      payload.modalidadeFrete,
      payload.tipoTransporte,
      payload.transportadoraId,
      pesoBruto,
      volM3,
      valMerc,
      payload.enderecoEntrega.uf
    );

    const novaExpedicao: Expedicao = {
      id,
      empresaId,
      numeroExpedicao,
      pedidoId: payload.pedidoId,
      numeroPedidoVenda: payload.numeroPedidoVenda,
      clienteId: payload.clienteId,
      clienteRazaoSocial: payload.clienteRazaoSocial,
      clienteCnpjCpf: payload.clienteCnpjCpf,
      enderecoEntrega: payload.enderecoEntrega,
      dataEmissao: new Date().toISOString(),
      dataPrometidaEntrega: payload.dataPrometidaEntrega,
      dataPrevisaoDespacho: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      status: 'PENDENTE',
      modalidadeFrete: payload.modalidadeFrete,
      tipoTransporte: payload.tipoTransporte,
      transportadoraId: payload.transportadoraId,
      transportadoraNome: payload.transportadoraNome,
      valorMercadorias: valMerc,
      valorTotalExpedicao: valMerc + (payload.modalidadeFrete === 'CIF' ? freteCalculado.valorFretePrevisto : 0),
      pesoLiquidoTotalKg: pesoLiq,
      pesoBrutoTotalKg: pesoBruto,
      volumeM3Total: volM3,
      quantidadeTotalVolumes: 0,
      itens: itensMapeados,
      volumes: [],
      frete: freteCalculado,
      rastreamento: [
        {
          id: `tr-${id}-1`,
          expedicaoId: id,
          timestamp: new Date().toISOString(),
          etapa: 'PEDIDO_LIBERADO_EXPEDICAO',
          cidade: 'Fábrica',
          uf: 'SP',
          descricao: `Expedição gerada a partir do Pedido de Venda ${payload.numeroPedidoVenda}. Aguardando início da separação.`,
          responsavelNome: payload.criadoPor,
        },
      ],
      ocorrencias: [],
      observacoes: payload.observacoes,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      criadoPor: payload.criadoPor,
    };

    list.unshift(novaExpedicao);
    this.expedicoes.set(empresaId, list);
    return novaExpedicao;
  }

  // 1. Iniciar e Concluir Separação (Picking)
  public iniciarSeparacao(
    empresaId: string,
    expedicaoId: string,
    operadorId: string,
    operadorNome: string
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    exp.status = 'EM_SEPARACAO';
    exp.atualizadoEm = new Date().toISOString();
    exp.separacao = {
      id: `sep-${exp.id}`,
      empresaId,
      expedicaoId: exp.id,
      codigoSeparacao: `SEP-${exp.numeroExpedicao}`,
      status: 'EM_ANDAMENTO',
      operadorId,
      operadorNome,
      dataInicio: new Date().toISOString(),
      itens: exp.itens.map((it) => ({
        itemId: it.id,
        codigoProduto: it.codigoProduto,
        descricao: it.descricao,
        localizacao: it.localizacaoEstoque || 'ALMOX-GERAL',
        lote: it.loteNumero || 'LOT-PADRAO',
        quantidadeSugerida: it.quantidadePedida,
        quantidadeColetada: 0,
        bipado: false,
      })),
    };

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: 'EM_SEPARACAO',
      cidade: 'Almoxarifado',
      uf: 'SP',
      descricao: `Separação iniciada pelo operador ${operadorNome}.`,
      responsavelNome: operadorNome,
    });

    return exp;
  }

  public concluirSeparacao(
    empresaId: string,
    expedicaoId: string,
    itensColetados: { itemId: string; quantidadeColetada: number }[]
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp || !exp.separacao) throw new Error('Separação não encontrada para esta expedição');

    let temDivergencia = false;

    exp.separacao.itens.forEach((sepItem) => {
      const col = itensColetados.find((c) => c.itemId === sepItem.itemId);
      if (col) {
        sepItem.quantidadeColetada = col.quantidadeColetada;
        sepItem.bipado = true;
        if (col.quantidadeColetada !== sepItem.quantidadeSugerida) {
          temDivergencia = true;
        }
      }
    });

    exp.itens.forEach((it) => {
      const col = itensColetados.find((c) => c.itemId === it.id);
      if (col) {
        it.quantidadeSeparada = col.quantidadeColetada;
      }
    });

    exp.separacao.status = temDivergencia ? 'DIVERGENCIA' : 'CONCLUIDA';
    exp.separacao.dataConclusao = new Date().toISOString();
    exp.status = 'SEPARADO';
    exp.atualizadoEm = new Date().toISOString();

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: 'SEPARADO',
      cidade: 'Doca de Separação',
      uf: 'SP',
      descricao: `Separação concluída com ${temDivergencia ? 'ressalvas/divergência' : '100% de conformidade'}.`,
    });

    return exp;
  }

  // 2. Iniciar e Concluir Conferência (Checking)
  public iniciarConferencia(
    empresaId: string,
    expedicaoId: string,
    conferenteId: string,
    conferenteNome: string,
    metodo: 'BIPAGEM_CODIGO_BARRAS' | 'CONFERENCIA_CEGA_MANUAL' | 'PESAGEM_DINAMICA'
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    exp.status = 'EM_CONFERENCIA';
    exp.atualizadoEm = new Date().toISOString();
    exp.conferencia = {
      id: `conf-${exp.id}`,
      empresaId,
      expedicaoId: exp.id,
      codigoConferencia: `CONF-${exp.numeroExpedicao}`,
      status: 'EM_ANDAMENTO',
      conferenteId,
      conferenteNome,
      metodo,
      dataInicio: new Date().toISOString(),
      pesoTeoricoTotalKg: exp.pesoBrutoTotalKg,
      divergencias: [],
      itensConferidos: [],
    };

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: 'EM_CONFERENCIA',
      cidade: 'Bancada de Conferência',
      uf: 'SP',
      descricao: `Conferência iniciada pelo inspetor ${conferenteNome} (${metodo}).`,
      responsavelNome: conferenteNome,
    });

    return exp;
  }

  public biparItemConferencia(
    empresaId: string,
    expedicaoId: string,
    codigoProduto: string,
    codigoBarrasLido: string,
    quantidadeLida: number
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp || !exp.conferencia) throw new Error('Conferência não iniciada');

    exp.conferencia.itensConferidos.push({
      codigoProduto,
      codigoBarrasLido,
      quantidadeLida,
      timestamp: new Date().toISOString(),
    });

    const itemExp = exp.itens.find((i) => i.codigoProduto === codigoProduto);
    if (itemExp) {
      itemExp.quantidadeConferida = (itemExp.quantidadeConferida || 0) + quantidadeLida;
    }

    exp.atualizadoEm = new Date().toISOString();
    return exp;
  }

  public finalizarConferencia(
    empresaId: string,
    expedicaoId: string,
    pesoAferidoBalancaKg?: number
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp || !exp.conferencia) throw new Error('Conferência não encontrada');

    const divergencias: ConferenciaExpedicao['divergencias'] = [];

    exp.itens.forEach((it) => {
      if (it.quantidadeConferida !== it.quantidadePedida) {
        divergencias.push({
          codigoProduto: it.codigoProduto,
          descricao: it.descricao,
          quantidadeEsperada: it.quantidadePedida,
          quantidadeAferida: it.quantidadeConferida || 0,
          motivoDivergencia:
            it.quantidadeConferida < it.quantidadePedida ? 'Falta de item' : 'Sobra/excesso de item',
        });
      }
    });

    if (pesoAferidoBalancaKg) {
      exp.conferencia.pesoAferidoBalancaKg = pesoAferidoBalancaKg;
      const diff = ((pesoAferidoBalancaKg - exp.conferencia.pesoTeoricoTotalKg) / exp.conferencia.pesoTeoricoTotalKg) * 100;
      exp.conferencia.diferencaPesoPercentual = parseFloat(diff.toFixed(2));
    }

    exp.conferencia.divergencias = divergencias;
    exp.conferencia.status = divergencias.length === 0 ? 'APROVADA' : 'DIVERGENCIA';
    exp.conferencia.dataConclusao = new Date().toISOString();
    exp.status = divergencias.length === 0 ? 'CONFERIDO' : 'EM_CONFERENCIA';
    exp.atualizadoEm = new Date().toISOString();

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: exp.conferencia.status === 'APROVADA' ? 'CONFERENCIA_APROVADA' : 'CONFERENCIA_DIVERGENTE',
      cidade: 'Doca de Inspeção',
      uf: 'SP',
      descricao:
        exp.conferencia.status === 'APROVADA'
          ? 'Conferência 100% aprovada e liberada para embalagem e geração de volumes.'
          : `Conferência finalizada com ${divergencias.length} divergência(s).`,
    });

    return exp;
  }

  // 3. Geração de Volumes, Cubagem e Etiquetas
  public gerarVolumesEEtiquetas(
    empresaId: string,
    expedicaoId: string,
    volumesPayload: {
      tipoEmbalagem: TipoEmbalagem;
      dimensoesCm: { comprimento: number; largura: number; altura: number };
      pesoLiquidoKg: number;
      pesoBrutoKg: number;
      itensContidos: { expedicaoItemId: string; quantidade: number }[];
      lacreSegurancaNumero?: string;
    }[]
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    const totalVolumes = volumesPayload.length;
    const novosVolumes: VolumeExpedicao[] = volumesPayload.map((vol, idx) => {
      const numVol = idx + 1;
      const volM3 = (vol.dimensoesCm.comprimento * vol.dimensoesCm.largura * vol.dimensoesCm.altura) / 1000000;
      const pesoCubado = volM3 * 300; // Fator rodoviário padrão 300 kg/m³

      const itensMapeados = vol.itensContidos.map((it) => {
        const itemExp = exp.itens.find((i) => i.id === it.expedicaoItemId);
        return {
          expedicaoItemId: it.expedicaoItemId,
          codigoProduto: itemExp?.codigoProduto || 'PROD',
          descricao: itemExp?.descricao || '',
          quantidade: it.quantidade,
        };
      });

      return {
        id: `vol-${exp.id}-${numVol}`,
        empresaId,
        expedicaoId: exp.id,
        numeroVolume: numVol,
        totalVolumesExpedicao: totalVolumes,
        codigoVolume: `VOL-${exp.numeroExpedicao.replace('EXP-2026-', '')}-${String(numVol).padStart(2, '0')}/${String(totalVolumes).padStart(2, '0')}`,
        codigoBarrasEtiqueta: `789${exp.numeroExpedicao.replace(/\D/g, '')}${String(numVol).padStart(2, '0')}`,
        tipoEmbalagem: vol.tipoEmbalagem,
        dimensoesCm: vol.dimensoesCm,
        volumeM3: parseFloat(volM3.toFixed(3)),
        pesoLiquidoKg: vol.pesoLiquidoKg,
        pesoBrutoKg: vol.pesoBrutoKg,
        pesoCubadoKg: parseFloat(pesoCubado.toFixed(2)),
        itensContidos: itensMapeados,
        etiquetaGerada: true,
        lacreSegurancaNumero: vol.lacreSegurancaNumero,
      };
    });

    exp.volumes = novosVolumes;
    exp.quantidadeTotalVolumes = totalVolumes;
    exp.volumeM3Total = parseFloat(novosVolumes.reduce((acc, v) => acc + v.volumeM3, 0).toFixed(3));
    exp.pesoBrutoTotalKg = novosVolumes.reduce((acc, v) => acc + v.pesoBrutoKg, 0);
    exp.status = 'EMBALADO';
    exp.atualizadoEm = new Date().toISOString();

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: 'VOLUMES_GERADOS',
      cidade: 'Área de Embalagem',
      uf: 'SP',
      descricao: `${totalVolumes} volume(s) embalado(s) e etiquetas de código de barras GS1 geradas com sucesso.`,
    });

    return exp;
  }

  // 4. Gerar Documentação Fiscal e Romaneio
  public gerarDocumentacao(
    empresaId: string,
    expedicaoId: string,
    payload: {
      numeroNotaFiscal: string;
      serieNotaFiscal: string;
      chaveNFe: string;
      numeroCTe?: string;
      chaveAcessoCTe?: string;
    }
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    exp.numeroNotaFiscal = payload.numeroNotaFiscal;
    exp.serieNotaFiscal = payload.serieNotaFiscal;
    exp.chaveNFe = payload.chaveNFe;
    if (payload.numeroCTe) exp.frete.numeroCTe = payload.numeroCTe;
    if (payload.chaveAcessoCTe) exp.frete.chaveAcessoCTe = payload.chaveAcessoCTe;

    exp.status = 'DOCUMENTADO';
    exp.atualizadoEm = new Date().toISOString();

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: 'DOCUMENTACAO_EMITIDA',
      cidade: 'Faturamento',
      uf: 'SP',
      descricao: `NF-e ${payload.numeroNotaFiscal} e Romaneio de Carga emitidos. Pronto para carregamento.`,
    });

    return exp;
  }

  // 5. Despachar Expedição / Iniciar Trânsito
  public despacharExpedicao(
    empresaId: string,
    expedicaoId: string,
    payload: {
      dataSaida?: string;
      veiculoPlaca?: string;
      motoristaNome?: string;
      observacoes?: string;
    }
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    const dataSaida = payload.dataSaida || new Date().toISOString();
    exp.dataEfetivaDespacho = dataSaida;
    exp.status = 'EM_TRANSITO';
    if (payload.veiculoPlaca) exp.veiculoPlaca = payload.veiculoPlaca;
    if (payload.motoristaNome) exp.motoristaNome = payload.motoristaNome;
    exp.atualizadoEm = new Date().toISOString();

    // Atualiza itens para quantidade expedida
    exp.itens.forEach((it) => {
      it.quantidadeExpedida = it.quantidadeConferida || it.quantidadePedida;
    });

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: dataSaida,
      etapa: 'DESPACHADO',
      cidade: 'Portaria / Doca de Saída',
      uf: 'SP',
      descricao: `Carga despachada com sucesso. Em trânsito para o destinatário ${exp.clienteRazaoSocial}.`,
      responsavelNome: payload.motoristaNome || exp.transportadoraNome,
    });

    return exp;
  }

  // 6. Adicionar Evento de Rastreamento (Tracking)
  public adicionarRastreamento(
    empresaId: string,
    expedicaoId: string,
    evento: Omit<EventoRastreamento, 'id' | 'expedicaoId'>
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    const novoEvento: EventoRastreamento = {
      ...evento,
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
    };

    exp.rastreamento.push(novoEvento);
    exp.atualizadoEm = new Date().toISOString();

    return exp;
  }

  // 7. Registrar Ocorrência no Transporte & Devolução / Avaria
  public registrarOcorrencia(
    empresaId: string,
    expedicaoId: string,
    payload: {
      tipo: TipoOcorrenciaTransporte;
      gravidade: GravidadeOcorrencia;
      descricaoDetalhada: string;
      acaoTomada?: string;
      valorPrejuizoEstimado?: number;
      gerarLogisticaReversa?: boolean;
      gerarRncQualidade?: boolean;
    }
  ): { expedicao: Expedicao; ocorrencia: OcorrenciaTransporte } {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    const ocorrenciaId = `oco-${empresaId}-${Date.now()}`;
    const seq = exp.ocorrencias.length + 1;
    const codigoOcorrencia = `OCO-2026-${String(seq).padStart(4, '0')}`;

    const novaOcorrencia: OcorrenciaTransporte = {
      id: ocorrenciaId,
      empresaId,
      expedicaoId: exp.id,
      codigoOcorrencia,
      tipo: payload.tipo,
      gravidade: payload.gravidade,
      dataHora: new Date().toISOString(),
      descricaoDetalhada: payload.descricaoDetalhada,
      acaoTomada: payload.acaoTomada,
      valorPrejuizoEstimado: payload.valorPrejuizoEstimado,
      gerouLogisticaReversa: !!payload.gerarLogisticaReversa,
      gerouRncQualidade: !!payload.gerarRncQualidade,
      rncQualidadeId: payload.gerarRncQualidade ? `RNC-2026-LOG-${Date.now().toString().slice(-4)}` : undefined,
      resolvido: false,
    };

    exp.ocorrencias.push(novaOcorrencia);

    if (payload.tipo === 'AVARIA_TOTAL' || payload.tipo === 'RECUSA_CLIENTE') {
      exp.status = 'DEVOLVIDO';
    }

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: new Date().toISOString(),
      etapa: 'OCORRENCIA_TRANSPORTE',
      cidade: 'Em Trânsito',
      uf: exp.enderecoEntrega.uf,
      descricao: `Ocorrência (${payload.tipo}): ${payload.descricaoDetalhada}`,
    });

    exp.atualizadoEm = new Date().toISOString();
    return { expedicao: exp, ocorrencia: novaOcorrencia };
  }

  // 8. Confirmar Entrega e Comprovante (Canhoto Digitalizado)
  public confirmarEntrega(
    empresaId: string,
    expedicaoId: string,
    payload: {
      dataHoraEntrega: string;
      nomeRecebedor: string;
      documentoRecebedor: string;
      parentescoOuCargo?: string;
      assinaturaDigitalUrl?: string;
      canhotoFotoUrl?: string;
      latitude?: number;
      longitude?: number;
      ressalvasCliente?: string;
      entregueCompleto: boolean;
      custoFreteRealFinal?: number;
    }
  ): Expedicao {
    const exp = this.getExpedicaoById(empresaId, expedicaoId);
    if (!exp) throw new Error('Expedição não encontrada');

    const dataEntrega = new Date(payload.dataHoraEntrega);
    const dataPrometida = new Date(exp.dataPrometidaEntrega);
    const entregueNoPrazo = dataEntrega <= dataPrometida;
    const otifConforme = entregueNoPrazo && payload.entregueCompleto && exp.ocorrencias.filter((o) => !o.resolvido).length === 0;

    exp.dataEfetivaEntrega = payload.dataHoraEntrega;
    exp.status = payload.entregueCompleto ? 'ENTREGUE' : 'ENTREGUE_PARCIAL';

    if (payload.custoFreteRealFinal !== undefined) {
      exp.frete.valorFreteReal = payload.custoFreteRealFinal;
      exp.frete.variacaoValor = payload.custoFreteRealFinal - exp.frete.valorFretePrevisto;
      exp.frete.variacaoPercentual =
        exp.frete.valorFretePrevisto > 0
          ? parseFloat(((exp.frete.variacaoValor / exp.frete.valorFretePrevisto) * 100).toFixed(2))
          : 0;
    }

    const comprovante: ComprovanteEntrega = {
      id: `comp-${exp.id}`,
      empresaId,
      expedicaoId: exp.id,
      dataHoraEntrega: payload.dataHoraEntrega,
      nomeRecebedor: payload.nomeRecebedor,
      documentoRecebedor: payload.documentoRecebedor,
      parentescoOuCargo: payload.parentescoOuCargo,
      assinaturaDigitalUrl: payload.assinaturaDigitalUrl,
      canhotoFotoUrl: payload.canhotoFotoUrl,
      geolocalizacao:
        payload.latitude && payload.longitude
          ? {
              latitude: payload.latitude,
              longitude: payload.longitude,
              precisaoMetros: 10,
            }
          : undefined,
      ressalvasCliente: payload.ressalvasCliente,
      entregueNoPrazo,
      entregueCompleto: payload.entregueCompleto,
      otifConforme,
    };

    exp.comprovanteEntrega = comprovante;
    exp.atualizadoEm = new Date().toISOString();

    exp.rastreamento.push({
      id: `tr-${exp.id}-${Date.now()}`,
      expedicaoId: exp.id,
      timestamp: payload.dataHoraEntrega,
      etapa: 'ENTREGUE',
      cidade: exp.enderecoEntrega.cidade,
      uf: exp.enderecoEntrega.uf,
      descricao: `Entrega confirmada para ${payload.nomeRecebedor} (${payload.documentoRecebedor}). OTIF: ${otifConforme ? 'CONFORME' : 'NÃO CONFORME'}.`,
    });

    return exp;
  }

  // ==========================================
  // GESTÃO DE CARGAS CONSOLIDADAS (ROMANEIO)
  // ==========================================

  public getCargas(empresaId: string): CargaExpedicao[] {
    return this.cargas.get(empresaId) || [];
  }

  public criarCarga(
    empresaId: string,
    payload: {
      tipoTransporte: TipoTransporte;
      transportadoraId?: string;
      transportadoraNome?: string;
      veiculoId?: string;
      veiculoPlaca?: string;
      veiculoModelo?: string;
      motoristaId?: string;
      motoristaNome?: string;
      motoristaCelular?: string;
      rotaNome: string;
      cidadesAtendidas: string[];
      capacidadeVeiculoKg: number;
      capacidadeVeiculoM3: number;
      expedicaoIds: string[];
      observacoes?: string;
      criadoPor: string;
    }
  ): CargaExpedicao {
    const list = this.cargas.get(empresaId) || [];
    const seq = list.length + 42;
    const numeroCarga = `CARGA-2026-0${seq}`;
    const id = `carga-${empresaId}-${Date.now()}`;

    const todasExp = this.expedicoes.get(empresaId) || [];
    const expsVinculadas = todasExp.filter((e) => payload.expedicaoIds.includes(e.id));

    let pesoTotal = 0;
    let volumeTotal = 0;
    let valorMercadorias = 0;
    let totalVolumes = 0;

    const pedidosVinculados = expsVinculadas.map((exp, idx) => {
      pesoTotal += exp.pesoBrutoTotalKg;
      volumeTotal += exp.volumeM3Total;
      valorMercadorias += exp.valorMercadorias;
      totalVolumes += exp.quantidadeTotalVolumes || 1;

      // Vincula na própria expedição
      exp.cargaId = id;
      exp.numeroCarga = numeroCarga;
      exp.status = 'EM_CARGA';
      exp.atualizadoEm = new Date().toISOString();

      return {
        expedicaoId: exp.id,
        pedidoId: exp.pedidoId,
        numeroPedido: exp.numeroPedidoVenda,
        clienteNome: exp.clienteRazaoSocial,
        cidadeUf: `${exp.enderecoEntrega.cidade}/${exp.enderecoEntrega.uf}`,
        ordemEntrega: idx + 1,
        pesoKg: exp.pesoBrutoTotalKg,
        volumeM3: exp.volumeM3Total,
        quantidadeVolumes: exp.quantidadeTotalVolumes || 1,
        valorMercadorias: exp.valorMercadorias,
        statusEntrega: exp.status,
      };
    });

    const ocupacaoPeso = payload.capacidadeVeiculoKg > 0 ? (pesoTotal / payload.capacidadeVeiculoKg) * 100 : 0;
    const ocupacaoVol = payload.capacidadeVeiculoM3 > 0 ? (volumeTotal / payload.capacidadeVeiculoM3) * 100 : 0;

    const novaCarga: CargaExpedicao = {
      id,
      empresaId,
      numeroCarga,
      dataCriacao: new Date().toISOString(),
      dataCarregamentoPrevisto: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'EM_MONTAGEM',
      tipoTransporte: payload.tipoTransporte,
      transportadoraId: payload.transportadoraId,
      transportadoraNome: payload.transportadoraNome,
      veiculoId: payload.veiculoId,
      veiculoPlaca: payload.veiculoPlaca,
      veiculoModelo: payload.veiculoModelo,
      motoristaId: payload.motoristaId,
      motoristaNome: payload.motoristaNome,
      motoristaCelular: payload.motoristaCelular,
      rotaNome: payload.rotaNome,
      cidadesAtendidas: payload.cidadesAtendidas,
      capacidadeVeiculoKg: payload.capacidadeVeiculoKg,
      capacidadeVeiculoM3: payload.capacidadeVeiculoM3,
      pesoTotalCargaKg: parseFloat(pesoTotal.toFixed(2)),
      volumeTotalCargaM3: parseFloat(volumeTotal.toFixed(2)),
      ocupacaoPesoPercentual: parseFloat(ocupacaoPeso.toFixed(2)),
      ocupacaoVolumePercentual: parseFloat(ocupacaoVol.toFixed(2)),
      valorTotalMercadoriasCarga: valorMercadorias,
      quantidadeTotalVolumesCarga: totalVolumes,
      pedidosVinculados,
      observacoes: payload.observacoes,
      criadoPor: payload.criadoPor,
    };

    list.unshift(novaCarga);
    this.cargas.set(empresaId, list);
    return novaCarga;
  }

  // ==========================================
  // CÁLCULO DE FRETE E SIMULADOR
  // ==========================================

  public simularCalculoFrete(
    empresaId: string,
    modalidade: ModalidadeFrete,
    tipoTransporte: TipoTransporte,
    transportadoraId?: string,
    pesoBrutoKg = 100,
    volumeM3 = 0.5,
    valorMercadorias = 10000,
    ufDestino = 'SP'
  ) {
    if (modalidade === 'FOB' || modalidade === 'RETIRA' || modalidade === 'SEM_FRETE') {
      return {
        modalidade,
        tipoTransporte,
        valorFretePrevisto: 0,
        valorFreteReal: 0,
        variacaoValor: 0,
        variacaoPercentual: 0,
        baseCalculoKg: pesoBrutoKg,
        pesoCubadoTotalKg: volumeM3 * 300,
        pesoRealTotalKg: pesoBrutoKg,
        adValoremValor: 0,
        grisValor: 0,
        pedagioValor: 0,
        taxaDespachoValor: 0,
        outrasTaxas: 0,
      };
    }

    const tabelas = this.tabelasFrete.get(empresaId) || [];
    const tabela =
      tabelas.find((t) => t.transportadoraId === transportadoraId && t.ufDestino === ufDestino && t.ativo) ||
      tabelas[0];

    const pesoCubado = volumeM3 * (tabela?.fatorCubagemKgPorM3 || 300);
    const baseCalculoKg = Math.max(pesoBrutoKg, pesoCubado);

    let fretePeso = 50.0;
    if (tabela) {
      const faixa = tabela.faixasPeso.find((f) => baseCalculoKg <= f.pesoAteKg);
      if (faixa) {
        fretePeso = faixa.tipoCobranca === 'VALOR_FIXO' ? faixa.valorKgOuFixo : baseCalculoKg * faixa.valorKgOuFixo;
      } else {
        const maiorFaixa = tabela.faixasPeso[tabela.faixasPeso.length - 1];
        fretePeso = baseCalculoKg * (maiorFaixa?.valorKgOuFixo || 0.65);
      }
    }

    const taxaDespacho = tabela?.valorFixoDespacho || 45.0;
    const adValorem = (valorMercadorias * (tabela?.aliquotaAdValoremPercentual || 0.35)) / 100;
    const gris = (valorMercadorias * (tabela?.aliquotaGrisPercentual || 0.15)) / 100;
    const fracoes100Kg = Math.ceil(baseCalculoKg / 100);
    const pedagio = fracoes100Kg * (tabela?.valorPedagioPorFracao100kg || 6.5);

    const valorTotalPrevisto = parseFloat((fretePeso + taxaDespacho + adValorem + gris + pedagio).toFixed(2));

    return {
      modalidade,
      transportadoraId: tabela?.transportadoraId || transportadoraId,
      transportadoraNome: tabela?.transportadoraNome || 'Transportadora Padrão',
      tipoTransporte,
      tabelaFreteId: tabela?.id,
      valorFretePrevisto: valorTotalPrevisto,
      valorFreteReal: valorTotalPrevisto,
      variacaoValor: 0,
      variacaoPercentual: 0,
      baseCalculoKg: parseFloat(baseCalculoKg.toFixed(2)),
      pesoCubadoTotalKg: parseFloat(pesoCubado.toFixed(2)),
      pesoRealTotalKg: parseFloat(pesoBrutoKg.toFixed(2)),
      adValoremValor: parseFloat(adValorem.toFixed(2)),
      grisValor: parseFloat(gris.toFixed(2)),
      pedagioValor: parseFloat(pedagio.toFixed(2)),
      taxaDespachoValor: parseFloat(taxaDespacho.toFixed(2)),
      outrasTaxas: 0,
    };
  }

  // ==========================================
  // INDICADORES OTIF & CUSTOS DE FRETE
  // ==========================================

  public calcularIndicadoresLogisticaEOTIF(empresaId: string): IndicadoresLogisticaOTIF {
    const list = this.expedicoes.get(empresaId) || [];

    const totalExpedicoes = list.length;
    const expedicoesEntregues = list.filter((e) => e.status === 'ENTREGUE' || e.status === 'ENTREGUE_PARCIAL').length;
    const expedicoesEmTransito = list.filter((e) => e.status === 'EM_TRANSITO' || e.status === 'DESPACHADO' || e.status === 'EM_CARGA').length;
    const expedicoesEmSeparacaoConferencia = list.filter(
      (e) => e.status === 'PENDENTE' || e.status === 'EM_SEPARACAO' || e.status === 'SEPARADO' || e.status === 'EM_CONFERENCIA' || e.status === 'CONFERIDO' || e.status === 'EMBALADO' || e.status === 'DOCUMENTADO'
    ).length;

    const entregasAvaliadas = list.filter((e) => e.comprovanteEntrega);
    const totalEntregasAvaliadas = entregasAvaliadas.length;

    const onTimeCount = entregasAvaliadas.filter((e) => e.comprovanteEntrega?.entregueNoPrazo).length;
    const inFullCount = entregasAvaliadas.filter((e) => e.comprovanteEntrega?.entregueCompleto).length;
    const otifCount = entregasAvaliadas.filter((e) => e.comprovanteEntrega?.otifConforme).length;

    const taxaOnTime = totalEntregasAvaliadas > 0 ? (onTimeCount / totalEntregasAvaliadas) * 100 : 100;
    const taxaInFull = totalEntregasAvaliadas > 0 ? (inFullCount / totalEntregasAvaliadas) * 100 : 100;
    const taxaOtifGeral = totalEntregasAvaliadas > 0 ? (otifCount / totalEntregasAvaliadas) * 100 : 100;

    let custoPrevistoTotal = 0;
    let custoRealTotal = 0;
    let pesoTotalExpedidoKg = 0;
    let totalVolumes = 0;

    list.forEach((e) => {
      custoPrevistoTotal += e.frete.valorFretePrevisto || 0;
      custoRealTotal += e.frete.valorFreteReal || 0;
      pesoTotalExpedidoKg += e.pesoBrutoTotalKg || 0;
      totalVolumes += e.quantidadeTotalVolumes || 0;
    });

    const variacaoFreteTotal = custoRealTotal - custoPrevistoTotal;
    const variacaoFretePercentual =
      custoPrevistoTotal > 0 ? parseFloat(((variacaoFreteTotal / custoPrevistoTotal) * 100).toFixed(2)) : 0;
    const custoMedioPorKg = pesoTotalExpedidoKg > 0 ? parseFloat((custoRealTotal / pesoTotalExpedidoKg).toFixed(2)) : 0;

    // Ocorrências
    const todasOcorrencias = list.flatMap((e) => e.ocorrencias || []);
    const contagemTipos: Record<string, number> = {};
    todasOcorrencias.forEach((o) => {
      contagemTipos[o.tipo] = (contagemTipos[o.tipo] || 0) + 1;
    });

    const ocorrenciasPorTipo = Object.entries(contagemTipos).map(([tipo, qtd]) => ({
      tipo: tipo as TipoOcorrenciaTransporte,
      quantidade: qtd,
      percentual: todasOcorrencias.length > 0 ? parseFloat(((qtd / todasOcorrencias.length) * 100).toFixed(1)) : 0,
    }));

    const causasPerdaOTIF = [
      { causa: 'Atraso na Malha Rodoviária / Tráfego', impactoPercentual: 45.0 },
      { causa: 'Avaria em Trânsito / Transbordo', impactoPercentual: 25.0 },
      { causa: 'Divergência de Separação / Falta de Volume', impactoPercentual: 18.0 },
      { causa: 'Destinatário Ausente / Problema de Agendamento', impactoPercentual: 12.0 },
    ];

    return {
      totalExpedicoes,
      expedicoesEntregues,
      expedicoesEmTransito,
      expedicoesEmSeparacaoConferencia,
      taxaOtifGeral: parseFloat(taxaOtifGeral.toFixed(1)),
      taxaOnTime: parseFloat(taxaOnTime.toFixed(1)),
      taxaInFull: parseFloat(taxaInFull.toFixed(1)),
      custoFretePrevistoTotal: parseFloat(custoPrevistoTotal.toFixed(2)),
      custoFreteRealTotal: parseFloat(custoRealTotal.toFixed(2)),
      variacaoFreteTotal: parseFloat(variacaoFreteTotal.toFixed(2)),
      variacaoFretePercentual,
      custoMedioPorKg,
      pesoTotalExpedidoKg: parseFloat(pesoTotalExpedidoKg.toFixed(1)),
      totalVolumesExpedidos: totalVolumes,
      totalOcorrencias: todasOcorrencias.length,
      ocorrenciasPorTipo,
      causasPerdaOTIF,
    };
  }

  // ==========================================
  // CADASTROS AUXILIARES (CRUD)
  // ==========================================

  public getTransportadoras(empresaId: string): Transportadora[] {
    return this.transportadoras.get(empresaId) || [];
  }

  public salvarTransportadora(empresaId: string, payload: Omit<Transportadora, 'id' | 'empresaId'> & { id?: string }): Transportadora {
    const list = this.transportadoras.get(empresaId) || [];
    if (payload.id) {
      const idx = list.findIndex((t) => t.id === payload.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload, id: payload.id, empresaId };
        this.transportadoras.set(empresaId, list);
        return list[idx];
      }
    }
    const nova: Transportadora = {
      ...payload,
      id: `transp-${empresaId}-${Date.now()}`,
      empresaId,
      taxaPontualidadePercentual: payload.taxaPontualidadePercentual || 95.0,
      ativo: payload.ativo ?? true,
    };
    list.push(nova);
    this.transportadoras.set(empresaId, list);
    return nova;
  }

  public getTabelasFrete(empresaId: string): TabelaFrete[] {
    return this.tabelasFrete.get(empresaId) || [];
  }

  public salvarTabelaFrete(empresaId: string, payload: Omit<TabelaFrete, 'id' | 'empresaId'> & { id?: string }): TabelaFrete {
    const list = this.tabelasFrete.get(empresaId) || [];
    if (payload.id) {
      const idx = list.findIndex((t) => t.id === payload.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload, id: payload.id, empresaId };
        this.tabelasFrete.set(empresaId, list);
        return list[idx];
      }
    }
    const nova: TabelaFrete = {
      ...payload,
      id: `tabfrete-${empresaId}-${Date.now()}`,
      empresaId,
      ativo: payload.ativo ?? true,
    };
    list.push(nova);
    this.tabelasFrete.set(empresaId, list);
    return nova;
  }

  public getVeiculos(empresaId: string): VeiculoFrota[] {
    return this.veiculos.get(empresaId) || [];
  }

  public salvarVeiculo(empresaId: string, payload: Omit<VeiculoFrota, 'id' | 'empresaId'> & { id?: string }): VeiculoFrota {
    const list = this.veiculos.get(empresaId) || [];
    if (payload.id) {
      const idx = list.findIndex((v) => v.id === payload.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload, id: payload.id, empresaId };
        this.veiculos.set(empresaId, list);
        return list[idx];
      }
    }
    const novo: VeiculoFrota = {
      ...payload,
      id: `veic-${empresaId}-${Date.now()}`,
      empresaId,
    };
    list.push(novo);
    this.veiculos.set(empresaId, list);
    return novo;
  }

  public getMotoristas(empresaId: string): Motorista[] {
    return this.motoristas.get(empresaId) || [];
  }

  public salvarMotorista(empresaId: string, payload: Omit<Motorista, 'id' | 'empresaId'> & { id?: string }): Motorista {
    const list = this.motoristas.get(empresaId) || [];
    if (payload.id) {
      const idx = list.findIndex((m) => m.id === payload.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload, id: payload.id, empresaId };
        this.motoristas.set(empresaId, list);
        return list[idx];
      }
    }
    const novo: Motorista = {
      ...payload,
      id: `mot-${empresaId}-${Date.now()}`,
      empresaId,
    };
    list.push(novo);
    this.motoristas.set(empresaId, list);
    return novo;
  }
}

export const expedicaoService = new ExpedicaoService();
