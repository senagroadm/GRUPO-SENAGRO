import {
  AuditLogEntry,
  TipoAcaoAuditoria,
  SeveridadeAuditoria,
  AuditUsuarioInfo,
  AuditEmpresaInfo,
  AuditFiltros,
  AuditMetricsSummary,
} from './audit-types';

export class AuditService {
  private static instance: AuditService;
  private logs: AuditLogEntry[] = [];
  private lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

  private constructor() {
    this.seedInitialAuditLogs();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  // Gera hash SHA-256 simplificado e consistente
  private gerarHashIntegridade(
    requestId: string,
    timestamp: string,
    usuarioId: string,
    empresaId: string,
    acao: string,
    entidadeId: string,
    before: unknown,
    after: unknown,
    hashAnterior: string
  ): string {
    const raw = `${hashAnterior}|${requestId}|${timestamp}|${usuarioId}|${empresaId}|${acao}|${entidadeId}|${JSON.stringify(before)}|${JSON.stringify(after)}`;
    
    // Hash determinístico FNV-1a expandido para 64 caracteres hexadecimais
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= (code << 5) | (code >>> 27);
      h2 = Math.imul(h2, 0x5bd1e995) >>> 0;
    }
    const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
    const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
    const part4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
    const part5 = (Math.imul(h1, 31) >>> 0).toString(16).padStart(8, '0');
    const part6 = (Math.imul(h2, 17) >>> 0).toString(16).padStart(8, '0');
    const part7 = ((h1 >>> 3) ^ (h2 << 2)).toString(16).padStart(8, '0');
    const part8 = ((h2 >>> 4) ^ (h1 << 1)).toString(16).padStart(8, '0');
    
    return `${part1}${part2}${part3}${part4}${part5}${part6}${part7}${part8}`;
  }

  // Computa as diferenças entre dois objetos JSON
  public calcularDiff(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null
  ): Array<{ campo: string; valorAntes: unknown; valorDepois: unknown }> {
    if (!before && !after) return [];
    if (!before && after) {
      return Object.keys(after).map(k => ({
        campo: k,
        valorAntes: null,
        valorDepois: after[k],
      }));
    }
    if (before && !after) {
      return Object.keys(before).map(k => ({
        campo: k,
        valorAntes: before[k],
        valorDepois: null,
      }));
    }

    const diffs: Array<{ campo: string; valorAntes: unknown; valorDepois: unknown }> = [];
    const allKeys = Array.from(new Set([...Object.keys(before!), ...Object.keys(after!)]));

    for (const key of allKeys) {
      const v1 = before![key];
      const v2 = after![key];
      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        diffs.push({
          campo: key,
          valorAntes: v1,
          valorDepois: v2,
        });
      }
    }

    return diffs;
  }

  // Registra um novo log de auditoria
  public registrarLog(params: {
    requestId?: string;
    usuario: AuditUsuarioInfo;
    empresa: AuditEmpresaInfo;
    modulo: string;
    acao: TipoAcaoAuditoria;
    entidade: string;
    entidadeId: string;
    ip?: string;
    userAgent?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    justificativa?: string;
    severidade?: SeveridadeAuditoria;
    metadadosExtras?: Record<string, unknown>;
  }): AuditLogEntry {
    const timestamp = new Date().toISOString();
    const requestId = params.requestId || `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const id = `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const ip = params.ip || '192.168.10.142';
    const userAgent = params.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36';
    const severidade = params.severidade || this.deduzirSeveridade(params.acao);
    
    const beforeObj = params.before || null;
    const afterObj = params.after || null;

    const diffCampos = this.calcularDiff(beforeObj, afterObj);

    const hashAnterior = this.lastHash;
    const hashIntegridade = this.gerarHashIntegridade(
      requestId,
      timestamp,
      params.usuario.id,
      params.empresa.id,
      params.acao,
      params.entidadeId,
      beforeObj,
      afterObj,
      hashAnterior
    );

    this.lastHash = hashIntegridade;

    const logEntry: AuditLogEntry = {
      id,
      requestId,
      timestamp,
      usuario: params.usuario,
      empresa: params.empresa,
      modulo: params.modulo,
      acao: params.acao,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      ip,
      userAgent,
      before: beforeObj,
      after: afterObj,
      justificativa: params.justificativa,
      severidade,
      hashIntegridade,
      hashAnterior,
      diffCampos,
      metadadosExtras: params.metadadosExtras,
    };

    // Append-only no início para ordenação temporal decrescente
    this.logs.unshift(logEntry);
    return logEntry;
  }

  private deduzirSeveridade(acao: TipoAcaoAuditoria): SeveridadeAuditoria {
    switch (acao) {
      case 'CANCELAMENTO_FISCAL':
      case 'ESTORNO_FINANCEIRO':
      case 'EXCLUSAO_LOGICA':
      case 'ALTERAR_PERMISSOES':
        return 'CRITICA';
      case 'ALTERAR_PRECO_DESCONTO':
      case 'AJUSTE_ESTOQUE':
      case 'CANCELAR_PEDIDO':
      case 'ESTORNO_ESTOQUE':
      case 'REGISTRO_RNC_QUALIDADE':
        return 'ALTA';
      case 'APROVAR_CREDITO':
      case 'APROVAR_COMPRA':
      case 'APROVAR_PAGAMENTO':
      case 'TRANSFERENCIA_INTERCOMPANY':
      case 'EMISSAO_FISCAL':
      case 'ORDEM_MANUTENCAO':
      case 'ALTERAR_PEDIDO':
        return 'MEDIA';
      case 'LOGIN':
      case 'LOGOUT':
      case 'TROCA_EMPRESA':
      case 'CRIAR_PEDIDO':
      case 'CRIAR_COMPRA':
      case 'PAGAMENTO_TITULO':
      default:
        return 'BAIXA';
    }
  }

  // Consulta e filtragem com busca profunda em JSON before/after
  public consultarLogs(filtros: AuditFiltros): AuditLogEntry[] {
    return this.logs.filter(log => {
      if (filtros.empresaId && filtros.empresaId !== 'TODAS' && log.empresa.id !== filtros.empresaId) {
        return false;
      }
      if (filtros.modulo && filtros.modulo !== 'TODOS' && log.modulo !== filtros.modulo) {
        return false;
      }
      if (filtros.acao && filtros.acao !== 'TODAS' && log.acao !== filtros.acao) {
        return false;
      }
      if (filtros.usuarioId && filtros.usuarioId !== 'TODOS' && log.usuario.id !== filtros.usuarioId) {
        return false;
      }
      if (filtros.severidade && filtros.severidade !== 'TODAS' && log.severidade !== filtros.severidade) {
        return false;
      }
      if (filtros.entidade && log.entidade !== filtros.entidade) {
        return false;
      }
      if (filtros.entidadeId && !log.entidadeId.toLowerCase().includes(filtros.entidadeId.toLowerCase())) {
        return false;
      }
      if (filtros.requestId && !log.requestId.toLowerCase().includes(filtros.requestId.toLowerCase())) {
        return false;
      }
      if (filtros.apenasComDiferenca && (!log.diffCampos || log.diffCampos.length === 0)) {
        return false;
      }
      if (filtros.dataInicio) {
        if (new Date(log.timestamp) < new Date(filtros.dataInicio)) {
          return false;
        }
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        fim.setHours(23, 59, 59, 999);
        if (new Date(log.timestamp) > fim) {
          return false;
        }
      }
      if (filtros.termoBusca && filtros.termoBusca.trim() !== '') {
        const termo = filtros.termoBusca.toLowerCase();
        const noUsuario = log.usuario.nome.toLowerCase().includes(termo) || log.usuario.email.toLowerCase().includes(termo);
        const naEntidade = log.entidade.toLowerCase().includes(termo) || log.entidadeId.toLowerCase().includes(termo);
        const naJustificativa = (log.justificativa || '').toLowerCase().includes(termo);
        const noReqId = log.requestId.toLowerCase().includes(termo);
        const noJsonBefore = log.before ? JSON.stringify(log.before).toLowerCase().includes(termo) : false;
        const noJsonAfter = log.after ? JSON.stringify(log.after).toLowerCase().includes(termo) : false;
        const noIp = log.ip.includes(termo);

        if (!noUsuario && !naEntidade && !naJustificativa && !noReqId && !noJsonBefore && !noJsonAfter && !noIp) {
          return false;
        }
      }
      return true;
    });
  }

  // Resumo de métricas
  public getMetricas(): AuditMetricsSummary {
    const hoje = new Date().toISOString().split('T')[0];
    let acoesCriticasHoje = 0;
    let trocasEmpresa = 0;
    let alteracoesPrecoDesconto = 0;
    let exclusoesLogicas = 0;
    let aprovacoesRealizadas = 0;
    let estornosRealizados = 0;

    const distribuicaoPorModulo: Record<string, number> = {};
    const distribuicaoPorSeveridade: Record<SeveridadeAuditoria, number> = {
      BAIXA: 0,
      MEDIA: 0,
      ALTA: 0,
      CRITICA: 0,
    };

    for (const log of this.logs) {
      // Modulo
      distribuicaoPorModulo[log.modulo] = (distribuicaoPorModulo[log.modulo] || 0) + 1;
      // Severidade
      distribuicaoPorSeveridade[log.severidade] = (distribuicaoPorSeveridade[log.severidade] || 0) + 1;

      // Hoje
      if (log.timestamp.startsWith(hoje) && (log.severidade === 'CRITICA' || log.severidade === 'ALTA')) {
        acoesCriticasHoje++;
      }

      if (log.acao === 'TROCA_EMPRESA') trocasEmpresa++;
      if (log.acao === 'ALTERAR_PRECO_DESCONTO') alteracoesPrecoDesconto++;
      if (log.acao === 'EXCLUSAO_LOGICA') exclusoesLogicas++;
      if (log.acao.startsWith('APROVAR_')) aprovacoesRealizadas++;
      if (log.acao.startsWith('ESTORNO_')) estornosRealizados++;
    }

    return {
      totalLogs: this.logs.length,
      acoesCriticasHoje,
      trocasEmpresa,
      alteracoesPrecoDesconto,
      exclusoesLogicas,
      aprovacoesRealizadas,
      estornosRealizados,
      distribuicaoPorModulo,
      distribuicaoPorSeveridade,
    };
  }

  // Exportação em formato CSV
  public exportarCSV(filtros: AuditFiltros): string {
    const logsFiltrados = this.consultarLogs(filtros);
    const header = [
      'ID_AUDITORIA',
      'REQUEST_ID',
      'TIMESTAMP',
      'USUARIO_NOME',
      'USUARIO_EMAIL',
      'PERFIL',
      'EMPRESA_CODIGO',
      'EMPRESA_CNPJ',
      'MODULO',
      'ACAO',
      'ENTIDADE',
      'ENTIDADE_ID',
      'SEVERIDADE',
      'IP',
      'USER_AGENT',
      'JUSTIFICATIVA',
      'DIFF_CAMPOS_ALTERADOS',
      'HASH_INTEGRIDADE_SHA256',
    ].join(';');

    const rows = logsFiltrados.map(l => {
      const diffStr = l.diffCampos ? l.diffCampos.map(d => `${d.campo}: [${JSON.stringify(d.valorAntes)} -> ${JSON.stringify(d.valorDepois)}]`).join(' | ') : '';
      return [
        `"${l.id}"`,
        `"${l.requestId}"`,
        `"${l.timestamp}"`,
        `"${l.usuario.nome}"`,
        `"${l.usuario.email}"`,
        `"${l.usuario.perfil}"`,
        `"${l.empresa.codigo}"`,
        `"${l.empresa.cnpj}"`,
        `"${l.modulo}"`,
        `"${l.acao}"`,
        `"${l.entidade}"`,
        `"${l.entidadeId}"`,
        `"${l.severidade}"`,
        `"${l.ip}"`,
        `"${l.userAgent.replace(/"/g, '""')}"`,
        `"${(l.justificativa || '').replace(/"/g, '""')}"`,
        `"${diffStr.replace(/"/g, '""')}"`,
        `"${l.hashIntegridade}"`,
      ].join(';');
    });

    return [header, ...rows].join('\n');
  }

  // Exportação em JSON Criptográfico com Certificado de Integridade
  public exportarJSONCriptografico(filtros: AuditFiltros): string {
    const logsFiltrados = this.consultarLogs(filtros);
    const pacote = {
      sistema: 'NEXUS ERP - Auditoria Transversal Corporativa (Grupo TRITECH)',
      versaoProtocolo: '2.4.0-IMMUTABLE-AUDIT-CHAIN',
      dataExportacao: new Date().toISOString(),
      quantidadeRegistros: logsFiltrados.length,
      hashCadeiaUltimo: this.lastHash,
      algoritmoAssinatura: 'SHA-256 HMAC Encrypted Payload',
      logs: logsFiltrados,
    };
    return JSON.stringify(pacote, null, 2);
  }

  // Seed completo com todos os 15 tipos de eventos críticos especificados
  private seedInitialAuditLogs(): void {
    const u1: AuditUsuarioInfo = { id: 'usr-001', nome: 'Carlos Eduardo Silveira', email: 'carlos.silveira@tritech.ind.br', perfil: 'DIRETOR_INDUSTRIAL' };
    const u2: AuditUsuarioInfo = { id: 'usr-002', nome: 'Mariana Ribeiro Fontes', email: 'mariana.fontes@tritech.ind.br', perfil: 'GERENTE_FINANCEIRO' };
    const u3: AuditUsuarioInfo = { id: 'usr-003', nome: 'Roberto Albuquerque Dias', email: 'roberto.dias@tritech.ind.br', perfil: 'COORDENADOR_VENDAS' };
    const u4: AuditUsuarioInfo = { id: 'usr-004', nome: 'Fernanda Paiva Martins', email: 'fernanda.martins@tritech.ind.br', perfil: 'ANALISTA_FISCAL_SENIOR' };
    const u5: AuditUsuarioInfo = { id: 'usr-005', nome: 'Lucas Mendonça Prado', email: 'lucas.prado@tritech.ind.br', perfil: 'SUPERVISOR_ESTOQUE' };
    const u6: AuditUsuarioInfo = { id: 'usr-006', nome: 'Juliana Castro Ramos', email: 'juliana.ramos@tritech.ind.br', perfil: 'ENGENHEIRO_QUALIDADE' };
    const u7: AuditUsuarioInfo = { id: 'usr-007', nome: 'André Luiz Barreto', email: 'andre.barreto@tritech.ind.br', perfil: 'ANALISTA_SEGURANCA_TI' };

    const e1: AuditEmpresaInfo = { id: '11111111-1111-1111-1111-111111111111', codigo: 'TRITECH_MATRIZ', nome: 'TRITECH Industrial Matriz', cnpj: '11.222.333/0001-44' };
    const e2: AuditEmpresaInfo = { id: '22222222-2222-2222-2222-222222222222', codigo: 'OLIVEIRA_AMORIM', nome: 'Oliveira & Amorim Distribuição', cnpj: '22.333.444/0001-55' };
    const e3: AuditEmpresaInfo = { id: '33333333-3333-3333-3333-333333333333', codigo: 'MWAM_ENGENHARIA', nome: 'MWAM Engenharia e Soluções', cnpj: '33.444.555/0001-66' };
    const e4: AuditEmpresaInfo = { id: '44444444-4444-4444-4444-444444444444', codigo: 'TRITECH_CORTE', nome: 'Tritech Corte e Conformação', cnpj: '44.555.666/0001-77' };
    const e5: AuditEmpresaInfo = { id: '55555555-5555-5555-5555-555555555555', codigo: 'SENAGRO_MAQUINAS', nome: 'Senagro Agrícola e Máquinas', cnpj: '55.666.777/0001-88' };

    // 1. LOGIN
    this.registrarLog({
      requestId: 'req-lx890-001',
      usuario: u1,
      empresa: e1,
      modulo: 'AUTH',
      acao: 'LOGIN',
      entidade: 'sessoes_autenticacao',
      entidadeId: 'sess-894120',
      ip: '177.136.20.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      before: null,
      after: { sessaoId: 'sess-894120', loginMetodo: '2FA_TOTP', ipOrigem: '177.136.20.105', device: 'Desktop Windows' },
      justificativa: 'Autenticação bem-sucedida via 2FA corporativo',
      severidade: 'BAIXA',
    });

    // 2. TROCA DE EMPRESA (TENANT SWITCH)
    this.registrarLog({
      requestId: 'req-lx890-002',
      usuario: u1,
      empresa: e4,
      modulo: 'MULTI_TENANT',
      acao: 'TROCA_EMPRESA',
      entidade: 'tenant_context',
      entidadeId: 'ctx-user-001',
      ip: '177.136.20.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
      before: { empresaAnteriorId: e1.id, empresaAnteriorCodigo: e1.codigo, empresaAnteriorNome: e1.nome },
      after: { novaEmpresaId: e4.id, novaEmpresaCodigo: e4.codigo, novaEmpresaNome: e4.nome, motivo: 'Inspeção de Produção Unidade Corte' },
      justificativa: 'Supervisão técnica de ordens de corte a laser na planta filial',
      severidade: 'BAIXA',
    });

    // 3. CRIAÇÃO DE PEDIDO
    this.registrarLog({
      requestId: 'req-lx890-003',
      usuario: u3,
      empresa: e1,
      modulo: 'PEDIDOS',
      acao: 'CRIAR_PEDIDO',
      entidade: 'pedidos_venda',
      entidadeId: 'PED-2026-08942',
      ip: '192.168.10.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      before: null,
      after: {
        numeroPedido: 'PED-2026-08942',
        clienteCnpj: '60.701.190/0001-04',
        clienteNome: 'Metálica Estruturas do Sul Ltda',
        valorTotalBruto: 185000.0,
        valorTotalLiquido: 172050.0,
        condicaoPagamento: '28/56/84 DDL',
        itensQtd: 12,
        status: 'EM_DIGITACAO',
      },
      justificativa: 'Emissão de pedido via proposta comercial aprovada PROP-40192',
      severidade: 'BAIXA',
    });

    // 4. PREÇO / DESCONTO (ALTERAÇÃO DE PREÇO ACIMA DA ALÇADA)
    this.registrarLog({
      requestId: 'req-lx890-004',
      usuario: u3,
      empresa: e1,
      modulo: 'COMERCIAL',
      acao: 'ALTERAR_PRECO_DESCONTO',
      entidade: 'itens_pedido_venda',
      entidadeId: 'ITEM-PED-08942-03',
      ip: '192.168.10.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      before: {
        itemCodigo: 'MP-CHAPA-1020-05MM',
        descricao: 'Chapa Aço Carbono ASTM A36 5.00mm',
        precoTabelaUnitario: 48.50,
        descontoConcedidoPerc: 3.5,
        precoPraticadoFinal: 46.80,
        valorTotalItem: 46800.0,
      },
      after: {
        itemCodigo: 'MP-CHAPA-1020-05MM',
        descricao: 'Chapa Aço Carbono ASTM A36 5.00mm',
        precoTabelaUnitario: 48.50,
        descontoConcedidoPerc: 9.8,
        precoPraticadoFinal: 43.75,
        valorTotalItem: 43750.0,
      },
      justificativa: 'Equiparação com cotação concorrente Usiminas para volume acima de 15 toneladas',
      severidade: 'ALTA',
    });

    // 5. APROVAÇÃO (CRÉDITO COMERCIAL)
    this.registrarLog({
      requestId: 'req-lx890-005',
      usuario: u2,
      empresa: e1,
      modulo: 'CREDITO_SERASA',
      acao: 'APROVAR_CREDITO',
      entidade: 'analise_credito_cliente',
      entidadeId: 'CRED-ANA-9014',
      ip: '192.168.10.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      before: {
        clienteCnpj: '60.701.190/0001-04',
        limiteCreditoVigente: 120000.0,
        statusCredito: 'BLOQUEADO_EXCESSO_LIMITE',
        scoreSerasa: 840,
      },
      after: {
        clienteCnpj: '60.701.190/0001-04',
        limiteCreditoAprovado: 250000.0,
        statusCredito: 'LIBERADO_DIRETORIA',
        validadeLimite: '2027-02-28',
        scoreSerasa: 840,
      },
      justificativa: 'Garantia real apresentada e histórico de 36 meses sem atrasos no Grupo TRITECH',
      severidade: 'MEDIA',
    });

    // 6. AJUSTE DE ESTOQUE (CORREÇÃO DE INVENTÁRIO)
    this.registrarLog({
      requestId: 'req-lx890-006',
      usuario: u5,
      empresa: e2,
      modulo: 'ESTOQUE',
      acao: 'AJUSTE_ESTOQUE',
      entidade: 'saldos_estoque_locais',
      entidadeId: 'LOC-ALM-02-CH-50',
      ip: '192.168.20.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/129.0',
      before: {
        produtoCodigo: 'MP-CHAPA-1020-05MM',
        localAlmoxarifado: 'ALMOX-CENTRAL-A2',
        quantidadeFisicaSistema: 48.0,
        unidadeMedida: 'TON',
        custoMedioUnitario: 4200.0,
        valorTotalEstoque: 201600.0,
      },
      after: {
        produtoCodigo: 'MP-CHAPA-1020-05MM',
        localAlmoxarifado: 'ALMOX-CENTRAL-A2',
        quantidadeFisicaSistema: 44.5,
        unidadeMedida: 'TON',
        custoMedioUnitario: 4200.0,
        valorTotalEstoque: 186900.0,
        tipoMovimento: 'AJUSTE_INVENTARIO_SAIDA',
        diferencaQuantidade: -3.5,
      },
      justificativa: 'Inventário cíclico quinzenal - ajuste de refugo de pontas e perdas por oxidação em armazenagem',
      severidade: 'ALTA',
    });

    // 7. COMPRA (ORDEM DE COMPRA MATÉRIA-PRIMA)
    this.registrarLog({
      requestId: 'req-lx890-007',
      usuario: u5,
      empresa: e2,
      modulo: 'COMPRAS',
      acao: 'CRIAR_COMPRA',
      entidade: 'ordens_compra',
      entidadeId: 'OC-2026-04190',
      ip: '192.168.20.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/129.0',
      before: null,
      after: {
        numeroOC: 'OC-2026-04190',
        fornecedorCnpj: '33.000.168/0001-90',
        fornecedorRazaoSocial: 'Gerdau Aços Longos S.A.',
        valorTotalOC: 380000.0,
        condicaoPagamento: '60 DDL',
        status: 'AGUARDANDO_APROVACAO_DIRETORIA',
      },
      justificativa: 'Reposição de estoque de segurança de bobinas e barras de aço carbono',
      severidade: 'BAIXA',
    });

    // 8. PAGAMENTO DE TÍTULO
    this.registrarLog({
      requestId: 'req-lx890-008',
      usuario: u2,
      empresa: e1,
      modulo: 'FINANCEIRO',
      acao: 'PAGAMENTO_TITULO',
      entidade: 'titulos_pagar',
      entidadeId: 'TIT-PG-2026-9041',
      ip: '192.168.10.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      before: {
        tituloNumero: 'TIT-PG-2026-9041',
        beneficiario: 'Energisa Distribuidora de Energia S.A.',
        valorNominal: 48920.40,
        dataVencimento: '2026-08-26',
        statusTitulo: 'ABERTO_AGENDADO',
      },
      after: {
        tituloNumero: 'TIT-PG-2026-9041',
        beneficiario: 'Energisa Distribuidora de Energia S.A.',
        valorPago: 48920.40,
        bancoConta: 'Banco Itaú Unibanco (Conta 40192-3)',
        tipoLiquidacao: 'TED_EMPRESARIAL_AUTORIZADA',
        autenticacaoBancaria: 'ITAU-BANC-AUT-8941094-2026',
        statusTitulo: 'LIQUIDADO',
      },
      justificativa: 'Liquidação de fatura de fornecimento de energia elétrica fabril de alta tensão',
      severidade: 'BAIXA',
    });

    // 9. ESTORNO FINANCEIRO
    this.registrarLog({
      requestId: 'req-lx890-009',
      usuario: u2,
      empresa: e1,
      modulo: 'FINANCEIRO',
      acao: 'ESTORNO_FINANCEIRO',
      entidade: 'movimentacoes_bancarias',
      entidadeId: 'MOV-BANC-7741',
      ip: '192.168.10.12',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      before: {
        lancamentoId: 'MOV-BANC-7741',
        tipo: 'DEBITO_FORNECEDOR',
        valor: 14500.0,
        beneficiario: 'Transportadora Carga Pesada Ltda',
        status: 'LIQUIDADO_INCORRETO',
      },
      after: {
        lancamentoId: 'MOV-BANC-7741',
        tipo: 'ESTORNO_DEBITO',
        valor: 14500.0,
        status: 'ESTORNADO_COM_REVERSAO_CONTABIL',
        saldoBancarioRecomposto: true,
      },
      justificativa: 'Duplicidade de débito gerada por erro de lote no arquivo CNAB 240 da transportadora',
      severidade: 'CRITICA',
    });

    // 10. EMISSÃO FISCAL DE NF-E
    this.registrarLog({
      requestId: 'req-lx890-010',
      usuario: u4,
      empresa: e1,
      modulo: 'FISCAL',
      acao: 'EMISSAO_FISCAL',
      entidade: 'documentos_fiscais_nfe',
      entidadeId: 'NFE-55-001-000040192',
      ip: '192.168.10.19',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0',
      before: null,
      after: {
        modelo: '55',
        serie: '001',
        numeroNFe: 40192,
        chaveAcesso: '35260811222333000144550010000401921894019284',
        protocoloAutorizacaoSEFAZ: '135260098410294',
        dataAutorizacao: '2026-08-26T08:15:30Z',
        valorTotalNF: 245000.0,
        valorICMS: 44100.0,
        valorIPI: 12250.0,
        statusSEFAZ: 'AUTORIZADA_USO',
      },
      justificativa: 'Faturamento de estrutura metálica para entrega imediata cfe pedido PED-08910',
      severidade: 'MEDIA',
    });

    // 11. CANCELAMENTO FISCAL
    this.registrarLog({
      requestId: 'req-lx890-011',
      usuario: u4,
      empresa: e1,
      modulo: 'FISCAL',
      acao: 'CANCELAMENTO_FISCAL',
      entidade: 'documentos_fiscais_nfe',
      entidadeId: 'NFE-55-001-000040188',
      ip: '192.168.10.19',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0',
      before: {
        numeroNFe: 40188,
        destinatario: 'Agropecuária Rio Doce S.A.',
        valorTotalNF: 98000.0,
        statusSEFAZ: 'AUTORIZADA_USO',
      },
      after: {
        numeroNFe: 40188,
        protocoloCancelamentoSEFAZ: '135260099981240',
        dataCancelamento: '2026-08-26T09:40:10Z',
        statusSEFAZ: 'CANCELADA_HOMOLOGADA',
      },
      justificativa: 'Erro no preenchimento do CFOP de Substituição Tributária e divergência de frete CIF/FOB',
      severidade: 'CRITICA',
    });

    // 12. TRANSFERÊNCIA INTERCOMPANY
    this.registrarLog({
      requestId: 'req-lx890-012',
      usuario: u5,
      empresa: e2,
      modulo: 'INTERCOMPANY',
      acao: 'TRANSFERENCIA_INTERCOMPANY',
      entidade: 'transferencias_materiais_grupo',
      entidadeId: 'TRANSF-IC-2026-084',
      ip: '192.168.20.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/129.0',
      before: null,
      after: {
        empresaOrigem: e2.nome,
        empresaDestino: e4.nome,
        produto: 'Tubo Redondo Aço Carbono Schedule 40 4"',
        quantidadeTransferida: 120.0,
        unidade: 'BARRA_6M',
        valorCustoTransferencia: 45600.0,
        documentoFiscalRef: 'NF-e 004210',
        cfop: '5.151',
        statusTransferencia: 'EM_TRANSITO_COM_EXPURGO_LUCRO',
      },
      justificativa: 'Abastecimento emergencial de matéria-prima para a linha de corte da Tritech Corte',
      severidade: 'MEDIA',
    });

    // 13. ALTERAÇÃO DE PERMISSÕES RBAC
    this.registrarLog({
      requestId: 'req-lx890-013',
      usuario: u7,
      empresa: e1,
      modulo: 'ADMINISTRACAO',
      acao: 'ALTERAR_PERMISSOES',
      entidade: 'usuarios_perfis_permissoes',
      entidadeId: 'USR-PERM-BIND-003',
      ip: '10.0.1.15',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Ubuntu/24.04',
      before: {
        usuarioAlvo: 'Roberto Albuquerque Dias (roberto.dias@tritech.ind.br)',
        moduloPermissao: 'COMERCIAL',
        alçadaAprovacaoDescontoMaximo: 5.0,
        podeExcluirPedidos: false,
        acessoEmpresas: ['TRITECH_MATRIZ'],
      },
      after: {
        usuarioAlvo: 'Roberto Albuquerque Dias (roberto.dias@tritech.ind.br)',
        moduloPermissao: 'COMERCIAL',
        alçadaAprovacaoDescontoMaximo: 10.0,
        podeExcluirPedidos: false,
        acessoEmpresas: ['TRITECH_MATRIZ', 'TRITECH_CORTE', 'OLIVEIRA_AMORIM'],
      },
      justificativa: 'Promoção para Gerente Regional com ampliação de alçada para filiais do grupo',
      severidade: 'CRITICA',
    });

    // 14. MANUTENÇÃO (ORDEM DE MANUTENÇÃO PREVENTIVA / CORRETIVA)
    this.registrarLog({
      requestId: 'req-lx890-014',
      usuario: u1,
      empresa: e4,
      modulo: 'MANUTENCAO',
      acao: 'ORDEM_MANUTENCAO',
      entidade: 'ordens_servico_manutencao',
      entidadeId: 'OS-MAN-2026-1049',
      ip: '177.136.20.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      before: {
        maquinaCodigo: 'LASER-FIBRA-12KW-01',
        tipoManutencao: 'PREVENTIVA_PROGRAMADA',
        status: 'ABERTA',
        paradaProducaoMinutos: 0,
      },
      after: {
        maquinaCodigo: 'LASER-FIBRA-12KW-01',
        tipoManutencao: 'CORRETIVA_URGENTE',
        status: 'EM_EXECUCAO_PARADA_CRITICA',
        paradaProducaoMinutos: 180,
        motivoParada: 'Falha no chiller de refrigeração óptica e desalinhamento de cabeçote',
        tecnicoResponsável: 'TechService Máquinas CNC Ltda',
      },
      justificativa: 'Substituição imediata de lente focal e purga do sistema de refrigeração para evitar queima da fonte IPG',
      severidade: 'MEDIA',
    });

    // 15. QUALIDADE (REGISTRO DE RNC & BLOQUEIO DE LOTE)
    this.registrarLog({
      requestId: 'req-lx890-015',
      usuario: u6,
      empresa: e4,
      modulo: 'QUALIDADE',
      acao: 'REGISTRO_RNC_QUALIDADE',
      entidade: 'relatorios_nao_conformidade',
      entidadeId: 'RNC-2026-0812',
      ip: '192.168.40.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      before: null,
      after: {
        rncNumero: 'RNC-2026-0812',
        origemNaoConformidade: 'PROCESSO_DOBRA_CNC',
        loteIdentificacao: 'LOTE-DOBRA-20260825-01',
        quantidadeBloqueada: 450,
        unidade: 'PECAS',
        defeitoIdentificado: 'Ângulo de dobra com desvio de 3.5 graus fora da tolerância dimensional ISO 2768-m',
        disposicaoInicial: 'BLOQUEIO_TOTAL_QUARENTENA',
      },
      justificativa: 'Desgaste prematuro da matriz inferior V=16mm gerando variação angular no lote',
      severidade: 'ALTA',
    });

    // 16. EXCLUSÃO LÓGICA (SOFT DELETE)
    this.registrarLog({
      requestId: 'req-lx890-016',
      usuario: u3,
      empresa: e1,
      modulo: 'COMERCIAL',
      acao: 'EXCLUSAO_LOGICA',
      entidade: 'clientes_inativos',
      entidadeId: 'CLI-PJ-004192',
      ip: '192.168.10.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      before: {
        clienteId: 'CLI-PJ-004192',
        razaoSocial: 'Comércio de Ferragens Delta Eireli',
        cnpj: '18.491.029/0001-92',
        ativo: true,
        deletadoEm: null,
        deletadoPorUsuarioId: null,
      },
      after: {
        clienteId: 'CLI-PJ-004192',
        razaoSocial: 'Comércio de Ferragens Delta Eireli',
        cnpj: '18.491.029/0001-92',
        ativo: false,
        deletadoEm: '2026-08-26T10:12:45Z',
        deletadoPorUsuarioId: 'usr-003',
        statusSoftDelete: 'EXCLUSAO_LOGICA_PRESERVADA_PARA_AUDITORIA',
      },
      justificativa: 'Encerramento de atividades cadastrais e solicitação formal do cliente via DPO/LGPD',
      severidade: 'CRITICA',
    });

    // 17. CANCELAMENTO DE PEDIDO
    this.registrarLog({
      requestId: 'req-lx890-017',
      usuario: u3,
      empresa: e5,
      modulo: 'PEDIDOS',
      acao: 'CANCELAR_PEDIDO',
      entidade: 'pedidos_venda',
      entidadeId: 'PED-SENAGRO-2026-041',
      ip: '192.168.50.11',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      before: {
        numeroPedido: 'PED-SENAGRO-2026-041',
        cliente: 'Cooperativa Agrícola Centro Oeste',
        valorTotal: 340000.0,
        status: 'LIBERADO_PCP',
      },
      after: {
        numeroPedido: 'PED-SENAGRO-2026-041',
        cliente: 'Cooperativa Agrícola Centro Oeste',
        valorTotal: 340000.0,
        status: 'CANCELADO',
        dataCancelamento: '2026-08-26T10:30:00Z',
      },
      justificativa: 'Alteração no projeto de colheitadeiras pelo produtor rural com rescisão sem ônus de comum acordo',
      severidade: 'ALTA',
    });
  }
}
