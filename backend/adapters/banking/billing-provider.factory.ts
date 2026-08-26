import { IBancoAdapter } from './banco-adapter.interface';
import { MockBankProvider } from './mock-bank.provider';
import { ItauBankAdapter } from './itau-bank.adapter';
import { BbBankAdapter } from './bb-bank.adapter';
import { BradescoBankAdapter } from './bradesco-bank.adapter';
import { SantanderBankAdapter } from './santander-bank.adapter';
import { SicoobBankAdapter } from './sicoob-bank.adapter';
import { ProviderType } from '../../modules/bancario/bancario-types';

/**
 * FACTORY DE PROVEDORES BANCÁRIOS (BillingProviderFactory)
 * Instancia o adapter apropriado de acordo com o provedor configurado para a conta bancária da empresa.
 */
export class BillingProviderFactory {
  private static providers: Map<string, IBancoAdapter> = new Map();

  static getProvider(providerType: ProviderType, bancoCodigo = '341', bancoNome = 'Itaú Unibanco'): IBancoAdapter {
    const key = `${providerType}_${bancoCodigo}`;
    
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    let adapter: IBancoAdapter;

    switch (providerType) {
      case 'ITAU_API':
        adapter = new ItauBankAdapter();
        break;
      case 'BB_API':
        adapter = new BbBankAdapter();
        break;
      case 'BRADESCO_API':
        adapter = new BradescoBankAdapter();
        break;
      case 'SANTANDER_API':
        adapter = new SantanderBankAdapter();
        break;
      case 'SICOOB_API':
        adapter = new SicoobBankAdapter();
        break;
      case 'CNAB240':
      case 'CNAB400':
      case 'MOCK':
      default:
        adapter = new MockBankProvider(bancoCodigo, bancoNome);
        break;
    }

    this.providers.set(key, adapter);
    return adapter;
  }
}
