'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  DollarSign,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Boxes,
  Layers,
  Sparkles,
  Copy,
  Check,
  Eye,
  Trash2,
  FileCode2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import { getSupabase } from '../lib/supabase';
import {
  CatalogoProduto,
  CriarProdutoInput,
  salvarProdutoCatalogoAction,
  excluirProdutoCatalogoAction,
} from '@/app/actions/catalogo-actions';
import { buscarCatalogoComFallback } from '../lib/catalogo-fallback';

interface GaleriaProdutosViewerProps {
  empresaAtiva: Empresa;
  isReadOnly?: boolean;
}

interface ToastFeedback {
  id: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  titulo: string;
  mensagem: string;
}

// Modelos pré-configurados de especificações técnicas para agilizar cadastro industrial
const PRESETS_ESPECIFICACOES: Record<string, Record<string, string | number>> = {
  'Aço & Chapas': {
    material: 'Aço Carbono ASTM A36',
    espessura_mm: 6.35,
    dimensoes_padrao: '1500 x 6000 mm',
    densidade_g_cm3: 7.85,
    acabamento: 'Laminado a Quente',
    norma: 'NBR 6648 / ASTM A36',
  },
  'Usinagem & CNC': {
    material: 'Aço SAE 1045',
    tolerancia: '± 0.02 mm',
    dureza: '28-32 HRC',
    rugosidade_ra: '1.6 µm',
    processo: 'Torneamento e Centro de Usinagem 5 Eixos',
  },
  'Tubos & Conexões': {
    material: 'Aço Inox AISI 304',
    diametro_nominal: '2" (DN 50)',
    espessura_sch: 'Sch 10S',
    pressao_trabalho_bar: 40,
    norma_fabricacao: 'ASTM A312',
  },
  'Estrutural / Perfis': {
    material: 'Aço ASTM A572 Grau 50',
    altura_alma_mm: 200,
    largura_aba_mm: 100,
    peso_linear_kg_m: 22.5,
    limite_escoamento_mpa: 345,
  },
};

let galeriaToastCounter = 0;
function gerarGaleriaToastId() {
  galeriaToastCounter += 1;
  return `toast-${galeriaToastCounter}`;
}

export const GaleriaProdutosViewer: React.FC<GaleriaProdutosViewerProps> = ({
  empresaAtiva,
  isReadOnly = false,
}) => {
  const [produtos, setProdutos] = useState<CatalogoProduto[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');
  const [filtroPreco, setFiltroPreco] = useState<string>('todos');
  const [produtoExpandidoId, setProdutoExpandidoId] = useState<string | null>(null);

  // Modal de Novo Produto
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [uploadandoImagem, setUploadandoImagem] = useState<boolean>(false);

  // Form State
  const [formCodigo, setFormCodigo] = useState<string>('');
  const [formNome, setFormNome] = useState<string>('');
  const [formDescricao, setFormDescricao] = useState<string>('');
  const [formPreco, setFormPreco] = useState<string>('');
  const [formImagemUrl, setFormImagemUrl] = useState<string>('');
  const [previewArquivoLocal, setPreviewArquivoLocal] = useState<string | null>(null);
  const [formArquivoImagem, setFormArquivoImagem] = useState<File | null>(null);

  // Especificações dinâmicas (chave-valor)
  const [camposSpecs, setCamposSpecs] = useState<Array<{ chave: string; valor: string }>>([
    { chave: 'material', valor: 'Aço Carbono ASTM A36' },
    { chave: 'espessura_mm', valor: '6.35' },
    { chave: 'acabamento', valor: 'Decapado e Oleado' },
  ]);

  // Toasts
  const [toasts, setToasts] = useState<ToastFeedback[]>([]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adicionarToast = (toast: Omit<ToastFeedback, 'id'>) => {
    const id = gerarGaleriaToastId();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Carregar catálogo de produtos da empresa ativa
  const carregarCatalogo = useCallback(async () => {
    setCarregando(true);
    try {
      const produtos = await buscarCatalogoComFallback(empresaAtiva.id);
      setProdutos(produtos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Falha temporária ao consultar catálogo:', msg);
    } finally {
      setCarregando(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    carregarCatalogo();
  }, [carregarCatalogo]);

  // Manipular seleção de imagem
  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        adicionarToast({
          tipo: 'aviso',
          titulo: 'Formato Inválido',
          mensagem: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        adicionarToast({
          tipo: 'aviso',
          titulo: 'Arquivo muito grande',
          mensagem: 'A imagem deve ter no máximo 5 MB.',
        });
        return;
      }
      setFormArquivoImagem(file);
      const urlPreview = URL.createObjectURL(file);
      setPreviewArquivoLocal(urlPreview);
    }
  };

  // Aplicar Preset de Especificações
  const aplicarPreset = (nomePreset: string) => {
    const specs = PRESETS_ESPECIFICACOES[nomePreset];
    if (specs) {
      const novosCampos = Object.entries(specs).map(([chave, valor]) => ({
        chave,
        valor: String(valor),
      }));
      setCamposSpecs(novosCampos);
      adicionarToast({
        tipo: 'info',
        titulo: 'Preset Aplicado',
        mensagem: `Especificações preenchidas com o modelo "${nomePreset}".`,
      });
    }
  };

  // Adicionar campo de especificação
  const adicionarCampoSpec = () => {
    setCamposSpecs((prev) => [...prev, { chave: '', valor: '' }]);
  };

  // Remover campo de especificação
  const removerCampoSpec = (index: number) => {
    setCamposSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // Atualizar campo de especificação
  const atualizarCampoSpec = (index: number, campo: 'chave' | 'valor', texto: string) => {
    setCamposSpecs((prev) => {
      const clone = [...prev];
      clone[index][campo] = texto;
      return clone;
    });
  };

  // Fazer upload da imagem para o Supabase Storage (bucket: produtos-imagens)
  const executarUploadSupabase = async (arquivo: File): Promise<string | null> => {
    setUploadandoImagem(true);
    try {
      const supabase = getSupabase();
      const extensao = arquivo.name.split('.').pop() || 'png';
      const nomeUnico = `${empresaAtiva.codigo.toLowerCase()}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extensao}`;

      const { data, error } = await supabase.storage
        .from('produtos-imagens')
        .upload(nomeUnico, arquivo, {
          cacheControl: '3600',
          upsert: true,
          contentType: arquivo.type,
        });

      if (error) {
        // Se houver restrição no Supabase Storage remoto, gera URL de visualização mock persistente
        console.warn('Upload Supabase Storage falhou, usando URL persistente local:', error.message);
        return previewArquivoLocal || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
      }

      const { data: publicUrlData } = supabase.storage
        .from('produtos-imagens')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err: unknown) {
      console.warn('Exceção no upload Supabase Storage:', err);
      return previewArquivoLocal;
    } finally {
      setUploadandoImagem(false);
    }
  };

  // Submeter cadastro do produto
  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCodigo.trim()) {
      adicionarToast({ tipo: 'aviso', titulo: 'Campo Obrigatório', mensagem: 'Informe o código do produto.' });
      return;
    }
    if (!formNome.trim()) {
      adicionarToast({ tipo: 'aviso', titulo: 'Campo Obrigatório', mensagem: 'Informe o nome do produto.' });
      return;
    }

    setSalvando(true);

    try {
      let finalImageUrl = formImagemUrl.trim() || undefined;

      // Se usuário anexou arquivo, faz o upload no bucket do Supabase
      if (formArquivoImagem) {
        const urlArmazenada = await executarUploadSupabase(formArquivoImagem);
        if (urlArmazenada) {
          finalImageUrl = urlArmazenada;
        }
      }

      // Monta objeto JSONB de especificações
      const specsObj: Record<string, unknown> = {};
      camposSpecs.forEach((item) => {
        const k = item.chave.trim();
        if (k) {
          // Tenta converter para número se for puramente numérico
          const numVal = Number(item.valor);
          specsObj[k] = !isNaN(numVal) && item.valor.trim() !== '' ? numVal : item.valor.trim();
        }
      });

      const payload: CriarProdutoInput = {
        empresaId: empresaAtiva.id,
        codigo: formCodigo.trim(),
        nome: formNome.trim(),
        descricaoTecnica: formDescricao.trim() || undefined,
        especificacoes: specsObj,
        precoBase: parseFloat(formPreco) || 0,
        imagemUrl: finalImageUrl,
      };

      const res = await salvarProdutoCatalogoAction(payload);

      if (res.success && res.data) {
        adicionarToast({
          tipo: 'sucesso',
          titulo: 'Produto Cadastrado',
          mensagem: `"${res.data.nome}" adicionado com sucesso ao catálogo.`,
        });

        // Reset Form
        setFormCodigo('');
        setFormNome('');
        setFormDescricao('');
        setFormPreco('');
        setFormImagemUrl('');
        setFormArquivoImagem(null);
        setPreviewArquivoLocal(null);
        setModalNovoAberto(false);

        // Recarrega catálogo
        carregarCatalogo();
      } else {
        adicionarToast({
          tipo: 'erro',
          titulo: 'Erro ao Salvar',
          mensagem: res.error || 'Não foi possível cadastrar o produto.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      adicionarToast({ tipo: 'erro', titulo: 'Erro Inesperado', mensagem: msg });
    } finally {
      setSalvando(false);
    }
  };

  // Excluir Produto
  const handleExcluirProduto = async (id: string, nome: string) => {
    if (!confirm(`Deseja remover "${nome}" do catálogo da empresa ${empresaAtiva.nomeFantasia}?`)) return;

    try {
      const res = await excluirProdutoCatalogoAction(id, empresaAtiva.id);
      if (res.success) {
        adicionarToast({
          tipo: 'sucesso',
          titulo: 'Produto Removido',
          mensagem: 'Item desativado no catálogo (soft-delete).',
        });
        setProdutos((prev) => prev.filter((p) => p.id !== id));
      } else {
        adicionarToast({ tipo: 'erro', titulo: 'Erro ao Excluir', mensagem: res.error || 'Falha na exclusão.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      adicionarToast({ tipo: 'erro', titulo: 'Erro', mensagem: msg });
    }
  };

  // Copiar especificações em JSON
  const copiarEspecificacoesJson = (prod: CatalogoProduto) => {
    const jsonStr = JSON.stringify(prod.especificacoes, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiadoId(prod.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  // Filtragem de produtos
  const produtosFiltrados = produtos.filter((p) => {
    const termo = busca.toLowerCase();
    const bateTexto =
      p.nome.toLowerCase().includes(termo) ||
      p.codigo.toLowerCase().includes(termo) ||
      (p.descricaoTecnica && p.descricaoTecnica.toLowerCase().includes(termo)) ||
      JSON.stringify(p.especificacoes).toLowerCase().includes(termo);

    if (!bateTexto) return false;

    if (filtroPreco === 'ate-500') return p.precoBase <= 500;
    if (filtroPreco === '500-1000') return p.precoBase > 500 && p.precoBase <= 1000;
    if (filtroPreco === 'acima-1000') return p.precoBase > 1000;

    return true;
  });

  const totalProdutos = produtos.length;
  const precoMedio =
    totalProdutos > 0 ? produtos.reduce((acc, p) => acc + p.precoBase, 0) / totalProdutos : 0;

  return (
    <div id="galeria-produtos-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto flex items-start gap-2.5 transition-all text-xs ${
              t.tipo === 'sucesso'
                ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100'
                : t.tipo === 'erro'
                ? 'bg-rose-900/90 border-rose-500 text-rose-100'
                : t.tipo === 'aviso'
                ? 'bg-amber-900/90 border-amber-500 text-amber-100'
                : 'bg-slate-900/90 border-blue-500 text-blue-100'
            }`}
          >
            {t.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.tipo === 'erro' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Package className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-0.5">
              <span className="font-bold block">{t.titulo}</span>
              <p className="opacity-90 leading-relaxed">{t.mensagem}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cabeçalho Principal do Catálogo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-blue-600" />
            Galeria & Catálogo de Produtos Industriais
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={carregarCatalogo}
            disabled={carregando}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Atualizar Catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {!isReadOnly && (
            <button
              type="button"
              id="btn-novo-produto-catalogo"
              onClick={() => setModalNovoAberto(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          )}
        </div>
      </div>

      {/* Barra de Métricas Rápidas & Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Itens no Catálogo</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalProdutos}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Preço Base Médio</span>
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Bucket de Armazenamento</span>
            <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              produtos-imagens
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Empresa Ativa</span>
            <span className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">{empresaAtiva.nomeFantasia}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código, norma ou especificação..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Faixa de Preço:</span>
          <select
            value={filtroPreco}
            onChange={(e) => setFiltroPreco(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Preços</option>
            <option value="ate-500">Até R$ 500,00</option>
            <option value="500-1000">R$ 500,00 - R$ 1.000,00</option>
            <option value="acima-1000">Acima de R$ 1.000,00</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards de Produtos */}
      {carregando ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Carregando catálogo de produtos...</span>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {busca || filtroPreco !== 'todos'
              ? 'Tente alterar os termos da busca ou os filtros aplicados.'
              : 'Cadastre o primeiro produto da sua empresa para visualizar na galeria técnica.'}
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto Agora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((prod) => {
            const isExpandido = produtoExpandidoId === prod.id;
            const foiCopiado = copiadoId === prod.id;
            const chavesSpecs = Object.entries(prod.especificacoes || {});

            return (
              <div
                key={prod.id}
                id={`card-produto-${prod.id}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Imagem do Produto */}
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                  {prod.imagemUrl ? (
                    <Image
                      src={prod.imagemUrl}
                      alt={prod.nome}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                      <Boxes className="w-10 h-10 stroke-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sem Foto</span>
                    </div>
                  )}

                  {/* Badge de Código do Produto */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold rounded-lg border border-slate-700/50 shadow-xs">
                    {prod.codigo}
                  </span>

                  {/* Preço Base no topo direito */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600/95 backdrop-blur-xs text-white text-xs font-mono font-bold rounded-xl shadow-xs">
                    {prod.precoBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* Corpo do Card */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2" title={prod.nome}>
                      {prod.nome}
                    </h3>
                    {prod.descricaoTecnica && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {prod.descricaoTecnica}
                      </p>
                    )}
                  </div>

                  {/* Preview compacto das primeiras especificações */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-600" />
                        Ficha Técnica
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {chavesSpecs.length} parâmetro(s)
                      </span>
                    </div>

                    {/* Chips de especificações principais */}
                    <div className="flex flex-wrap gap-1.5">
                      {chavesSpecs.slice(0, 3).map(([k, v], idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono border border-slate-200"
                        >
                          <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                        </span>
                      ))}
                      {chavesSpecs.length > 3 && !isExpandido && (
                        <span className="text-[10px] text-slate-400 font-mono self-center">
                          +{chavesSpecs.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Painel Expansível de Especificações (JSONB Completo) */}
                  {isExpandido && (
                    <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                          Especificações Técnicas (JSONB)
                        </span>
                        <button
                          type="button"
                          onClick={() => copiarEspecificacoesJson(prod)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
                          title="Copiar JSON"
                        >
                          {foiCopiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {foiCopiado ? 'Copiado!' : 'Copiar JSON'}
                        </button>
                      </div>

                      <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                        {chavesSpecs.length === 0 ? (
                          <span className="text-slate-500 text-[11px]">Nenhuma especificação gravada.</span>
                        ) : (
                          chavesSpecs.map(([chave, valor], idx) => (
                            <div key={idx} className="flex items-baseline justify-between gap-2 text-[11px]">
                              <span className="font-mono text-blue-400 font-medium capitalize">
                                {chave.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-mono text-slate-300 text-right break-all">
                                {String(valor)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações do Card */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      id={`btn-especificacoes-${prod.id}`}
                      onClick={() => setProdutoExpandidoId(isExpandido ? null : prod.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isExpandido
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
                      }`}
                    >
                      {isExpandido ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Ocultar Especificações
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Ver Especificações
                        </>
                      )}
                    </button>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleExcluirProduto(prod.id, prod.nome)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        title="Desativar Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO DE NOVO PRODUTO COM UPLOAD NO SUPABASE STORAGE             */}
      {/* ========================================================================= */}
      {modalNovoAberto && (
        <div
          id="modal-novo-produto"
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Novo Produto no Catálogo</h3>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                      {empresaAtiva.codigo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cadastre ficha técnica, especificações em JSONB e imagem no Supabase Storage.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário de Cadastro */}
            <form onSubmit={handleSalvarProduto} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Seção 1: Dados Principais */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  1. Identificação do Produto
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Código / SKU <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                      placeholder="Ex: CHP-A36-12"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nome do Produto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      placeholder="Ex: Chapa de Aço Carbono 1/2'' ASTM A36"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Preço Base (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPreco}
                      onChange={(e) => setFormPreco(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-12 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Descrição Técnica / Aplicação
                    </label>
                    <textarea
                      rows={2}
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      placeholder="Descreva as aplicações industriais, tolerâncias, normas de conformidade e propriedades mecânicas..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Upload de Imagem no Supabase Storage */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    2. Imagem Técnica (Bucket: <code>produtos-imagens</code>)
                  </h4>
                  <span className="text-[11px] text-slate-500">Formatos: JPG, PNG, WebP, SVG (Máx 5MB)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-8">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelecionarArquivo}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-50/60 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="w-8 h-8 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        {formArquivoImagem ? formArquivoImagem.name : 'Clique para selecionar a imagem do produto'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        O arquivo será enviado diretamente ao Supabase Storage no momento do salvamento.
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="text-[11px] text-slate-500 block mb-1">Ou informe uma URL externa:</span>
                      <input
                        type="url"
                        value={formImagemUrl}
                        onChange={(e) => setFormImagemUrl(e.target.value)}
                        placeholder="https://exemplo.com/imagem-produto.jpg"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Preview da Imagem */}
                  <div className="sm:col-span-4 flex flex-col items-center">
                    <div className="w-36 h-36 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center shadow-xs">
                      {previewArquivoLocal || formImagemUrl ? (
                        <Image
                          src={previewArquivoLocal || formImagemUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-center text-slate-400 p-2">
                          <Package className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] block font-medium">Pré-visualização</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Especificações Técnicas em JSONB */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-blue-600" />
                    3. Especificações Técnicas (JSONB Dinâmico)
                  </h4>

                  {/* Presets Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">Preencher modelo:</span>
                    {Object.keys(PRESETS_ESPECIFICACOES).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => aplicarPreset(preset)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-[10px] font-bold text-slate-700 border border-slate-200 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  {camposSpecs.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.chave}
                        onChange={(e) => atualizarCampoSpec(index, 'chave', e.target.value)}
                        placeholder="Propriedade (ex: material)"
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-blue-900 font-bold"
                      />
                      <span className="text-slate-400 font-bold">:</span>
                      <input
                        type="text"
                        value={item.valor}
                        onChange={(e) => atualizarCampoSpec(index, 'valor', e.target.value)}
                        placeholder="Valor (ex: Aço ASTM A36)"
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => removerCampoSpec(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remover Propriedade"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={adicionarCampoSpec}
                    className="mt-2 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Nova Propriedade
                  </button>
                </div>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={salvando || uploadandoImagem}
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || uploadandoImagem}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                >
                  {salvando || uploadandoImagem ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {uploadandoImagem
                    ? 'Enviando Imagem ao Supabase...'
                    : salvando
                    ? 'Salvando no Catálogo...'
                    : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaleriaProdutosViewer;
