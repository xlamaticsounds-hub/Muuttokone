import { NextResponse } from 'next/server';

export async function GET() {
  // Auth removed - return basic API status
  return NextResponse.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
}
