import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySecret } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, pin } = await request.json();
    if (!userId || !pin) {
      return NextResponse.json({ success: false, message: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'المستخدم غير موجود' }, { status: 404 });
    }

    const isValid = verifySecret(pin, user.pinHash);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'رمز PIN غير صحيح' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    // Set 1-hour PIN unlock cookie
    response.cookies.set('baytna_pin_token', `${userId}:${Date.now()}`, {
      httpOnly: true,
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
