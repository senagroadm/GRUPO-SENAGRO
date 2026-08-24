# Especificação de Cobrança Bancária e CNAB 240/400

## 1. Padrões de Cobrança Suportados

O módulo financeiro do ERP suporta:
1. **Cobrança Registrada CNAB 400**: Padrão tradicional para remessas e retornos de títulos com código de barras FEBRABAN.
2. **Cobrança Registrada CNAB 240**: Padrão com segmentos P, Q, R para integração em lote com bancos estatais e privados.
3. **PIX Dinâmico com QRCode no Boleto (Boleto Híbrido)**: Geração de chave PIX vinculada ao Nosso Número para liquidação instantânea.

## 2. Decisões Pendentes (TODO / decision-needed)

- `[ ]` Homologar layouts de remessa/retorno dos bancos com contas ativas para cada uma das 5 empresas (ex.: Itaú 341, Banco do Brasil 001, Bradesco 237, Santander 033, Sicoob 756).
- `[ ]` Definir se a comunicação inicial será por upload/download manual de arquivos `.REM` / `.RET` ou por APIs bancárias de Open Finance (webhook de liquidação em tempo real).
