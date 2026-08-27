import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Terminal,
  Lock,
  CheckCircle,
  AlertTriangle,
  Code2,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
  KeyRound,
  FileCode2,
  ShieldAlert,
  Play,
  Copy,
  Check,
  Boxes,
  ShoppingBag,
  Receipt,
  Hammer,
  DollarSign,
  ShoppingCart,
  CheckSquare,
  Shield,
} from 'lucide-react';

interface ToolContract {
  id: string;
  nome: string;
  modulo: string;
  tipoAcao: 'LEITURA' | 'GRAVACAO_MUTACAO' | 'ANALISE_ESTRATEGICA';
  descricao: string;
  permissaoMinima: string;
  exigeAprovacaoHumana: boolean;
  bloqueioSqlLivre: boolean;
  schemaInput: string;
  schemaOutput: string;
  exemploPayload: string;
}

const FERRAMENTAS_CATALOGO: ToolContract[] = [
  {
    id: 'tool-01',
    nome: 'consultarEstoque',
    modulo: 'ESTOQUE',
    tipoAcao: 'LEITURA',
    descricao: 'Consulta saldos em tempo real, lotes disponíveis e itens abaixo do ponto de pedido por empresa.',
    permissaoMinima: 'ESTOQUE_READ',
    exigeAprovacaoHumana: false,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "codigoItem": "string?",\n  "apenasCriticos": "boolean?"\n}',
    schemaOutput: '{\n  "itens": [{\n    "id": "string",\n    "codigo": "string",\n    "saldoAtual": "number",\n    "saldoDisponivel": "number",\n    "deposito": "string"\n  }]\n}',
    exemploPayload: '{\n  "empresaId": "33333333-3333-3333-3333-333333333333",\n  "codigoItem": "CHAPA-INOX-304-2MM",\n  "apenasCriticos": false\n}',
  },
  {
    id: 'tool-02',
    nome: 'consultarPedido',
    modulo: 'PEDIDOS',
    tipoAcao: 'LEITURA',
    descricao: 'Recupera status de pedidos de venda, itens faturados, pendências de produção e prazos de entrega.',
    permissaoMinima: 'PEDIDOS_READ',
    exigeAprovacaoHumana: false,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "numeroPedido": "string?",\n  "clienteId": "string?"\n}',
    schemaOutput: '{\n  "pedidos": [{\n    "numero": "string",\n    "status": "string",\n    "valorTotal": "number",\n    "prazoEntrega": "string"\n  }]\n}',
    exemploPayload: '{\n  "empresaId": "11111111-1111-1111-1111-111111111111",\n  "numeroPedido": "PED-09012"\n}',
  },
  {
    id: 'tool-03',
    nome: 'consultarFinanceiro',
    modulo: 'FINANCEIRO',
    tipoAcao: 'LEITURA',
    descricao: 'Consolida posição de contas a pagar/receber, conciliações e fluxo de caixa de curto prazo.',
    permissaoMinima: 'FINANCEIRO_READ',
    exigeAprovacaoHumana: false,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "tipo": "A_PAGAR | A_RECEBER | AMBOS",\n  "diasHorizonte": "number"\n}',
    schemaOutput: '{\n  "totalPrevisto": "number",\n  "titulosVencidos": "number",\n  "titulosAVencer": "number"\n}',
    exemploPayload: '{\n  "empresaId": "22222222-2222-2222-2222-222222222222",\n  "tipo": "AMBOS",\n  "diasHorizonte": 30\n}',
  },
  {
    id: 'tool-04',
    nome: 'consultarProducao',
    modulo: 'PRODUCAO',
    tipoAcao: 'LEITURA',
    descricao: 'Verifica ordens de produção em andamento, apontamentos de máquina, paradas e eficiência OEE.',
    permissaoMinima: 'PRODUCAO_READ',
    exigeAprovacaoHumana: false,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "centroTrabalho": "string?",\n  "statusOP": "string?"\n}',
    schemaOutput: '{\n  "ordens": [{\n    "opId": "string",\n    "produto": "string",\n    "qtdProgramada": "number",\n    "qtdApontada": "number",\n    "oeeEstimado": "number"\n  }]\n}',
    exemploPayload: '{\n  "empresaId": "44444444-4444-4444-4444-444444444444",\n  "centroTrabalho": "LASER_FIBRA_01"\n}',
  },
  {
    id: 'tool-05',
    nome: 'consultarMargemPedido',
    modulo: 'COMERCIAL',
    tipoAcao: 'ANALISE_ESTRATEGICA',
    descricao: 'Calcula margem líquida real de proposta comercial considerando custos de matéria-prima, impostos e frete.',
    permissaoMinima: 'ORCAMENTO_ANALYSIS',
    exigeAprovacaoHumana: false,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "pedidoId": "string",\n  "descontoSimuladoPerc": "number?"\n}',
    schemaOutput: '{\n  "margemBrutaPerc": "number",\n  "margemLiquidaPerc": "number",\n  "alertaDesvio": "boolean",\n  "parecer": "string"\n}',
    exemploPayload: '{\n  "empresaId": "11111111-1111-1111-1111-111111111111",\n  "pedidoId": "ORC-7741",\n  "descontoSimuladoPerc": 5.5\n}',
  },
  {
    id: 'tool-06',
    nome: 'gerarSugestaoCompra',
    modulo: 'COMPRAS',
    tipoAcao: 'GRAVACAO_MUTACAO',
    descricao: 'Gera rascunho de ordem de compra com base nas necessidades do MRP e giro médio histórico.',
    permissaoMinima: 'COMPRAS_CREATE',
    exigeAprovacaoHumana: true,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "itens": [{\n    "itemCodigo": "string",\n    "quantidadeSugerida": "number",\n    "justificativa": "string"\n  }]\n}',
    schemaOutput: '{\n  "ordemRascunhoId": "string",\n  "status": "PENDENTE_APROVACAO_COMPRADOR",\n  "valorEstimado": "number"\n}',
    exemploPayload: '{\n  "empresaId": "33333333-3333-3333-3333-333333333333",\n  "itens": [{\n    "itemCodigo": "PERFIL-ALU-V2",\n    "quantidadeSugerida": 150,\n    "justificativa": "Reposição de estoque de segurança conforme demanda de OP"\n  }]\n}',
  },
  {
    id: 'tool-07',
    nome: 'criarTarefa',
    modulo: 'SISTEMA',
    tipoAcao: 'GRAVACAO_MUTACAO',
    descricao: 'Cria apontamentos ou tarefas colaborativas vinculadas a alertas operacionais para operadores.',
    permissaoMinima: 'TAREFAS_CREATE',
    exigeAprovacaoHumana: true,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "titulo": "string",\n  "responsavelSetor": "string",\n  "prioridade": "BAIXA | MEDIA | ALTA",\n  "prazoDias": "number"\n}',
    schemaOutput: '{\n  "tarefaId": "string",\n  "protocolo": "string",\n  "criadoEm": "string"\n}',
    exemploPayload: '{\n  "empresaId": "55555555-5555-5555-5555-555555555555",\n  "titulo": "Auditar divergência física de estoque - Bloco B",\n  "responsavelSetor": "Almoxarifado",\n  "prioridade": "ALTA",\n  "prazoDias": 2\n}',
  },
  {
    id: 'tool-08',
    nome: 'consultarCredito',
    modulo: 'CREDITO',
    tipoAcao: 'ANALISE_ESTRATEGICA',
    descricao: 'Consulta limite aprovado, score interno e política de risco comercial do cliente (Serasa Adapter).',
    permissaoMinima: 'CREDITO_READ',
    exigeAprovacaoHumana: false,
    bloqueioSqlLivre: true,
    schemaInput: '{\n  "empresaId": "string (UUID)",\n  "cnpjCliente": "string"\n}',
    schemaOutput: '{\n  "score": "number",\n  "classificacaoRisco": "A | B | C | D",\n  "limiteDisponivel": "number",\n  "titulosEmAberto": "number"\n}',
    exemploPayload: '{\n  "empresaId": "11111111-1111-1111-1111-111111111111",\n  "cnpjCliente": "12.345.678/0001-90"\n}',
  },
];

const LOGS_MOCKADOS = [
  {
    id: 'TLOG-901',
    data: '27/08/2026 09:15:02',
    ferramenta: 'consultarEstoque',
    agente: 'TRITECH AI Gateway (Subsystem)',
    empresa: 'MWAM Engenharia',
    status: 'SUCESSO (200 OK)',
    latencia: '42ms',
    seguranca: 'RLS & empresa_id Validado',
    resultado: 'Retornados 14 itens em ponto de pedido. Sem violação de escopo.',
  },
  {
    id: 'TLOG-902',
    data: '27/08/2026 09:20:18',
    ferramenta: 'consultarMargemPedido',
    agente: 'TRITECH AI Gateway (Subsystem)',
    empresa: 'TRITECH Industrial Matriz',
    status: 'SUCESSO (200 OK)',
    latencia: '68ms',
    seguranca: 'Permissão ORCAMENTO_ANALYSIS OK',
    resultado: 'Margem calculada em 28.4%. Alerta de margem mínima não disparado.',
  },
  {
    id: 'TLOG-903',
    data: '27/08/2026 09:35:44',
    ferramenta: 'gerarSugestaoCompra',
    agente: 'TRITECH AI Gateway (Subsystem)',
    empresa: 'Tritech Corte e Conformação',
    status: 'BLOQUEADO - REQUER APROVAÇÃO HUMANA',
    latencia: '12ms',
    seguranca: 'Human-in-the-Loop Ativado',
    resultado: 'Payload retido em fila de homologação. Exige aceite de comprador.',
  },
  {
    id: 'TLOG-904',
    data: '27/08/2026 09:50:11',
    ferramenta: 'RAW_SQL_EXECUTE',
    agente: 'Tentativa Não Autorizada Externa',
    empresa: 'Grupo TRITECH',
    status: 'BARRADO (403 FORBIDDEN)',
    latencia: '4ms',
    seguranca: 'Anti-SQL Injection Gateway',
    resultado: 'Acesso direto a SQL livre permanentemente proibido pela arquitetura.',
  },
];

export function TritechAiBridgeViewer() {
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<ToolContract>(FERRAMENTAS_CATALOGO[0]);
  const [payloadSimulacao, setPayloadSimulacao] = useState<string>(FERRAMENTAS_CATALOGO[0].exemploPayload);
  const [respostaSimulada, setRespostaSimulada] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  const handleSelecionarFerramenta = (tool: ToolContract) => {
    setFerramentaSelecionada(tool);
    setPayloadSimulacao(tool.exemploPayload);
    setRespostaSimulada(null);
  };

  const handleExecutarChamada = () => {
    if (ferramentaSelecionada.exigeAprovacaoHumana) {
      setRespostaSimulada(JSON.stringify({
        status: 'GATEWAY_SECURITY_HOLD',
        codigo: 202,
        mensagem: `Ação [${ferramentaSelecionada.nome}] requer aprovação humana obrigatória (Human-in-the-Loop). Rascunho enviado para a fila de governança.`,
        protocoloAuditoria: `AUDIT-TRITECH-${Date.now()}`,
        empresaValidada: 'Contexto restrito ao empresa_id da sessão',
      }, null, 2));
      setFeedback(`Validação de Segurança: Ação retida para confirmação humana.`);
    } else {
      setRespostaSimulada(JSON.stringify({
        status: 'SUCCESS',
        codigo: 200,
        ferramenta: ferramentaSelecionada.nome,
        modulo: ferramentaSelecionada.modulo,
        seguranca: {
          bloqueioSqlLivre: true,
          empresaIdEnforced: true,
          rlsAtivo: true,
        },
        dadosSimulados: JSON.parse(ferramentaSelecionada.schemaOutput.replace(/\/\/.*/g, '').replace(/(\w+): "([^"]+)"/g, '"$1": "$2"').replace(/(\w+): (\[|\{)/g, '"$1": $2')),
      }, null, 2));
      setFeedback(`Contrato executado com sucesso através do Tool Gateway.`);
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleCopiarSchema = () => {
    navigator.clipboard?.writeText(ferramentaSelecionada.schemaInput);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Tool Gateway */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <Cpu className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                TRITECH AI Tool Gateway & Bridge Contratos
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Extensibilidade Determinística
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Camada de desacoplamento, contratos estritos de ferramentas e barreira de segurança para integração futura de inteligência artificial.
            </p>
          </div>
        </div>

        {/* Badges de Garantia de Segurança */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            SQL Livre Bloqueado
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            <Lock className="w-3.5 h-3.5" />
            Ações com Human-in-the-Loop
          </span>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Catálogo de Ferramentas + Painel de Inspeção & Execução */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Coluna Esquerda: Catálogo de Funções e Ferramentas Seguras */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto max-h-[calc(100vh-210px)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-600" />
              Catálogo de Ferramentas ({FERRAMENTAS_CATALOGO.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Prot. v1.2</span>
          </div>

          <div className="space-y-2">
            {FERRAMENTAS_CATALOGO.map((tool) => {
              const isSelected = ferramentaSelecionada.id === tool.id;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelecionarFerramenta(tool)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{tool.nome}()</span>
                    </div>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        tool.tipoAcao === 'LEITURA'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : tool.tipoAcao === 'GRAVACAO_MUTACAO'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {tool.tipoAcao}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {tool.descricao}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-500 font-mono">Módulo: <strong>{tool.modulo}</strong></span>
                    {tool.exigeAprovacaoHumana ? (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Requer Aprovação
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Leitura Direta
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Contrato da Função, Validação e Simulador */}
        <div className="lg:col-span-7 p-5 overflow-y-auto max-h-[calc(100vh-210px)] space-y-5 bg-white">
          
          {/* Card do Contrato Selecionado */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  function {ferramentaSelecionada.nome}(input: Payload)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{ferramentaSelecionada.descricao}</p>
              </div>
              <button
                onClick={handleCopiarSchema}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar Schema'}</span>
              </button>
            </div>

            {/* Metadados de Autorização e Segurança */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Permissão RBAC</span>
                <span className="font-mono font-bold text-slate-800">{ferramentaSelecionada.permissaoMinima}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Human-in-the-Loop</span>
                <span className={`font-bold ${ferramentaSelecionada.exigeAprovacaoHumana ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {ferramentaSelecionada.exigeAprovacaoHumana ? 'Obrigatório' : 'Isento (Leitura)'}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Sanitização SQL</span>
                <span className="text-emerald-700 font-bold">100% Parametrizado</span>
              </div>
            </div>

            {/* Schemas JSON de Entrada e Saída */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase mb-1">
                  Schema de Entrada (Input JSON):
                </span>
                <pre className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-md overflow-x-auto max-h-36">
                  {ferramentaSelecionada.schemaInput}
                </pre>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block uppercase mb-1">
                  Schema de Resposta (Output JSON):
                </span>
                <pre className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-md overflow-x-auto max-h-36">
                  {ferramentaSelecionada.schemaOutput}
                </pre>
              </div>
            </div>
          </div>

          {/* Área de Simulação de Chamada */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-indigo-600" />
                Simulador de Chamada Externa via Gateway
              </span>
              <button
                onClick={handleExecutarChamada}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition-colors shadow-xs"
              >
                <Play className="w-3 h-3 text-white fill-white" />
                Disparar Contrato
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Payload de Simulação (Editável):
              </label>
              <textarea
                value={payloadSimulacao}
                onChange={(e) => setPayloadSimulacao(e.target.value)}
                rows={4}
                className="w-full p-2.5 font-mono text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
            </div>

            {respostaSimulada && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-600 block uppercase">
                  Retorno do Tool Gateway (JSON Validado):
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-md overflow-x-auto max-h-48 border border-slate-800">
                  {respostaSimulada}
                </pre>
              </div>
            )}
          </div>

          {/* Painel de Auditoria e Logs das Chamadas ao Gateway */}
          <div className="border border-slate-200 rounded-lg overflow-hidden space-y-0">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                Logs Estruturados do Gateway de Ferramentas
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Auditoria Append-Only</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {LOGS_MOCKADOS.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                      <span className="font-mono font-bold text-slate-800">{log.ferramenta}()</span>
                      <span className="text-[10px] text-slate-500">em {log.empresa}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        log.status.includes('SUCESSO')
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.status.includes('REQUER APROVAÇÃO')
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                    <span>{log.resultado}</span>
                    <span className="text-slate-400 text-[10px]">{log.latencia}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
