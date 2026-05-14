import { NextResponse } from 'next/server';
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

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
