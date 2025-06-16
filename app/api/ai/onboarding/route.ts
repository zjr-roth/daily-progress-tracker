import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '../../../lib/services/perplexityService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInputs } = body;

    if (!userInputs) {
      return NextResponse.json(
        { error: 'User inputs are required' },
        { status: 400 }
      );
    }

    console.log('Generating schedule for user inputs:', userInputs);

    let result;
    try {
      result = await PerplexityService.generateOptimalSchedule(userInputs);
    } catch (apiError) {
      console.warn('Primary API failed, using fallback:', apiError);
      result = await PerplexityService.generateFallbackSchedule(userInputs);
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in AI onboarding route:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

