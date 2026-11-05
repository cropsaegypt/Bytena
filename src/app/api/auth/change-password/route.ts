import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSignedToken } from '@/lib/auth';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ success: false, message: 'كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل' }, { status: 400 });
    }

    const cleanPassword = newPassword.trim();

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: cleanPassword },
    });

    const token = createSignedToken({ userId, loggedInAt: Date.now() });

    const response = NextResponse.json({
      success: true,
      message: 'تم تعيين كلمة المرور الجديدة بنجاح! 🔒 تم إيقاف كلمة dalida القديمة ولن تعمل مجدداً.',
    });

    // Set authentication cookies
    response.cookies.set('baytna_auth_user', token, {
      httpOnly: true,
      maxAge: 30 * 86400,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('baytna_session', token, {
      httpOnly: true,
      maxAge: 30 * 86400,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
