import React, { useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  RefreshCw,
  FileText,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  ArrowRight,
  Sparkles,
  Download,
  Play,
  Shield,
  Activity,
  Layers,
  FileCode,
} from 'lucide-react';

interface BackupSnapshot {
  id: string;
  tipo: 'FULL_DIARIO' | 'INCREMENTAL_WAL' | 'SNAPSHOT_CONFIG';
  tamanho: string;
  criadoEm: string;
  status: 'DISPONIVEL' | 'REPLICADO_OFFSITE' | 'TESTADO_EM_STAGING';
  checksumSHA256: string;
  retencaoDias: number;
}

const BACKUPS_RECENTES: BackupSnapshot[] = [
  {
    id: 'BKP-FULL-20260827-0200',
    tipo: 'FULL_DIARIO',
    tamanho: '14.8 GB',
    criadoEm: '27/08/2026 02:00:00',
    status: 'TESTADO_EM_STAGING',
    checksumSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retencaoDias: 30,
  },
  {
    id: 'BKP-WAL-20260827-0600',
    tipo: 'INCREMENTAL_WAL',
    tamanho: '420 MB',
    criadoEm: '27/08/2026 06:00:00',
    status: 'REPLICADO_OFFSITE',
    checksumSHA256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    retencaoDias: 7,
  },
  {
    id: 'BKP-WAL-20260827-1000',
    tipo: 'INCREMENTAL_WAL',
    tamanho: '380 MB',
    criadoEm: '27/08/2026 10:00:00',
    status: 'REPLICADO_OFFSITE',
    checksumSHA256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    retencaoDias: 7,
  },
  {
    id: 'BKP-FULL-20260826-0200',
    tipo: 'FULL_DIARIO',
    tamanho: '14.5 GB',
    criadoEm: '26/08/2026 02:00:00',
    status: 'DISPONIVEL',
    checksumSHA256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    retencaoDias: 30,
  },
];

const METRICAS_CONTINUIDADE = [
  {
    titulo: 'RPO (Recovery Point Objective)',
    alvo: '< 24 Horas',
    statusAtual: '15 Minutos (PITR / WAL)',
    indicador: 'CONFORME',
    cor: 'emerald',
    descricao: 'Tolerância máxima de perda de dados entre transações.',
  },
  {
    titulo: 'RTO (Recovery Time Objective)',
    alvo: '< 2 Horas',
    statusAtual: '28 Minutos (Staging Test)',
    indicador: 'CONFORME',
    cor: 'emerald',
    descricao: 'Tempo máximo para restabelecimento total dos serviços.',
  },
  {
    titulo: 'Ambiente de Staging (DR)',
    alvo: 'Standby / Réplica Pronta',
    statusAtual: '100% Sincronizado',
    indicador: 'OPERACIONAL',
    cor: 'blue',
    descricao: 'Instância isolada para validação automática de restores.',
  },
  {
    titulo: 'Retenção & Imutabilidade',
    alvo: '30 Dias + WORM Storage',
    statusAtual: 'Proteção Anti-Ransomware',
    indicador: 'ATIVO',
    cor: 'purple',
    descricao: 'Backups bloqueados para exclusão direta (Append-Only).',
  },
];

const ETAPAS_PLANO_RECUPERACAO = [
  {
    etapa: '1. Detecção & Declaração do Incidente',
    responsavel: 'Engenharia de Infra / DevOps On-Call',
    tempoEstimado: '5 min',
    acoes: [
      'Identificar indisponibilidade do nó primário ou corrupção de partição.',
      'Congelar roteamento DNS no balanceador para prevenir escritas inconsistentes.',
      'Registrar protocolo inicial de auditoria de emergência no log de segurança.',
    ],
  },
  {
    etapa: '2. Provisionamento ou Ativação do Nó Standby',
    responsavel: 'Arquiteto de Banco de Dados / Cloud Lead',
    tempoEstimado: '10 min',
    acoes: [
      'Promover a réplica de Staging/Standby para nó mestre temporário ou restaurar dump full.',
      'Aplicar arquivos de WAL incrementais até o timestamp exato do incidente (PITR).',
      'Validar integridade referencial das chaves estrangeiras e RLS de empresa_id.',
    ],
  },
  {
    etapa: '3. Testes de Fumaça & Validação Multiempresa',
    responsavel: 'Time de QA & Governança',
    tempoEstimado: '8 min',
    acoes: [
      'Executar suite de testes de isolamento nos 5 CNPJs do Grupo TRITECH.',
      'Confirmar integridade de saldos de estoque, pedidos e contas a pagar/receber.',
      'Validar chaves de autenticação de usuários e permissões RBAC.',
    ],
  },
  {
    etapa: '4. Liberação do Tráfego & Post-Mortem',
    responsavel: 'Diretoria de Tecnologia & Compliance',
    tempoEstimado: '5 min',
    acoes: [
      'Reapontar tráfego do Gateway HTTP/Nginx para o nó restabelecido.',
      'Emitir comunicado de estabilização aos usuários das 5 empresas.',
      'Gerar relatório formal Post-Mortem de causa-raiz em até 48 horas úteis.',
    ],
  },
];

export function BackupRecoveryViewer() {
  const [backups] = useState<BackupSnapshot[]>(BACKUPS_RECENTES);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSimularTesteRestore = (bkpId: string) => {
    setFeedback(`Simulação de Restore em Staging iniciada para [${bkpId}]. Checksum verificado com sucesso.`);
    setTimeout(() => setFeedback(null), 4500);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Módulo */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <HardDrive className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                Disaster Recovery, Backups & Continuidade de Negócios
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Políticas RPO/RTO Validadas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoramento de rotinas de cópia, integridade criptográfica SHA-256, testes contínuos em staging e plano de mitigação.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimularTesteRestore('BKP-FULL-20260827-0200')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Executar Teste em Staging
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
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

      {/* Cards de Métricas Principais (RPO, RTO, Staging, Retenção) */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {METRICAS_CONTINUIDADE.map((m, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {m.titulo}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  {m.indicador}
                </span>
              </div>
              <div className="text-sm font-extrabold text-slate-900">{m.statusAtual}</div>
              <div className="text-[10px] text-slate-500 font-medium">Alvo: <strong className="text-slate-700">{m.alvo}</strong></div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-50">{m.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Principal: Lista de Snapshots + Plano de Ação em Incidentes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Coluna Esquerda: Snapshots de Backup Disponíveis */}
        <div className="lg:col-span-6 border-r border-slate-200 p-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-3 bg-white">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Snapshots & Arquivos de Backup ({backups.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Retenção WORM</span>
          </div>

          <div className="space-y-2.5">
            {backups.map((bkp) => (
              <div
                key={bkp.id}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{bkp.id}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      bkp.status === 'TESTADO_EM_STAGING'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : bkp.status === 'REPLICADO_OFFSITE'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {bkp.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block">Tipo:</span>
                    <strong className="text-slate-800">{bkp.tipo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tamanho:</span>
                    <strong className="text-slate-800 font-mono">{bkp.tamanho}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Data de Criação:</span>
                    <strong className="text-slate-800 font-mono">{bkp.criadoEm}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-400 truncate max-w-[280px]" title={bkp.checksumSHA256}>
                    SHA: {bkp.checksumSHA256.slice(0, 24)}...
                  </span>
                  <button
                    onClick={() => handleSimularTesteRestore(bkp.id)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    Testar Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Procedimento Operacional Padrão de Recuperação */}
        <div className="lg:col-span-6 p-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-4 bg-slate-50/40">
          
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Procedimento de Resposta a Incidentes (Disaster Recovery)
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                SLA Global: 28 min
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {ETAPAS_PLANO_RECUPERACAO.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{item.etapa}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.tempoEstimado}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Responsável: <strong className="text-slate-700">{item.responsavel}</strong>
                  </div>

                  <ul className="space-y-1 pt-1">
                    {item.acoes.map((acao, aIdx) => (
                      <li key={aIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{acao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              Garantia de Não-Destrutividade
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Nenhuma ação de recuperação ou teste sobrescreve dados de produção sem autorização de duplo fator e validação de chaves de integridade multiempresa.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
