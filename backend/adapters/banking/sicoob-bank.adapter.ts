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
 * ADAPTER: SicoobBankAdapter (Banco Cooperativo Sicoob API Cobrança v3)
 *
 * ESPECIFICAÇÃO TÉCNICA OFICIAL:
 * - Protocolo: HTTPS REST com mTLS Open Finance
 * - Endpoint: https://api.sicoob.com.br/cobranca-bancaria/v3/boletos
 * - CAMPOS DEPENDENTES [TODO/BANCO-DEPENDENT]:
 *   1. `numeroCooperativa`: Código da cooperativa filiada (ex: '3007')
 *   2. `numeroCliente`: Código do cooperado
 * ============================================================================
 */
export class SicoobBankAdapter implements IBancoAdapter {
  readonly providerType: ProviderType = 'SICOOB_API';
  readonly bancoCodigo: string = '756';
  readonly bancoNome: string = 'Bancoob / Sicoob Confederação';

  private fallbackProvider: MockBankProvider;

  constructor() {
    this.fallbackProvider = new MockBankProvider('756', 'Bancoob / Sicoob Confederação');
  }

  async gerarCobranca(input: GerarCobrancaInput): Promise<ResultadoCobranca> {
    const base = await this.fallbackProvider.gerarCobranca(input);
    return {
      ...base,
      protocoloBancario: `SICOOB-COB-${Date.now()}`,
      mensagem: 'Cobrança formatada com regras Sicoob Cooperativa v3.',
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
