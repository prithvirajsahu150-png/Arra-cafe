import { NextResponse } from 'next/server';
import { getOffers } from '@/lib/db';

export async function GET() {
  try {
    // Only return active offers for customer site
    const offers = getOffers(true);
    return NextResponse.json({ ok: true, offers });
  } catch (error) {
    console.error('Error fetching public offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
