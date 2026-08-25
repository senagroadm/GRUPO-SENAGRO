import { describe, it, expect } from 'vitest';
import { engenhariaService } from '../../backend/modules/engenharia/engenharia-service';

describe('Engenharia de Produto & Processos - Regras de Negócio Industriais', () => {
  const empresaId = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica

  it('1. Deve criar projeto com Revisão Inicial (Rev 00) ativa e versões sequenciais', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-TESTE-VASO-01',
      titulo: 'Vaso de Pressão Horizontal 10m³',
      descricao: 'Vaso para ar comprimido industrial',
      clienteNome: 'Petrobras S.A.',
      responsavelNome: 'Eng. Roberto Alcantara',
      categoria: 'RESERVATORIO_SILO',
      itensIniciaisBOM: [
        {
          codigo: 'MP-CH-A516-12.7',
          descricao: 'Chapa Aço ASTM A516 Gr 70 12.7mm x 2000 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 2,
          unidadeMedida: 'CHAPA',
          percentualPerda: 5.0,
          custoUnitarioEstimado: 3800.0,
          pesoUnitarioKg: 1195.0,
        },
      ],
      operacoesIniciaisRoteiro: [
        {
          sequencia: 10,
          operacaoNome: 'Calandragem de Casco Cilíndrico',
          setor: 'CALDEIRARIA_SOLDA',
          maquina: 'Calandra 4 Rolos 2500mm',
          ferramenta: 'Rolos Aço Forjado',
          tempoPreparacaoMinutos: 30,
          tempoOperacaoMinutos: 90,
          custoHoraMaquina: 260.0,
          instrucaoTecnica: 'Controlar raio de curvatura R=1000mm',
        },
      ],
    });

    expect(prj.projeto.codigo).toBe('PRJ-TESTE-VASO-01');
    expect(prj.revisaoAtiva).toBeDefined();
    expect(prj.revisaoAtiva?.versao).toBe('Rev 00');
    expect(prj.revisaoAtiva?.ativa).toBe(true);
    expect(prj.revisoes.length).toBe(1);
  });

  it('2. BOM deve suportar componentes, quantidades e cálculo de perdas técnicas', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-BOM-PERDAS',
      titulo: 'Chassi Teste Perdas',
      descricao: 'Teste de cálculo de perdas',
      clienteNome: 'Cliente Teste',
      responsavelNome: 'Eng. Teste',
      categoria: 'ESTRUTURA_METALICA',
    });

    const rev0Id = prj.revisaoAtiva!.id;

    // Adicionar item com quantidade líquida 4 e 10% de perda
    const estruturaAtualizada = engenhariaService.adicionarItemBOM(
      empresaId,
      rev0Id,
      {
        codigo: 'MP-CH-1020-6.35',
        descricao: 'Chapa SAE 1020 6.35mm',
        tipoItem: 'MATERIA_PRIMA',
        quantidadeLiquida: 4,
        unidadeMedida: 'CHAPA',
        percentualPerda: 10, // 10% de perda técnica
        custoUnitarioEstimado: 1000.0,
        pesoUnitarioKg: 100.0,
      },
      'Engenheiro Teste'
    );

    const item = estruturaAtualizada.itens.find((i) => i.codigo === 'MP-CH-1020-6.35');
    expect(item).toBeDefined();
    expect(item?.quantidadeLiquida).toBe(4);
    expect(item?.percentualPerda).toBe(10);
    // Quantidade Bruta = 4 * (1 + 10/100) = 4.4
    expect(item?.quantidadeBruta).toBe(4.4);
    // Custo Total = 4.4 * 1000 = 4400
    expect(item?.custoTotalItem).toBe(4400.0);
    // Peso Total = 4.4 * 100 = 440
    expect(item?.pesoTotalKg).toBe(440.0);
  });

  it('3. Roteiro deve suportar sequência, operação, setor, máquina, ferramenta e tempos padrão (setup + ciclo)', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-ROTEIRO-TEST',
      titulo: 'Teste de Roteiro',
      descricao: 'Validação de tempos padrão',
      clienteNome: 'Cliente Teste',
      responsavelNome: 'Eng. Processos',
      categoria: 'MAQUINARIO_INDUSTRIAL',
    });

    const rev0Id = prj.revisaoAtiva!.id;

    const roteiroAtualizado = engenhariaService.adicionarOperacaoRoteiro(
      empresaId,
      rev0Id,
      {
        sequencia: 20,
        operacaoNome: 'Usinagem de Roscas e Guias',
        setor: 'USINAGEM',
        maquina: 'Centro CNC Romi D800',
        ferramenta: 'Macho Rosca M12 Metal Duro',
        tempoPreparacaoMinutos: 25,
        tempoOperacaoMinutos: 35,
        custoHoraMaquina: 300.0,
        instrucaoTecnica: 'Tolerância ISO 2768-m',
      },
      'Eng. Processos'
    );

    const op = roteiroAtualizado.operacoes.find((o) => o.sequencia === 20);
    expect(op).toBeDefined();
    expect(op?.operacaoNome).toBe('Usinagem de Roscas e Guias');
    expect(op?.setor).toBe('USINAGEM');
    expect(op?.maquina).toBe('Centro CNC Romi D800');
    expect(op?.ferramenta).toBe('Macho Rosca M12 Metal Duro');
    expect(op?.tempoPreparacaoMinutos).toBe(25);
    expect(op?.tempoOperacaoMinutos).toBe(35);
    // Tempo padrão = 25 + 35 = 60 min
    expect(op?.tempoPadraoTotalMinutos).toBe(60);
    // Custo total operação = (60 / 60) * 300 = 300
    expect(op?.custoTotalOperacao).toBe(300.0);
  });

  it('4. Arquivos técnicos devem ser vinculados por projeto e revisão', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-ARQ-TEST',
      titulo: 'Teste de Arquivos Técnicos',
      descricao: 'Validação de vínculo por projeto/revisão',
      clienteNome: 'Cliente Teste',
      responsavelNome: 'Eng. CAD',
      categoria: 'CHASSI_VEICULAR',
    });

    const rev0Id = prj.revisaoAtiva!.id;

    const arq = engenhariaService.vincularArquivoTecnico(empresaId, {
      projetoId: prj.projeto.id,
      revisaoId: rev0Id,
      nomeArquivo: 'DESENHO-CONJUNTO-R00.dwg',
      tipo: 'DESENHO_2D',
      formato: 'DWG',
      autor: 'Eng. CAD',
    });

    expect(arq.projetoId).toBe(prj.projeto.id);
    expect(arq.revisaoId).toBe(rev0Id);
    expect(arq.revisaoVersao).toBe('Rev 00');
    expect(arq.formato).toBe('DWG');

    const detalhado = engenhariaService.obterProjetoDetalhado(empresaId, prj.projeto.id, rev0Id);
    expect(detalhado?.arquivos.some((a) => a.id === arq.id)).toBe(true);
  });

  it('5. Imutabilidade: Criar nova revisão NÃO deve apagar ou alterar a revisão anterior', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-IMUTABILIDADE',
      titulo: 'Projeto Imutabilidade',
      descricao: 'Teste de preservação histórica',
      clienteNome: 'Cliente Teste',
      responsavelNome: 'Eng. Responsável',
      categoria: 'ESTRUTURA_METALICA',
      itensIniciaisBOM: [
        {
          codigo: 'ITEM-BASE-01',
          descricao: 'Componente Base',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 1,
          unidadeMedida: 'UN',
          percentualPerda: 0,
          custoUnitarioEstimado: 500,
          pesoUnitarioKg: 20,
        },
      ],
    });

    const rev0Id = prj.revisaoAtiva!.id;

    // Criar nova versão Rev 01
    const prjComRev1 = engenhariaService.criarNovaRevisao(empresaId, prj.projeto.id, {
      descricaoModificacoes: 'Modificação de alívio estrutural',
      motivoRevisao: 'Evolução de projeto',
      criadoPor: 'Eng. Inovação',
    });

    expect(prjComRev1.revisoes.length).toBe(2);
    const rev0Encontrada = prjComRev1.revisoes.find((r) => r.versao === 'Rev 00');
    const rev1Encontrada = prjComRev1.revisoes.find((r) => r.versao === 'Rev 01');

    expect(rev0Encontrada).toBeDefined();
    expect(rev1Encontrada).toBeDefined();
    expect(rev1Encontrada?.versao).toBe('Rev 01');
    expect(rev1Encontrada?.status).toBe('RASCUNHO');

    // A Rev 00 continua existindo e com seus dados preservados
    const detalheRev0 = engenhariaService.obterProjetoDetalhado(empresaId, prj.projeto.id, rev0Id);
    expect(detalheRev0?.estruturaBOM?.itens.length).toBe(1);
    expect(detalheRev0?.estruturaBOM?.itens[0].codigo).toBe('ITEM-BASE-01');
  });

  it('6. Regra de Unicidade: Apenas uma revisão pode estar ativa para cada projeto', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-UNICIDADE-TEST',
      titulo: 'Teste de Unicidade de Revisão',
      descricao: 'Garantir que apenas 1 revisão seja ativa',
      clienteNome: 'Cliente A',
      responsavelNome: 'Eng. Chefe',
      categoria: 'ESTRUTURA_METALICA',
    });

    const rev0Id = prj.revisaoAtiva!.id;

    // Criar Rev 01
    const prjRev1 = engenhariaService.criarNovaRevisao(empresaId, prj.projeto.id, {
      descricaoModificacoes: 'Alteração para versão 2',
      motivoRevisao: 'Melhoria de processo',
      criadoPor: 'Eng. Chefe',
    });

    const rev1Id = prjRev1.revisaoSelecionada!.id;

    // Ativar a Rev 01
    const prjAtivado = engenhariaService.ativarRevisao(empresaId, prj.projeto.id, rev1Id, {
      aprovadorNome: 'Diretoria de Engenharia',
    });

    // Validar que Rev 01 está ativa
    const rev1 = prjAtivado.revisoes.find((r) => r.id === rev1Id);
    expect(rev1?.ativa).toBe(true);
    expect(rev1?.status).toBe('ATIVA');

    // Validar que Rev 00 agora é inativa e ficou obsoleta
    const rev0 = prjAtivado.revisoes.find((r) => r.id === rev0Id);
    expect(rev0?.ativa).toBe(false);
    expect(rev0?.status).toBe('OBSOLETA');

    // Validar que apenas 1 revisão no projeto tem ativa = true
    const revisoesAtivas = prjAtivado.revisoes.filter((r) => r.ativa);
    expect(revisoesAtivas.length).toBe(1);
  });

  it('7. Ordem de Produção (OP) deve registrar e congelar qual revisão foi usada', () => {
    const prj = engenhariaService.criarProjeto(empresaId, {
      codigo: 'PRJ-OP-RASTREIO',
      titulo: 'Projeto para Teste de OP',
      descricao: 'Teste de congelamento de revisão em OP',
      clienteNome: 'Cliente OP',
      responsavelNome: 'Eng. PCP',
      categoria: 'CHASSI_VEICULAR',
    });

    const op1 = engenhariaService.emitirOrdemProducaoComRevisao(empresaId, prj.projeto.id, {
      quantidade: 5,
      numeroOpCustomizado: 'OP-2026-0010',
      usuarioNome: 'PCP Fábrica',
    });

    expect(op1.numeroOp).toBe('OP-2026-0010');
    expect(op1.revisaoVersao).toBe('Rev 00'); // Gravou que usou a Rev 00

    // Criar e ativar Rev 01
    const prjRev1 = engenhariaService.criarNovaRevisao(empresaId, prj.projeto.id, {
      descricaoModificacoes: 'Rev 01 para lote 2',
      motivoRevisao: 'Evolução',
      criadoPor: 'Engenheiro',
    });
    engenhariaService.ativarRevisao(empresaId, prj.projeto.id, prjRev1.revisaoSelecionada!.id, {
      aprovadorNome: 'Diretoria',
    });

    // Emitir nova OP sob a Rev 01
    const op2 = engenhariaService.emitirOrdemProducaoComRevisao(empresaId, prj.projeto.id, {
      quantidade: 10,
      numeroOpCustomizado: 'OP-2026-0020',
      usuarioNome: 'PCP Fábrica',
    });

    expect(op2.numeroOp).toBe('OP-2026-0020');
    expect(op2.revisaoVersao).toBe('Rev 01'); // Gravou que usou a Rev 01

    // A OP 1 antiga continua intacta gravando Rev 00
    const prjDetalhe = engenhariaService.obterProjetoDetalhado(empresaId, prj.projeto.id);
    const op1Buscada = prjDetalhe?.ordensProducao.find((op) => op.numeroOp === 'OP-2026-0010');
    expect(op1Buscada?.revisaoVersao).toBe('Rev 00');
  });
});
