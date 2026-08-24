# Matriz de Permissões RBAC (Empresa x Módulo x Ação)

## 1. Princípio Tridimensional de Permissões

Toda permissão é avaliada pela tupla:
```
(Empresa_ID, Modulo, Acao)
```

Onde:
- **Ações**: `READ`, `CREATE`, `UPDATE`, `DELETE` (Soft Delete apenas), `APPROVE`, `CANCEL`, `EXPORT`, `ADMIN`.
- **Escopo**: Se `Empresa_ID` for nulo no perfil, aplica-se a todas as empresas nas quais o usuário estiver habilitado na tabela `usuario_empresas`.

## 2. Matriz Padrão de Perfis de Acesso

| Perfil | Escopo Típico | Módulos com Acesso Total | Ações Restritas |
|---|---|---|---|
| **Super Admin do Grupo** | Todas as 5 Empresas | Todos os 20 Módulos | Acesso irrestrito com registro completo em `audit_logs` |
| **Diretor Geral / Industrial** | Todas as 5 Empresas | Comercial, Orçamento, PCP, Produção, Fiscal, Financeiro, BI | `APPROVE` em orçamentos > R$ 50k, `READ` em todos |
| **Gerente de Produção (PCP)** | Por CNPJ (ex.: Tritech Corte) | PCP, Produção, Corte, Dobra, Qualidade, Estoque | Não acessa Financeiro/Fiscal de outros CNPJs |
| **Orçamentista Técnico** | Por CNPJ ou Grupo | Orçamento, Engenharia, Estoque (`READ`) | `CREATE`/`UPDATE` em Orçamentos, sem alçada de aprovação final |
| **Operador de Máquina (Laser/Dobra)** | Por CNPJ (Tritech / Senagro) | Produção, Corte, Dobra (`READ`/`CREATE` Apontamentos) | Sem acesso comercial/financeiro |
| **Analista de Crédito** | Grupo / Financeiro | Crédito/Serasa, Comercial (`READ`), Pedidos (`APPROVE`) | Alçada de aprovação de limite |
| **Comprador / Suprimentos** | Por CNPJ | Compras, Estoque, Fornecedores | `CREATE` ordens de compra, aprovação conforme alçada |
| **Contador / Fiscal** | Todas as 5 Empresas | Fiscal, Financeiro, BI, Almoxarifado | Emissão e conciliação de NF-e, fechamento mensal |
