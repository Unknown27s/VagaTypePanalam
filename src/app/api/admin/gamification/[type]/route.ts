import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
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
    console.error('Create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

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
    console.error('Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
