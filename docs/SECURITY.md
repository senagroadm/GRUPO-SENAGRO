# NEXUS ERP — Arquitetura e Políticas de Segurança (Security Blueprint)

Este documento detalha as decisões técnicas, camadas defensivas e diretrizes de conformidade implementadas no **NEXUS ERP Industrial Multiempresa** para os ambientes de **Desenvolvimento (DEV)**, **Homologação (STAGING)** e **Produção (PROD)**.

---

## 1. Matriz de Perfis de Segurança por Ambiente

| Diretriz / Camada | DEV (Local / Dev Server) | STAGING (Homologação) | PROD (Produção) |
|---|---|---|---|
| **Ambiente (`NODE_ENV`)** | `development` | `staging` | `production` |
| **Origens CORS Permitidas** | `http://localhost:3000`, `127.0.0.1` | Domínios internos `*.nexuserp.internal` | Domínios restritos `https://*.nexuserp.com.br` |
| **HSTS (`Strict-Transport-Security`)** | Desativado | Ativo (1 ano) + includeSubDomains | Ativo (1 ano) + Preload |
| **Content Security Policy (CSP)** | Permissivo para depuração | Estrito (`default-src 'self'`) | Estrito com restrição total de iframes e fontes |
| **Rate Limit Geral (por IP)** | 300 req/min | 150 req/min | 100 req/min |
| **Rate Limit Auth/Login (por IP)** | 30 req/min | 10 req/min | 5 req/min (Anti-Brute-Force) |
| **Timeout de Requisição** | 30 segundos | 15 segundos | 10 segundos |
| **Limite Máximo de Upload** | 15 MB | 10 MB | 10 MB |
| **Comprimento Mínimo de Senha** | 8 caracteres | 10 caracteres | 12 caracteres (Maiúsc., Minúsc., Núm., Simb.) |
| **MFA Obrigatório para Papéis Críticos** | Opcional | Obrigatório | Obrigatório (`SUPERADMIN`, `DIRETOR_FINANCEIRO`, `RESPONSAVEL_FISCAL`) |
| **Exibição de Stack Trace em Erros** | Ativo (apenas depuração) | Oculto (Anti-Leak) | Oculto (Anti-Leak) |
| **Mascaramento de Dados Sensíveis (Logs)** | Ativo | Ativo | Ativo |

---

## 2. Validação Estrita no Startup (`backend/config/env.ts`)

- **Falha Rápida (Fail-Fast)**: Em ambientes `production` e `staging`, qualquer variável de ambiente obrigatória ausente, formato inválido de URL ou uso de segredos fracos/padrão (`JWT_SECRET` com menos de 32 caracteres ou contendo "development") interrompe a inicialização imediatamente com `[ConfigStartupFatal]`.
- **Zero Credenciais Hardcoded**: Todas as chaves e certificados são carregados via variáveis de ambiente tipadas e validadas através de schemas Zod.

---

## 3. Headers HTTP de Segurança & CORS Restritivo

Implementados no middleware `createSecureHandler` e `backend/core/security/headers.ts`:

1. **`X-Content-Type-Options: nosniff`**: Impede que navegadores adivinhem o MIME-type de arquivos servidos.
2. **`X-Frame-Options: DENY`**: Previne ataques de Clickjacking ao proibir renderização em iframes não autorizados.
3. **`X-XSS-Protection: 1; mode=block`**: Filtro legado contra ataques XSS em clientes antigos.
4. **`Referrer-Policy: strict-origin-when-cross-origin`**: Evita vazamento de URLs internas com parâmetros no cabeçalho `Referer`.
5. **`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`**: Desativa o acesso a sensores e recursos periféricos desnecessários no ERP.
6. **`Cache-Control: no-store, no-cache, must-revalidate`**: Garante que respostas de API contendo dados financeiros ou fiscais não permaneçam no cache do navegador ou proxies intermediários.
7. **CORS Restritivo Dinâmico**: O cabeçalho `Access-Control-Allow-Origin` valida estritamente a origem contra a whitelist do ambiente ativo, rejeitando origens desconhecidas.

---

## 4. Rate Limiting e Proteção Anti-Abuso (`backend/core/security/rate-limit.ts`)

- Implementação em memória com janelas deslizantes (`InMemoryRateLimiter`) com suporte transparente a migração para Redis.
- Diferenciação entre endpoints gerais de consulta e rotas críticas de autenticação (`endpointType: 'auth'`), reduzindo drasticamente a viabilidade de ataques de força bruta ou credential stuffing.
- Retorno de cabeçalhos RFC padrão: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset` e `Retry-After`.

---

## 5. Rastreabilidade, Request-ID e Logs Estruturados com Mascaramento

- **`x-request-id` e `x-correlation-id`**: Cada requisição carrega identificadores únicos para correlacionar chamadas entre frontend, backend e serviços externos.
- **Mascaramento Automático (`backend/core/security/masking.ts`)**:
  - Chaves sensíveis (`password`, `senha`, `token`, `secret`, `apiKey`, `authorization`, `cvv`) são automaticamente substituídas por `[REDACTED]`.
  - Dados pessoais (CPF: `123.***.***-99`, CNPJ: `44.566.***/***0001-01`) recebem ofuscação parcial para conformidade com a LGPD (Lei Geral de Proteção de Dados).
- **Sem Vazamento de Stack Trace em Produção**: O formatador `formatErrorResponse` suprime stacks e mensagens de exceções de baixo nível (como erros de driver de banco) em produção, retornando apenas códigos de erro seguros e o `requestId` para correlação interna.

---

## 6. Sanitização de Payloads, Validação Zod e Limite de Upload

- **Anti-XSS & HTML Injection**: Sanitizador recursivo em `backend/core/security/sanitization.ts` remove tags `<script>`, pseudo-protocolos `javascript:` e manipuladores inline `onclick=`.
- **Validação de Schema (Zod)**: Todas as entradas de endpoints são validadas de forma determinística antes de atingir as camadas de domínio ou persistência.
- **Timeout Proativo (`withTimeout`)**: Previne starvation de threads Node.js por operações I/O demoradas.
- **Limite de Payload (`validateUploadSize`)**: Interrompe requisições cujo `Content-Length` exceda o limite do ambiente (10 MB em PROD) com status `413 Payload Too Large`.

---

## 7. Política de Senhas Robusta (`backend/core/security/password-policy.ts`)

- **Exigências em Produção**:
  - Mínimo de 12 caracteres.
  - Pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.
  - Bloqueio de repetições consecutivas (máximo 2 caracteres idênticos em sequência).
  - Bloqueio de senhas comuns e fracas (dicionário de senhas padrão).
- **Pontuação de Força (Entropy Score)**: Avaliação de 0 a 100 retornada em diagnósticos para feedback em tempo real no cadastro de usuários.

---

## 8. Suporte a MFA (Multi-Factor Authentication) para Perfis Críticos

- **Arquitetura Desacoplada (`backend/core/security/mfa.ts`)**:
  - Interface `IMfaProvider` pronta para integração com provedores TOTP (RFC 6238), WebAuthn/FIDO2 ou SMS.
  - Ativação automática de obrigatoriedade nos ambientes de Homologação e Produção para os papéis de maior privilégio: `SUPERADMIN`, `DIRETOR_FINANCEIRO` e `RESPONSAVEL_FISCAL`.
  - Controle de expiração da sessão secundária de MFA (2 horas em PROD).

---

## 9. Evidências de Testes de Segurança Automatizados

Executados via `vitest run tests/unit/security.test.ts`:

```text
✓ tests/unit/security.test.ts (14 tests passed)
  ✓ 1. Password Policy Validation
    ✓ should reject passwords shorter than min length
    ✓ should reject common weak passwords
    ✓ should require uppercase, lowercase, numbers, and symbols in production
    ✓ should accept strong compliant password in production
  ✓ 2. Sensitive Data Masking
    ✓ should mask simple strings appropriately
    ✓ should mask sensitive keys in nested object payloads
  ✓ 3. Rate Limiting Control
    ✓ should allow requests within rate limit window
    ✓ should block requests exceeding threshold
  ✓ 4. Security Headers and Restrictive CORS
    ✓ should produce OWASP recommended security headers in production
    ✓ should enforce strict CORS origin validation
  ✓ 5. Input Sanitization & Upload Limits
    ✓ should strip malicious script tags and event handlers
    ✓ should sanitize nested payload objects
    ✓ should throw PayloadTooLargeError when Content-Length exceeds threshold
  ✓ 6. MFA Policy & Extension Point
    ✓ should identify critical roles requiring MFA in staging/prod
    ✓ should validate 6-digit TOTP verification token pattern
  ✓ 7. Safe Error Formatting without Stack Leaks
    ✓ should hide stack trace for generic errors in production environment
    ✓ should preserve controlled AppError details safely
```
