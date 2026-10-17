import { NextResponse } from 'next/server';
import { getOffers, createOffer } from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offers = await getOffers();
    return NextResponse.json({ ok: true, offers });
  } catch (error) {
    console.error('Error fetching admin offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, discount, couponCode, startDate, endDate, active, offerType } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Offer title is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Offer description is required.' }, { status: 400 });
    }
    if (!discount || !discount.trim()) {
      return NextResponse.json({ error: 'Discount/value is required.' }, { status: 400 });
    }

    const newOffer = await createOffer({
      title: title.trim(),
      description: description.trim(),
      discount: discount.trim(),
      couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
      startDate: startDate || null,
      endDate: endDate || null,
      active: active !== undefined ? Boolean(active) : true,
      offerType: offerType || 'PERCENTAGE',
    });

    return NextResponse.json({ ok: true, offer: newOffer }, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}
