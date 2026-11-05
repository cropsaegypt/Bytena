import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySignedToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    const cookieStore = cookies();
    const token = cookieStore.get('baytna_auth_user')?.value || cookieStore.get('baytna_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = verifySignedToken<{ userId: string }>(token);
    if (!payload?.userId) {
      return NextResponse.json({ authenticated: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, displayName: true, avatar: true, role: true },
    });

    return NextResponse.json({
      authenticated: true,
      user: user || {
        id: payload.userId,
        displayName: payload.userId === 'fady' ? 'فادي' : 'رحمة',
        avatar: payload.userId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳',
        role: payload.userId === 'fady' ? 'OWNER_FADY' : 'OWNER_RAHMA',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false });
  }
}
