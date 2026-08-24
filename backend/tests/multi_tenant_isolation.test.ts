/**
 * Testes Unitários e de Integração: Isolamento e Núcleo Multiempresa
 * 
 * Regras Testadas:
 * 1. CNPJ Único e validação de dígitos Módulo 11
 * 2. Toda transação carrega empresa_id
 * 3. Validação estrita do empresa_id no backend
 * 4. Isolamento estrito: Usuário sem vínculo NÃO pode acessar empresa (falha esperada)
 * 5. Alternância autorizada de empresa para usuários do grupo
 * 6. Auditoria obrigatória de troca de contexto
 * 7. Cadastro dinâmico de novos CNPJs
 */

import { companyService } from '../modules/multi-tenant/company-service';
import { userService } from '../modules/multi-tenant/user-service';
import { tenantContextService } from '../modules/multi-tenant/tenant-context-service';
import { isValidCnpj, formatCnpj } from '../modules/multi-tenant/cnpj-validator';
import { ConflictError, ValidationError, TenantMismatchError } from '../core/errors';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export function runMultiTenantTestSuite(): { summary: { total: number; passed: number; failed: number }; results: TestResult[] } {
  const results: TestResult[] = [];

  function test(suite: string, name: string, fn: () => void) {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite,
        name,
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
      });
    } catch (err: any) {
      results.push({
        suite,
        name,
        passed: false,
        error: err?.message || String(err),
        durationMs: Number((performance.now() - start).toFixed(2)),
      });
    }
  }

  // Reseta estado antes dos testes
  companyService.resetToInitialSeed();
  userService.resetToInitialSeed();

  // SUITE 1: Validação e Unicidade de CNPJ
  test('CNPJ Validation', 'Deve validar algoritmo oficial Módulo 11 para CNPJs válidos', () => {
    // CNPJ MWAM
    if (!isValidCnpj('44.566.045/0001-01')) throw new Error('Falha ao validar CNPJ MWAM');
    // CNPJ Senagro
    if (!isValidCnpj('23.280.366/0001-67')) throw new Error('Falha ao validar CNPJ Senagro');
    // CNPJ Tritech
    if (!isValidCnpj('48.082.502/0001-35')) throw new Error('Falha ao validar CNPJ Tritech');
  });

  test('CNPJ Validation', 'Deve rejeitar CNPJs com dígitos verificadores inválidos ou repetidos', () => {
    if (isValidCnpj('00.000.000/0000-00')) throw new Error('Deveria ter rejeitado zeros');
    if (isValidCnpj('11.111.111/1111-11')) throw new Error('Deveria ter rejeitado uns');
    if (isValidCnpj('44.566.045/0001-99')) throw new Error('Deveria ter rejeitado dígito verificador adulterado');
  });

  test('CNPJ Uniqueness', 'Deve rejeitar cadastro de nova empresa com CNPJ duplicado (Regra 1)', () => {
    let threw = false;
    try {
      companyService.createCompany({
        codigo: 'NOVA_CLONE',
        razaoSocial: 'Empresa Clonada Ltda',
        nomeFantasia: 'Clone MWAM',
        cnpj: '44.566.045/0001-01', // Mesmo CNPJ da MWAM
        regimeTributario: 'LUCRO_REAL',
        ramoAtividade: 'Serviços',
      });
    } catch (err) {
      if (err instanceof ConflictError) {
        threw = true;
      } else {
        throw err;
      }
    }

    if (!threw) {
      throw new Error('O sistema permitiu cadastrar uma empresa com CNPJ duplicado');
    }
  });

  // SUITE 2: Isolamento Multiempresa (Acesso Não Autorizado DEVE Falhar)
  test('Tenant Isolation', 'Usuário José Senagro NÃO pode acessar empresa MWAM (Deve falhar com TenantMismatchError)', () => {
    const joseUserId = 'u4444444-4444-4444-4444-444444444444'; // José Senagro só tem acesso à Senagro (33333333-...)
    const mwamCompanyId = '11111111-1111-1111-1111-111111111111'; // MWAM

    let threwExpectedError = false;
    try {
      tenantContextService.enforceTenantAccess(joseUserId, mwamCompanyId);
    } catch (err) {
      if (err instanceof TenantMismatchError) {
        threwExpectedError = true;
      } else {
        throw new Error(`Erro inesperado lançado: ${err}`);
      }
    }

    if (!threwExpectedError) {
      throw new Error('FALHA DE SEGURANÇA: Usuário José Senagro conseguiu acessar MWAM sem vínculo!');
    }
  });

  test('Tenant Isolation', 'Tentativa de troca de contexto para empresa não autorizada DEVE ser rejeitada no backend (Regra 3 e 4)', () => {
    const joseUserId = 'u4444444-4444-4444-4444-444444444444';
    const tritechCompanyId = '44444444-4444-4444-4444-444444444444';

    let threw = false;
    try {
      tenantContextService.switchActiveCompany({
        userId: joseUserId,
        targetEmpresaId: tritechCompanyId,
        motivo: 'Tentativa de invasão / switch forçado',
      });
    } catch (err) {
      if (err instanceof TenantMismatchError) {
        threw = true;
      }
    }

    if (!threw) {
      throw new Error('FALHA DE SEGURANÇA: Switch forçado para empresa não autorizada foi aceito!');
    }
  });

  // SUITE 3: Troca de Contexto Autorizada e Auditoria
  test('Tenant Context Switching', 'Usuário do Grupo Mariana Tritech pode alternar entre Tritech Corte e Tritech Industrial (Regra 5)', () => {
    const marianaUserId = 'u3333333-3333-3333-3333-333333333333';
    const tritechCorteId = '44444444-4444-4444-4444-444444444444';
    const tritechIndId = '55555555-5555-5555-5555-555555555555';

    // Switch para Tritech Corte
    const res1 = tenantContextService.switchActiveCompany({
      userId: marianaUserId,
      targetEmpresaId: tritechCorteId,
      motivo: 'Supervisão de corte CNC',
    });
    if (res1.activeCompany.id !== tritechCorteId) throw new Error('Falha ao ativar Tritech Corte');

    // Switch para Tritech Industrial
    const res2 = tenantContextService.switchActiveCompany({
      userId: marianaUserId,
      targetEmpresaId: tritechIndId,
      motivo: 'Acompanhamento de caldeiraria pesada',
    });
    if (res2.activeCompany.id !== tritechIndId) throw new Error('Falha ao ativar Tritech Ind');
  });

  test('Audit Trail', 'Toda troca de contexto deve ser auditada com registro de usuário, origem e destino (Regra 6)', () => {
    const logs = tenantContextService.getAuditLogs(10);
    if (logs.length === 0) throw new Error('Nenhum log de auditoria de contexto foi gerado');

    const lastLog = logs[0];
    if (!lastLog.usuarioId || !lastLog.empresaDestinoId || !lastLog.criadoEm) {
      throw new Error('Log de auditoria incompleto');
    }
  });

  // SUITE 4: Suporte a Novos CNPJs e Expansão
  test('Dynamic CNPJ Support', 'Deve permitir o cadastro de nova empresa filial com CNPJ válido e vinculação de usuários (Regra 7)', () => {
    // CNPJ fictício válido para teste: 04.252.011/0001-10
    const newCompany = companyService.createCompany({
      codigo: 'NOVA_UNIDADE_SUL',
      razaoSocial: 'Tritech Sul Montagens Industriais Ltda',
      nomeFantasia: 'Tritech Sul',
      cnpj: '04.252.011/0001-10',
      inscricaoEstadual: '009827361.00-11',
      regimeTributario: 'LUCRO_REAL',
      ramoAtividade: 'Montagens Industriais e Estruturas Offshore',
    });

    if (!newCompany.id || newCompany.codigo !== 'NOVA_UNIDADE_SUL') {
      throw new Error('Falha ao registrar nova empresa no sistema');
    }

    // Vincula Mariana à nova empresa
    userService.updateUser('u3333333-3333-3333-3333-333333333333', {
      empresasVinculadas: [
        { empresaId: '44444444-4444-4444-4444-444444444444', perfilId: 'a3333333-3333-3333-3333-333333333333', padrao: true },
        { empresaId: '55555555-5555-5555-5555-555555555555', perfilId: 'a3333333-3333-3333-3333-333333333333' },
        { empresaId: newCompany.id, perfilId: 'a3333333-3333-3333-3333-333333333333' },
      ],
    });

    // Mariana agora pode alternar para a nova empresa
    const switchRes = tenantContextService.switchActiveCompany({
      userId: 'u3333333-3333-3333-3333-333333333333',
      targetEmpresaId: newCompany.id,
      motivo: 'Inauguração da unidade Sul',
    });

    if (switchRes.activeCompany.id !== newCompany.id) {
      throw new Error('Falha ao operar na nova empresa recém-cadastrada');
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    summary: {
      total: results.length,
      passed,
      failed,
    },
    results,
  };
}
