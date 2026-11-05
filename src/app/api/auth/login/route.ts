import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSignedToken } from '@/lib/auth';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const { username, password, clientSavedPassword } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const userId = (cleanUsername === 'فادي' || cleanUsername === 'fady') ? 'fady' : 
                   (cleanUsername === 'رحمة' || cleanUsername === 'rahma') ? 'rahma' : null;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'اسم المستخدم غير صحيح. هذا النظام خاص بفادي ورحمة فقط.' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'المستخدم غير مسجل' }, { status: 404 });
    }

    // If client had previously saved a new password and server container was reset:
    if (clientSavedPassword && clientSavedPassword !== 'dalida' && user.passwordHash === 'dalida') {
      try {
        user = await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: clientSavedPassword.trim() },
        });
      } catch {}
    }

    const inputPassword = password.trim();
    const currentStoredPassword = user.passwordHash || 'dalida';
    const isInitialDefault = currentStoredPassword.toLowerCase() === 'dalida';

    let isMatch = false;
    if (isInitialDefault) {
      // User has not changed their initial password yet -> accepts 'dalida'
      isMatch = inputPassword.toLowerCase() === 'dalida';
    } else {
      // User has already set a custom password -> ONLY accept the new custom password!
      // 'dalida' is strictly rejected once changed!
      isMatch = inputPassword === currentStoredPassword;
    }

    if (!isMatch) {
      if (!isInitialDefault && inputPassword.toLowerCase() === 'dalida') {
        return NextResponse.json({
          success: false,
          message: 'تم تغيير كلمة المرور سابقاً إلى كلمة جديدة خاصة بك! لم يعد مسموحاً بالدخول بكلمة dalida القديمة. أدخل كلمة مرورك الجديدة.',
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        message: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة',
      }, { status: 401 });
    }

    const isDefaultPassword = isInitialDefault;

    // Create session token
    const token = createSignedToken({ userId, loggedInAt: Date.now() });

    const response = NextResponse.json({
      success: true,
      isDefaultPassword,
      user: {
        id: user.id,
        displayName: user.displayName || (userId === 'fady' ? 'فادي' : 'رحمة'),
        avatar: user.avatar || (userId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳'),
      },
    });

    // Set 30-day authentication cookie
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
