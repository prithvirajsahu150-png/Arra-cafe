import { NextResponse } from 'next/server';
import { createBooking } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      purpose,
      customPurpose,
      date,
      time,
      guests,
      customer,
      specialRequirements,
      selectedItems,
      totalAmount,
      advanceAmount,
      remainingAmount,
    } = body;

    if (!purpose && !customPurpose) {
      return NextResponse.json({ error: 'Booking purpose is required.' }, { status: 400 });
    }
    if (!date || !time) {
      return NextResponse.json({ error: 'Date and time are required.' }, { status: 400 });
    }
    if (!customer?.name || !customer?.phone) {
      return NextResponse.json({ error: 'Customer name and phone number are required.' }, { status: 400 });
    }

    const bookingId = `ARRA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newBooking = await createBooking({
      bookingId,
      purpose: purpose === 'Other' ? customPurpose : purpose,
      customPurpose,
      date,
      time,
      guests: String(guests),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim() : undefined,
      },
      specialRequirements,
      selectedItems: selectedItems || [],
      totalAmount: Math.round(Number(totalAmount) || 0),
      advanceAmount: Math.round(Number(advanceAmount) || 0),
      remainingAmount: Math.round(Number(remainingAmount) || 0),
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
    });

    return NextResponse.json({ ok: true, bookingId, booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
