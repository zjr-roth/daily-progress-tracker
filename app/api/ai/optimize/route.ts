// app/api/ai/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '../../../lib/services/perplexityService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentTasks, optimizationGoal } = body;

    if (!currentTasks || !optimizationGoal) {
      return NextResponse.json(
        { error: 'Current tasks and optimization goal are required' },
        { status: 400 }
      );
    }

    console.log('Optimizing schedule with goal:', optimizationGoal);

    const result = await PerplexityService.optimizeExistingSchedule(
      currentTasks,
      optimizationGoal
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in AI optimization route:', error);
    return NextResponse.json(
      {
        error: 'Failed to optimize schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}