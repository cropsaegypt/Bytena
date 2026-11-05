import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'fady';

    const catalog = await prisma.rewardCatalog.findMany({
      where: { householdId: 'baytna-main', isActive: true },
      orderBy: { pointsCost: 'asc' },
    });

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
      where: { userId },
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
      catalog: catalog || [],
      redemptions: redemptions || [],
      pointsHistory: pointsHistory || [],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      balance: 0,
      catalog: [],
      redemptions: [],
      pointsHistory: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { action } = body;

    // 1. Add Reward
    if (action === 'add_reward') {
      const { title, pointsCost, icon, description, userId } = body;

      const reward = await prisma.rewardCatalog.create({
        data: {
          householdId: 'baytna-main',
          title,
          pointsCost: pointsCost ? parseInt(pointsCost) : 50,
          icon: icon || '🎁',
          description: description || null,
        },
      });

      return NextResponse.json({ success: true, reward });
    }

    // 2. Delete Reward
    if (action === 'delete_reward') {
      const { rewardId } = body;
      await prisma.rewardCatalog.delete({ where: { id: rewardId } });
      return NextResponse.json({ success: true });
    }

    // 3. Redeem Reward
    if (action === 'redeem') {
      const { rewardId, userId } = body;

      const reward = await prisma.rewardCatalog.findUnique({
        where: { id: rewardId },
      });

      if (!reward) {
        return NextResponse.json({ success: false, message: 'المكافأة غير موجودة' }, { status: 404 });
      }

      const redemption = await prisma.rewardRedemption.create({
        data: {
          rewardId,
          userId,
          pointsSpent: reward.pointsCost,
        },
      });

      return NextResponse.json({
        success: true,
        message: `ألف مبروك! تم استبدال مكافأة "${reward.title}" بنجاح 🎉`,
        redemption,
      });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
