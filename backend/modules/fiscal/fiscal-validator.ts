/**
 * NEXUS ERP - Fiscal Validator (Motor de Pré-Validação de Documentos e Faturamento)
 * Executa checagens profundas antes de qualquer reserva de numeração ou envio SEFAZ:
 * Empresa, Cliente, Produto/Serviço, Tributação, Endereço, Série, Certificado e Condições.
 */

import {
  EmissaoDocumentoRequest,
  ConfiguracaoFiscal,
  SerieFiscal,
  CertificadoReferencia,
  OperacaoFiscal,
  PreValidacaoResult,
  ItemValidacaoErro,
} from './fiscal-types';

export class FiscalValidator {
  /**
   * Valida CNPJ com cálculo de dígitos verificadores
   */
  public validarCNPJ(cnpj: string): boolean {
    const limpo = cnpj.replace(/\D/g, '');
    if (limpo.length !== 14 || /^(\d)\1+$/.test(limpo)) return false;

    let tamanho = limpo.length - 2;
    let numeros = limpo.substring(0, tamanho);
    const digitos = limpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

    tamanho = tamanho + 1;
    numeros = limpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1), 10);
  }

  /**
   * Valida CPF com cálculo de dígitos verificadores
   */
  public validarCPF(cpf: string): boolean {
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.substring(9, 10), 10)) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(limpo.substring(10, 11), 10);
  }

  /**
   * Executa a bateria completa de pré-validação
   */
  public validarEmissao(
    request: EmissaoDocumentoRequest,
    contexto: {
      configuracao: ConfiguracaoFiscal | null;
      series: SerieFiscal[];
      certificados: CertificadoReferencia[];
      operacao: OperacaoFiscal | null;
    }
  ): PreValidacaoResult {
    const erros: ItemValidacaoErro[] = [];
    const avisos: ItemValidacaoErro[] = [];

    let empresaOk = true;
    let clienteOk = true;
    let produtosOk = true;
    let tributacaoOk = true;
    let enderecoOk = true;
    let serieOk = true;
    let certificadoOk = true;
    let condicoesOk = true;

    // -------------------------------------------------------------
    // 1. VALIDAÇÃO DA EMPRESA EMISSORA
    // -------------------------------------------------------------
    const { configuracao } = contexto;
    if (!configuracao) {
      empresaOk = false;
      erros.push({
        campo: 'empresa.configuracao',
        mensagem: `A empresa ${request.empresaId} não possui parametrização fiscal cadastrada.`,
        severidade: 'BLOQUEANTE',
        categoria: 'EMPRESA',
      });
    } else {
      if (!configuracao.ufEmissao || configuracao.ufEmissao.length !== 2) {
        empresaOk = false;
        erros.push({
          campo: 'empresa.ufEmissao',
          mensagem: 'UF de emissão da empresa inválida ou não configurada.',
          severidade: 'BLOQUEANTE',
          categoria: 'EMPRESA',
        });
      }
      if (!configuracao.codigoMunicipioIBGE || configuracao.codigoMunicipioIBGE.length !== 7) {
        empresaOk = false;
        erros.push({
          campo: 'empresa.codigoMunicipioIBGE',
          mensagem: 'Código IBGE do município emitente deve conter exatamente 7 dígitos.',
          severidade: 'BLOQUEANTE',
          categoria: 'EMPRESA',
        });
      }
      if (request.modelo === 'NFE_55' && !configuracao.inscricaoEstadual) {
        empresaOk = false;
        erros.push({
          campo: 'empresa.inscricaoEstadual',
          mensagem: 'Inscrição Estadual da empresa emissora é obrigatória para emissão de NF-e mod. 55.',
          severidade: 'BLOQUEANTE',
          categoria: 'EMPRESA',
        });
      }
      if (request.modelo === 'NFSE' && !configuracao.inscricaoMunicipal) {
        empresaOk = false;
        erros.push({
          campo: 'empresa.inscricaoMunicipal',
          mensagem: 'Inscrição Municipal da empresa é obrigatória para emissão de NFS-e.',
          severidade: 'BLOQUEANTE',
          categoria: 'EMPRESA',
        });
      }
    }

    // -------------------------------------------------------------
    // 2. VALIDAÇÃO DO CERTIFICADO DIGITAL
    // -------------------------------------------------------------
    const certAtivo = contexto.certificados.find(
      (c) => c.ativo && (c.id === configuracao?.certificadoReferenciaId || c.status === 'VALIDO')
    );

    if (!certAtivo) {
      certificadoOk = false;
      erros.push({
        campo: 'certificado.status',
        mensagem: 'Nenhum certificado digital A1/A3 válido e ativo foi vinculado à empresa.',
        severidade: 'BLOQUEANTE',
        categoria: 'CERTIFICADO',
      });
    } else {
      const agora = new Date().getTime();
      const vencimento = new Date(certAtivo.validoAte).getTime();
      if (agora > vencimento || certAtivo.status === 'EXPIRADO') {
        certificadoOk = false;
        erros.push({
          campo: 'certificado.validade',
          mensagem: `O certificado digital ${certAtivo.aliasNome} expirou em ${new Date(certAtivo.validoAte).toLocaleDateString('pt-BR')}.`,
          severidade: 'BLOQUEANTE',
          categoria: 'CERTIFICADO',
        });
      } else if (certAtivo.diasAteVencimento <= 30) {
        avisos.push({
          campo: 'certificado.alertaVencimento',
          mensagem: `Certificado digital vence em ${certAtivo.diasAteVencimento} dias (${new Date(certAtivo.validoAte).toLocaleDateString('pt-BR')}).`,
          severidade: 'AVISO',
          categoria: 'CERTIFICADO',
        });
      }
    }

    // -------------------------------------------------------------
    // 3. VALIDAÇÃO DA SÉRIE FISCAL
    // -------------------------------------------------------------
    const serieReq = request.serieNumero || 1;
    const ambReq = request.ambiente || configuracao?.ambientePadrao || 'HOMOLOGACAO';
    const serie = contexto.series.find((s) => s.modelo === request.modelo && s.serieNumero === serieReq);

    if (serie && serie.bloqueadoParaUso) {
      serieOk = false;
      erros.push({
        campo: 'serie.bloqueada',
        mensagem: `A Série ${serieReq} para o modelo ${request.modelo} está bloqueada para novas emissões.`,
        severidade: 'BLOQUEANTE',
        categoria: 'SERIE',
      });
    }

    // -------------------------------------------------------------
    // 4. VALIDAÇÃO DO DESTINATÁRIO / CLIENTE / FORNECEDOR
    // -------------------------------------------------------------
    const dest = request.destinatario;
    if (!dest) {
      clienteOk = false;
      erros.push({
        campo: 'destinatario',
        mensagem: 'Destinatário/Tomador não informado.',
        severidade: 'BLOQUEANTE',
        categoria: 'CLIENTE',
      });
    } else {
      if (!dest.razaoSocialNome || dest.razaoSocialNome.trim().length < 2) {
        clienteOk = false;
        erros.push({
          campo: 'destinatario.razaoSocialNome',
          mensagem: 'Razão Social / Nome do destinatário é obrigatório.',
          severidade: 'BLOQUEANTE',
          categoria: 'CLIENTE',
        });
      }

      const docLimpo = dest.cnpjCpf ? dest.cnpjCpf.replace(/\D/g, '') : '';
      if (dest.tipoPessoa === 'PJ') {
        if (!docLimpo || docLimpo.length !== 14 || !this.validarCNPJ(docLimpo)) {
          // Em homologação permitimos CNPJ de teste, mas sinalizamos se inválido
          if (ambReq === 'PRODUCAO') {
            clienteOk = false;
            erros.push({
              campo: 'destinatario.cnpjCpf',
              mensagem: `CNPJ do destinatário (${dest.cnpjCpf}) é inválido perante o algoritmo da Receita Federal.`,
              severidade: 'BLOQUEANTE',
              categoria: 'CLIENTE',
            });
          } else if (docLimpo.length !== 14) {
            clienteOk = false;
            erros.push({
              campo: 'destinatario.cnpjCpf',
              mensagem: 'CNPJ deve conter 14 dígitos numéricos.',
              severidade: 'BLOQUEANTE',
              categoria: 'CLIENTE',
            });
          }
        }

        // IE para Contribuinte
        if (dest.indicadorIe === '1_CONTRIBUINTE' && (!dest.inscricaoEstadual || dest.inscricaoEstadual.trim().length < 2)) {
          clienteOk = false;
          erros.push({
            campo: 'destinatario.inscricaoEstadual',
            mensagem: 'Inscrição Estadual é obrigatória quando o destinatário é marcado como Contribuinte de ICMS.',
            severidade: 'BLOQUEANTE',
            categoria: 'CLIENTE',
          });
        }
      } else if (dest.tipoPessoa === 'PF') {
        if (!docLimpo || docLimpo.length !== 11 || (ambReq === 'PRODUCAO' && !this.validarCPF(docLimpo))) {
          clienteOk = false;
          erros.push({
            campo: 'destinatario.cnpjCpf',
            mensagem: `CPF do destinatário (${dest.cnpjCpf}) é inválido.`,
            severidade: 'BLOQUEANTE',
            categoria: 'CLIENTE',
          });
        }
      }

      // -------------------------------------------------------------
      // 5. VALIDAÇÃO DO ENDEREÇO
      // -------------------------------------------------------------
      const end = dest.endereco;
      if (!end) {
        enderecoOk = false;
        erros.push({
          campo: 'destinatario.endereco',
          mensagem: 'Endereço do destinatário não informado.',
          severidade: 'BLOQUEANTE',
          categoria: 'ENDERECO',
        });
      } else {
        if (!end.logradouro || end.logradouro.trim().length < 2) {
          enderecoOk = false;
          erros.push({
            campo: 'destinatario.endereco.logradouro',
            mensagem: 'Logradouro do destinatário é obrigatório.',
            severidade: 'BLOQUEANTE',
            categoria: 'ENDERECO',
          });
        }
        if (!end.numero || end.numero.trim().length === 0) {
          enderecoOk = false;
          erros.push({
            campo: 'destinatario.endereco.numero',
            mensagem: 'Número do endereço é obrigatório (use "S/N" se não houver).',
            severidade: 'BLOQUEANTE',
            categoria: 'ENDERECO',
          });
        }
        if (!end.bairro || end.bairro.trim().length < 2) {
          enderecoOk = false;
          erros.push({
            campo: 'destinatario.endereco.bairro',
            mensagem: 'Bairro do destinatário é obrigatório.',
            severidade: 'BLOQUEANTE',
            categoria: 'ENDERECO',
          });
        }
        if (!end.uf || end.uf.length !== 2) {
          enderecoOk = false;
          erros.push({
            campo: 'destinatario.endereco.uf',
            mensagem: 'UF de destino deve conter 2 letras (ex: SP, MG, RJ).',
            severidade: 'BLOQUEANTE',
            categoria: 'ENDERECO',
          });
        }
        if (!end.codigoMunicipioIBGE || end.codigoMunicipioIBGE.length !== 7) {
          enderecoOk = false;
          erros.push({
            campo: 'destinatario.endereco.codigoMunicipioIBGE',
            mensagem: 'Código IBGE do município de destino deve conter exatamente 7 dígitos.',
            severidade: 'BLOQUEANTE',
            categoria: 'ENDERECO',
          });
        }
        const cepLimpo = end.cep ? end.cep.replace(/\D/g, '') : '';
        if (cepLimpo.length !== 8) {
          enderecoOk = false;
          erros.push({
            campo: 'destinatario.endereco.cep',
            mensagem: 'CEP do destinatário deve conter 8 dígitos numéricos.',
            severidade: 'BLOQUEANTE',
            categoria: 'ENDERECO',
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 6. VALIDAÇÃO DOS ITENS E PRODUTOS
    // -------------------------------------------------------------
    if (!request.itens || request.itens.length === 0) {
      produtosOk = false;
      erros.push({
        campo: 'itens',
        mensagem: 'O documento fiscal deve conter pelo menos 1 item.',
        severidade: 'BLOQUEANTE',
        categoria: 'PRODUTO',
      });
    } else {
      request.itens.forEach((it, idx) => {
        const itemNum = idx + 1;
        if (!it.codigoItem || it.codigoItem.trim().length === 0) {
          produtosOk = false;
          erros.push({
            campo: `itens[${itemNum}].codigoItem`,
            mensagem: `Item #${itemNum}: Código do item não informado.`,
            severidade: 'BLOQUEANTE',
            categoria: 'PRODUTO',
          });
        }
        if (!it.descricao || it.descricao.trim().length === 0) {
          produtosOk = false;
          erros.push({
            campo: `itens[${itemNum}].descricao`,
            mensagem: `Item #${itemNum}: Descrição do produto/serviço é obrigatória.`,
            severidade: 'BLOQUEANTE',
            categoria: 'PRODUTO',
          });
        }
        if (!it.quantidade || it.quantidade <= 0) {
          produtosOk = false;
          erros.push({
            campo: `itens[${itemNum}].quantidade`,
            mensagem: `Item #${itemNum}: Quantidade deve ser maior que zero.`,
            severidade: 'BLOQUEANTE',
            categoria: 'PRODUTO',
          });
        }
        if (it.valorUnitario === undefined || it.valorUnitario < 0) {
          produtosOk = false;
          erros.push({
            campo: `itens[${itemNum}].valorUnitario`,
            mensagem: `Item #${itemNum}: Valor unitário não pode ser negativo.`,
            severidade: 'BLOQUEANTE',
            categoria: 'PRODUTO',
          });
        }

        // Para NF-e de Mercadorias (55)
        if (request.modelo === 'NFE_55') {
          const ncm = (it.ncmManual || '').replace(/\D/g, '');
          if (ncm && ncm.length !== 8) {
            produtosOk = false;
            erros.push({
              campo: `itens[${itemNum}].ncm`,
              mensagem: `Item #${itemNum}: NCM deve conter exatamente 8 dígitos numéricos.`,
              severidade: 'BLOQUEANTE',
              categoria: 'PRODUTO',
            });
          }
        }
      });
    }

    // -------------------------------------------------------------
    // 7. VALIDAÇÃO DE OPERAÇÃO & TRIBUTAÇÃO
    // -------------------------------------------------------------
    if (!contexto.operacao) {
      tributacaoOk = false;
      erros.push({
        campo: 'operacaoFiscalCodigo',
        mensagem: `Operação fiscal ${request.operacaoFiscalCodigo} não cadastrada no sistema.`,
        severidade: 'BLOQUEANTE',
        categoria: 'TRIBUTACAO',
      });
    } else {
      const operacao = contexto.operacao;
      const ufEmit = configuracao?.ufEmissao || 'SP';
      const ufDest = dest?.endereco?.uf || 'SP';
      const interestadual = ufEmit !== ufDest;

      // Validação de CFOP estadual vs interestadual
      request.itens.forEach((it, idx) => {
        const itemNum = idx + 1;
        const cfop = it.cfopManual || (interestadual ? operacao.cfopPadraoInterestadual : operacao.cfopPadraoEstadual);
        if (!cfop || cfop.length !== 4) {
          tributacaoOk = false;
          erros.push({
            campo: `itens[${itemNum}].cfop`,
            mensagem: `Item #${itemNum}: CFOP inválido (${cfop}). Deve possuir 4 dígitos.`,
            severidade: 'BLOQUEANTE',
            categoria: 'TRIBUTACAO',
          });
        } else {
          // CFOP de Saída deve começar com 5 (estadual), 6 (interestadual) ou 7 (exterior)
          if (operacao.tipoOperacao === 'SAIDA') {
            if (interestadual && !cfop.startsWith('6') && !cfop.startsWith('7')) {
              tributacaoOk = false;
              erros.push({
                campo: `itens[${itemNum}].cfop`,
                mensagem: `Item #${itemNum}: Operação interestadual (${ufEmit} -> ${ufDest}) requer CFOP iniciado por 6 (ou 7 para exterior). Informado: ${cfop}.`,
                severidade: 'BLOQUEANTE',
                categoria: 'TRIBUTACAO',
              });
            } else if (!interestadual && !cfop.startsWith('5')) {
              avisos.push({
                campo: `itens[${itemNum}].cfop`,
                mensagem: `Item #${itemNum}: Operação interna dentro de ${ufEmit} normalmente utiliza CFOP iniciado por 5. Informado: ${cfop}.`,
                severidade: 'AVISO',
                categoria: 'TRIBUTACAO',
              });
            }
          }
          // CFOP de Entrada deve começar com 1 (estadual), 2 (interestadual) ou 3 (exterior)
          if (operacao.tipoOperacao === 'ENTRADA') {
            if (interestadual && !cfop.startsWith('2') && !cfop.startsWith('3')) {
              tributacaoOk = false;
              erros.push({
                campo: `itens[${itemNum}].cfop`,
                mensagem: `Item #${itemNum}: Entrada interestadual requer CFOP iniciado por 2. Informado: ${cfop}.`,
                severidade: 'BLOQUEANTE',
                categoria: 'TRIBUTACAO',
              });
            }
          }
        }
      });
    }

    // -------------------------------------------------------------
    // 8. CONDIÇÕES ESPECIAIS (DEVOLUÇÃO, TRANSFERÊNCIA INTERCOMPANY)
    // -------------------------------------------------------------
    if (contexto.operacao?.finalidade === 'DEVOLUCAO_RETORNO') {
      if (!request.chaveReferenciadaNFe || request.chaveReferenciadaNFe.replace(/\D/g, '').length !== 44) {
        condicoesOk = false;
        erros.push({
          campo: 'chaveReferenciadaNFe',
          mensagem: 'Para notas de Devolução/Retorno, é obrigatório informar a Chave de Acesso da NF-e referenciada (44 dígitos).',
          severidade: 'BLOQUEANTE',
          categoria: 'CONDICOES',
        });
      }
    }

    if (request.operacaoFiscalCodigo.includes('TRANSFERENCIA') && request.empresaDestinoIntercompanyId) {
      if (request.empresaDestinoIntercompanyId === request.empresaId) {
        condicoesOk = false;
        erros.push({
          campo: 'empresaDestinoIntercompanyId',
          mensagem: 'A empresa de destino da transferência intercompany não pode ser a própria empresa emissora.',
          severidade: 'BLOQUEANTE',
          categoria: 'CONDICOES',
        });
      }
    }

    const valido = erros.length === 0;
    const temAvisos = avisos.length > 0;

    return {
      valido,
      temAvisos,
      erros,
      avisos,
      resumoValidacoes: {
        empresaOk,
        clienteOk,
        produtosOk,
        tributacaoOk,
        enderecoOk,
        serieOk,
        certificadoOk,
        condicoesOk,
      },
      auditoriaTimestamp: new Date().toISOString(),
    };
  }
}

export const fiscalValidator = new FiscalValidator();
