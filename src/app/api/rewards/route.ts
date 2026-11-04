import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'fady';

    const catalog = await prisma.rewardCatalog.findMany({
      where: { householdId: 'baytna-main', isActive: true },
      orderBy: { pointsCost: 'asc' },
    });

    // Calculate user balance
    const earned = await prisma.pointsTransaction.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const spent = await prisma.rewardRedemption.aggregate({
      where: { userId },
      _sum: { pointsSpent: true },
    });

    const balance = (earned._sum.points || 0) - (spent._sum.pointsSpent || 0);

    const redemptions = await prisma.rewardRedemption.findMany({
      where: { householdId: 'baytna-main' } as any,
      include: {
        reward: true,
        user: { select: { displayName: true } },
      },
      orderBy: { redeemedAt: 'desc' },
      take: 20,
    });

    const pointsHistory = await prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      balance: Math.max(0, balance),
      catalog,
      redemptions,
      pointsHistory,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    // 1. Redeem a reward
    if (action === 'redeem') {
      const { rewardId, notes } = body;
      const reward = await prisma.rewardCatalog.findUnique({
        where: { id: rewardId },
      });

      if (!reward) {
        return NextResponse.json({ success: false, message: 'المكافأة غير متوفرة' }, { status: 404 });
      }

      // Check balance
      const earned = await prisma.pointsTransaction.aggregate({
        where: { userId },
        _sum: { points: true },
      });
      const spent = await prisma.rewardRedemption.aggregate({
        where: { userId },
        _sum: { pointsSpent: true },
      });
      const balance = (earned._sum.points || 0) - (spent._sum.pointsSpent || 0);

      if (balance < reward.pointsCost) {
        return NextResponse.json({
          success: false,
          message: `عفواً، نقاطك الحالية (${balance}) لا تكفي لاسترداد هذه المكافأة (${reward.pointsCost} نقطة). شد حيلك وكمّل باقي الأهداف! 💪`,
        }, { status: 400 });
      }

      const redemption = await prisma.rewardRedemption.create({
        data: {
          rewardId,
          userId,
          pointsSpent: reward.pointsCost,
          status: 'REQUESTED',
          notes: notes || null,
        },
        include: { reward: true },
      });

      return NextResponse.json({
        success: true,
        message: `مبروك يا بطل! تم استرداد المكافأة: "${reward.title}" بنجاح 🎉`,
        redemption,
        newBalance: balance - reward.pointsCost,
      });
    }

    // 2. Add custom reward
    if (action === 'add_reward') {
      const { title, description, pointsCost, icon } = body;
      const newReward = await prisma.rewardCatalog.create({
        data: {
          householdId: 'baytna-main',
          title,
          description: description || null,
          pointsCost: pointsCost ? parseInt(pointsCost) : 50,
          icon: icon || '🎁',
          createdByUserId: userId,
        },
      });

      return NextResponse.json({ success: true, reward: newReward });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
