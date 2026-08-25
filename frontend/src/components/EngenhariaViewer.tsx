'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitBranch,
  Layers,
  Wrench,
  FileText,
  FileCode2,
  History,
  Check,
  X,
  Sliders,
  Sparkles,
  Download,
  Trash2,
  Clock,
  Scale,
  DollarSign,
  Factory,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import {
  Projeto,
  ProjetoRevisao,
  EstruturaProduto,
  Roteiro,
  ArquivoTecnico,
  OrdemProducaoVinculo,
  HistoricoEngenhariaEvento,
  ProjetoDetalhado,
  TipoItemBOM,
  SetorFabricacao,
  TipoArquivoTecnico,
  FormatoArquivo,
} from '../../../backend/modules/engenharia/engenharia-types';

interface EngenhariaViewerProps {
  empresaAtiva: Empresa;
}

export function EngenhariaViewer({ empresaAtiva }: EngenhariaViewerProps) {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(null);
  const [selectedRevisaoId, setSelectedRevisaoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ProjetoDetalhado | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [detalheLoading, setDetalheLoading] = useState<boolean>(false);

  // Sub-tabs da tela de projeto
  const [activeProjectTab, setActiveProjectTab] = useState<
    'dados' | 'arquivos' | 'revisoes' | 'bom' | 'roteiro' | 'historico'
  >('dados');

  // Filtro de status na lista lateral
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Toast Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais de Criação
  const [modalNovoProjetoAberto, setModalNovoProjetoAberto] = useState<boolean>(false);
  const [modalNovaRevisaoAberto, setModalNovaRevisaoAberto] = useState<boolean>(false);
  const [modalNovoItemBOMAberto, setModalNovoItemBOMAberto] = useState<boolean>(false);
  const [modalNovaOpRoteiroAberto, setModalNovaOpRoteiroAberto] = useState<boolean>(false);
  const [modalNovoArquivoAberto, setModalNovoArquivoAberto] = useState<boolean>(false);
  const [modalSimularOpAberto, setModalSimularOpAberto] = useState<boolean>(false);

  // Form State: Novo Projeto
  const [formPrjCodigo, setFormPrjCodigo] = useState<string>('PRJ-2026-CHAS-02');
  const [formPrjTitulo, setFormPrjTitulo] = useState<string>('Chassi Longarina Dupla para Carreta Graneleira 30T');
  const [formPrjDescricao, setFormPrjDescricao] = useState<string>(
    'Estrutura em aço estrutural de alta resistência com reforços dobrados em CNC e travessas soldadas.'
  );
  const [formPrjCliente, setFormPrjCliente] = useState<string>('Randon Implementos Rodoviários');
  const [formPrjResponsavel, setFormPrjResponsavel] = useState<string>('Eng. Mariana Siqueira (CREA-RS 441.902)');
  const [formPrjCategoria, setFormPrjCategoria] = useState<string>('CHASSI_VEICULAR');

  // Form State: Nova Revisão
  const [formRevDescricao, setFormRevDescricao] = useState<string>(
    'Otimização do alívio de peso no alma da viga e inclusão de furos passantes para chicote elétrico.'
  );
  const [formRevMotivo, setFormRevMotivo] = useState<string>(
    'Solicitação de redução de tara veicular pelo cliente (Melhoria de Engenharia).'
  );
  const [formRevCriador, setFormRevCriador] = useState<string>('Engenharia de Produto');

  // Form State: Novo Item BOM
  const [formItemCodigo, setFormItemCodigo] = useState<string>('MP-CH-DOMEX-700');
  const [formItemDescricao, setFormItemDescricao] = useState<string>('Chapa Aço Alta Resistência Domex 700 6.00mm x 1500x6000mm');
  const [formItemTipo, setFormItemTipo] = useState<TipoItemBOM>('MATERIA_PRIMA');
  const [formItemQtdeLiq, setFormItemQtdeLiq] = useState<number>(2);
  const [formItemUnidade, setFormItemUnidade] = useState<string>('CHAPA');
  const [formItemPerda, setFormItemPerda] = useState<number>(8.0);
  const [formItemCustoUnit, setFormItemCustoUnit] = useState<number>(2450.0);
  const [formItemPesoUnit, setFormItemPesoUnit] = useState<number>(423.9);
  const [formItemNesting, setFormItemNesting] = useState<string>('Nesting Laser #04 - Aproveitamento 92%');
  const [formItemObs, setFormItemObs] = useState<string>('Corte com gás nitrogênio de alta pressão');

  // Form State: Nova Operação Roteiro
  const [formOpNome, setFormOpNome] = useState<string>('Chanframento e Preparação de Bordas para Solda');
  const [formOpSetor, setFormOpSetor] = useState<SetorFabricacao>('CALDEIRARIA_SOLDA');
  const [formOpMaquina, setFormOpMaquina] = useState<string>('Biseladora Automática de Chapas OMCA 650');
  const [formOpFerramenta, setFormOpFerramenta] = useState<string>('Fresa com Pastilhas Metal Duro Ângulo 30°');
  const [formOpTempoPrep, setFormOpTempoPrep] = useState<number>(15);
  const [formOpTempoCiclo, setFormOpTempoCiclo] = useState<number>(30);
  const [formOpCustoHora, setFormOpCustoHora] = useState<number>(190.0);
  const [formOpInstrucao, setFormOpInstrucao] = useState<string>('Executar chanfro tipo V com 30° de abertura e nariz de 1.5mm.');

  // Form State: Novo Arquivo
  const [formArqNome, setFormArqNome] = useState<string>('PRJ-CHASSI-DETALHAMENTO-LONGARINAS-R01.pdf');
  const [formArqTipo, setFormArqTipo] = useState<TipoArquivoTecnico>('DESENHO_2D');
  const [formArqFormato, setFormArqFormato] = useState<FormatoArquivo>('PDF');
  const [formArqAutor, setFormArqAutor] = useState<string>('Eng. Mariana Siqueira');
  const [formArqObs, setFormArqObs] = useState<string>('Folha de detalhamento 01/03 aprovada para caldeiraria.');

  // Form State: Simular Emissão de OP
  const [formOpQtde, setFormOpQtde] = useState<number>(10);
  const [formOpNumero, setFormOpNumero] = useState<string>('OP-2026-0350');

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Carregar lista de projetos
  const carregarProjetos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/engenharia/projetos?empresaId=${empresaAtiva.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProjetos(json.data);
        if (json.data.length > 0 && !selectedProjetoId) {
          setSelectedProjetoId(json.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar projetos de engenharia:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id, selectedProjetoId]);

  // Carregar projeto detalhado selecionado
  const carregarProjetoDetalhado = useCallback(async (projetoId: string, revisaoId?: string) => {
    try {
      setDetalheLoading(true);
      const url = `/api/v1/engenharia/projetos/${projetoId}?empresaId=${empresaAtiva.id}${
        revisaoId ? `&revisaoId=${revisaoId}` : ''
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setDetalhe(json.data);
        setSelectedRevisaoId(json.data.revisaoSelecionada?.id || null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar detalhes do projeto:', err);
    } finally {
      setDetalheLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await carregarProjetos();
    };
    run();
    return () => {
      active = false;
    };
  }, [carregarProjetos]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active || !selectedProjetoId) return;
      await carregarProjetoDetalhado(selectedProjetoId, selectedRevisaoId || undefined);
    };
    run();
    return () => {
      active = false;
    };
  }, [selectedProjetoId, selectedRevisaoId, carregarProjetoDetalhado]);

  // Ações de API
  const handleCriarProjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/engenharia/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          codigo: formPrjCodigo,
          titulo: formPrjTitulo,
          descricao: formPrjDescricao,
          clienteNome: formPrjCliente,
          responsavelNome: formPrjResponsavel,
          categoria: formPrjCategoria,
          itensIniciaisBOM: [
            {
              codigo: 'MP-CH-1020-4.75',
              descricao: 'Chapa Aço SAE 1020 4.75mm x 1500 x 6000mm',
              tipoItem: 'MATERIA_PRIMA',
              quantidadeLiquida: 3,
              unidadeMedida: 'CHAPA',
              percentualPerda: 8.0,
              custoUnitarioEstimado: 1150.0,
              pesoUnitarioKg: 335.5,
              nestingOuCorteInfo: 'Nesting Longarinas',
            },
          ],
          operacoesIniciaisRoteiro: [
            {
              sequencia: 10,
              operacaoNome: 'Corte a Laser 4kW Fibra',
              setor: 'CORTE_LASER',
              maquina: 'Trumpf TruLaser 3030',
              ferramenta: 'Bico 1.5mm O2',
              tempoPreparacaoMinutos: 20,
              tempoOperacaoMinutos: 45,
              custoHoraMaquina: 380.0,
              instrucaoTecnica: 'Corte conforme programa CNC CAM',
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Projeto criado com sucesso.');
        setModalNovoProjetoAberto(false);
        await carregarProjetos();
        if (data.data?.projeto?.id) {
          setSelectedProjetoId(data.data.projeto.id);
        }
      } else {
        showToast('error', data.error || 'Erro ao criar projeto.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleCriarNovaRevisao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjetoId) return;

    try {
      const res = await fetch(`/api/v1/engenharia/projetos/${selectedProjetoId}/revisoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          descricaoModificacoes: formRevDescricao,
          motivoRevisao: formRevMotivo,
          criadoPor: formRevCriador,
          clonarRevisaoOrigemId: selectedRevisaoId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Nova revisão criada.');
        setModalNovaRevisaoAberto(false);
        if (data.data?.revisaoSelecionada?.id) {
          setSelectedRevisaoId(data.data.revisaoSelecionada.id);
        }
        await carregarProjetos();
        if (selectedProjetoId) {
          await carregarProjetoDetalhado(selectedProjetoId, data.data?.revisaoSelecionada?.id);
        }
      } else {
        showToast('error', data.error || 'Erro ao criar nova revisão.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleAtivarRevisao = async (revisaoId: string) => {
    if (!selectedProjetoId) return;

    try {
      const res = await fetch(`/api/v1/engenharia/revisoes/${revisaoId}/ativar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          projetoId: selectedProjetoId,
          aprovadorNome: 'Diretoria de Engenharia & Qualidade',
          parecerAprovacao: 'Homologado para produção seriada com atendimento integral às normas de projeto.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Revisão ativada como VIGENTE.');
        await carregarProjetos();
        if (selectedProjetoId) {
          await carregarProjetoDetalhado(selectedProjetoId, revisaoId);
        }
      } else {
        showToast('error', data.error || 'Erro ao ativar revisão.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleAdicionarItemBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalhe?.revisaoSelecionada?.id) return;

    try {
      const res = await fetch(`/api/v1/engenharia/revisoes/${detalhe.revisaoSelecionada.id}/bom/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          codigo: formItemCodigo,
          descricao: formItemDescricao,
          tipoItem: formItemTipo,
          quantidadeLiquida: Number(formItemQtdeLiq),
          unidadeMedida: formItemUnidade,
          percentualPerda: Number(formItemPerda),
          custoUnitarioEstimado: Number(formItemCustoUnit),
          pesoUnitarioKg: Number(formItemPesoUnit),
          nestingOuCorteInfo: formItemNesting,
          observacoesTecnicas: formItemObs,
          usuarioNome: 'Engenharia de Processos',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Item adicionado ao BOM.');
        setModalNovoItemBOMAberto(false);
        if (selectedProjetoId && detalhe.revisaoSelecionada.id) {
          await carregarProjetoDetalhado(selectedProjetoId, detalhe.revisaoSelecionada.id);
        }
      } else {
        showToast('error', data.error || 'Erro ao adicionar item.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleRemoverItemBOM = async (itemId: string) => {
    if (!detalhe?.revisaoSelecionada?.id || !selectedProjetoId) return;

    try {
      const res = await fetch(
        `/api/v1/engenharia/revisoes/${detalhe.revisaoSelecionada.id}/bom/itens?empresaId=${empresaAtiva.id}&itemId=${itemId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Item removido do BOM com sucesso.');
        await carregarProjetoDetalhado(selectedProjetoId, detalhe.revisaoSelecionada.id);
      } else {
        showToast('error', data.error || 'Erro ao remover item.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleAdicionarOperacaoRoteiro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalhe?.revisaoSelecionada?.id || !selectedProjetoId) return;

    try {
      const res = await fetch(`/api/v1/engenharia/revisoes/${detalhe.revisaoSelecionada.id}/roteiro/operacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          operacaoNome: formOpNome,
          setor: formOpSetor,
          maquina: formOpMaquina,
          ferramenta: formOpFerramenta,
          tempoPreparacaoMinutos: Number(formOpTempoPrep),
          tempoOperacaoMinutos: Number(formOpTempoCiclo),
          custoHoraMaquina: Number(formOpCustoHora),
          instrucaoTecnica: formOpInstrucao,
          usuarioNome: 'Engenharia de Processos',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Operação adicionada ao roteiro.');
        setModalNovaOpRoteiroAberto(false);
        await carregarProjetoDetalhado(selectedProjetoId, detalhe.revisaoSelecionada.id);
      } else {
        showToast('error', data.error || 'Erro ao adicionar operação.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleRemoverOperacaoRoteiro = async (operacaoId: string) => {
    if (!detalhe?.revisaoSelecionada?.id || !selectedProjetoId) return;

    try {
      const res = await fetch(
        `/api/v1/engenharia/revisoes/${detalhe.revisaoSelecionada.id}/roteiro/operacoes?empresaId=${empresaAtiva.id}&operacaoId=${operacaoId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Operação removida do roteiro.');
        await carregarProjetoDetalhado(selectedProjetoId, detalhe.revisaoSelecionada.id);
      } else {
        showToast('error', data.error || 'Erro ao remover operação.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleAdicionarArquivoTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalhe?.revisaoSelecionada?.id || !selectedProjetoId) return;

    try {
      const res = await fetch('/api/v1/engenharia/arquivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          projetoId: selectedProjetoId,
          revisaoId: detalhe.revisaoSelecionada.id,
          nomeArquivo: formArqNome,
          tipo: formArqTipo,
          formato: formArqFormato,
          autor: formArqAutor,
          observacoes: formArqObs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Arquivo técnico vinculado à revisão.');
        setModalNovoArquivoAberto(false);
        await carregarProjetoDetalhado(selectedProjetoId, detalhe.revisaoSelecionada.id);
      } else {
        showToast('error', data.error || 'Erro ao vincular arquivo.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleSimularEmissaoOP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjetoId) return;

    try {
      const res = await fetch('/api/v1/engenharia/ordens-producao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          projetoId: selectedProjetoId,
          quantidade: Number(formOpQtde),
          numeroOpCustomizado: formOpNumero,
          forcarRevisaoId: detalhe?.revisaoSelecionada?.id,
          usuarioNome: 'PCP Fábrica',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Ordem de Produção emitida com snapshot da revisão.');
        setModalSimularOpAberto(false);
        setActiveProjectTab('historico');
        await carregarProjetoDetalhado(selectedProjetoId, detalhe?.revisaoSelecionada?.id);
      } else {
        showToast('error', data.error || 'Erro ao emitir OP.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const projeto = detalhe?.projeto;
  const revisaoSelecionada = detalhe?.revisaoSelecionada;
  const revisaoAtiva = detalhe?.revisaoAtiva;
  const estrutura = detalhe?.estruturaBOM;
  const roteiro = detalhe?.roteiro;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              MÓDULO DE ENGENHARIA
            </span>
            <span className="text-xs text-slate-400 font-mono">PRODUTO, BOM & PROCESSOS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-600" />
            Engenharia de Produto & Roteiros de Fabricação
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Controle rigoroso de versões e revisões de engenharia, estrutura de materiais (BOM) com quantidades brutas e perdas técnicas, roteiros de fabricação com tempos padrão, gestão de arquivos CAD/CAM e rastreabilidade imutável de Ordens de Produção (OP).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={carregarProjetos}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setModalNovoProjetoAberto(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Projeto de Engenharia
          </button>
        </div>
      </div>

      {/* Regras de Engenharia - Banner Informativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3.5 text-xs text-cyan-950 flex items-start gap-2.5">
          <GitBranch className="w-4 h-4 text-cyan-700 mt-0.5 shrink-0" />
          <div>
            <strong className="font-bold text-cyan-900">Unicidade da Revisão Ativa:</strong>
            <p className="text-[11px] text-cyan-800 mt-0.5">
              Apenas 1 revisão pode estar ativa por projeto. Ao ativar uma nova, as anteriores tornam-se obsoletas sem jamais serem apagadas.
            </p>
          </div>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-950 flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
          <div>
            <strong className="font-bold text-purple-900">BOM com Perdas & Nesting:</strong>
            <p className="text-[11px] text-purple-800 mt-0.5">
              Cálculo automático de quantidade bruta a partir da quantidade líquida e percentual de perda técnica (queima/retalho).
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
          <Factory className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <strong className="font-bold text-emerald-900">Rastreabilidade Estrita de OP:</strong>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Toda Ordem de Produção congela a revisão de engenharia exata que foi utilizada no momento da emissão fabril.
            </p>
          </div>
        </div>
      </div>

      {/* Layout Principal: Sidebar de Projetos + Painel de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR: Lista de Projetos */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Projetos Cadastrados ({projetos.length})
              </span>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-semibold"
              >
                <option value="TODOS">Todos Status</option>
                <option value="EM_DESENVOLVIMENTO">Em Desenv.</option>
                <option value="HOMOLOGADO">Homologados</option>
                <option value="EM_PRODUCAO">Em Produção</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {projetos
                .filter((p) => filtroStatus === 'TODOS' || p.status === filtroStatus)
                .map((prj) => {
                  const isSelected = prj.id === selectedProjetoId;
                  return (
                    <div
                      key={prj.id}
                      onClick={() => {
                        setSelectedProjetoId(prj.id);
                        setSelectedRevisaoId(null);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50/60 border-cyan-300 ring-1 ring-cyan-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-700">{prj.codigo}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            prj.status === 'EM_PRODUCAO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prj.status === 'HOMOLOGADO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prj.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{prj.titulo}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Cliente: {prj.clienteNome}</p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[10px]">
                        <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold border border-purple-100">
                          {prj.revisaoAtivaVersao || 'Rev 00'}
                        </span>
                        <span className="font-bold text-slate-700">
                          R$ {(prj.custoTotalEstimadoRevisaoAtiva || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* PAINEL CENTRAL: TELA DO PROJETO COM TABS REQUISITADAS */}
        <div className="lg:col-span-8 space-y-6">
          {detalhe && projeto ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Header do Projeto Selecionado */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-cyan-100 text-cyan-800 rounded border border-cyan-200">
                      {projeto.codigo}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded border border-purple-200">
                      Revisão Ativa Vigente: {revisaoAtiva?.versao || 'Nenhuma'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Cliente: {projeto.clienteNome}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{projeto.titulo}</h2>
                  <p className="text-xs text-slate-500 mt-1">{projeto.descricao}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setModalSimularOpAberto(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Factory className="w-3.5 h-3.5" />
                    Simular Emissão de OP
                  </button>
                  <button
                    onClick={() => setModalNovaRevisaoAberto(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    Criar Nova Revisão
                  </button>
                </div>
              </div>

              {/* Seletor de Revisão em Exibição */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  <span>Visualizando Contexto da Revisão:</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={revisaoSelecionada?.id || ''}
                    onChange={(e) => {
                      const revId = e.target.value;
                      setSelectedRevisaoId(revId);
                      if (selectedProjetoId) carregarProjetoDetalhado(selectedProjetoId, revId);
                    }}
                    className="bg-white text-slate-800 text-xs font-bold rounded-md px-3 py-1.5 border border-slate-300 shadow-2xs"
                  >
                    {detalhe.revisoes.map((rev) => (
                      <option key={rev.id} value={rev.id}>
                        {rev.versao} - Status: {rev.status} {rev.ativa ? '★ (ATIVA / VIGENTE)' : ''}
                      </option>
                    ))}
                  </select>

                  {revisaoSelecionada && !revisaoSelecionada.ativa && revisaoSelecionada.status !== 'OBSOLETA' && (
                    <button
                      onClick={() => handleAtivarRevisao(revisaoSelecionada.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Homologar & Ativar {revisaoSelecionada.versao}
                    </button>
                  )}
                </div>
              </div>

              {/* ABAS DA TELA DE PROJETO (REQUISITADAS) */}
              <div className="border-b border-slate-200 flex flex-wrap gap-2 text-xs font-bold">
                <button
                  onClick={() => setActiveProjectTab('dados')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeProjectTab === 'dados'
                      ? 'border-cyan-600 text-cyan-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Dados Gerais
                </button>

                <button
                  onClick={() => setActiveProjectTab('arquivos')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeProjectTab === 'arquivos'
                      ? 'border-cyan-600 text-cyan-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  Arquivos Técnicos ({detalhe.arquivos.length})
                </button>

                <button
                  onClick={() => setActiveProjectTab('revisoes')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeProjectTab === 'revisoes'
                      ? 'border-cyan-600 text-cyan-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Revisões ({detalhe.revisoes.length})
                </button>

                <button
                  onClick={() => setActiveProjectTab('bom')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeProjectTab === 'bom'
                      ? 'border-cyan-600 text-cyan-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  BOM (Estrutura) ({estrutura?.itens.length || 0})
                </button>

                <button
                  onClick={() => setActiveProjectTab('roteiro')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeProjectTab === 'roteiro'
                      ? 'border-cyan-600 text-cyan-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Roteiro de Fabricação ({roteiro?.operacoes.length || 0})
                </button>

                <button
                  onClick={() => setActiveProjectTab('historico')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeProjectTab === 'historico'
                      ? 'border-cyan-600 text-cyan-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Histórico & Rastreabilidade OP ({detalhe.historico.length})
                </button>
              </div>

              {/* CONTEÚDO DA ABA 1: DADOS GERAIS */}
              {activeProjectTab === 'dados' && (
                <div className="space-y-6">
                  {/* Grid de Resumo de Custos & Métricas da Revisão */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        Custo Estimado Matéria-Prima (BOM)
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        R$ {(estrutura?.custoTotalEstimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {estrutura?.itens.length || 0} componentes com perdas calculadas
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Wrench className="w-3.5 h-3.5 text-purple-600" />
                        Custo Estimado Mão de Obra / Roteiro
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        R$ {(roteiro?.custoTotalMaoDeObra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {roteiro?.operacoes.length || 0} operações fabris
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        Peso Total Estimado
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {(estrutura?.pesoTotalEstimadoKg || 0).toFixed(1)} kg
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-1">
                        {( (estrutura?.pesoTotalEstimadoKg || 0) / 1000 ).toFixed(3)} toneladas
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        Tempo Padrão de Fabricação
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {roteiro?.tempoTotalPadraoMinutos || 0} min
                      </div>
                      <div className="text-[10px] text-cyan-700 font-medium mt-1">
                        {(((roteiro?.tempoTotalPadraoMinutos || 0) / 60)).toFixed(1)} horas de fábrica
                      </div>
                    </div>
                  </div>

                  {/* Informações Técnicas Detalhadas */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Ficha Cadastral do Projeto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Responsável Técnico (Engenharia):</span>
                        <span className="font-semibold text-slate-800">{projeto.responsavelNome}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Categoria / Aplicação:</span>
                        <span className="font-semibold text-slate-800">{projeto.categoria}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Cliente Solicitante:</span>
                        <span className="font-semibold text-slate-800">{projeto.clienteNome}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Data de Criação Inicial:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(projeto.dataCriacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 2: ARQUIVOS TÉCNICOS */}
              {activeProjectTab === 'arquivos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Arquivos Técnicos & Documentação CAD/CAM</h3>
                      <p className="text-xs text-slate-500">
                        Arquivos vinculados especificamente à <strong>{revisaoSelecionada?.versao || 'revisão'}</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => setModalNovoArquivoAberto(true)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Anexar Arquivo Técnico
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Nome do Arquivo</th>
                          <th className="px-4 py-3">Tipo & Formato</th>
                          <th className="px-4 py-3">Revisão</th>
                          <th className="px-4 py-3">Tamanho</th>
                          <th className="px-4 py-3">Hash MD5 (Integridade)</th>
                          <th className="px-4 py-3">Autor & Data</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detalhe.arquivos.map((arq) => (
                          <tr key={arq.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                              <FileCode2 className="w-4 h-4 text-cyan-600" />
                              <span>{arq.nomeArquivo}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                                {arq.tipo} ({arq.formato})
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-purple-700">{arq.revisaoVersao}</td>
                            <td className="px-4 py-3 text-slate-600">{arq.tamanhoFormatado}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{arq.hashMd5.slice(0, 12)}...</td>
                            <td className="px-4 py-3 text-slate-600">
                              <div>{arq.autor}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(arq.dataUpload).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => showToast('success', `Download simulado do arquivo ${arq.nomeArquivo}`)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Baixar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 3: REVISÕES & CONTROLE DE VERSÕES */}
              {activeProjectTab === 'revisoes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Histórico de Versões e Alçadas de Homologação</h3>
                      <p className="text-xs text-slate-500">
                        Cada revisão possui versões imutáveis. Ao ativar uma revisão, apenas ela fica ativa no contexto fabril.
                      </p>
                    </div>
                    <button
                      onClick={() => setModalNovaRevisaoAberto(true)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Revisão
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Versão</th>
                          <th className="px-4 py-3">Modificações & Motivo</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Criado Por</th>
                          <th className="px-4 py-3">Data Liberação / Homologador</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detalhe.revisoes.map((rev) => (
                          <tr
                            key={rev.id}
                            className={`${rev.ativa ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50/70'}`}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-purple-800">
                              <div className="flex items-center gap-1.5">
                                <span>{rev.versao}</span>
                                {rev.ativa && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded border border-emerald-200">
                                    ★ ATIVA
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[280px]">
                              <div className="font-semibold text-slate-900">{rev.descricaoModificacoes}</div>
                              <div className="text-[10px] text-slate-500 italic mt-0.5">Motivo: {rev.motivoRevisao}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rev.status === 'ATIVA'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : rev.status === 'OBSOLETA'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {rev.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <div>{rev.criadoPor}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(rev.dataCriacao).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {rev.dataLiberacao ? (
                                <div>
                                  <div className="font-semibold text-slate-900">{rev.liberadoPor}</div>
                                  <div className="text-[10px] text-emerald-700">
                                    {new Date(rev.dataLiberacao).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Pendente homologação</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!rev.ativa && rev.status !== 'OBSOLETA' && (
                                <button
                                  onClick={() => handleAtivarRevisao(rev.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Ativar Versão
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 4: BOM (ESTRUTURA DE PRODUTO, COMPONENTES & PERDAS) */}
              {activeProjectTab === 'bom' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        Estrutura do Produto (BOM) - {revisaoSelecionada?.versao}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cálculo preciso de perdas técnicas de queima/corte/nesting: <code>Qtde Bruta = Qtde Líquida * (1 + % Perda)</code>.
                      </p>
                    </div>
                    {revisaoSelecionada?.status !== 'OBSOLETA' && (
                      <button
                        onClick={() => setModalNovoItemBOMAberto(true)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Item / Matéria-Prima
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Seq</th>
                          <th className="px-4 py-3">Código & Descrição</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Qtde Líquida</th>
                          <th className="px-4 py-3">Perda Técnica (%)</th>
                          <th className="px-4 py-3">Qtde Bruta</th>
                          <th className="px-4 py-3">Custo Unit / Total</th>
                          <th className="px-4 py-3">Peso Total</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {estrutura?.itens.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-bold text-slate-500">{it.itemSequencia}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{it.codigo}</div>
                              <div className="text-slate-600">{it.descricao}</div>
                              {it.nestingOuCorteInfo && (
                                <div className="text-[10px] text-cyan-700 font-mono mt-0.5">
                                  {it.nestingOuCorteInfo}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {it.tipoItem}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {it.quantidadeLiquida} {it.unidadeMedida}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                +{it.percentualPerda}%
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-purple-900">
                              {it.quantidadeBruta} {it.unidadeMedida}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <div>R$ {it.custoTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              <div className="text-[10px] text-slate-400">
                                R$ {it.custoUnitarioEstimado.toFixed(2)} / {it.unidadeMedida}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-semibold">{it.pesoTotalKg.toFixed(2)} kg</td>
                            <td className="px-4 py-3 text-right">
                              {revisaoSelecionada?.status !== 'OBSOLETA' && (
                                <button
                                  onClick={() => handleRemoverItemBOM(it.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 5: ROTEIRO DE FABRICAÇÃO */}
              {activeProjectTab === 'roteiro' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-600" />
                        Roteiro de Processos & Tempos Padrão - {revisaoSelecionada?.versao}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sequenciamento por setor produtivo com tempos de preparação (Setup) e ciclo unitário.
                      </p>
                    </div>
                    {revisaoSelecionada?.status !== 'OBSOLETA' && (
                      <button
                        onClick={() => setModalNovaOpRoteiroAberto(true)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Plus className="w-3 h-3" />
                        Nova Operação Fabril
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Seq</th>
                          <th className="px-4 py-3">Operação & Setor</th>
                          <th className="px-4 py-3">Máquina / Posto</th>
                          <th className="px-4 py-3">Ferramenta</th>
                          <th className="px-4 py-3">Setup / Ciclo</th>
                          <th className="px-4 py-3">Tempo Padrão</th>
                          <th className="px-4 py-3">Custo Operação</th>
                          <th className="px-4 py-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {roteiro?.operacoes.map((op) => (
                          <tr key={op.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-bold text-cyan-700">{op.sequencia}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{op.operacaoNome}</div>
                              <div className="text-[10px] text-purple-700 font-mono font-semibold">{op.setor}</div>
                              {op.instrucaoTecnica && (
                                <div className="text-[10px] text-slate-500 italic mt-0.5">{op.instrucaoTecnica}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">{op.maquina}</td>
                            <td className="px-4 py-3 text-slate-600">{op.ferramenta}</td>
                            <td className="px-4 py-3 text-slate-700">
                              <div>Setup: {op.tempoPreparacaoMinutos}m</div>
                              <div className="text-[10px] text-slate-400">Ciclo: {op.tempoOperacaoMinutos}m</div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {op.tempoPadraoTotalMinutos} min
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              R$ {op.custoTotalOperacao.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {revisaoSelecionada?.status !== 'OBSOLETA' && (
                                <button
                                  onClick={() => handleRemoverOperacaoRoteiro(op.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                  title="Remover Operação"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA 6: HISTÓRICO & AUDITORIA & RASTREABILIDADE DE OP */}
              {activeProjectTab === 'historico' && (
                <div className="space-y-6">
                  {/* Painel de OPs Emitidas com Rastreabilidade de Revisão */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Factory className="w-4 h-4 text-emerald-600" />
                        Ordens de Produção (OP) Vinculadas ao Projeto
                      </h3>
                      <span className="text-xs text-slate-500">
                        {detalhe.ordensProducao.length} ordens de fabricação rastreadas
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                        <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Número OP</th>
                            <th className="px-4 py-2.5">Revisão de Engenharia Utilizada</th>
                            <th className="px-4 py-2.5">Quantidade</th>
                            <th className="px-4 py-2.5">Data Liberação</th>
                            <th className="px-4 py-2.5">Status Fábrica</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detalhe.ordensProducao.map((op) => (
                            <tr key={op.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono font-bold text-slate-900">{op.numeroOp}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono font-bold text-[11px]">
                                  {op.revisaoVersao} (Snapshot Congelado)
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">{op.quantidadeProduzir} un</td>
                              <td className="px-4 py-3 text-slate-600">{new Date(op.dataLiberacao).toLocaleDateString('pt-BR')}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                  {op.statusOp}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Linha do Tempo de Auditoria */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Linha do Tempo de Eventos de Engenharia</h3>
                    <div className="space-y-3">
                      {detalhe.historico.map((ev) => (
                        <div key={ev.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start gap-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-cyan-600 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{ev.tipoEvento.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(ev.dataHora).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-0.5">{ev.descricao}</p>
                            <div className="text-[10px] text-slate-400 mt-1">Por: {ev.usuarioNome}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Compass className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold">Selecione um projeto na lista lateral ou cadastre um novo projeto.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NOVO PROJETO DE ENGENHARIA */}
      {/* ========================================================================= */}
      {modalNovoProjetoAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-600" />
                Cadastrar Novo Projeto de Engenharia
              </h3>
              <button onClick={() => setModalNovoProjetoAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarProjeto} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código do Projeto *</label>
                  <input
                    type="text"
                    required
                    value={formPrjCodigo}
                    onChange={(e) => setFormPrjCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    placeholder="PRJ-2026-CHAS-02"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={formPrjCategoria}
                    onChange={(e) => setFormPrjCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="CHASSI_VEICULAR">Chassi Veicular</option>
                    <option value="ESTRUTURA_METALICA">Estrutura Metálica</option>
                    <option value="MAQUINARIO_INDUSTRIAL">Maquinário Industrial</option>
                    <option value="RESERVATORIO_SILO">Silo / Reservatório</option>
                    <option value="TUBULACAO_CALDEIRARIA">Tubulação & Caldeiraria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Projeto *</label>
                <input
                  type="text"
                  required
                  value={formPrjTitulo}
                  onChange={(e) => setFormPrjTitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  placeholder="Nome do produto ou equipamento"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Técnica</label>
                <textarea
                  rows={2}
                  value={formPrjDescricao}
                  onChange={(e) => setFormPrjDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente Solicitante</label>
                  <input
                    type="text"
                    value={formPrjCliente}
                    onChange={(e) => setFormPrjCliente(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsável Técnico</label>
                  <input
                    type="text"
                    value={formPrjResponsavel}
                    onChange={(e) => setFormPrjResponsavel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200 text-cyan-900 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-600" />
                O sistema criará automaticamente a <strong>Rev 00 Inicial Ativa</strong> com a Estrutura (BOM) e Roteiro de Fabricação base.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoProjetoAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NOVA REVISÃO */}
      {/* ========================================================================= */}
      {modalNovaRevisaoAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                Criar Nova Revisão de Engenharia
              </h3>
              <button onClick={() => setModalNovaRevisaoAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarNovaRevisao} className="space-y-3.5 text-xs">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-purple-950 text-[11px]">
                <strong>Regra de Imutabilidade:</strong> A nova revisão clonará a estrutura de materiais (BOM) e o roteiro atual para uma nova versão independente. As revisões anteriores continuarão 100% preservadas e inalteradas.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição das Modificações *</label>
                <textarea
                  rows={2}
                  required
                  value={formRevDescricao}
                  onChange={(e) => setFormRevDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Ex: Aumento de espessura de chapa, furos de alívio..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo da Revisão *</label>
                <input
                  type="text"
                  required
                  value={formRevMotivo}
                  onChange={(e) => setFormRevMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="Ex: RNC-2026-012, solicitação do cliente..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Criado Por</label>
                <input
                  type="text"
                  value={formRevCriador}
                  onChange={(e) => setFormRevCriador(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaRevisaoAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Gerar Nova Versão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NOVO ITEM BOM (ESTRUTURA & PERDAS) */}
      {/* ========================================================================= */}
      {modalNovoItemBOMAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Adicionar Componente à Estrutura (BOM)
              </h3>
              <button onClick={() => setModalNovoItemBOMAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdicionarItemBOM} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código do Item *</label>
                  <input
                    type="text"
                    required
                    value={formItemCodigo}
                    onChange={(e) => setFormItemCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={formItemTipo}
                    onChange={(e) => setFormItemTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-xs"
                  >
                    <option value="MATERIA_PRIMA">Matéria-Prima</option>
                    <option value="COMPONENTE">Componente</option>
                    <option value="SUB_CONJUNTO">Sub-Conjunto</option>
                    <option value="FIXACAO">Elemento Fixação</option>
                    <option value="CONSUMIVEL">Consumível</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Completa *</label>
                <input
                  type="text"
                  required
                  value={formItemDescricao}
                  onChange={(e) => setFormItemDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qtde Líquida *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formItemQtdeLiq}
                    onChange={(e) => setFormItemQtdeLiq(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade *</label>
                  <input
                    type="text"
                    required
                    value={formItemUnidade}
                    onChange={(e) => setFormItemUnidade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">% Perda Técnica *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formItemPerda}
                    onChange={(e) => setFormItemPerda(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-amber-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Estimado Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItemCustoUnit}
                    onChange={(e) => setFormItemCustoUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peso Unitário (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItemPesoUnit}
                    onChange={(e) => setFormItemPesoUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nesting / Plano de Corte</label>
                <input
                  type="text"
                  value={formItemNesting}
                  onChange={(e) => setFormItemNesting(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoItemBOMAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Adicionar ao BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: NOVA OPERAÇÃO ROTEIRO */}
      {/* ========================================================================= */}
      {modalNovaOpRoteiroAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-600" />
                Adicionar Operação ao Roteiro de Fabricação
              </h3>
              <button onClick={() => setModalNovaOpRoteiroAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdicionarOperacaoRoteiro} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Operação *</label>
                <input
                  type="text"
                  required
                  value={formOpNome}
                  onChange={(e) => setFormOpNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Setor Fabril *</label>
                  <select
                    value={formOpSetor}
                    onChange={(e) => setFormOpSetor(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="CORTE_LASER">Corte a Laser</option>
                    <option value="DOBRA_CNC">Dobra CNC</option>
                    <option value="CALDEIRARIA_SOLDA">Caldeiraria & Solda</option>
                    <option value="USINAGEM">Usinagem CNC</option>
                    <option value="PINTURA_TRATAMENTO">Pintura / Tratamento</option>
                    <option value="MONTAGEM">Montagem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Máquina / Posto *</label>
                  <input
                    type="text"
                    required
                    value={formOpMaquina}
                    onChange={(e) => setFormOpMaquina(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ferramenta / Acessório</label>
                <input
                  type="text"
                  value={formOpFerramenta}
                  onChange={(e) => setFormOpFerramenta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Setup (min) *</label>
                  <input
                    type="number"
                    required
                    value={formOpTempoPrep}
                    onChange={(e) => setFormOpTempoPrep(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciclo Unit (min) *</label>
                  <input
                    type="number"
                    required
                    value={formOpTempoCiclo}
                    onChange={(e) => setFormOpTempoCiclo(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo/Hora (R$)</label>
                  <input
                    type="number"
                    value={formOpCustoHora}
                    onChange={(e) => setFormOpCustoHora(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instrução Técnica</label>
                <textarea
                  rows={2}
                  value={formOpInstrucao}
                  onChange={(e) => setFormOpInstrucao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaOpRoteiroAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Adicionar ao Roteiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NOVO ARQUIVO TÉCNICO */}
      {/* ========================================================================= */}
      {modalNovoArquivoAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-cyan-600" />
                Vincular Arquivo Técnico à Revisão
              </h3>
              <button onClick={() => setModalNovoArquivoAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdicionarArquivoTecnico} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Arquivo *</label>
                <input
                  type="text"
                  required
                  value={formArqNome}
                  onChange={(e) => setFormArqNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Documento *</label>
                  <select
                    value={formArqTipo}
                    onChange={(e) => setFormArqTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="DESENHO_2D">Desenho 2D</option>
                    <option value="MODELO_3D">Modelo 3D CAD</option>
                    <option value="ESPECIFICACAO_TECNICA">Especificação Técnica</option>
                    <option value="MEMORIAL_CALCULO">Memorial de Cálculo</option>
                    <option value="PROGRAMA_CNC_CAM">Programa CAM / G-Code</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Formato / Extensão *</label>
                  <select
                    value={formArqFormato}
                    onChange={(e) => setFormArqFormato(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DWG">DWG</option>
                    <option value="DXF">DXF</option>
                    <option value="STEP">STEP</option>
                    <option value="SLDPRT">SLDPRT</option>
                    <option value="NC_GCODE">NC / G-Code</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Autor do Arquivo</label>
                <input
                  type="text"
                  value={formArqAutor}
                  onChange={(e) => setFormArqAutor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Técnicas</label>
                <input
                  type="text"
                  value={formArqObs}
                  onChange={(e) => setFormArqObs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoArquivoAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Anexar Arquivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: SIMULAR EMISSÃO DE ORDEM DE PRODUÇÃO (OP) */}
      {/* ========================================================================= */}
      {modalSimularOpAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-600" />
                Simular Emissão de Ordem de Produção (OP)
              </h3>
              <button onClick={() => setModalSimularOpAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimularEmissaoOP} className="space-y-3.5 text-xs">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-950 text-[11px]">
                <strong>Regra de Rastreabilidade Estrita:</strong> A Ordem de Produção gravará e congelará o vínculo exato com a <strong>{detalhe?.revisaoSelecionada?.versao || 'revisão selecionada'}</strong>, garantindo que o chão de fábrica execute o BOM e roteiro corretos mesmo se houver revisões futuras.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número da OP *</label>
                  <input
                    type="text"
                    required
                    value={formOpNumero}
                    onChange={(e) => setFormOpNumero(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantidade a Produzir (un) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formOpQtde}
                    onChange={(e) => setFormOpQtde(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSimularOpAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Emitir OP com Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
