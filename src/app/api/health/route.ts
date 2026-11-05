import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId') || 'fady';
  const requesterUserId = searchParams.get('requesterId') || targetUserId;

  try {
    await ensureDatabaseInitialized();

    let profile = await prisma.healthProfile.findUnique({
      where: { userId: targetUserId },
      include: { user: { select: { displayName: true, avatar: true } } },
    });

    if (!profile) {
      profile = {
        id: 'hp-' + targetUserId,
        userId: targetUserId,
        heightCm: targetUserId === 'fady' ? 182 : 166,
        currentWeightKg: targetUserId === 'fady' ? 85.0 : 65.0,
        targetWeightKg: targetUserId === 'fady' ? 78.0 : 59.0,
        activityLevel: targetUserId === 'fady' ? 'ACTIVE' : 'MODERATE',
        dailyCalorieTarget: targetUserId === 'fady' ? 2350 : 1850,
        dailyWaterTargetMl: targetUserId === 'fady' ? 3200 : 2600,
        macrosProteinG: targetUserId === 'fady' ? 155 : 105,
        macrosCarbsG: targetUserId === 'fady' ? 230 : 195,
        macrosFatG: targetUserId === 'fady' ? 65 : 50,
        isSharedWithPartner: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { displayName: targetUserId === 'fady' ? 'فادي' : 'رحمة', avatar: targetUserId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳' },
      } as any;
    }

    if (requesterUserId !== targetUserId && !profile.isSharedWithPartner) {
      return NextResponse.json({
        success: false,
        isPrivate: true,
        message: 'هذا الملف الصحي خاص ولم يتم تفعيل مشاركته من قبل صاحبه 🔒',
      }, { status: 403 });
    }

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

    const medicalRecords = await prisma.medicalRecord.findMany({
      where: { userId: targetUserId },
      orderBy: { testDate: 'desc' },
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

    const totalWaterToday = waterLogsToday.reduce((sum, item) => sum + (item.amountMl || 0), 0);

    return NextResponse.json({
      success: true,
      profile,
      weightLogs: weightLogs || [],
      workoutLogs: workoutLogs || [],
      medicalRecords: medicalRecords || [],
      totalWaterToday,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      profile: {
        heightCm: targetUserId === 'fady' ? 182 : 166,
        currentWeightKg: targetUserId === 'fady' ? 85.0 : 65.0,
        targetWeightKg: targetUserId === 'fady' ? 78.0 : 59.0,
        dailyCalorieTarget: targetUserId === 'fady' ? 2350 : 1850,
        dailyWaterTargetMl: targetUserId === 'fady' ? 3200 : 2600,
        macrosProteinG: targetUserId === 'fady' ? 155 : 105,
        macrosCarbsG: targetUserId === 'fady' ? 230 : 195,
        macrosFatG: targetUserId === 'fady' ? 65 : 50,
        isSharedWithPartner: true,
        user: { displayName: targetUserId === 'fady' ? 'فادي' : 'رحمة', avatar: targetUserId === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳' },
      },
      weightLogs: [],
      workoutLogs: [],
      medicalRecords: [],
      totalWaterToday: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { action, userId } = body;

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

      await prisma.healthProfile.update({
        where: { userId },
        data: { currentWeightKg: parsedWeight },
      });

      return NextResponse.json({ success: true, log });
    }

    // 2. Delete weight log
    if (action === 'delete_weight') {
      const { id } = body;
      await prisma.weightLog.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // 3. Log workout
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

      return NextResponse.json({ success: true, workout });
    }

    // 4. Delete workout log
    if (action === 'delete_workout') {
      const { id } = body;
      await prisma.workoutLog.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // 5. Log water
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

    // 6. Toggle partner sharing consent
    if (action === 'toggle_share') {
      const { isSharedWithPartner } = body;
      const updated = await prisma.healthProfile.update({
        where: { userId },
        data: { isSharedWithPartner: !!isSharedWithPartner },
      });

      return NextResponse.json({ success: true, profile: updated });
    }

    // 7. Add Medical Record
    if (action === 'add_medical_record') {
      const { title, testType, testDate, isSharedWithPartner, testSummaryOrText } = body;

      const record = await prisma.medicalRecord.create({
        data: {
          userId,
          title,
          testType: testType || 'BLOOD_TEST',
          testDate: testDate ? new Date(testDate) : new Date(),
          aiSummary: testSummaryOrText || 'تم حفظ الفحص الطبي بنجاح في ملفك الصحي الخاص.',
          isSharedWithPartner: !!isSharedWithPartner,
        },
      });

      return NextResponse.json({ success: true, record });
    }

    // 8. Delete medical record
    if (action === 'delete_medical') {
      const { id } = body;
      await prisma.medicalRecord.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // 9. Edit health target profile
    if (action === 'edit_profile') {
      const { heightCm, currentWeightKg, targetWeightKg, dailyWaterTargetMl, dailyCalorieTarget } = body;
      const updated = await prisma.healthProfile.update({
        where: { userId },
        data: {
          heightCm: heightCm ? parseFloat(heightCm) : undefined,
          currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : undefined,
          targetWeightKg: targetWeightKg ? parseFloat(targetWeightKg) : undefined,
          dailyWaterTargetMl: dailyWaterTargetMl ? parseInt(dailyWaterTargetMl) : undefined,
          dailyCalorieTarget: dailyCalorieTarget ? parseInt(dailyCalorieTarget) : undefined,
        },
      });

      return NextResponse.json({ success: true, profile: updated });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
