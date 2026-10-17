import { NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { bookingStatus, paymentStatus } = body;

    const validBookingStatuses = ['Payment Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (bookingStatus && !validBookingStatuses.includes(bookingStatus)) {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 });
    }

    const updated = updateBookingStatus(id, bookingStatus, paymentStatus);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, booking: updated });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}
