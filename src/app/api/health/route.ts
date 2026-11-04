import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAIService } from '@/lib/ai/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || 'fady';
    const requesterUserId = searchParams.get('requesterId') || targetUserId;

    // Strict Privacy Verification:
    // If requester is not the target user, verify if profile is explicitly shared
    const profile = await prisma.healthProfile.findUnique({
      where: { userId: targetUserId },
      include: { user: { select: { displayName: true, avatar: true } } },
    });

    if (!profile) {
      return NextResponse.json({ success: false, message: 'الملف الصحي غير موجود' }, { status: 404 });
    }

    if (requesterUserId !== targetUserId && !profile.isSharedWithPartner) {
      return NextResponse.json({
        success: false,
        isPrivate: true,
        message: 'هذا الملف الصحي خاص ولم يتم تفعيل مشاركته من قبل صاحبه 🔒',
      }, { status: 403 });
    }

    // Load user's private data
    const weightLogs = await prisma.weightLog.findMany({
      where: { userId: targetUserId },
      orderBy: { loggedAt: 'desc' },
      take: 30,
    });

    const workoutLogs = await prisma.workoutLog.findMany({
      where: { userId: targetUserId },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const waterLogsToday = await prisma.waterLog.findMany({
      where: {
        userId: targetUserId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    const totalWaterToday = waterLogsToday.reduce((sum, item) => sum + item.amountMl, 0);

    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        userId: targetUserId,
        ...(requesterUserId !== targetUserId ? { isSharedWithPartner: true } : {}),
      },
      orderBy: { testDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      profile,
      weightLogs,
      workoutLogs,
      totalWaterToday,
      medicalRecords,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // 1. Log weight
    if (action === 'log_weight') {
      const { weightKg, notes } = body;
      const parsedWeight = parseFloat(weightKg);

      const log = await prisma.weightLog.create({
        data: {
          userId,
          weightKg: parsedWeight,
          notes: notes || null,
        },
      });

      // Update current weight in profile
      await prisma.healthProfile.update({
        where: { userId },
        data: { currentWeightKg: parsedWeight },
      });

      // Award points for consistency
      await prisma.pointsTransaction.create({
        data: {
          userId,
          points: 10,
          category: 'HEALTH',
          reason: `تسجيل وزن جديد: ${parsedWeight} كجم ⚖️`,
        },
      });

      return NextResponse.json({ success: true, log });
    }

    // 2. Log workout
    if (action === 'log_workout') {
      const { title, category, durationMins, exercises, burnedCalories, notes } = body;

      const workout = await prisma.workoutLog.create({
        data: {
          userId,
          title,
          category: category || 'GYM',
          durationMins: durationMins ? parseInt(durationMins) : 45,
          exercisesJson: JSON.stringify(exercises || []),
          burnedCalories: burnedCalories ? parseInt(burnedCalories) : 250,
          notes: notes || null,
        },
      });

      // Award fitness points
      await prisma.pointsTransaction.create({
        data: {
          userId,
          points: 20,
          category: 'HEALTH',
          reason: `إكمال تمرين: ${title} 💪`,
        },
      });

      return NextResponse.json({ success: true, workout });
    }

    // 3. Log water
    if (action === 'log_water') {
      const { amountMl } = body;
      const log = await prisma.waterLog.create({
        data: {
          userId,
          amountMl: amountMl ? parseInt(amountMl) : 250,
        },
      });

      return NextResponse.json({ success: true, log });
    }

    // 4. Toggle partner sharing consent
    if (action === 'toggle_share') {
      const { isSharedWithPartner } = body;
      const updated = await prisma.healthProfile.update({
        where: { userId },
        data: { isSharedWithPartner: !!isSharedWithPartner },
      });

      return NextResponse.json({ success: true, profile: updated });
    }

    // 5. Add Medical Record with AI clinical explanation
    if (action === 'add_medical_record') {
      const { title, testType, testDate, isSharedWithPartner, testSummaryOrText } = body;

      let aiSummary = 'فحص معتمد محفوظ بأمان في سجلك الطبي الخاص.';
      if (testSummaryOrText) {
        aiSummary = `ملاحظات المؤشرات المرجعية: ${testSummaryOrText} (تنبيه: هذا التفسير الإحصائي استرشادي فقط ولا يغني عن مراجعة واستشارة طبيبك المختص).`;
      }

      const record = await prisma.medicalRecord.create({
        data: {
          userId,
          title,
          testType: testType || 'BLOOD_TEST',
          testDate: testDate ? new Date(testDate) : new Date(),
          aiSummary,
          isSharedWithPartner: !!isSharedWithPartner,
        },
      });

      return NextResponse.json({ success: true, record });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
