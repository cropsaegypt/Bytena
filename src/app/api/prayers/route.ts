import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

function getTodayUtcDate(): Date {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function calculateStreak(history: any[]): number {
  if (!history || history.length === 0) return 0;

  // Map of date string -> hadPrayers
  const dayMap = new Map<string, boolean>();
  for (const h of history) {
    const dStr = new Date(h.date).toISOString().split('T')[0];
    const hadPrayer = !!(h.fajr || h.dhuhr || h.asr || h.maghrib || h.isha);
    if (!dayMap.has(dStr)) {
      dayMap.set(dStr, hadPrayer);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let streak = 0;
  let checkDate = new Date();

  // If today has prayers, start with today; otherwise start from yesterday to see current ongoing streak
  const todayPrayed = dayMap.get(todayStr);
  if (todayPrayed) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If today is not completed yet, check if yesterday had prayers
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    if (!dayMap.get(yesterdayStr)) {
      return 0; // broken streak
    }
  }

  // Walk backwards day by day
  for (let i = 0; i < 60; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dayMap.get(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'fady';

  try {
    await ensureDatabaseInitialized();
    const todayDate = getTodayUtcDate();

    let record = await prisma.prayerRecord.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayDate,
        },
      },
    });

    if (!record) {
      record = await prisma.prayerRecord.create({
        data: {
          userId,
          date: todayDate,
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

    const allRecords = await prisma.prayerRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const streakDays = calculateStreak(allRecords);

    const completedTodayCount = [
      record.fajr,
      record.dhuhr,
      record.asr,
      record.maghrib,
      record.isha,
    ].filter(Boolean).length;

    return NextResponse.json({
      success: true,
      record,
      history: allRecords.slice(0, 7),
      streakDays,
      completedTodayCount,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      record: {
        id: 'p-clean',
        userId,
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        morningDhikr: false,
        eveningDhikr: false,
        quranPages: 0,
      },
      history: [],
      streakDays: 0,
      completedTodayCount: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { userId, field, value } = body;

    const todayDate = getTodayUtcDate();

    const updated = await prisma.prayerRecord.upsert({
      where: {
        userId_date: {
          userId,
          date: todayDate,
        },
      },
      update: {
        [field]: value,
      },
      create: {
        userId,
        date: todayDate,
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

      try {
        await prisma.pointsTransaction.create({
          data: {
            userId,
            points,
            category: 'PRAYER',
            reason: `الالتزام بـ ${names[field] || 'العبادة'} 🌟`,
          },
        });
      } catch {}
    }

    const allRecords = await prisma.prayerRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const streakDays = calculateStreak(allRecords);

    return NextResponse.json({
      success: true,
      record: updated,
      streakDays,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
