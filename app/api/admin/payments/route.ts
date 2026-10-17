import { NextResponse } from 'next/server';
import { getPayments } from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await getPayments();
    return NextResponse.json({ ok: true, payments });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
