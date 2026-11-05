import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ success: false, message: 'كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPassword.trim() },
    });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح 🔒' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
