import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, PNG, WEBP, or GIF.' },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || (file.type === 'image/webp' ? '.webp' : file.type === 'image/png' ? '.png' : '.jpg');
    const safeBaseName = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 30);
    const fileName = `${safeBaseName || 'food'}-${Date.now()}${ext}`;

    // ------------------------------------------------------------------------
    // STORAGE PROVIDER 1: Vercel Blob Storage (Official Vercel Production Solution)
    // ------------------------------------------------------------------------
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`menu/${fileName}`, file, {
        access: 'public',
        contentType: file.type,
      });
      return NextResponse.json({ ok: true, url: blob.url });
    }

    // ------------------------------------------------------------------------
    // STORAGE PROVIDER 2: Cloudinary (Alternative Production Solution)
    // ------------------------------------------------------------------------
    if (
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
    ) {
      if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ url: process.env.CLOUDINARY_URL });
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'arra_cafe/menu',
            public_id: `${safeBaseName || 'food'}-${Date.now()}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Cloudinary upload returned empty result'));
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({ ok: true, url: uploadResult.secure_url });
    }

    // ------------------------------------------------------------------------
    // STORAGE PROVIDER 3: Local Filesystem (Local Development Only)
    // ------------------------------------------------------------------------
    if (!process.env.VERCEL) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'menu');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/menu/${fileName}`;
      return NextResponse.json({ ok: true, url: publicUrl });
    }

    // ------------------------------------------------------------------------
    // GUARD: Running on Vercel without production blob storage configured
    // ------------------------------------------------------------------------
    return NextResponse.json(
      {
        error:
          'Persistent cloud storage is not configured for photo uploads. Please add BLOB_READ_WRITE_TOKEN (Vercel Blob) or CLOUDINARY_URL in Vercel Environment Variables.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('File upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload photo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
