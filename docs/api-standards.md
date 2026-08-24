# Padrões de API & Protocolos de Comunicação (v1)

## 1. Versionamento de Endpoints
Todas as rotas de API residem sob o prefixo `/api/v1/*`.
Exemplo:
- `GET /api/v1/health`
- `GET /api/v1/auth/me`
- `GET /api/v1/companies`

## 2. Cabeçalhos HTTP Obrigatórios e Opcionais

| Cabeçalho | Tipo | Descrição |
|---|---|---|
| `x-request-id` | Retornado / Opcional no envio | Identificador único da requisição (ex: `req-m0x1-a7bc`) |
| `x-correlation-id` | Retornado / Opcional no envio | ID de correlação para rastreabilidade distribuída de ponta a ponta |
| `x-empresa-id` | Opcional | UUID da empresa ativa na sessão multi-tenant |
| `Authorization` | Opcional | `Bearer <token>` com credenciais de autenticação |

## 3. Padrão de Resposta de Sucesso

```json
{
  "success": true,
  "data": { ... },
  "requestId": "req-m0x1-a7bc",
  "timestamp": "2026-08-24T21:40:00.000Z"
}
```

## 4. Padrão de Resposta Paginada

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "requestId": "req-m0x1-a7bc",
  "timestamp": "2026-08-24T21:40:00.000Z"
}
```

## 5. Padrão de Resposta de Erro (RFC 7807)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Falha na validação do schema de entrada",
    "statusCode": 422,
    "details": [
      {
        "field": "cnpj",
        "message": "CNPJ deve ter formato válido XX.XXX.XXX/XXXX-XX",
        "rule": "invalid_string"
      }
    ]
  },
  "requestId": "req-m0x1-a7bc",
  "timestamp": "2026-08-24T21:40:00.000Z"
}
```
