import { UsuarioRecord, UsuarioEmpresaBinding } from './types';
import { companyService } from './company-service';
import { profileService } from './profile-service';
import { NotFoundError, ConflictError, ValidationError } from '../../core/errors';
import { randomUUID } from 'crypto';

const INITIAL_USERS: UsuarioRecord[] = [
  {
    id: 'u1111111-1111-1111-1111-111111111111',
    nome: 'Administrador Geral do Grupo',
    email: 'superadmin@industrialgroup.com.br',
    cpf: '111.222.333-44',
    cargo: 'CTO / Diretor de Operações',
    isSuperAdmin: true,
    ativo: true,
    empresasVinculadas: [
      { empresaId: '11111111-1111-1111-1111-111111111111', perfilId: 'a1111111-1111-1111-1111-111111111111', padrao: true, ativo: true },
      { empresaId: '22222222-2222-2222-2222-222222222222', perfilId: 'a1111111-1111-1111-1111-111111111111', padrao: false, ativo: true },
      { empresaId: '33333333-3333-3333-3333-333333333333', perfilId: 'a1111111-1111-1111-1111-111111111111', padrao: false, ativo: true },
      { empresaId: '44444444-4444-4444-4444-444444444444', perfilId: 'a1111111-1111-1111-1111-111111111111', padrao: false, ativo: true },
      { empresaId: '55555555-5555-5555-5555-555555555555', perfilId: 'a1111111-1111-1111-1111-111111111111', padrao: false, ativo: true },
    ],
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u2222222-2222-2222-2222-222222222222',
    nome: 'Carlos Eduardo Mendonça',
    email: 'carlos.financeiro@mwam.com.br',
    cpf: '222.333.444-55',
    cargo: 'Diretor Financeiro',
    isSuperAdmin: false,
    ativo: true,
    empresasVinculadas: [
      { empresaId: '11111111-1111-1111-1111-111111111111', perfilId: 'a2222222-2222-2222-2222-222222222222', padrao: true, ativo: true },
      { empresaId: '22222222-2222-2222-2222-222222222222', perfilId: 'a2222222-2222-2222-2222-222222222222', padrao: false, ativo: true },
    ],
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u3333333-3333-3333-3333-333333333333',
    nome: 'Mariana Rocha Tritech',
    email: 'mariana.tritech@tritech.com.br',
    cpf: '333.444.555-66',
    cargo: 'Gerente Geral de Unidades Tritech',
    isSuperAdmin: false,
    ativo: true,
    empresasVinculadas: [
      { empresaId: '44444444-4444-4444-4444-444444444444', perfilId: 'a3333333-3333-3333-3333-333333333333', padrao: true, ativo: true },
      { empresaId: '55555555-5555-5555-5555-555555555555', perfilId: 'a3333333-3333-3333-3333-333333333333', padrao: false, ativo: true },
    ],
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u4444444-4444-4444-4444-444444444444',
    nome: 'José Roberto Senagro',
    email: 'jose.senagro@senagro.ind.br',
    cpf: '444.555.666-77',
    cargo: 'Supervisor de Produção',
    isSuperAdmin: false,
    ativo: true,
    empresasVinculadas: [
      { empresaId: '33333333-3333-3333-3333-333333333333', perfilId: 'a5555555-5555-5555-5555-555555555555', padrao: true, ativo: true },
    ],
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u5555555-5555-5555-5555-555555555555',
    nome: 'Ana Paula Fiscal',
    email: 'ana.fiscal@industrialgroup.com.br',
    cpf: '555.666.777-88',
    cargo: 'Auditora Fiscal Corporativa',
    isSuperAdmin: false,
    ativo: true,
    empresasVinculadas: [
      { empresaId: '11111111-1111-1111-1111-111111111111', perfilId: 'a4444444-4444-4444-4444-444444444444', padrao: true, ativo: true },
      { empresaId: '22222222-2222-2222-2222-222222222222', perfilId: 'a4444444-4444-4444-4444-444444444444', padrao: false, ativo: true },
      { empresaId: '33333333-3333-3333-3333-333333333333', perfilId: 'a4444444-4444-4444-4444-444444444444', padrao: false, ativo: true },
      { empresaId: '44444444-4444-4444-4444-444444444444', perfilId: 'a4444444-4444-4444-4444-444444444444', padrao: false, ativo: true },
      { empresaId: '55555555-5555-5555-5555-555555555555', perfilId: 'a4444444-4444-4444-4444-444444444444', padrao: false, ativo: true },
    ],
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
];

export interface CreateUserInput {
  nome: string;
  email: string;
  cpf?: string;
  cargo?: string;
  isSuperAdmin?: boolean;
  empresasVinculadas: Array<{
    empresaId: string;
    perfilId: string;
    padrao?: boolean;
  }>;
}

export interface UpdateUserInput {
  nome?: string;
  email?: string;
  cpf?: string;
  cargo?: string;
  isSuperAdmin?: boolean;
  ativo?: boolean;
  empresasVinculadas?: Array<{
    empresaId: string;
    perfilId: string;
    padrao?: boolean;
    ativo?: boolean;
  }>;
}

class UserService {
  private users: Map<string, UsuarioRecord> = new Map();

  constructor() {
    this.resetToInitialSeed();
  }

  public resetToInitialSeed(): void {
    this.users.clear();
    for (const u of INITIAL_USERS) {
      this.users.set(u.id, {
        ...u,
        empresasVinculadas: u.empresasVinculadas.map((b) => ({ ...b })),
      });
    }
  }

  private enrichUserBindings(user: UsuarioRecord): UsuarioRecord {
    const enrichedBindings: UsuarioEmpresaBinding[] = user.empresasVinculadas.map((binding) => {
      let empresaNome = 'Empresa Desconhecida';
      let empresaCnpj = '';
      try {
        const comp = companyService.getCompanyById(binding.empresaId);
        empresaNome = comp.nomeFantasia;
        empresaCnpj = comp.cnpj;
      } catch {
        // Ignora se não encontrada
      }

      let perfilNome = 'Perfil Padrão';
      try {
        const perf = profileService.getPerfilById(binding.perfilId);
        perfilNome = perf.nome;
      } catch {
        // Ignora
      }

      return {
        ...binding,
        empresaNomeFantasia: empresaNome,
        empresaCnpj,
        perfilNome,
      };
    });

    return {
      ...user,
      empresasVinculadas: enrichedBindings,
    };
  }

  public listUsers(filters?: {
    empresaId?: string;
    search?: string;
    ativo?: boolean;
  }): UsuarioRecord[] {
    let result = Array.from(this.users.values());

    if (filters?.ativo !== undefined) {
      result = result.filter((u) => u.ativo === filters.ativo);
    }

    if (filters?.empresaId) {
      result = result.filter((u) =>
        u.isSuperAdmin || u.empresasVinculadas.some((b) => b.empresaId === filters.empresaId && b.ativo)
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.cargo && u.cargo.toLowerCase().includes(q))
      );
    }

    return result.map((u) => this.enrichUserBindings(u));
  }

  public getUserById(id: string): UsuarioRecord {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundError(`Usuário com ID '${id}' não encontrado.`);
    }
    return this.enrichUserBindings(user);
  }

  public getUserByEmail(email: string): UsuarioRecord | null {
    const norm = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === norm) {
        return this.enrichUserBindings(u);
      }
    }
    return null;
  }

  public createUser(input: CreateUserInput): UsuarioRecord {
    if (!input.nome || !input.email) {
      throw new ValidationError('Nome e e-mail são obrigatórios para cadastro de usuário.');
    }

    const emailClean = input.email.toLowerCase().trim();
    if (this.getUserByEmail(emailClean)) {
      throw new ConflictError(`Já existe um usuário cadastrado com o e-mail '${emailClean}'.`);
    }

    // Validar vínculos de empresas
    const bindings: UsuarioEmpresaBinding[] = [];
    if (input.empresasVinculadas && input.empresasVinculadas.length > 0) {
      const seenEmpresas = new Set<string>();
      let hasDefault = false;

      for (const item of input.empresasVinculadas) {
        if (seenEmpresas.has(item.empresaId)) {
          continue; // Evita duplicidade de vínculo com a mesma empresa
        }
        seenEmpresas.add(item.empresaId);

        // Valida se empresa existe
        companyService.getCompanyById(item.empresaId);
        // Valida se perfil existe
        profileService.getPerfilById(item.perfilId);

        const isPadrao = Boolean(item.padrao && !hasDefault);
        if (isPadrao) hasDefault = true;

        bindings.push({
          empresaId: item.empresaId,
          perfilId: item.perfilId,
          padrao: isPadrao,
          ativo: true,
        });
      }

      // Se nenhum foi marcado como padrão, marca o primeiro
      if (!hasDefault && bindings.length > 0) {
        bindings[0].padrao = true;
      }
    }

    const now = new Date().toISOString();
    const newUser: UsuarioRecord = {
      id: randomUUID(),
      nome: input.nome.trim(),
      email: emailClean,
      cpf: input.cpf?.trim(),
      cargo: input.cargo?.trim(),
      isSuperAdmin: Boolean(input.isSuperAdmin),
      ativo: true,
      empresasVinculadas: bindings,
      criadoEm: now,
      atualizadoEm: now,
    };

    this.users.set(newUser.id, newUser);
    return this.enrichUserBindings(newUser);
  }

  public updateUser(id: string, input: UpdateUserInput): UsuarioRecord {
    const user = this.getUserById(id);

    if (input.email) {
      const emailClean = input.email.toLowerCase().trim();
      const existing = this.getUserByEmail(emailClean);
      if (existing && existing.id !== id) {
        throw new ConflictError(`O e-mail '${emailClean}' já está sendo utilizado por outro usuário.`);
      }
      user.email = emailClean;
    }

    if (input.nome) user.nome = input.nome.trim();
    if (input.cpf !== undefined) user.cpf = input.cpf?.trim();
    if (input.cargo !== undefined) user.cargo = input.cargo?.trim();
    if (input.isSuperAdmin !== undefined) user.isSuperAdmin = input.isSuperAdmin;
    if (input.ativo !== undefined) user.ativo = input.ativo;

    if (input.empresasVinculadas) {
      const bindings: UsuarioEmpresaBinding[] = [];
      const seen = new Set<string>();
      for (const item of input.empresasVinculadas) {
        if (seen.has(item.empresaId)) continue;
        seen.add(item.empresaId);

        companyService.getCompanyById(item.empresaId);
        profileService.getPerfilById(item.perfilId);

        bindings.push({
          empresaId: item.empresaId,
          perfilId: item.perfilId,
          padrao: Boolean(item.padrao),
          ativo: item.ativo !== undefined ? item.ativo : true,
        });
      }
      user.empresasVinculadas = bindings;
    }

    user.atualizadoEm = new Date().toISOString();
    this.users.set(id, user);
    return this.enrichUserBindings(user);
  }

  public toggleUserStatus(id: string): UsuarioRecord {
    const user = this.getUserById(id);
    user.ativo = !user.ativo;
    user.atualizadoEm = new Date().toISOString();
    this.users.set(id, user);
    return this.enrichUserBindings(user);
  }

  public isUserAuthorizedForCompany(userId: string, empresaId: string): boolean {
    try {
      const user = this.getUserById(userId);
      if (!user.ativo) return false;
      if (user.isSuperAdmin) return true;

      return user.empresasVinculadas.some((b) => b.empresaId === empresaId && b.ativo);
    } catch {
      return false;
    }
  }
}

export const userService = new UserService();
