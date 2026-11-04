import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId') || 'fady';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    // Fetch household
    const household = await prisma.household.findFirst({
      where: { id: 'baytna-main' },
    });

    // 1. Today's Meals
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        householdId: 'baytna-main',
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        recipe: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 2. Shopping Items (urgent / not purchased)
    const pendingShopping = await prisma.shoppingItem.findMany({
      where: {
        householdId: 'baytna-main',
        isPurchased: false,
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // 3. Monthly Finance
    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        householdId: 'baytna-main',
        expenseDate: { gte: startOfMonth },
      },
    });

    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyBudget = household?.monthlyBudgetTarget || 16000;
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);

    // 4. Today's Prayers for requested user
    let prayerRecord = await prisma.prayerRecord.findUnique({
      where: {
        userId_date: {
          userId: requestedUserId,
          date: todayStart,
        },
      },
    });

    if (!prayerRecord) {
      prayerRecord = await prisma.prayerRecord.create({
        data: {
          userId: requestedUserId,
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

    // 5. Household Tasks for today
    const tasks = await prisma.householdTask.findMany({
      where: { householdId: 'baytna-main' },
      take: 5,
    });

    // 6. User Points balance
    const userPoints = await prisma.pointsTransaction.aggregate({
      where: { userId: requestedUserId },
      _sum: { points: true },
    });

    const redemptions = await prisma.rewardRedemption.aggregate({
      where: { userId: requestedUserId },
      _sum: { pointsSpent: true },
    });

    const totalPoints = (userPoints._sum.points || 0) - (redemptions._sum.pointsSpent || 0);

    // 7. Today's Water intake
    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: requestedUserId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });
    const totalWaterToday = waterLogs.reduce((acc, log) => acc + log.amountMl, 0);

    // 8. Today's Workout
    const todayWorkout = await prisma.workoutLog.findFirst({
      where: {
        userId: requestedUserId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    // 9. Personalized Advice
    const advice =
      requestedUserId === 'rahma'
        ? {
            speaker: 'أم محمود',
            avatar: '👵🏼',
            quote: 'صباح الفل يا ست الكل! يومنا النهارده هادي، متشيليش هم المطبخ فادي مبسوط جداً بالبشاميل ومتنسيش تشربي مية وتاخدي بريك ليكي ❤️',
          }
        : {
            speaker: 'كوتش فادي',
            avatar: '🏋🏻‍♂️',
            quote: 'عاش يا بطل! النهارده تركيزنا على شرب 3 لتر مية وإكمال 150 جم بروتين. أداءك في تحسن مستمر والهدف قرب 💪',
          };

    return NextResponse.json({
      success: true,
      data: {
        householdName: household?.name || 'بيتنا',
        monthlyBudget,
        totalSpent,
        remainingBudget,
        mealPlans,
        pendingShopping,
        prayerRecord,
        tasks,
        totalPoints: Math.max(0, totalPoints),
        totalWaterToday,
        todayWorkout,
        advice,
      },
    });
  } catch (err: any) {
    console.error('Home API Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
