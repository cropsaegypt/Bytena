import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId') || 'fady';

  try {
    await ensureDatabaseInitialized();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch household
    const household = await prisma.household.findFirst({
      where: { id: 'baytna-main' },
    });

    // 1. Today's Meals
    let mealPlans = await prisma.mealPlan.findMany({
      where: {
        householdId: 'baytna-main',
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { recipe: true },
      orderBy: { createdAt: 'asc' },
    });

    if (mealPlans.length === 0) {
      mealPlans = await prisma.mealPlan.findMany({
        where: { householdId: 'baytna-main' },
        include: { recipe: true },
        take: 3,
        orderBy: { date: 'desc' },
      });
    }

    // 2. Shopping Items
    const pendingShopping = await prisma.shoppingItem.findMany({
      where: { householdId: 'baytna-main', isPurchased: false },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // 3. Monthly Finance
    const monthlyExpenses = await prisma.expense.findMany({
      where: { householdId: 'baytna-main' },
      take: 50,
    });

    const totalSpent = (monthlyExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const monthlyBudget = household?.monthlyBudgetTarget || 16000;
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);

    // 4. Today's Prayers
    let prayerRecord = await prisma.prayerRecord.findFirst({
      where: {
        userId: requestedUserId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (!prayerRecord) {
      prayerRecord = await prisma.prayerRecord.findFirst({
        where: { userId: requestedUserId },
        orderBy: { date: 'desc' },
      });
    }

    if (!prayerRecord) {
      prayerRecord = {
        id: 'clean-prayer',
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
        encouragementNote: 'بداية يوم مبارك في بيتنا ❤️ صلاتك نور يومك وراحتك.',
      } as any;
    }

    // 5. Tasks
    const tasks = await prisma.householdTask.findMany({
      where: { householdId: 'baytna-main' },
      take: 10,
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    });

    // 6. Points
    const userPoints = await prisma.pointsTransaction.aggregate({
      where: { userId: requestedUserId },
      _sum: { points: true },
    });
    const totalPoints = userPoints._sum.points || 0;

    // 7. Water
    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: requestedUserId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });
    const totalWaterToday = waterLogs.reduce((sum, item) => sum + (item.amountMl || 0), 0);

    // 8. Coach / Om Mahmoud Advice
    const advice =
      requestedUserId === 'rahma'
        ? {
            speaker: 'أم محمود',
            avatar: '👵🏼',
            quote: 'صباح الفل يا ست البنات! يومك جميل وهادي بإذن الله، متشيليش هم أي حاجة ومتنسيش تشربي مية وتاخدي بريك ليكي ❤️',
          }
        : {
            speaker: 'كوتش فادي',
            avatar: '🏋🏻‍♂️',
            quote: 'عاش يا بطل مصر! يوم جديد وتركيز عالي على شرب المية والتغذية النظيفة وتنظيم يومك مع قمر بيتك رحمة 💪',
          };

    return NextResponse.json({
      success: true,
      data: {
        householdName: household?.name || 'بيتنا - فادي ورحمة ❤️',
        monthlyBudget,
        totalSpent,
        remainingBudget,
        mealPlans: mealPlans || [],
        pendingShopping: pendingShopping || [],
        prayerRecord,
        tasks: tasks || [],
        totalPoints,
        totalWaterToday,
        todayWorkout: null,
        advice,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: {
        householdName: 'بيتنا - فادي ورحمة ❤️',
        monthlyBudget: 16000,
        totalSpent: 0,
        remainingBudget: 16000,
        mealPlans: [],
        pendingShopping: [],
        prayerRecord: {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        },
        tasks: [],
        totalPoints: 0,
        totalWaterToday: 0,
        todayWorkout: null,
      },
    });
  }
}
