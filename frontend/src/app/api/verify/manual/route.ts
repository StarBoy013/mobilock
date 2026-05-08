import { NextResponse } from 'next/server';
import { verifyManualCode } from '@/lib/verification-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { manualCode } = body;

    if (!manualCode || typeof manualCode !== 'string') {
      return NextResponse.json(
        { result: 'invalid', reason: 'Invalid request: manualCode is required' },
        { status: 400 }
      );
    }

    const result = verifyManualCode(manualCode);

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { result: 'invalid', reason: 'Server error' },
      { status: 500 }
    );
  }
}
