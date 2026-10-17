import { NextResponse } from 'next/server';
import { getMenuItems, createMenuItem } from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const items = await getMenuItems({ category, search });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Error fetching admin menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, price, image, description, available } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Item name is required.' }, { status: 400 });
    }
    if (!category || !category.trim()) {
      return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: 'A valid non-negative price is required.' }, { status: 400 });
    }

    const newItem = await createMenuItem({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category: category.trim(),
      price: Math.round(Number(price)),
      image: image || null,
      description: description ? description.trim() : '',
      available: available !== undefined ? Boolean(available) : true,
    });

    return NextResponse.json({ ok: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
