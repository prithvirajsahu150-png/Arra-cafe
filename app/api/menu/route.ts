import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const items = getMenuItems({ category, search, availableOnly });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Error fetching public menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
