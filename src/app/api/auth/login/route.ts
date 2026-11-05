import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSignedToken } from '@/lib/auth';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const { username, password } = await request.json();

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

    // Accept either database stored password or standard default
    const validPasswords = [
      user?.passwordHash,
      userId === 'fady' ? 'fady2026' : 'rahma2026',
      '123456',
    ].filter(Boolean);

    const isMatch = validPasswords.includes(password.trim());

    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' }, { status: 401 });
    }

    // Create session token
    const token = createSignedToken({ userId, loggedInAt: Date.now() });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user?.id || userId,
        displayName: user?.displayName || (userId === 'fady' ? 'فادي' : 'رحمة'),
        avatar: user?.avatar || (userId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳'),
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
