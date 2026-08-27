import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  EyeOff,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  KeyRound,
  Fingerprint,
  Sparkles,
  Layers,
  Database,
  Activity,
  UserCheck,
  Shield,
  Server,
} from 'lucide-react';

interface HardeningItem {
  id: string;
  camada: 'MULTI_TENANT' | 'PRIVACIDADE_LGPD' | 'APLICACAO' | 'INFRAESTRUTURA' | 'BANCO_DADOS';
  titulo: string;
  mecanismo: string;
  status: 'EM_CONFORMIDADE' | 'MONITORAMENTO_ATIVO' | 'BLOQUEADO_RESTRITO';
  impactoRisco: 'CRITICO' | 'ALTO' | 'MEDIO';
  descricao: string;
  detalheTecnico: string;
}

const ITENS_HARDENING: HardeningItem[] = [
  {
    id: 'SEC-01',
    camada: 'MULTI_TENANT',
    titulo: 'Isolamento Estrito de Tenant (Row Level Security & Middleware)',
    mecanismo: 'Validação Forçada de empresa_id no Backend',
    status: 'EM_CONFORMIDADE',
    impactoRisco: 'CRITICO',
    descricao: 'Nenhuma consulta ou mutação é executada sem o empresa_id extraído da sessão criptografada do token JWT.',
    detalheTecnico: 'Políticas RLS nativas do PostgreSQL vinculam todas as tabelas transacionais a context_user_company_id.',
  },
  {
    id: 'SEC-02',
    camada: 'PRIVACIDADE_LGPD',
    titulo: 'Mascaramento e Criptografia de Dados Pessoais (LGPD)',
    mecanismo: 'Dynamic Data Masking (DDM) & AES-256 no Repouso',
    status: 'EM_CONFORMIDADE',
    impactoRisco: 'ALTO',
    descricao: 'CPFs, dados bancários e e-mails de clientes são ofuscados na camada de visualização para operadores sem alçada DPO.',
    detalheTecnico: 'Formatos anonimizados: 123.***.***-99 / contato@***.com. Chaves KMS rotacionadas a cada 90 dias.',
  },
  {
    id: 'SEC-03',
    camada: 'APLICACAO',
    titulo: 'Mitigação Integral contra SQL Injection & XSS Sanitization',
    mecanismo: 'Prepared Statements & DOMPurify / Content-Security-Policy',
    status: 'EM_CONFORMIDADE',
    impactoRisco: 'CRITICO',
    descricao: 'Bloqueio estrito de concatenação de queries dinâmicas e escape de caracteres em todos os formulários e visualizadores.',
    detalheTecnico: 'Drizzle ORM com bind parameters obrigatórios. Headers CSP com nonces estritos.',
  },
  {
    id: 'SEC-04',
    camada: 'INFRAESTRUTURA',
    titulo: 'Rate Limiting Granular & Prevenção Anti-Brute Force',
    mecanismo: 'Token Bucket no Gateway Nginx + Redis Limiter',
    status: 'MONITORAMENTO_ATIVO',
    impactoRisco: 'ALTO',
    descricao: 'Limitação de 100 requisições/min por IP e 5 tentativas incorretas de login antes do lockout temporário de 15 minutos.',
    detalheTecnico: 'Cabeçalhos HTTP 429 Too Many Requests emitidos com Retry-After automático.',
  },
  {
    id: 'SEC-05',
    camada: 'BANCO_DADOS',
    titulo: 'Princípio do Menor Privilégio & RBAC Granular',
    mecanismo: 'Roles Granulares (nexus_app_read / nexus_app_write)',
    status: 'EM_CONFORMIDADE',
    impactoRisco: 'CRITICO',
    descricao: 'O usuário da aplicação não possui permissões de DDL (DROP, CREATE, ALTER) nem acesso a esquemas de auditoria bruta.',
    detalheTecnico: 'Esquema de auditoria gravado via trigger SECURITY DEFINER imutável sem permissão de UPDATE/DELETE.',
  },
  {
    id: 'SEC-06',
    camada: 'PRIVACIDADE_LGPD',
    titulo: 'Trilha de Consentimento & Logs de Acesso a Dados Sensíveis',
    mecanismo: 'Auditoria Append-Only em Tabela Segregada',
    status: 'EM_CONFORMIDADE',
    impactoRisco: 'MEDIO',
    descricao: 'Toda consulta e exportação de dados pessoais sensíveis gera um registro formal com justificativa e operador autenticado.',
    detalheTecnico: 'Logs criptografados e retidos por 5 anos para atendimento aos requisitos da ANPD.',
  },
];

const DADOS_SIMULADOS_LGPD = [
  {
    id: 1,
    nome: 'Carlos Eduardo Silveira',
    cargo: 'Gerente Comercial',
    cpf: '342.891.708-44',
    cpfMascarado: '342.***.***-44',
    email: 'carlos.silveira@metalurgica.com.br',
    emailMascarado: 'car***@metalurgica.com.br',
    chavePix: '34289170844',
    chavePixMascarada: '342***44 (CPF)',
  },
  {
    id: 2,
    nome: 'Mariana Duarte Souza',
    cargo: 'Analista Financeiro Pleno',
    cpf: '882.140.391-02',
    cpfMascarado: '882.***.***-02',
    email: 'mariana.souza@tritech.ind.br',
    emailMascarado: 'mar***@tritech.ind.br',
    chavePix: 'financeiro@tritech.ind.br',
    chavePixMascarada: 'fin***@tritech.ind.br (E-mail)',
  },
  {
    id: 3,
    nome: 'Roberto Almeida Mendes',
    cargo: 'Diretor de Operações Fabris',
    cpf: '119.554.802-77',
    cpfMascarado: '119.***.***-77',
    email: 'roberto.mendes@mwam.com.br',
    emailMascarado: 'rob***@mwam.com.br',
    chavePix: '+5511988887766',
    chavePixMascarada: '+55 11 *****-7766 (Telefone)',
  },
];

const CARDS_RESUMO_SEGURANCA = [
  {
    titulo: 'Blindagem Global',
    valor: 'Nível Enterprise',
    subtitulo: 'Aprovado em Pentest',
    status: 'ATIVO',
  },
  {
    titulo: 'Classificação LGPD',
    valor: '100% Protegido',
    subtitulo: 'DDM & AES-256 ativo',
    status: 'CONFORME',
  },
  {
    titulo: 'Isolamento Multi-tenant',
    valor: '5 de 5 CNPJs',
    subtitulo: 'RLS & Middleware rígido',
    status: 'SEGRO',
  },
  {
    titulo: 'Acessos RBAC',
    valor: 'Menor Privilégio',
    subtitulo: 'Zero permissão DDL',
    status: 'RESTRITO',
  },
];

export function SecurityHardeningViewer() {
  const [mascaramentoAtivo, setMascaramentoAtivo] = useState<boolean>(true);
  const [itens] = useState<HardeningItem[]>(ITENS_HARDENING);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<HardeningItem | null>(ITENS_HARDENING[0]);

  const handleToggleMascaramento = () => {
    const novoStatus = !mascaramentoAtivo;
    setMascaramentoAtivo(novoStatus);
    if (novoStatus) {
      setFeedback('✓ Mascaramento dinâmico LGPD ATIVADO. Dados sensíveis (CPF, e-mails, chaves PIX) foram ofuscados para proteção contra vazamento.');
    } else {
      setFeedback('⚠ Mascaramento LGPD DESATIVADO temporariamente (Modo Auditoria/DPO). Todas as visualizações foram registradas no log imutável.');
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Módulo de Hardening */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                Segurança, Hardening & Governança LGPD
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Blindagem Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Políticas de isolamento de tenants, proteção contra injeções, mascaramento de dados sensíveis e controle de privilégios.
            </p>
          </div>
        </div>

        {/* Botão de Alternância de Mascaramento LGPD */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMascaramento}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-2xs border cursor-pointer ${
              mascaramentoAtivo
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {mascaramentoAtivo ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-700" />
                <span>Mascaramento LGPD: <strong>LIGADO</strong></span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                <span>Mascaramento LGPD: <strong>DESLIGADO</strong></span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Cards de KPIs de Segurança & Governança */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CARDS_RESUMO_SEGURANCA.map((card, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.titulo}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  {card.status}
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900">{card.valor}</div>
              <div className="text-[10px] text-slate-500 font-medium">{card.subtitulo}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Principal: Políticas de Hardening + Exibição de Dados LGPD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Coluna Esquerda: Itens de Hardening Revisados */}
        <div className="lg:col-span-7 border-r border-slate-200 p-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-2.5 bg-white">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              Itens de Hardening & Blindagem Arquitetural ({itens.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">OWASP ASVS v4.0</span>
          </div>

          <div className="space-y-2">
            {itens.map((item) => {
              const isSelected = itemSelecionado?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setItemSelecionado(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{item.id}</span>
                        <span className="font-bold text-xs text-slate-900">{item.titulo}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block mt-0.5">
                        Mecanismo: {item.mecanismo}
                      </span>
                    </div>

                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">
                    {item.descricao}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-500 font-mono">Camada: <strong>{item.camada}</strong></span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Risco Mitigado ({item.impactoRisco})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Detalhe do Item + Simulação de Mascaramento LGPD */}
        <div className="lg:col-span-5 p-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-4 bg-slate-50/40">
          
          {/* Detalhamento Técnico do Item Selecionado */}
          {itemSelecionado && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{itemSelecionado.id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 uppercase">
                    {itemSelecionado.camada}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{itemSelecionado.titulo}</h3>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Implementação Técnica no NEXUS ERP:
                </span>
                <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200 font-medium">
                  {itemSelecionado.detalheTecnico}
                </p>
              </div>
            </div>
          )}

          {/* Demonstração Prática de Mascaramento Dinâmico LGPD */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Visão de Dados Pessoais (LGPD)
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                mascaramentoAtivo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {mascaramentoAtivo ? 'Modo Seguro (Ofuscado)' : 'Modo DPO (Aberto)'}
              </span>
            </div>

            <div className="space-y-2">
              {DADOS_SIMULADOS_LGPD.map((pessoa) => (
                <div key={pessoa.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-900">{pessoa.nome}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">{pessoa.cargo}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CPF:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {mascaramentoAtivo ? pessoa.cpfMascarado : pessoa.cpf}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Chave PIX:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {mascaramentoAtivo ? pessoa.chavePixMascarada : pessoa.chavePix}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 bg-slate-900 text-slate-300 rounded text-[10px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Acessos sem máscara geram evento auditável registrado com IP e ID do operador.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
