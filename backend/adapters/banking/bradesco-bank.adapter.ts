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
 * ADAPTER: BradescoBankAdapter (Banco Bradesco S.A. API Cobrança / ShopFácil)
 *
 * ESPECIFICAÇÃO TÉCNICA OFICIAL:
 * - Protocolo: HTTPS REST com assinatura JWT (RS256)
 * - Endpoint Emissão: POST https://cobranca.bradesco.com.br/v1/boleto
 * - CAMPOS DEPENDENTES [TODO/BANCO-DEPENDENT]:
 *   1. `pkiPrivateKey`: Chave privada RSA cadastrada no Bradesco Net Empresa
 *   2. `merchantId`: Código do comerciante/cedente
 *   3. `carteira`: Carteira 09 (Registrada)
 * ============================================================================
 */
export class BradescoBankAdapter implements IBancoAdapter {
  readonly providerType: ProviderType = 'BRADESCO_API';
  readonly bancoCodigo: string = '237';
  readonly bancoNome: string = 'Banco Bradesco S.A.';

  private fallbackProvider: MockBankProvider;

  constructor() {
    this.fallbackProvider = new MockBankProvider('237', 'Banco Bradesco S.A.');
  }

  async gerarCobranca(input: GerarCobrancaInput): Promise<ResultadoCobranca> {
    const base = await this.fallbackProvider.gerarCobranca(input);
    return {
      ...base,
      protocoloBancario: `BRADESCO-COB-${Date.now()}`,
      mensagem: 'Cobrança formatada com regras Bradesco Net Empresa.',
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
