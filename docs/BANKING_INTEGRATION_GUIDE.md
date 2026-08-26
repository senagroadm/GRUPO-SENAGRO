# 🏦 GUIA DE INTEGRAÇÃO BANCÁRIA & COBRANÇA (NEXUS ERP - GRUPO TRITECH)

## 📌 1. Visão Geral & Arquitetura de Cobrança

O NEXUS ERP adota o padrão **Adapter/Port (Hexagonal Architecture)** para isolar as complexidades de comunicação bancária e fornecer rastreabilidade rigorosa e imutável para todas as operações financeiras.

### Rastreabilidade Estrita
Toda cobrança registrada no sistema obedece ao vínculo quadridimensional:
```
[ EMPRESA (CNPJ) ] ➔ [ CONTA BANCÁRIA / CONVÊNIO ] ➔ [ TÍTULO A RECEBER (AR) ] ➔ [ COBRANÇA (NOSSO NÚMERO) ]
```

---

## 🏛️ 2. Padrão de Adapters (`IBancoAdapter` / `IBillingProvider`)

O contrato abstrato define operações uniformes que todas as integrações bancárias implementam:

```typescript
export interface IBancoAdapter {
  readonly providerType: string;
  readonly bancoCodigo: string;

  gerarBoleto(dados: GerarCobrancaInput): Promise<ResultadoCobranca>;
  registrarCobranca(dados: RegistrarCobrancaInput): Promise<ResultadoRegistro>;
  consultarCobranca(dados: ConsultarCobrancaInput): Promise<ResultadoConsulta>;
  alterarCobranca(dados: AlterarCobrancaInput): Promise<ResultadoAlteracao>;
  baixarCobranca(dados: BaixarCobrancaInput): Promise<ResultadoBaixa>;
  gerarSegundaVia(dados: SegundaViaInput): Promise<ResultadoSegundaVia>;
  enviarEmailCobranca(dados: EnvioEmailInput): Promise<ResultadoEnvioEmail>;
}
```

---

## 🔍 3. Mapeamento de Bancos & Campos Dependentes (`[TODO/BANCO-DEPENDENT]`)

Abaixo estão listados os provedores suportados pelo padrão Factory do NEXUS ERP, especificando o status de implementação e os requisitos de credenciais corporativas reais.

### 3.1. `MockBankProvider` (Ativo em Desenvolvimento / Demonstração)
* **Finalidade**: Testes automatizados, simulações em sandbox e homologação de telas sem necessidade de certificados corporativos.
* **Recursos**:
  - Geração matemática exata de Linha Digitável e Código de Barras FEBRABAN (com fator de vencimento e cálculo módulo 11).
  - Geração de Payload PIX EMV (BR Code / Copia e Cola) compatível com padrão BACEN.
  - Simulação de registro bancário instantâneo com geração de protocolo.
  - Simulação de consulta com transição de status.
  - Simulação de envio de e-mail com rastreabilidade de entrega.

---

### 3.2. Banco Itaú Unibanco (API Cobrança v2)
* **Padrão**: REST / JSON com OAuth2 (mTLS + Client Credentials).
* **Endpoints**:
  - Auth: `https://sts.itau.com.br/api/oauth/token`
  - Boletos: `https://api.itau.com.br/cobranca/v2/boletos`
  - Baixas: `https://api.itau.com.br/cobranca/v2/boletos/{id}/baixa`
* **Campos Dependentes do Banco** `[TODO/BANCO-DEPENDENT]`:
  - `certificado_mtls_pfx`: Certificado Digital A1 (.pfx/.pem) fornecido pelo Itaú Empresas.
  - `certificado_senha`: Senha do certificado digital.
  - `client_id`: Identificador da aplicação no Portal Dev Itaú.
  - `client_secret`: Chave secreta da aplicação.
  - `codigo_beneficiario`: Agência + Conta + Carteira (109/112).
  - `chave_pix`: Chave PIX cadastrada na conta Itaú para ativação do Boleto Híbrido.

---

### 3.3. Banco do Brasil (API Cobrança v2)
* **Padrão**: REST / JSON com OAuth2 (mTLS + Basic Auth).
* **Endpoints**:
  - Auth: `https://oauth.bb.com.br/oauth/token`
  - Boletos: `https://api.bb.com.br/cobrancas/v2/boletos`
  - Consultas: `https://api.bb.com.br/cobrancas/v2/boletos/{id}`
* **Campos Dependentes do Banco** `[TODO/BANCO-DEPENDENT]`:
  - `developer_application_key`: Chave da aplicação obtida no Portal Developers BB.
  - `client_id` & `client_secret`: Credenciais OAuth2 do convênio.
  - `numero_convenio`: Número do convênio de cobrança líder (7 dígitos).
  - `carteira_numero`: Geralmente '17' (Cobrança Simples).
  - `variacao_carteira`: Código da variação da carteira (ex: '019').

---

### 3.4. Banco Bradesco (API Cobrança / ShopFácil)
* **Padrão**: REST / JSON assinado com JWT (RS256) e certificado PKI.
* **Endpoints**:
  - Auth: `https://auth.bradesco.com.br/oauth2/token`
  - Boletos: `https://cobranca.bradesco.com.br/v1/boleto`
* **Campos Dependentes do Banco** `[TODO/BANCO-DEPENDENT]`:
  - `pki_private_key`: Chave privada RSA para geração de tokens JWT assinados.
  - `merchant_id` / `client_id`: ID do credenciado no Bradesco Net Empresa.
  - `carteira`: '09' (com registro) ou '04'.

---

### 3.5. Banco Santander (API Cobrança Santander Empresas)
* **Padrão**: REST / JSON com certificado digital A1.
* **Endpoints**:
  - Auth: `https://trust-open.santander.com.br/oauth/token`
  - Boletos: `https://trust-open.santander.com.br/collection/v1/workspaces/{workspace_id}/bank_slips`
* **Campos Dependentes do Banco** `[TODO/BANCO-DEPENDENT]`:
  - `workspace_id`: ID do espaço de trabalho gerado pelo Santander Developer.
  - `convenio_santander`: Código do beneficiário Santander.
  - `client_id` & `client_secret`.

---

### 3.6. Banco Cooperativo Sicoob (API Cobrança Bancária v3)
* **Padrão**: REST / JSON com mTLS e escopos de Cooperativa.
* **Endpoints**:
  - Auth: `https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token`
  - Boletos: `https://api.sicoob.com.br/cobranca-bancaria/v3/boletos`
* **Campos Dependentes do Banco** `[TODO/BANCO-DEPENDENT]`:
  - `numero_cooperativa`: Código da cooperativa Sicoob filiada (ex: '3007').
  - `numero_cliente`: Código do cliente cooperado.
  - `client_id` no Portal Sicoob Developers.

---

### 3.7. CNAB 240 / 400 (Remessa e Retorno por Arquivo)
* **Padrão**: Arquivos posicionais FEBRABAN para empresas sem suporte a APIs síncronas.
* **Campos Dependentes** `[TODO/BANCO-DEPENDENT]`:
  - `sequencial_arquivo_remessa`: Número sequencial incremental por arquivo gerado.
  - `layout_versao`: Versão do layout FEBRABAN (ex: '087' para Itaú 240, '089' para BB 240).

---

## ⚙️ 4. Especificações Matemáticas & Algoritmos de Cálculo

### 4.1. Código de Barras (44 dígitos)
Composto conforme padrão FEBRABAN:
- `Posições 01 a 03`: Código do Banco (ex: '341', '001', '237')
- `Posição 04`: Código da Moeda ('9' para Real)
- `Posição 05`: Dígito Verificador Geral (Módulo 11 com pesos de 2 a 9)
- `Posições 06 a 09`: Fator de Vencimento (calculado a partir da data base 07/10/1997)
- `Posições 10 a 19`: Valor do Documento (10 dígitos com zeros à esquerda)
- `Posições 20 a 44`: Campo Livre (definido pelo banco: agência, conta, nosso número, carteira)

### 4.2. Linha Digitável (47 dígitos)
Dividida em 5 campos formatados:
`Campo 1`: `AAABC.CCCCX` (onde X é o DV módulo 10)
`Campo 2`: `DDDDD.DDDDDY` (onde Y é o DV módulo 10)
`Campo 3`: `EEEEE.EEEEEZ` (onde Z é o DV módulo 10)
`Campo 4`: `K` (Dígito verificador geral do código de barras)
`Campo 5`: `UUUUVVVVVVVVVV` (Fator de vencimento + valor)

Formato Visual:
`34191.79001 01043.510047 91020.150008 5 99990000000000`

### 4.3. QR Code PIX EMV (Boleto Híbrido)
Geração compatível com a especificação do Banco Central do Brasil para payload EMV BR Code:
- Payload Format Indicator (00)
- Point of Initiation Method (01)
- Merchant Account Information - PIX (26)
  - GUI: `br.gov.bcb.pix`
  - Chave PIX
  - Descrição / Instrução
- Merchant Category Code (52)
- Transaction Currency (53: '986' - BRL)
- Transaction Amount (54)
- Country Code (58: 'BR')
- Merchant Name (59)
- Merchant City (60)
- Additional Data Field Template (62: txid)
- CRC16 (63: 4 hex caracteres calculados por polinômio CCITT-FALSE `0x1021`)

---

## 🔔 5. Webhooks & Notificações de Pagamento

O endpoint `/api/cobrancas/webhook/{provider}` processa as notificações assíncronas de liquidação:
1. Valida a assinatura de autenticidade (HMAC com `webhook_secret`).
2. Localiza a cobrança pelo `nosso_numero` ou `txid`.
3. Altera o status da cobrança para `PAGA_TOTAL`.
4. Registra evento em `cobranca_eventos`.
5. Gera automaticamente o lançamento em `movimentos_financeiros` e concilia o saldo da conta bancária da empresa.
