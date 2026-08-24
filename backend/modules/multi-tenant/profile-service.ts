import { PerfilRecord, PermissaoRecord } from './types';
import { NotFoundError, ConflictError } from '../../core/errors';
import { randomUUID } from 'crypto';

const INITIAL_PERFIS: PerfilRecord[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    codigo: 'SUPERADMIN_GRUPO',
    nome: 'Superadministrador do Grupo',
    descricao: 'Acesso irrestrito a todas as empresas, configurações e auditorias do grupo industrial',
    nivelAcesso: 'GRUPO',
    ativo: true,
    permissoesIds: ['ALL'],
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    codigo: 'DIRETOR_FINANCEIRO',
    nome: 'Diretor Financeiro & Controladoria',
    descricao: 'Gestão completa de financeiro, crédito, faturamento e relatórios gerenciais consolidados',
    nivelAcesso: 'GRUPO',
    ativo: true,
    permissoesIds: ['FINANCEIRO_ADMIN', 'COMERCIAL_READ', 'FISCAL_READ'],
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    codigo: 'GERENTE_OPERACIONAL',
    nome: 'Gerente Operacional / Industrial',
    descricao: 'Gestão de produção, corte, dobra, manutenção, estoque e compras na empresa atribuída',
    nivelAcesso: 'EMPRESA',
    ativo: true,
    permissoesIds: ['PRODUCAO_ADMIN', 'ESTOQUE_ADMIN', 'CORTE_DOBRA_OP'],
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    codigo: 'RESPONSAVEL_FISCAL',
    nome: 'Responsável Fiscal & Contábil',
    descricao: 'Emissão de notas fiscais (NF-e/NFS-e), apuração de tributos e relatórios de conformidade',
    nivelAcesso: 'EMPRESA',
    ativo: true,
    permissoesIds: ['FISCAL_ADMIN', 'FISCAL_READ'],
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    codigo: 'OPERADOR_INDUSTRIAL',
    nome: 'Operador Industrial / Chão de Fábrica',
    descricao: 'Apontamento de ordens de produção, corte, dobra e conferência física de estoque',
    nivelAcesso: 'OPERACIONAL',
    ativo: true,
    permissoesIds: ['PRODUCAO_UPDATE', 'CORTE_DOBRA_OP'],
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    codigo: 'CONSULTOR_LEITURA',
    nome: 'Auditor / Visualizador de Consulta',
    descricao: 'Permissão exclusiva de leitura de relatórios e painéis operacionais',
    nivelAcesso: 'EMPRESA',
    ativo: true,
    permissoesIds: ['COMERCIAL_READ', 'ESTOQUE_READ', 'FISCAL_READ', 'FINANCEIRO_READ'],
    criadoEm: '2026-01-01T00:00:00.000Z',
  },
];

const INITIAL_PERMISSOES: PermissaoRecord[] = [
  { id: 'p1', codigo: 'ADMIN_FULL', modulo: 'ADMINISTRACAO', acao: 'ADMIN', descricao: 'Administração geral do sistema e tenants', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p2', codigo: 'ADMIN_READ', modulo: 'ADMINISTRACAO', acao: 'READ', descricao: 'Consulta de parâmetros administrativos', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p3', codigo: 'COMERCIAL_ADMIN', modulo: 'COMERCIAL', acao: 'ADMIN', descricao: 'Gestão total de vendas e propostas', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p4', codigo: 'COMERCIAL_READ', modulo: 'COMERCIAL', acao: 'READ', descricao: 'Consulta de propostas comerciais', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p5', codigo: 'PRODUCAO_ADMIN', modulo: 'PRODUCAO', acao: 'ADMIN', descricao: 'Controle de PCP e ordens de fabricação', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p6', codigo: 'PRODUCAO_UPDATE', modulo: 'PRODUCAO', acao: 'UPDATE', descricao: 'Apontamento de chão de fábrica', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p7', codigo: 'CORTE_DOBRA_OP', modulo: 'CORTE', acao: 'UPDATE', descricao: 'Execução de planos de corte e dobra CNC', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p8', codigo: 'ESTOQUE_ADMIN', modulo: 'ESTOQUE', acao: 'ADMIN', descricao: 'Gestão de almoxarifado e rastreabilidade', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p9', codigo: 'ESTOQUE_READ', modulo: 'ESTOQUE', acao: 'READ', descricao: 'Consulta de inventário e matérias-primas', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p10', codigo: 'FISCAL_ADMIN', modulo: 'FISCAL', acao: 'ADMIN', descricao: 'Emissão e cancelamento de NF-e / NFS-e', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p11', codigo: 'FISCAL_READ', modulo: 'FISCAL', acao: 'READ', descricao: 'Consulta de documentos fiscais', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p12', codigo: 'FINANCEIRO_ADMIN', modulo: 'FINANCEIRO', acao: 'ADMIN', descricao: 'Gestão de fluxo de caixa, DRE e pagamentos', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'p13', codigo: 'FINANCEIRO_READ', modulo: 'FINANCEIRO', acao: 'READ', descricao: 'Consulta de extratos e posições financeiras', criadoEm: '2026-01-01T00:00:00.000Z' },
];

class ProfileService {
  private perfis: Map<string, PerfilRecord> = new Map();
  private permissoes: Map<string, PermissaoRecord> = new Map();

  constructor() {
    this.resetToInitialSeed();
  }

  public resetToInitialSeed(): void {
    this.perfis.clear();
    this.permissoes.clear();

    for (const p of INITIAL_PERMISSOES) {
      this.permissoes.set(p.id, { ...p });
    }

    for (const perf of INITIAL_PERFIS) {
      this.perfis.set(perf.id, { ...perf });
    }
  }

  public listPerfis(): PerfilRecord[] {
    return Array.from(this.perfis.values());
  }

  public listPermissoes(): PermissaoRecord[] {
    return Array.from(this.permissoes.values());
  }

  public getPerfilById(id: string): PerfilRecord {
    const p = this.perfis.get(id);
    if (!p) {
      throw new NotFoundError(`Perfil com ID '${id}' não encontrado.`);
    }
    return { ...p };
  }

  public getPerfilByCodigo(codigo: string): PerfilRecord | null {
    for (const p of this.perfis.values()) {
      if (p.codigo === codigo) return { ...p };
    }
    return null;
  }

  public createPerfil(input: {
    codigo: string;
    nome: string;
    descricao?: string;
    nivelAcesso: 'GRUPO' | 'EMPRESA' | 'OPERACIONAL';
    permissoesIds?: string[];
  }): PerfilRecord {
    const cleanCode = input.codigo.toUpperCase().replace(/\s+/g, '_').trim();
    if (this.getPerfilByCodigo(cleanCode)) {
      throw new ConflictError(`Perfil com o código '${cleanCode}' já existe.`);
    }

    const newPerfil: PerfilRecord = {
      id: randomUUID(),
      codigo: cleanCode,
      nome: input.nome.trim(),
      descricao: input.descricao?.trim(),
      nivelAcesso: input.nivelAcesso,
      ativo: true,
      permissoesIds: input.permissoesIds || [],
      criadoEm: new Date().toISOString(),
    };

    this.perfis.set(newPerfil.id, newPerfil);
    return { ...newPerfil };
  }
}

export const profileService = new ProfileService();
