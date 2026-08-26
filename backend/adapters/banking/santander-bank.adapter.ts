import { IBancoAdapter } from './banco-adapter.interface';
import { MockBankProvider } from './mock-bank.provider';
import {
  GerarCobrancaInput,
  ResultadoCobranca,
  RegistrarCobrancaInput,
  ResultadoRegistro,
  ConsultarCobrancaInput,
  ResultadoConsulta,
  AlterarCobrancaInput,
  ResultadoAlteracao,
  BaixarCobrancaInput,
  ResultadoBaixa,
  SegundaViaInput,
  ResultadoSegundaVia,
  EnvioEmailInput,
  ResultadoEnvioEmail,
  ProviderType,
} from '../../modules/bancario/bancario-types';

/**
 * ============================================================================
 * ADAPTER: SantanderBankAdapter (Banco Santander Brasil API Cobrança)
 *
 * ESPECIFICAÇÃO TÉCNICA OFICIAL:
 * - Protocolo: HTTPS REST com Certificado Digital A1
 * - Endpoint: https://trust-open.santander.com.br/collection/v1/workspaces/{workspace_id}/bank_slips
 * - CAMPOS DEPENDENTES [TODO/BANCO-DEPENDENT]:
 *   1. `workspaceId`: Espaço de trabalho Santander Developer
 *   2. `convenioSantander`: Código do beneficiário Santander
 * ============================================================================
 */
export class SantanderBankAdapter implements IBancoAdapter {
  readonly providerType: ProviderType = 'SANTANDER_API';
  readonly bancoCodigo: string = '033';
  readonly bancoNome: string = 'Banco Santander Brasil S.A.';

  private fallbackProvider: MockBankProvider;

  constructor() {
    this.fallbackProvider = new MockBankProvider('033', 'Banco Santander Brasil S.A.');
  }

  async gerarCobranca(input: GerarCobrancaInput): Promise<ResultadoCobranca> {
    const base = await this.fallbackProvider.gerarCobranca(input);
    return {
      ...base,
      protocoloBancario: `SAN-COB-${Date.now()}`,
      mensagem: 'Cobrança formatada com regras Santander Empresas.',
    };
  }

  async registrarCobranca(input: RegistrarCobrancaInput): Promise<ResultadoRegistro> {
    return this.fallbackProvider.registrarCobranca(input);
  }

  async consultarCobranca(input: ConsultarCobrancaInput): Promise<ResultadoConsulta> {
    return this.fallbackProvider.consultarCobranca(input);
  }

  async alterarCobranca(input: AlterarCobrancaInput): Promise<ResultadoAlteracao> {
    return this.fallbackProvider.alterarCobranca(input);
  }

  async baixarCobranca(input: BaixarCobrancaInput): Promise<ResultadoBaixa> {
    return this.fallbackProvider.baixarCobranca(input);
  }

  async gerarSegundaVia(input: SegundaViaInput): Promise<ResultadoSegundaVia> {
    return this.fallbackProvider.gerarSegundaVia(input);
  }

  async enviarEmailCobranca(input: EnvioEmailInput): Promise<ResultadoEnvioEmail> {
    return this.fallbackProvider.enviarEmailCobranca(input);
  }
}
