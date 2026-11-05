import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const { userId, newPin } = await request.json();

    if (!userId || !newPin) {
      return NextResponse.json({ success: false, message: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const cleanPin = String(newPin).trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      return NextResponse.json({ success: false, message: 'رمز الـ PIN يجب أن يتكون من 4 أرقام فقط' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: cleanPin },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تعيين وتحديث رمز الـ PIN الخاص بك بنجاح 🔒',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
