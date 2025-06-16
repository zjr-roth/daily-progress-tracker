// app/api/ai/research/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '../../../lib/services/perplexityService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goals } = body;

    if (!goals || !Array.isArray(goals)) {
      return NextResponse.json(
        { error: 'Goals array is required' },
        { status: 400 }
      );
    }

    console.log('Researching optimal practices for goals:', goals);

    const result = await PerplexityService.researchOptimalPractices(goals);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in AI research route:', error);
    return NextResponse.json(
      {
        error: 'Failed to research optimal practices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}