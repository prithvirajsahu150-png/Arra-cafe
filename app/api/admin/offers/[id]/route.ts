import { NextResponse } from 'next/server';
import { updateOffer, deleteOffer, toggleOfferActive, getOfferById } from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const offer = getOfferById(id);
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, offer });
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, discount, couponCode, startDate, endDate, active, offerType } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (discount !== undefined) updates.discount = discount.trim();
    if (couponCode !== undefined) updates.couponCode = couponCode ? couponCode.trim().toUpperCase() : null;
    if (startDate !== undefined) updates.startDate = startDate || null;
    if (endDate !== undefined) updates.endDate = endDate || null;
    if (active !== undefined) updates.active = Boolean(active);
    if (offerType !== undefined) updates.offerType = offerType;

    const updated = updateOffer(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, offer: updated });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updated = toggleOfferActive(id);
    if (!updated) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, offer: updated });
  } catch (error) {
    console.error('Error toggling offer status:', error);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = deleteOffer(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
  }
}
