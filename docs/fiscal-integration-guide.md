# Guia de Integração Fiscal (NF-e, NFS-e, MDF-e, CT-e)

## 1. Contexto Tributário dos 5 CNPJs

| Empresa | CNPJ | Regime Tributário | Atividade Fiscal Principal |
|---|---|---|---|
| **MWAM Engenharia** | 44.566.045/0001-01 | Lucro Presumido | Emissão de NFS-e (ISS municipal) e NF-e mod 55 (Remessa de materiais/máquinas) |
| **Oliveira e Amorim Distribuição** | 26.200.037/0001-57 | Lucro Real | NF-e mod 55 (Comércio atacadista de chapas, tubos e perfis de aço com ST/ICMS) |
| **Senagro Indústria e Comércio** | 23.280.366/0001-67 | Lucro Real | NF-e mod 55 (Equipamentos agrícolas e peças industriais com IPI, PIS/COFINS monofásico) |
| **Tritech Corte Dobra** | 48.082.502/0001-35 | Lucro Real | NF-e / NFS-e (Industrialização por encomenda - CFOP 5124 / 5902 / 5901) |
| **Tritech Industrial** | 64.036.495/0001-91 | Lucro Real | NF-e mod 55 (Estruturas metálicas de grande porte e caldeiraria pesada) |

## 2. Decisões Pendentes (TODO / decision-needed)

1. **Definição de Provedor de API Fiscal**:
   - `[ ]` Homologar provedor SaaS (FocusNFe / PlugNotas / Nuvem Fiscal) vs Gateway próprio com biblioteca Node.js e certificados A1.
2. **Prefeituras Municipais**:
   - `[ ]` Mapear padrões ABRASF / Ginfes / DSF dos municípios onde MWAM e Tritech possuem inscrição municipal ativa.
3. **Certificados Digitais A1**:
   - `[ ]` Armazenamento seguro de arquivo `.pfx` em cofre criptografado com renovação anual controlada por notificação prévia de 30 dias.
