import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth, createErrorResponse } from '@/lib/adminAuth';
import { sanitizeSVG } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { type } = await params;
    let result;

    switch (type) {
      case 'badges':
        result = await prisma.badge.findMany({
          orderBy: { createdAt: 'desc' },
        });
        break;
      case 'events':
        result = await prisma.event.findMany({
          orderBy: { activeFrom: 'desc' },
        });
        break;
      case 'ranks':
        result = await prisma.rank.findMany({
          orderBy: { type: 'asc' },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return createErrorResponse('Failed to fetch gamification', 500, error.message);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  const { type } = await params;

  try {
    const data = await req.json();

    if (data.svgContent) {
      data.svgContent = sanitizeSVG(data.svgContent);
    }

    let result;

    switch (type) {
      case 'ranks':
        result = await prisma.rank.create({ data });
        break;
      case 'badges':
        result = await prisma.badge.create({ data });
        break;
      case 'events':
        result = await prisma.event.create({ data });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return createErrorResponse('Failed to create gamification item', 500, error.message);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  const { type } = await params;

  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (data.svgContent) {
      data.svgContent = sanitizeSVG(data.svgContent);
    }

    let result;
    switch (type) {
      case 'ranks':
        result = await prisma.rank.update({ where: { id }, data });
        break;
      case 'badges':
        result = await prisma.badge.update({ where: { id }, data });
        break;
      case 'events':
        result = await prisma.event.update({ where: { id }, data });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return createErrorResponse('Failed to update gamification item', 500, error.message);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  const { type } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    switch (type) {
      case 'ranks':
        await prisma.rank.delete({ where: { id } });
        break;
      case 'badges':
        await prisma.badge.delete({ where: { id } });
        break;
      case 'events':
        await prisma.event.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return createErrorResponse('Failed to delete gamification item', 500, error.message);
  }
}
