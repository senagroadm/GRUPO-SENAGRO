import { EmpresaRecord, RegimeTributario } from './types';
import { cleanCnpj, formatCnpj, isValidCnpj } from './cnpj-validator';
import { ValidationError, ConflictError, NotFoundError } from '../../core/errors';
import { randomUUID } from 'crypto';

// Initial 5 Group Companies seed
const INITIAL_COMPANIES: EmpresaRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    codigo: 'MWAM',
    razaoSocial: 'MWAM Engenharia e Serviços Industrial Ltda',
    nomeFantasia: 'MWAM Engenharia',
    cnpj: '44.566.045/0001-01',
    inscricaoEstadual: '001829102.00-33',
    inscricaoMunicipal: '8839201',
    regimeTributario: 'LUCRO_PRESUMIDO',
    ramoAtividade: 'Engenharia e Serviços Industriais de Montagem e Manutenção',
    isMatriz: true,
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    codigo: 'OLIVEIRA_AMORIM',
    razaoSocial: 'Oliveira e Amorim Distribuição Ltda',
    nomeFantasia: 'Oliveira & Amorim Distribuição',
    cnpj: '26.200.037/0001-57',
    inscricaoEstadual: '003291823.00-12',
    inscricaoMunicipal: '9928102',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Comércio Atacadista e Distribuição de Aço e Insumos Industriais',
    isMatriz: false,
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    codigo: 'SENAGRO',
    razaoSocial: 'Senagro Indústria e Comércio Ltda',
    nomeFantasia: 'Senagro Indústria',
    cnpj: '23.280.366/0001-67',
    inscricaoEstadual: '002981921.00-45',
    inscricaoMunicipal: '7748291',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Indústria e Comércio de Máquinas e Equipamentos Agrícolas',
    isMatriz: false,
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    codigo: 'TRITECH_CORTE',
    razaoSocial: 'Tritech Corte Dobra e Fabricação Ltda',
    nomeFantasia: 'Tritech Corte & Dobra',
    cnpj: '48.082.502/0001-35',
    inscricaoEstadual: '004128912.00-88',
    inscricaoMunicipal: '6639201',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Serviços Especializados de Corte a Laser/Plasma, Dobra CNC e Caldeiraria Leve',
    isMatriz: false,
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    codigo: 'TRITECH_IND',
    razaoSocial: 'Tritech Industrial Ltda',
    nomeFantasia: 'Tritech Industrial',
    cnpj: '64.036.495/0001-91',
    inscricaoEstadual: '001928374.00-99',
    inscricaoMunicipal: '5549201',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Indústria e Fabricação de Estruturas Pesadas e Máquinas Industriais',
    isMatriz: false,
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
];

export interface CreateCompanyInput {
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributario: RegimeTributario;
  ramoAtividade: string;
  isMatriz?: boolean;
}

export interface UpdateCompanyInput {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributario?: RegimeTributario;
  ramoAtividade?: string;
  isMatriz?: boolean;
  ativo?: boolean;
}

class CompanyService {
  private companies: Map<string, EmpresaRecord> = new Map();

  constructor() {
    this.resetToInitialSeed();
  }

  public resetToInitialSeed(): void {
    this.companies.clear();
    for (const comp of INITIAL_COMPANIES) {
      this.companies.set(comp.id, { ...comp });
    }
  }

  public listCompanies(filters?: {
    ativo?: boolean;
    search?: string;
    regime?: string;
  }): EmpresaRecord[] {
    let result = Array.from(this.companies.values());

    if (filters?.ativo !== undefined) {
      result = result.filter((c) => c.ativo === filters.ativo);
    }

    if (filters?.regime) {
      result = result.filter((c) => c.regimeTributario === filters.regime);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nomeFantasia.toLowerCase().includes(q) ||
          c.razaoSocial.toLowerCase().includes(q) ||
          c.codigo.toLowerCase().includes(q) ||
          cleanCnpj(c.cnpj).includes(cleanCnpj(q))
      );
    }

    return result.sort((a, b) => {
      if (a.isMatriz && !b.isMatriz) return -1;
      if (!a.isMatriz && b.isMatriz) return 1;
      return a.nomeFantasia.localeCompare(b.nomeFantasia);
    });
  }

  public getCompanyById(id: string): EmpresaRecord {
    const comp = this.companies.get(id);
    if (!comp) {
      throw new NotFoundError(`Empresa com ID '${id}' não encontrada.`);
    }
    return { ...comp };
  }

  public getCompanyByCnpj(cnpj: string): EmpresaRecord | null {
    const cleaned = cleanCnpj(cnpj);
    for (const comp of this.companies.values()) {
      if (cleanCnpj(comp.cnpj) === cleaned) {
        return { ...comp };
      }
    }
    return null;
  }

  public getCompanyByCode(codigo: string): EmpresaRecord | null {
    const norm = codigo.toUpperCase().trim();
    for (const comp of this.companies.values()) {
      if (comp.codigo.toUpperCase() === norm) {
        return { ...comp };
      }
    }
    return null;
  }

  public createCompany(input: CreateCompanyInput): EmpresaRecord {
    // 1. Validar preenchimento obrigatório
    if (!input.codigo || !input.razaoSocial || !input.nomeFantasia || !input.cnpj || !input.ramoAtividade || !input.regimeTributario) {
      throw new ValidationError('Todos os campos obrigatórios da empresa devem ser fornecidos.');
    }

    // 2. Validação estrita de CNPJ com Modulo 11
    if (!isValidCnpj(input.cnpj)) {
      throw new ValidationError(`CNPJ '${input.cnpj}' é inválido. Verifique os dígitos verificadores.`);
    }

    const formattedCnpj = formatCnpj(input.cnpj);

    // 3. Regra 1: CNPJ Único
    const existingCnpj = this.getCompanyByCnpj(formattedCnpj);
    if (existingCnpj) {
      throw new ConflictError(`Já existe uma empresa cadastrada com o CNPJ '${formattedCnpj}' (${existingCnpj.nomeFantasia}).`);
    }

    // 4. Código da empresa único
    const cleanCode = input.codigo.toUpperCase().replace(/\s+/g, '_').trim();
    const existingCode = this.getCompanyByCode(cleanCode);
    if (existingCode) {
      throw new ConflictError(`Já existe uma empresa com o código '${cleanCode}'.`);
    }

    const now = new Date().toISOString();
    const newCompany: EmpresaRecord = {
      id: randomUUID(),
      codigo: cleanCode,
      razaoSocial: input.razaoSocial.trim(),
      nomeFantasia: input.nomeFantasia.trim(),
      cnpj: formattedCnpj,
      inscricaoEstadual: input.inscricaoEstadual?.trim(),
      inscricaoMunicipal: input.inscricaoMunicipal?.trim(),
      regimeTributario: input.regimeTributario,
      ramoAtividade: input.ramoAtividade.trim(),
      isMatriz: Boolean(input.isMatriz),
      ativo: true,
      criadoEm: now,
      atualizadoEm: now,
    };

    // Se a nova empresa for matriz, assegura que apenas ela seja matriz
    if (newCompany.isMatriz) {
      for (const comp of this.companies.values()) {
        if (comp.isMatriz) {
          comp.isMatriz = false;
          comp.atualizadoEm = now;
        }
      }
    }

    this.companies.set(newCompany.id, newCompany);
    return { ...newCompany };
  }

  public updateCompany(id: string, input: UpdateCompanyInput): EmpresaRecord {
    const company = this.getCompanyById(id);

    if (input.cnpj) {
      if (!isValidCnpj(input.cnpj)) {
        throw new ValidationError(`CNPJ '${input.cnpj}' é inválido.`);
      }
      const formattedCnpj = formatCnpj(input.cnpj);
      const existing = this.getCompanyByCnpj(formattedCnpj);
      if (existing && existing.id !== id) {
        throw new ConflictError(`O CNPJ '${formattedCnpj}' já pertence à empresa ${existing.nomeFantasia}.`);
      }
      company.cnpj = formattedCnpj;
    }

    if (input.razaoSocial) company.razaoSocial = input.razaoSocial.trim();
    if (input.nomeFantasia) company.nomeFantasia = input.nomeFantasia.trim();
    if (input.inscricaoEstadual !== undefined) company.inscricaoEstadual = input.inscricaoEstadual?.trim();
    if (input.inscricaoMunicipal !== undefined) company.inscricaoMunicipal = input.inscricaoMunicipal?.trim();
    if (input.regimeTributario) company.regimeTributario = input.regimeTributario;
    if (input.ramoAtividade) company.ramoAtividade = input.ramoAtividade.trim();
    if (input.ativo !== undefined) company.ativo = input.ativo;

    if (input.isMatriz !== undefined && input.isMatriz) {
      for (const c of this.companies.values()) {
        if (c.id !== id && c.isMatriz) {
          c.isMatriz = false;
        }
      }
      company.isMatriz = true;
    }

    company.atualizadoEm = new Date().toISOString();
    this.companies.set(id, company);
    return { ...company };
  }

  public toggleCompanyStatus(id: string): EmpresaRecord {
    const company = this.getCompanyById(id);
    company.ativo = !company.ativo;
    company.atualizadoEm = new Date().toISOString();
    this.companies.set(id, company);
    return { ...company };
  }
}

export const companyService = new CompanyService();
