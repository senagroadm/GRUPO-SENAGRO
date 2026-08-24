import {
  CreditProvider,
  CadastroBureauResponse,
  ScoreBureauResponse,
  RestricoesBureauResponse,
  CreditoCompletoBureauResponse,
} from './credit-provider.interface';

/**
 * MockSerasaProvider
 * Provedor mock para desenvolvimento e testes conceituais do módulo de crédito industrial.
 * Simula respostas de bureaux de crédito (Serasa Experian / Boa Vista) sem inventar endpoints ou preços arbitrários.
 */
export class MockSerasaProvider implements CreditProvider {
  public readonly nomeProvedor = 'MockSerasaExperian';

  private normalizarDocumento(doc: string): string {
    return (doc || '').replace(/\D/g, '');
  }

  public async consultarCadastro(documento: string): Promise<CadastroBureauResponse> {
    const docLimpo = this.normalizarDocumento(documento);

    // Perfis mockados conforme terminação do documento
    if (docLimpo.endsWith('0001') || docLimpo.length === 14) {
      const isComRestricao = docLimpo.endsWith('9999') || docLimpo.endsWith('6666');
      return {
        documento: documento,
        razaoSocialOuNome: isComRestricao
          ? 'INDÚSTRIA E COMÉRCIO DE ESTRUTURAS METÁLICAS RESTRITAS LTDA'
          : 'METALÚRGICA E CALDEIRARIA INDUSTRIAL PROGRESSO LTDA',
        nomeFantasia: isComRestricao ? 'Estruturas Restritas' : 'Progresso Metais',
        situacaoCadastral: isComRestricao ? 'REGULAR' : 'REGULAR',
        dataAberturaOuNascimento: '2014-05-12',
        cnaePrincipal: '25.11-0-00',
        cnaeDescricao: 'Fabricação de estruturas metálicas e caldeiraria pesada',
        logradouro: 'Av. Industrial das Nações',
        numero: '4500',
        bairro: 'Distrito Industrial II',
        cidade: 'Sertãozinho',
        uf: 'SP',
        cep: '14170-000',
        capitalSocial: 2500000.0,
        quadroSocietario: [
          {
            nome: 'Carlos Eduardo Silveira',
            documento: '123.456.789-00',
            participacaoPerc: 60.0,
            cargo: 'Sócio-Administrador',
            dataEntrada: '2014-05-12',
          },
          {
            nome: 'Renata Albuquerque Silveira',
            documento: '987.654.321-11',
            participacaoPerc: 40.0,
            cargo: 'Sócia',
            dataEntrada: '2016-08-20',
          },
        ],
      };
    }

    // Caso Pessoa Física
    return {
      documento: documento,
      razaoSocialOuNome: 'MARCELO AUGUSTO DE FREITAS',
      situacaoCadastral: 'REGULAR',
      dataAberturaOuNascimento: '1982-11-25',
      logradouro: 'Rua das Palmeiras',
      numero: '120',
      bairro: 'Centro',
      cidade: 'Ribeirão Preto',
      uf: 'SP',
      cep: '14010-000',
      quadroSocietario: [],
    };
  }

  public async consultarScore(documento: string): Promise<ScoreBureauResponse> {
    const docLimpo = this.normalizarDocumento(documento);

    // Cenários de simulação controlada
    if (docLimpo.endsWith('9999')) {
      // Perfil Risco Alto / Crítico
      return {
        documento,
        score: 215,
        faixaRisco: 'MUITO_ALTO',
        probabilidadeInadimplenciaPerc: 38.5,
        textoExplicativo: 'Score crítico. Elevada probabilidade de inadimplência em 12 meses devido a pendências no mercado.',
      };
    }

    if (docLimpo.endsWith('6666')) {
      // Perfil Risco Médio / Atenção
      return {
        documento,
        score: 540,
        faixaRisco: 'MEDIO',
        probabilidadeInadimplenciaPerc: 14.2,
        textoExplicativo: 'Score intermediário. Histórico com pequenas oscilações de pontualidade no setor comercial.',
      };
    }

    if (docLimpo.endsWith('8888')) {
      // Perfil Excelente / AAA
      return {
        documento,
        score: 920,
        faixaRisco: 'MUITO_BAIXO',
        probabilidadeInadimplenciaPerc: 1.1,
        textoExplicativo: 'Excelente perfil de crédito. Empresa com altíssima pontualidade e sólida saúde financeira.',
      };
    }

    // Default: Bom Perfil / Padrão B+
    return {
      documento,
      score: 785,
      faixaRisco: 'BAIXO',
      probabilidadeInadimplenciaPerc: 4.8,
      textoExplicativo: 'Bom perfil cadastral. Baixa probabilidade de inadimplência.',
    };
  }

  public async consultarRestricoes(documento: string): Promise<RestricoesBureauResponse> {
    const docLimpo = this.normalizarDocumento(documento);

    if (docLimpo.endsWith('9999')) {
      // Restrições graves
      return {
        documento,
        totalRestricoesFinanceiras: 3,
        valorTotalRestricoes: 45800.0,
        protestos: [
          {
            cartorio: '1º Tabelião de Protesto de Letras',
            cidade: 'Sertãozinho',
            uf: 'SP',
            dataProtesto: '2026-03-15',
            valor: 18450.0,
            favorecidoOuCedente: 'AÇOS DO BRASIL DISTRIBUIDORA S/A',
          },
          {
            cartorio: '2º Tabelião de Protesto de Letras',
            cidade: 'Ribeirão Preto',
            uf: 'SP',
            dataProtesto: '2026-05-20',
            valor: 7350.0,
            favorecidoOuCedente: 'OXIGÊNIO & GASES INDUSTRIAIS LTDA',
          },
        ],
        pefin: [
          {
            empresaCredora: 'USINAGEM CENTRAL PAULISTA S/A',
            dataOcorrencia: '2026-04-10',
            valor: 20000.0,
            contrato: 'DUP-99412',
          },
        ],
        refin: [],
        acoesJudiciais: [
          {
            vara: '2ª Vara Cível de Sertãozinho',
            processo: '1004523-88.2025.8.26.0597',
            valor: 65000.0,
            dataDistribuicao: '2025-11-10',
            natureza: 'Execução de Título Extrajudicial',
          },
        ],
        chequesSemFundoQtd: 0,
        participacaoFalenciasOuRecuperacoes: false,
      };
    }

    if (docLimpo.endsWith('6666')) {
      // Restrição leve / 1 protesto antigo
      return {
        documento,
        totalRestricoesFinanceiras: 1,
        valorTotalRestricoes: 1250.0,
        protestos: [
          {
            cartorio: '1º Tabelião de Protesto',
            cidade: 'Piracicaba',
            uf: 'SP',
            dataProtesto: '2025-08-14',
            valor: 1250.0,
            favorecidoOuCedente: 'TRANSPORTADORA RODOVIÁRIA RAPIDO S/A',
          },
        ],
        pefin: [],
        refin: [],
        acoesJudiciais: [],
        chequesSemFundoQtd: 0,
        participacaoFalenciasOuRecuperacoes: false,
      };
    }

    // Sem restrições (Cadastro Limpo)
    return {
      documento,
      totalRestricoesFinanceiras: 0,
      valorTotalRestricoes: 0.0,
      protestos: [],
      pefin: [],
      refin: [],
      acoesJudiciais: [],
      chequesSemFundoQtd: 0,
      participacaoFalenciasOuRecuperacoes: false,
    };
  }

  public async consultarCredito(documento: string): Promise<CreditoCompletoBureauResponse> {
    const [cadastro, score, restricoes] = await Promise.all([
      this.consultarCadastro(documento),
      this.consultarScore(documento),
      this.consultarRestricoes(documento),
    ]);

    // Estimativas de mercado derivadas
    let faturamentoEstimado = 450000.0;
    if (score.score > 850) faturamentoEstimado = 1200000.0;
    else if (score.score < 300) faturamentoEstimado = 150000.0;

    const limiteSugerido = Math.round((faturamentoEstimado * 0.25 * (score.score / 1000)) / 1000) * 1000;

    return {
      cadastro,
      score,
      restricoes,
      resumoFinanceiro: {
        faturamentoEstimadoMensal: faturamentoEstimado,
        limiteCreditoSugeridoBureau: Math.max(limiteSugerido, 10000),
        pontualidadePagamentoMercadoPerc: score.score > 700 ? 98.2 : score.score > 400 ? 88.5 : 62.0,
      },
      provedorNome: this.nomeProvedor,
      consultadoEm: new Date().toISOString(),
    };
  }
}
