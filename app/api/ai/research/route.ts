// app/api/ai/research/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '../../../lib/services/perplexityService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goals } = body;

    // FIXED: Accept goals as string (natural language) instead of requiring array
    if (!goals || typeof goals !== 'string') {
      return NextResponse.json(
        { error: 'Goals string is required' },
        { status: 400 }
      );
    }

    console.log('Researching optimal practices for goals:', goals);

    // FIXED: Pass goals as string to Perplexity service
    const result = await PerplexityService.researchOptimalPractices(goals);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in AI research route:', error);

    // FIXED: Don't expose internal API details to client
    const sanitizedError = error instanceof Error
      ? 'Failed to research optimal practices. Please try again.'
      : 'An unexpected error occurred.';

    return NextResponse.json(
      {
        error: sanitizedError,
        success: false
      },
      { status: 500 }
    );
  }
}