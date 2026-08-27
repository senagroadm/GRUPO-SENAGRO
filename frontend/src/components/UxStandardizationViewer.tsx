import React, { useState } from 'react';
import {
  LayoutTemplate,
  Search,
  Filter,
  CheckSquare,
  Smartphone,
  Monitor,
  Building2,
  User,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Columns,
  Table,
  SlidersHorizontal,
  Info,
  AlertCircle,
  HelpCircle,
  Maximize2,
  MousePointerClick,
  Eye,
} from 'lucide-react';

interface UxPattern {
  id: string;
  categoria: 'NAVEGACAO' | 'ESTADOS' | 'TABELAS_FILTROS' | 'MODAIS_ACOES';
  titulo: string;
  padraoObrigatorio: string;
  beneficio: string;
  exemploVisual: string;
}

const PADROES_UX: UxPattern[] = [
  {
    id: 'UX-01',
    categoria: 'NAVEGACAO',
    titulo: 'Cabeçalho Global & Contexto da Empresa',
    padraoObrigatorio: 'Exibição permanente do CNPJ/Empresa ativa, usuário autenticado e seletor rápido.',
    beneficio: 'Elimina trocas acidentais de tenant e previne lançamentos cruzados incorretos.',
    exemploVisual: 'Header fixo 56px com seletor de empresa_id destacado e avatar com nível de alçada.',
  },
  {
    id: 'UX-02',
    categoria: 'NAVEGACAO',
    titulo: 'Breadcrumbs & Navegação Hierárquica',
    padraoObrigatorio: 'Trilha de navegação contextual presente em todas as páginas internas (Home > PCP > OPs).',
    beneficio: 'Orientação espacial contínua e retorno com um clique sem perda de filtros.',
    exemploVisual: 'Módulo > Submódulo > Registro Ativo com link para retorno rápido.',
  },
  {
    id: 'UX-03',
    categoria: 'TABELAS_FILTROS',
    titulo: 'Filtros Persistentes & Busca Global',
    padraoObrigatorio: 'Painel de filtros colapsável com memorização de estado na URL/Sessão e busca unificada.',
    beneficio: 'Eficiência para operadores industriais que executam consultas repetitivas de chão de fábrica.',
    exemploVisual: 'Barra superior com busca por código/CNPJ + chips de filtros ativos com botão limpar.',
  },
  {
    id: 'UX-04',
    categoria: 'TABELAS_FILTROS',
    titulo: 'Tabelas Paginadas & Colunas Adaptáveis',
    padraoObrigatorio: 'Paginação por cursor, ordenação em headers e feedback visual de registros selecionados.',
    beneficio: 'Alta performance de renderização mesmo em bases com mais de 50.000 itens.',
    exemploVisual: 'Grid com zebrado suave, sticky header e resumo no rodapé (Exibindo 1-25 de 1.420).',
  },
  {
    id: 'UX-05',
    categoria: 'MODAIS_ACOES',
    titulo: 'Ações Críticas com Confirmação em 2 Fatores',
    padraoObrigatorio: 'Ações destrutivas, estornos ou aprovações de crédito exigem confirmação explícita.',
    beneficio: 'Conformidade com a regra de Não-Destrutividade e governança corporativa do Grupo TRITECH.',
    exemploVisual: 'Modal com banner vermelho/âmbar, digitação de confirmação e resumo before/after.',
  },
  {
    id: 'UX-06',
    categoria: 'ESTADOS',
    titulo: 'Estados de Carregamento (Skeleton) & Vazio (Empty State)',
    padraoObrigatorio: 'Proibido telas em branco ou spinners soltos. Use skeletons proporcionais e call-to-actions nos empty states.',
    beneficio: 'Redução do tempo percebido de resposta e orientação imediata para o próximo passo.',
    exemploVisual: 'Skeleton com formato exato da tabela + Empty state com ilustração e botão "+ Novo Registro".',
  },
];

export function UxStandardizationViewer() {
  const [padroes] = useState<UxPattern[]>(PADROES_UX);
  const [padraoSelecionado, setPadraoSelecionado] = useState<UxPattern>(PADROES_UX[0]);
  const [dispositivoPreview, setDispositivoPreview] = useState<'DESKTOP' | 'TABLET' | 'MOBILE'>('DESKTOP');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleValidarPadrao = (titulo: string) => {
    setFeedback(`Padrão [${titulo}] validado no Design System NEXUS (100% de conformidade com diretrizes).`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Módulo de UX */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <LayoutTemplate className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                Design System, UX & Padronização de Componentes
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Guia Unificado NEXUS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diretrizes de usabilidade, consistência visual, hierarquia de informação e acessibilidade em todo o ERP.
            </p>
          </div>
        </div>

        {/* Seletor de Pré-visualização de Dispositivos */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-lg border border-slate-300 gap-1">
          <button
            onClick={() => setDispositivoPreview('DESKTOP')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              dispositivoPreview === 'DESKTOP' ? 'bg-white text-indigo-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDispositivoPreview('TABLET')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              dispositivoPreview === 'TABLET' ? 'bg-white text-indigo-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDispositivoPreview('MOBILE')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              dispositivoPreview === 'MOBILE' ? 'bg-white text-indigo-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Seção de Destaques Obrigatórios do Cabeçalho e Contexto */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Elementos de Contexto Obrigatórios (Em Todas as Telas)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Regra de Ouro #1</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Empresa Ativa</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Sempre visível no topo com Razão Social, CNPJ e indicador colorido de filial.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
              <User className="w-3.5 h-3.5" />
              <span>2. Usuário & Alçada</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Nome do operador, cargo, permissão RBAC e tempo de expiração da sessão segura.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3. Status do Sistema</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Indicador de conectividade com SEFAZ, Banco e modo online/offline de chão de fábrica.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>4. Pendências / Alçadas</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Badge com contagem de aprovações pendentes (descontos, OPs e compras).
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Lista de Padrões + Visualizador Prático */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Coluna Esquerda: Catálogo de Padrões do Design System */}
        <div className="lg:col-span-6 border-r border-slate-200 p-4 overflow-y-auto max-h-[calc(100vh-320px)] space-y-2.5 bg-white">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Columns className="w-4 h-4 text-indigo-600" />
              Diretrizes & Padrões Estabelecidos ({padroes.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">NEXUS-DS v2.0</span>
          </div>

          <div className="space-y-2">
            {padroes.map((p) => {
              const isSelected = padraoSelecionado.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setPadraoSelecionado(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{p.id}</span>
                      <span className="font-bold text-xs text-slate-900">{p.titulo}</span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {p.categoria}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1">{p.padraoObrigatorio}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="truncate max-w-[280px]">Benefício: <strong>{p.beneficio}</strong></span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Amostra Visual & Diretrizes de Acessibilidade */}
        <div className="lg:col-span-6 p-4 overflow-y-auto max-h-[calc(100vh-320px)] space-y-4 bg-slate-50/40">
          
          {/* Card Detalhado do Padrão */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 uppercase font-mono">
                  {padraoSelecionado.id} • {padraoSelecionado.categoria}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{padraoSelecionado.titulo}</h3>
              </div>

              <button
                onClick={() => handleValidarPadrao(padraoSelecionado.titulo)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validar Conformidade
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Regra Arquitetural Obrigatória:
                </span>
                <p className="text-slate-800 font-medium bg-slate-50 p-2.5 rounded border border-slate-200 mt-0.5">
                  {padraoSelecionado.padraoObrigatorio}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Exemplo de Implementação nos Componentes:
                </span>
                <p className="text-indigo-900 font-medium bg-indigo-50/50 p-2.5 rounded border border-indigo-200/60 mt-0.5">
                  {padraoSelecionado.exemploVisual}
                </p>
              </div>
            </div>
          </div>

          {/* Guia de Responsividade & Acessibilidade */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              Checklist de Responsividade & Acessibilidade
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Touch Targets Adequados (≥ 44px):</strong>
                  <p className="text-[11px] text-slate-500">Botões e controles de chão de fábrica possuem área de clique confortável para tablets industriais e celulares.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Contraste WCAG AA (Mínimo 4.5:1):</strong>
                  <p className="text-[11px] text-slate-500">Textos em slate-800/900 sobre fundos neutros proporcionam leitura nítida em ambientes de alta luminosidade fabril.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Navegação por Teclado (Tab & Enter):</strong>
                  <p className="text-[11px] text-slate-500">Formulários de pedidos e apontamentos de produção suportam preenchimento rápido via teclado numérico e leitor de código de barras.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
