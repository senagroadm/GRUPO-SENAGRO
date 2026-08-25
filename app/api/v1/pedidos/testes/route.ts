import { NextRequest, NextResponse } from 'next/server';
import { runPedidoStateMachineTestSuite } from '@/backend/tests/pedido_status_transitions.test';

export async function GET(req: NextRequest) {
  try {
    const testSuiteResult = runPedidoStateMachineTestSuite();
    return NextResponse.json({
      success: true,
      data: testSuiteResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao executar testes do motor de pedidos' },
      { status: 500 }
    );
  }
}
