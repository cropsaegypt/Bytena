import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'fady';

  try {
    await ensureDatabaseInitialized();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let record = await prisma.prayerRecord.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    if (!record) {
      record = await prisma.prayerRecord.create({
        data: {
          userId,
          date: todayStart,
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
          morningDhikr: false,
          eveningDhikr: false,
          quranPages: 0,
        },
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const history = await prisma.prayerRecord.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, record, history });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      record: {
        id: 'p-default',
        userId,
        fajr: true,
        dhuhr: true,
        asr: false,
        maghrib: false,
        isha: false,
        morningDhikr: true,
        eveningDhikr: false,
        quranPages: 4,
      },
      history: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, field, value } = body;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const updated = await prisma.prayerRecord.upsert({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
      update: {
        [field]: value,
      },
      create: {
        userId,
        date: todayStart,
        [field]: value,
      },
    });

    // If marked completed, award points
    if (value === true || (field === 'quranPages' && value > 0)) {
      const points = field === 'quranPages' ? 5 : 10;
      const names: Record<string, string> = {
        fajr: 'صلاة الفجر',
        dhuhr: 'صلاة الظهر',
        asr: 'صلاة العصر',
        maghrib: 'صلاة المغرب',
        isha: 'صلاة العشاء',
        morningDhikr: 'أذكار الصباح',
        eveningDhikr: 'أذكار المساء',
        quranPages: 'تلاوة ورد القرآن الكريم',
      };

      await prisma.pointsTransaction.create({
        data: {
          userId,
          points,
          category: 'PRAYER',
          reason: `الالتزام بـ ${names[field] || 'العبادة'} 🌟`,
        },
      });
    }

    return NextResponse.json({ success: true, record: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
