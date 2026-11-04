import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Weekly Expenses
    const weeklyExpenses = await prisma.expense.findMany({
      where: {
        householdId: 'baytna-main',
        expenseDate: { gte: sevenDaysAgo },
      },
    });
    const totalWeeklySpent = weeklyExpenses.reduce((s, e) => s + e.amount, 0);

    // 2. Weekly Workouts
    const fadyWorkouts = await prisma.workoutLog.count({
      where: { userId: 'fady', date: { gte: sevenDaysAgo } },
    });
    const rahmaWorkouts = await prisma.workoutLog.count({
      where: { userId: 'rahma', date: { gte: sevenDaysAgo } },
    });

    // 3. Completed Tasks
    const completedTasks = await prisma.householdTask.count({
      where: { householdId: 'baytna-main', isCompleted: true },
    });

    // 4. Meals Planned & Prepared
    const mealsCount = await prisma.mealPlan.count({
      where: { householdId: 'baytna-main', date: { gte: sevenDaysAgo } },
    });

    // 5. Weekly Points Earned
    const fadyPoints = await prisma.pointsTransaction.aggregate({
      where: { userId: 'fady', createdAt: { gte: sevenDaysAgo } },
      _sum: { points: true },
    });
    const rahmaPoints = await prisma.pointsTransaction.aggregate({
      where: { userId: 'rahma', createdAt: { gte: sevenDaysAgo } },
      _sum: { points: true },
    });

    return NextResponse.json({
      success: true,
      report: {
        period: 'خلال الـ 7 أيام الماضية',
        totalWeeklySpent,
        fadyWorkouts,
        rahmaWorkouts,
        completedTasks,
        mealsCount,
        fadyPoints: fadyPoints._sum.points || 0,
        rahmaPoints: rahmaPoints._sum.points || 0,
        omMahmoudVerdict:
          'اللهم بارك يا ولاد، أسبوعكم كان مليان بركة وهدوء وتفاهم! المطبخ كان عامر، والمصاريف مدروسة، وتمرين فادي والتزام رحمة مشرف جداً. استمروا بنفس الروح الجميلة دي واستمتعوا بالويك إند ❤️',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
