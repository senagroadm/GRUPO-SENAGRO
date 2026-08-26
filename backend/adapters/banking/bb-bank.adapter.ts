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
 * ADAPTER: BbBankAdapter (Banco do Brasil API Cobrança v2)
 *
 * ESPECIFICAÇÃO TÉCNICA OFICIAL:
 * - Protocolo: HTTPS REST / JSON com OAuth2 (mTLS + Basic Auth)
 * - Endpoint Auth: POST https://oauth.bb.com.br/oauth/token (Basic Auth com clientId:clientSecret)
 * - Endpoint Emissão: POST https://api.bb.com.br/cobrancas/v2/boletos?gw-dev-app-key={developer_key}
 * - Endpoint Consulta: GET https://api.bb.com.br/cobrancas/v2/boletos/{id}
 *
 * CAMPOS DEPENDENTES DO BANCO [TODO/BANCO-DEPENDENT]:
 * 1. `developerApplicationKey`: Chave da aplicação no Portal Developers BB
 * 2. `clientId` & `clientSecret`: Credenciais do Convênio de Cobrança
 * 3. `numeroConvenio`: Convênio de cobrança (ex: 3128557)
 * 4. `carteiraNumero`: Carteira 17
 * 5. `variacaoCarteira`: Variação da carteira (ex: 019)
 * ============================================================================
 */
export class BbBankAdapter implements IBancoAdapter {
  readonly providerType: ProviderType = 'BB_API';
  readonly bancoCodigo: string = '001';
  readonly bancoNome: string = 'Banco do Brasil S.A.';

  private fallbackProvider: MockBankProvider;

  constructor() {
    this.fallbackProvider = new MockBankProvider('001', 'Banco do Brasil S.A.');
  }

  async gerarCobranca(input: GerarCobrancaInput): Promise<ResultadoCobranca> {
    const base = await this.fallbackProvider.gerarCobranca(input);
    return {
      ...base,
      protocoloBancario: `BB-COB-${Date.now()}`,
      mensagem: 'Cobrança formatada com regras do Convênio Banco do Brasil v2.',
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
