import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export interface AdminCheckResult {
  isAdmin: boolean;
  session: any;
  error?: { message: string; status: number };
}

export async function checkAdminAuth(): Promise<AdminCheckResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        isAdmin: false,
        session: null,
        error: { message: 'Unauthorized', status: 401 },
      };
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return {
        isAdmin: false,
        session,
        error: { message: 'Forbidden: Admin role required', status: 403 },
      };
    }

    return { isAdmin: true, session };
  } catch (error) {
    return {
      isAdmin: false,
      session: null,
      error: { message: 'Authentication error', status: 500 },
    };
  }
}

export async function requireAdminAuth(req: NextRequest) {
  const adminAuth = await checkAdminAuth();
  if (!adminAuth.isAdmin) {
    return NextResponse.json(
      { error: adminAuth.error?.message },
      { status: adminAuth.error?.status || 401 }
    );
  }
  return null;
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string
) {
  if (details) {
    console.error(`[${status}] ${message}:`, details);
  }

  return NextResponse.json({ error: message }, { status });
}
