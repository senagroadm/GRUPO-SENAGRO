import React, { useState } from 'react';
import {
  FileText,
  Download,
  Filter,
  Layout,
  Save,
  Check,
  Layers,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  Star,
  Sliders,
  BarChart2,
  Calendar,
  Building2,
  ListFilter,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface CategoriaRelatorio {
  id: string;
  nome: string;
  descricao: string;
  iconeModulo: string;
  relatorios: {
    id: string;
    titulo: string;
    descricao: string;
    tipoPadrao: string;
  }[];
}

const CATEGORIAS_RELATORIOS: CategoriaRelatorio[] = [
  {
    id: 'clientes',
    nome: 'Clientes',
    descricao: 'Carteira de clientes, limites e histórico',
    iconeModulo: 'Users',
    relatorios: [
      { id: 'cli-01', titulo: 'Extrato Consolidado da Carteira', descricao: 'Listagem completa por empresa e vendedor', tipoPadrao: 'Analítico' },
      { id: 'cli-02', titulo: 'Curva ABC de Clientes por Faturamento', descricao: 'Classificação por volume nos 5 CNPJs', tipoPadrao: 'Sintético' },
      { id: 'cli-03', titulo: 'Clientes Inativos (> 90 dias)', descricao: 'Contatos sem pedidos recentes para reativação', tipoPadrao: 'Operacional' },
    ],
  },
  {
    id: 'fornecedores',
    nome: 'Fornecedores',
    descricao: 'Parceiros, homologações e pontualidade OTIF',
    iconeModulo: 'Truck',
    relatorios: [
      { id: 'for-01', titulo: 'Quadro Geral de Fornecedores Homologados', descricao: 'Status cadastral e avaliação de conformidade', tipoPadrao: 'Analítico' },
      { id: 'for-02', titulo: 'Desempenho de Entrega (OTIF)', descricao: 'Índice de pontualidade e conformidade de pedidos', tipoPadrao: 'Gerencial' },
    ],
  },
  {
    id: 'estoque',
    nome: 'Estoque',
    descricao: 'Saldos, posições físicas e valorização contábil',
    iconeModulo: 'Boxes',
    relatorios: [
      { id: 'est-01', titulo: 'Posição Físico-Financeira por Depósito', descricao: 'Saldos valorizados pelo custo médio e PEPS', tipoPadrao: 'Analítico' },
      { id: 'est-02', titulo: 'Itens Abaixo do Estoque Mínimo / Ponto de Pedido', descricao: 'Necessidade de ressuprimento emergencial', tipoPadrao: 'Operacional' },
      { id: 'est-03', titulo: 'Giro e Cobertura de Estoque (Dias)', descricao: 'Análise de obsolescência e giro fabril', tipoPadrao: 'Estratégico' },
    ],
  },
  {
    id: 'movimentacoes',
    nome: 'Movimentações',
    descricao: 'Entradas, saídas, transferências e estornos',
    iconeModulo: 'ArrowRightLeft',
    relatorios: [
      { id: 'mov-01', titulo: 'Kardex Completo de Movimentação por Item', descricao: 'Rastreabilidade de lotes e ordens vinculadas', tipoPadrao: 'Analítico' },
      { id: 'mov-02', titulo: 'Transferências Intercompany (5 CNPJs)', descricao: 'Movimentações entre filiais e matriz', tipoPadrao: 'Auditoria' },
    ],
  },
  {
    id: 'vendas',
    nome: 'Vendas',
    descricao: 'Faturamento, rentabilidade e margens comerciais',
    iconeModulo: 'TrendingUp',
    relatorios: [
      { id: 'ven-01', titulo: 'Mapa Geral de Vendas por Período e UF', descricao: 'Consolidação tributária e geográfica', tipoPadrao: 'Gerencial' },
      { id: 'ven-02', titulo: 'Margem de Contribuição por Linha de Produto', descricao: 'Rentabilidade real pós-impostos', tipoPadrao: 'Estratégico' },
    ],
  },
  {
    id: 'orcamentos',
    nome: 'Orçamento',
    descricao: 'Propostas técnicas, CPQ e taxas de conversão',
    iconeModulo: 'FileSpreadsheet',
    relatorios: [
      { id: 'orc-01', titulo: 'Funil de Orçamentos e Taxa de Conversão', descricao: 'Volume cotado vs pedidos emitidos', tipoPadrao: 'Gerencial' },
      { id: 'orc-02', titulo: 'Histórico de Descontos e Alçadas Aplicadas', descricao: 'Auditoria de margens concedidas', tipoPadrao: 'Auditoria' },
    ],
  },
  {
    id: 'pedidos',
    nome: 'Pedidos',
    descricao: 'Carteira de pedidos, backorders e faturamento pendente',
    iconeModulo: 'ShoppingBag',
    relatorios: [
      { id: 'ped-01', titulo: 'Backlog Geral de Pedidos em Aberto', descricao: 'Itens em produção, separação e expedição', tipoPadrao: 'Operacional' },
      { id: 'ped-02', titulo: 'Histórico de Cancelamentos e Estornos', descricao: 'Justificativas de perdas e cancelamentos', tipoPadrao: 'Auditoria' },
    ],
  },
  {
    id: 'compras',
    nome: 'Compras',
    descricao: 'Ordens de compra, cotações e saving obtido',
    iconeModulo: 'ShoppingCart',
    relatorios: [
      { id: 'cmp-01', titulo: 'Acompanhamento de Ordens de Compra (Follow-up)', descricao: 'Prazos de entrega prometidos vs realizados', tipoPadrao: 'Operacional' },
      { id: 'cmp-02', titulo: 'Saving e Negociação por Comprador', descricao: 'Diferencial entre orçamento base e fechamento', tipoPadrao: 'Gerencial' },
    ],
  },
  {
    id: 'producao',
    nome: 'Produção',
    descricao: 'Ordens fabris, apontamentos e eficiência OEE',
    iconeModulo: 'Hammer',
    relatorios: [
      { id: 'prd-01', titulo: 'Acompanhamento de OPs (Chão de Fábrica)', descricao: 'Status das operações de corte, dobra e solda', tipoPadrao: 'Operacional' },
      { id: 'prd-02', titulo: 'Cálculo de Eficiência Global (OEE) por Centro de Trabalho', descricao: 'Disponibilidade, performance e qualidade', tipoPadrao: 'Gerencial' },
      { id: 'prd-03', titulo: 'Relatório de Refugos e Retrabalhos Fabris', descricao: 'Custo de não-conformidade acumulado', tipoPadrao: 'Qualidade' },
    ],
  },
  {
    id: 'qualidade',
    nome: 'Qualidade',
    descricao: 'RNCs, inspeções de recebimento e laudos',
    iconeModulo: 'ShieldCheck',
    relatorios: [
      { id: 'qua-01', titulo: 'Painel Consolidado de RNCs e Ações Corretivas', descricao: 'Classificação por gravidade e causa raiz (5 Porquês)', tipoPadrao: 'Auditoria' },
      { id: 'qua-02', titulo: 'Certificados de Matéria-Prima e Rastreabilidade', descricao: 'Vínculo de lotes de aço com certificados de usina', tipoPadrao: 'Técnico' },
    ],
  },
  {
    id: 'manutencao',
    nome: 'Manutenção',
    descricao: 'Ordens de serviço, preventivas e MTBF / MTTR',
    iconeModulo: 'Wrench',
    relatorios: [
      { id: 'man-01', titulo: 'Cronograma de Manutenções Preventivas e Preditivas', descricao: 'Paradas programadas de corte laser e dobradeiras', tipoPadrao: 'Operacional' },
      { id: 'man-02', titulo: 'Indicadores MTBF e MTTR por Equipamento', descricao: 'Tempo médio entre falhas e tempo de reparo', tipoPadrao: 'Gerencial' },
    ],
  },
  {
    id: 'expedicao',
    nome: 'Expedição',
    descricao: 'Romaneios, fretes, rastreamento e entregas',
    iconeModulo: 'PackageCheck',
    relatorios: [
      { id: 'exp-01', titulo: 'Romaneios de Carga e Minutas de Despacho', descricao: 'Volumes conferidos e vinculados a CT-e/NF-e', tipoPadrao: 'Operacional' },
      { id: 'exp-02', titulo: 'Auditoria de Fretes e Custos Logísticos', descricao: 'Comparativo CIF vs FOB por transportadora', tipoPadrao: 'Financeiro' },
    ],
  },
  {
    id: 'contas_pagar_receber',
    nome: 'Contas a Pagar/Receber',
    descricao: 'Títulos em aberto, liquidados e inadimplência',
    iconeModulo: 'Receipt',
    relatorios: [
      { id: 'cpr-01', titulo: 'Posição Geral de Contas a Receber (Aging List)', descricao: 'Faixas de vencimento: a vencer, 30, 60, 90+ dias', tipoPadrao: 'Financeiro' },
      { id: 'cpr-02', titulo: 'Compromissos Financeiros a Pagar por Fornecedor', descricao: 'Programação semanal de desembolsos autorizados', tipoPadrao: 'Financeiro' },
    ],
  },
  {
    id: 'bancos',
    nome: 'Bancos',
    descricao: 'Saldos consolidados, extratos e contas bancárias',
    iconeModulo: 'Landmark',
    relatorios: [
      { id: 'ban-01', titulo: 'Posição Consolidada de Disponibilidades (5 CNPJs)', descricao: 'Saldos em conta corrente e aplicações de liquidez', tipoPadrao: 'Tesouraria' },
      { id: 'ban-02', titulo: 'Extrato Detalhado de Boletos Emitidos e Taxas', descricao: 'Remessas e liquidações bancárias CNAB 240', tipoPadrao: 'Operacional' },
    ],
  },
  {
    id: 'conciliacao',
    nome: 'Conciliação',
    descricao: 'Conciliação bancária, cartões e divergências',
    iconeModulo: 'Scale',
    relatorios: [
      { id: 'con-01', titulo: 'Relatório de Pendências de Conciliação Bancária', descricao: 'Lançamentos sem correspondência no extrato OFX', tipoPadrao: 'Controladoria' },
      { id: 'con-02', titulo: 'Conciliação de Recebimentos via PIX Híbrido', descricao: 'Liquidações automáticas vs créditos em conta', tipoPadrao: 'Financeiro' },
    ],
  },
  {
    id: 'fiscal',
    nome: 'Fiscal',
    descricao: 'Livros fiscais, apuração de impostos e SPED',
    iconeModulo: 'FileCode',
    relatorios: [
      { id: 'fisc-01', titulo: 'Resumo de Apuração Tributária (ICMS, IPI, PIS, COFINS)', descricao: 'Memória de cálculo de débitos e créditos por empresa', tipoPadrao: 'Fiscal' },
      { id: 'fisc-02', titulo: 'Simulação da Reforma Tributária (IBS e CBS)', descricao: 'Impacto projetado da transição tributária', tipoPadrao: 'Estratégico' },
    ],
  },
  {
    id: 'dre',
    nome: 'DRE',
    descricao: 'Demonstrativo de Resultado do Exercício gerencial',
    iconeModulo: 'BarChart3',
    relatorios: [
      { id: 'dre-01', titulo: 'DRE Gerencial Consolidado e por Centro de Custo', descricao: 'Receita líquida, CPV, despesas operacionais e EBITDA', tipoPadrao: 'Controladoria' },
      { id: 'dre-02', titulo: 'DRE Comparativo Intercompany (Eliminações do Grupo)', descricao: 'Resultado líquido consolidado sem duplicidades', tipoPadrao: 'Estratégico' },
    ],
  },
  {
    id: 'fluxo_caixa',
    nome: 'Fluxo de Caixa',
    descricao: 'Projeção diária, semanal e mensal de tesouraria',
    iconeModulo: 'DollarSign',
    relatorios: [
      { id: 'flx-01', titulo: 'Fluxo de Caixa Projetado vs Realizado (90 Dias)', descricao: 'Entradas previstas, pedidos faturáveis e saídas fixas', tipoPadrao: 'Tesouraria' },
      { id: 'flx-02', titulo: 'Análise de Cenários de Liquidez (Otimista / Pessimista)', descricao: 'Sensibilidade a atrasos de clientes e adiantamentos', tipoPadrao: 'Estratégico' },
    ],
  },
  {
    id: 'credito',
    nome: 'Crédito',
    descricao: 'Limites de crédito, ratings de risco e Serasa',
    iconeModulo: 'ShieldAlert',
    relatorios: [
      { id: 'crd-01', titulo: 'Painel de Exposição de Risco e Limites de Crédito', descricao: 'Utilização do limite aprovado por cliente do grupo', tipoPadrao: 'Risco' },
      { id: 'crd-02', titulo: 'Histórico de Consultas de Score (Serasa Adapter)', descricao: 'Consultas efetuadas, scores e pareceres de comitê', tipoPadrao: 'Auditoria' },
    ],
  },
  {
    id: 'rh',
    nome: 'RH',
    descricao: 'Quadro de lotação, horas extras e produtividade fabril',
    iconeModulo: 'Users2',
    relatorios: [
      { id: 'rh-01', titulo: 'Espelho de Banco de Horas e Horas Extras Fabris', descricao: 'Controle de apontamentos de ponto e turnos de fábrica', tipoPadrao: 'Operacional' },
      { id: 'rh-02', titulo: 'Custo de Mão de Obra Direta (MOD) por Setor e Turno', descricao: 'Apropriação de custos de RH por centro de trabalho', tipoPadrao: 'Gerencial' },
    ],
  },
];

const COLUNAS_DISPONIVEIS = [
  { id: 'codigo', label: 'Código / Identificador', padrao: true },
  { id: 'descricao', label: 'Descrição / Razão Social', padrao: true },
  { id: 'empresa_origem', label: 'CNPJ / Empresa Emitente', padrao: true },
  { id: 'data_emissao', label: 'Data de Emissão / Evento', padrao: true },
  { id: 'quantidade', label: 'Quantidade / Volumes', padrao: true },
  { id: 'valor_unitario', label: 'Valor Unitário (R$)', padrao: false },
  { id: 'valor_total', label: 'Valor Total Bruto (R$)', padrao: true },
  { id: 'desconto', label: 'Desconto Concedido (%)', padrao: false },
  { id: 'impostos', label: 'Impostos Retidos (R$)', padrao: false },
  { id: 'valor_liquido', label: 'Valor Líquido Faturado (R$)', padrao: true },
  { id: 'status_operacional', label: 'Status Operacional', padrao: true },
  { id: 'responsavel', label: 'Operador / Responsável', padrao: false },
  { id: 'centro_custo', label: 'Centro de Custo / Setor', padrao: false },
  { id: 'lote_serie', label: 'Número de Lote / Rastreabilidade', padrao: false },
];

export function RelatoriosViewer() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaRelatorio>(CATEGORIAS_RELATORIOS[0]);
  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState<string>(CATEGORIAS_RELATORIOS[0].relatorios[0].id);

  // Estados dos Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('TODAS');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('MES_ATUAL');
  const [ordenacao, setOrdenacao] = useState<string>('DATA_DESC');
  const [agrupamento, setAgrupamento] = useState<string>('EMPRESA');
  const [tipoQuebra, setTipoQuebra] = useState<string>('SUBTOTAL');

  // Colunas selecionadas
  const [colunasAtivas, setColunasAtivas] = useState<string[]>(
    COLUNAS_DISPONIVEIS.filter(c => c.padrao).map(c => c.id)
  );

  // Totalizadores
  const [somarTotais, setSomarTotais] = useState<boolean>(true);
  const [calcularMedias, setCalcularMedias] = useState<boolean>(true);
  const [contarRegistros, setContarRegistros] = useState<boolean>(true);

  // Feedback de Ações
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  const relatorioAtual = categoriaSelecionada.relatorios.find(r => r.id === relatorioSelecionadoId) || categoriaSelecionada.relatorios[0];

  const handleToggleColuna = (id: string) => {
    if (colunasAtivas.includes(id)) {
      if (colunasAtivas.length > 2) {
        setColunasAtivas(colunasAtivas.filter(c => c !== id));
      }
    } else {
      setColunasAtivas([...colunasAtivas, id]);
    }
  };

  const handleSimularGeracao = (tipo: 'PDF' | 'XLSX' | 'FAVORITO') => {
    if (tipo === 'PDF') {
      setMensagemFeedback(`Simulação de impressão PDF disparada para "${relatorioAtual.titulo}". Layout analítico formatado.`);
    } else if (tipo === 'XLSX') {
      setMensagemFeedback(`Arquivo de planilha XLSX estruturado com ${colunasAtivas.length} colunas e fórmulas automáticas.`);
    } else {
      setMensagemFeedback(`Configuração salva nos favoritos: "${relatorioAtual.titulo}" [Filtro: ${empresaFiltro}, Agrupamento: ${agrupamento}].`);
    }

    setTimeout(() => {
      setMensagemFeedback(null);
    }, 4500);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Motor de Relatórios */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            Motor de Relatórios & Inteligência Operacional
          </h2>
          <p className="text-sm text-slate-500">
            Geração de relatórios parametrizáveis com consolidação multiempresa nos 5 CNPJs do Grupo TRITECH.
          </p>
        </div>

        {/* Botões de Ação Visual */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimularGeracao('FAVORITO')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
          >
            <Star className="w-3.5 h-3.5 text-amber-600" />
            Salvar Favorito
          </button>
          <button
            onClick={() => handleSimularGeracao('XLSX')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Gerar XLSX
          </button>
          <button
            onClick={() => handleSimularGeracao('PDF')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Notificação / Feedback de Ação */}
      {mensagemFeedback && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{mensagemFeedback}</span>
          </div>
          <button
            onClick={() => setMensagemFeedback(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Menu Lateral de Categorias + Área de Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Menu Lateral de Categorias (20 Módulos/Domínios) */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/60 overflow-y-auto max-h-[calc(100vh-220px)] p-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
            Categorias de Relatórios ({CATEGORIAS_RELATORIOS.length})
          </div>

          <div className="space-y-1">
            {CATEGORIAS_RELATORIOS.map((cat) => {
              const isAtiva = categoriaSelecionada.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoriaSelecionada(cat);
                    setRelatorioSelecionadoId(cat.relatorios[0]?.id || '');
                  }}
                  className={`w-full text-left p-2.5 rounded-md transition-all flex items-center justify-between text-xs ${
                    isAtiva
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-2 h-2 rounded-full ${isAtiva ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    <div>
                      <div className="truncate">{cat.nome}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">{cat.descricao}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isAtiva ? 'text-indigo-600' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel Central: Configuração do Relatório Selecionado */}
        <div className="lg:col-span-8 p-5 overflow-y-auto space-y-6 bg-white">
          
          {/* Seletor de Modelo de Relatório dentro da Categoria */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Modelos Pré-Configurados: {categoriaSelecionada.nome}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {categoriaSelecionada.relatorios.length} modelos disponíveis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoriaSelecionada.relatorios.map((rel) => {
                const isSelected = relatorioSelecionadoId === rel.id;
                return (
                  <div
                    key={rel.id}
                    onClick={() => setRelatorioSelecionadoId(rel.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-slate-800">{rel.titulo}</div>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {rel.tipoPadrao}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{rel.descricao}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 1: Filtros de Seleção de Dados */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Filter className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Filtros e Escopo dos Dados
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Empresa / CNPJ:
                </label>
                <select
                  value={empresaFiltro}
                  onChange={(e) => setEmpresaFiltro(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="TODAS">Todas as 5 Empresas (Consolidado)</option>
                  <option value="TRITECH_MATRIZ">TRITECH Industrial Matriz (11.222...)</option>
                  <option value="OLIVEIRA_AMORIM">Oliveira & Amorim Distribuição (22.333...)</option>
                  <option value="MWAM_ENGENHARIA">MWAM Engenharia e Soluções (33.444...)</option>
                  <option value="TRITECH_CORTE">Tritech Corte e Conformação (44.555...)</option>
                  <option value="SENAGRO_MAQUINAS">Senagro Agrícola e Máquinas (55.666...)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Período de Competência:
                </label>
                <select
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="HOJE">Hoje</option>
                  <option value="SEMANA_ATUAL">Semana Atual</option>
                  <option value="MES_ATUAL">Mês Atual (Agosto/2026)</option>
                  <option value="TRIMESTRE">Último Trimestre</option>
                  <option value="ANO_CORRENTE">Ano de 2026 Completo</option>
                  <option value="PERSONALIZADO">Intervalo Personalizado...</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Status de Registro:
                </label>
                <select
                  className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="TODOS">Todos os Registros Ativos</option>
                  <option value="APENAS_APROVADOS">Apenas Aprovados / Emitidos</option>
                  <option value="PENDENTES">Apenas Pendências / Em Aberto</option>
                  <option value="CANCELADOS">Cancelados / Estornados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Colunas e Campos Configuráveis */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Colunas Visíveis no Relatório
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                {colunasAtivas.length} de {COLUNAS_DISPONIVEIS.length} colunas marcadas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {COLUNAS_DISPONIVEIS.map((col) => {
                const isMarcada = colunasAtivas.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => handleToggleColuna(col.id)}
                    className={`flex items-center gap-2 text-left p-2 rounded border text-xs transition-colors ${
                      isMarcada
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {isMarcada ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 3: Ordenação, Agrupamento e Totalizadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco de Ordenação e Agrupamento */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ordenação e Agrupamento
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Ordenar Por:
                  </label>
                  <select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="DATA_DESC">Data do Evento (Mais recente primeiro)</option>
                    <option value="DATA_ASC">Data do Evento (Mais antigo primeiro)</option>
                    <option value="VALOR_DESC">Valor Total (Maior para menor)</option>
                    <option value="ALFABETICA">Razão Social / Nome (A - Z)</option>
                    <option value="CODIGO">Código de Identificação (Numérico)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Quebrar / Agrupar Por:
                  </label>
                  <select
                    value={agrupamento}
                    onChange={(e) => setAgrupamento(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="EMPRESA">Empresa / CNPJ do Grupo</option>
                    <option value="SETOR">Centro de Custo / Setor</option>
                    <option value="CLIENTE">Cliente / Fornecedor</option>
                    <option value="VENDEDOR">Operador / Vendedor Responsável</option>
                    <option value="NENHUM">Sem Agrupamento (Listagem Contínua)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco de Totalizadores e Sumários */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ListFilter className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Totalizadores & Resumos
                </h3>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={somarTotais}
                    onChange={(e) => setSomarTotais(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Somar valores monetários ao final dos grupos (R$)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcularMedias}
                    onChange={(e) => setCalcularMedias(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Calcular médias ponderadas e margem percentual</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contarRegistros}
                    onChange={(e) => setContarRegistros(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Exibir contagem total de linhas e registros</span>
                </label>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-500 mt-2">
                <strong>Assinatura de Governança:</strong> Os relatórios gerados carregam carimbo de tempo inviolável e assinatura do usuário autenticado no contexto multi-tenant.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
