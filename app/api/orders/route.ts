import { NextResponse } from 'next/server';
import { createPayment } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, totalAmount, paymentMethod } = body;

    if (!customer?.name || !customer?.phone) {
      return NextResponse.json({ error: 'Customer details are required.' }, { status: 400 });
    }

    const orderId = `ARRA-ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Record payment
    const payment = await createPayment({
      paymentReference: `PAY-ORD-${Date.now().toString().slice(-6)}`,
      orderId,
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      type: 'Food Delivery',
      amount: Math.round(Number(totalAmount) || 0),
      status: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      method: paymentMethod || 'COD',
    });

    return NextResponse.json({ ok: true, orderId, payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer order:', error);
    return NextResponse.json({ error: 'Failed to record order' }, { status: 500 });
  }
}
