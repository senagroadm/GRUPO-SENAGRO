import { CatalogoProduto, listarProdutosCatalogoAction } from '../../../app/actions/catalogo-actions';

export const PRODUTOS_CATALOGO_FALLBACK: CatalogoProduto[] = [
  {
    id: 'prd-001',
    empresaId: 'emp-tritech-matriz',
    codigo: 'CHP-A36-635',
    nome: 'Chapa de Aço Carbono ASTM A36 1/4" (6.35mm)',
    descricaoTecnica: 'Chapa laminada a quente para conformação mecânica, caldeiraria e estruturas soldadas pesadas.',
    especificacoes: {
      material: 'Aço Carbono ASTM A36',
      espessura_mm: 6.35,
      dimensoes_padrao: '1500 x 6000 mm',
      densidade_g_cm3: 7.85,
      limite_escoamento_mpa: 250,
      acabamento: 'Laminado a Quente (Preto)',
      certificacao: 'NBR 6648 / ASTM A36',
    },
    precoBase: 1250.0,
    imagemUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prd-002',
    empresaId: 'emp-tritech-matriz',
    codigo: 'TUB-INOX-304-2POL',
    nome: 'Tubo Industrial Inox 304 Redondo 2" Sch 10',
    descricaoTecnica: 'Tubo sem costura em aço inoxidável austenítico com alta resistência à corrosão intergranular.',
    especificacoes: {
      material: 'Aço Inox AISI 304',
      diametro_externo_pol: '2.0"',
      espessura_parede_mm: 2.77,
      comprimento_barra_m: 6.0,
      norma: 'ASTM A312 / ASME SA312',
      acabamento: 'Decapado / Fosco',
      pressao_trabalho_bar: 64,
    },
    precoBase: 485.5,
    imagemUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prd-003',
    empresaId: 'emp-tritech-matriz',
    codigo: 'PRF-W-200X22',
    nome: 'Viga Perfil I / W 200 x 22.5 kg/m',
    descricaoTecnica: 'Perfil estrutural soldado e laminado de abas paralelas para pilares, vigamentos e galpões industriais.',
    especificacoes: {
      material: 'Aço ASTM A572 Grau 50',
      altura_alma_mm: 200,
      largura_aba_mm: 100,
      massa_linear_kg_m: 22.5,
      modulo_resistencia_wx_cm3: 181.0,
      norma: 'ASTM A6 / NBR 15980',
    },
    precoBase: 890.0,
    imagemUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'prd-004',
    empresaId: 'emp-tritech-matriz',
    codigo: 'FLG-SO-150-ANSI',
    nome: 'Flange Sobreposto (Slip-On) ANSI B16.5 150# 4"',
    descricaoTecnica: 'Flange forjado para união flangeada de tubulações com ressalto de vedação RF.',
    especificacoes: {
      material: 'Aço Forjado ASTM A105',
      classe_pressao: '150 LBS',
      diametro_nominal: '4" (DN 100)',
      tipo_face: 'RF (Raised Face)',
      furos_fixacao: 8,
      norma_dimensional: 'ASME B16.5',
    },
    precoBase: 320.0,
    imagemUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
];

export async function buscarCatalogoComFallback(empresaId: string): Promise<CatalogoProduto[]> {
  try {
    const res = await listarProdutosCatalogoAction(empresaId);
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err: unknown) {
    console.warn('Utilizando catálogo padrão offline/demonstração:', err instanceof Error ? err.message : err);
  }
  return PRODUTOS_CATALOGO_FALLBACK;
}
