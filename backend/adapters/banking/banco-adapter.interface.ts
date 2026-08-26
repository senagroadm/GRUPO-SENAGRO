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
 * CONTRATO DA PORTA/ADAPTER BANCÁRIO (IBancoAdapter / IBillingProvider)
 * Define as operações padronizadas de emissão, registro, consulta, alteração,
 * baixa e segunda via de cobranças bancárias e PIX para o NEXUS ERP.
 */
export interface IBancoAdapter {
  readonly providerType: ProviderType;
  readonly bancoCodigo: string;
  readonly bancoNome: string;

  /**
   * Gera localmente os dados preliminares da cobrança (Nosso Número, Linha Digitável, Código de Barras, EMV PIX)
   */
  gerarCobranca(input: GerarCobrancaInput): Promise<ResultadoCobranca>;

  /**
   * Registra formalmente a cobrança via API do Banco ou transmissão de remessa
   */
  registrarCobranca(input: RegistrarCobrancaInput): Promise<ResultadoRegistro>;

  /**
   * Consulta o status atual da cobrança no banco (Pendente, Paga, Baixada, Protestada)
   */
  consultarCobranca(input: ConsultarCobrancaInput): Promise<ResultadoConsulta>;

  /**
   * Envia comando de alteração de vencimento, valor ou concessão de desconto
   */
  alterarCobranca(input: AlterarCobrancaInput): Promise<ResultadoAlteracao>;

  /**
   * Envia comando de baixa de cobrança (por pagamento ou cancelamento de pedido)
   */
  baixarCobranca(input: BaixarCobrancaInput): Promise<ResultadoBaixa>;

  /**
   * Gera uma segunda via atualizada do título com recálculo de encargos
   */
  gerarSegundaVia(input: SegundaViaInput): Promise<ResultadoSegundaVia>;

  /**
   * Dispara notificação por e-mail com os dados da cobrança e link do boleto
   */
  enviarEmailCobranca(input: EnvioEmailInput): Promise<ResultadoEnvioEmail>;
}
