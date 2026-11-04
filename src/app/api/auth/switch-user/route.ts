import { NextResponse } from 'next/server';
import { createSignedToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!['fady', 'rahma'].includes(userId)) {
      return NextResponse.json({ success: false, message: 'مستخدم غير صالح' }, { status: 400 });
    }

    const token = createSignedToken({ userId, switchedAt: Date.now() });
    const response = NextResponse.json({ success: true, userId });
    
    response.cookies.set('baytna_session', token, {
      httpOnly: true,
      maxAge: 30 * 86400, // 30 days
      path: '/',
      sameSite: 'lax',
    });

    // Reset health pin token on user switch
    response.cookies.delete('baytna_pin_token');

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
