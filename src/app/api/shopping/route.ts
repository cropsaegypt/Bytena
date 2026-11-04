import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await prisma.shoppingItem.findMany({
      where: { householdId: 'baytna-main' },
      orderBy: [
        { isPurchased: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add shopping item
    if (action === 'add_item') {
      const { name, category, quantity, unit, estimatedPrice, assignedToUserId, inStockQty, addedByVoiceOrAi } = body;
      
      const item = await prisma.shoppingItem.create({
        data: {
          householdId: 'baytna-main',
          name,
          category: category || 'GROCERIES',
          quantity: quantity ? parseFloat(quantity) : 1,
          unit: unit || 'قطعة',
          inStockQty: inStockQty ? parseFloat(inStockQty) : 0,
          needBuyQty: quantity ? parseFloat(quantity) : 1,
          estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : 0,
          assignedToUserId: assignedToUserId || null,
          addedByVoiceOrAi: !!addedByVoiceOrAi,
        },
      });

      return NextResponse.json({ success: true, item });
    }

    // 2. Toggle purchased
    if (action === 'toggle_purchase') {
      const { id, isPurchased, purchasedByUserId } = body;
      const updated = await prisma.shoppingItem.update({
        where: { id },
        data: { isPurchased },
      });

      // Grant points if completed
      if (isPurchased && purchasedByUserId) {
        await prisma.pointsTransaction.create({
          data: {
            userId: purchasedByUserId,
            points: 10,
            category: 'CHORES',
            reason: `شراء طلب من البيت: ${updated.name}`,
          },
        });
      }

      return NextResponse.json({ success: true, item: updated });
    }

    // 3. Delete item
    if (action === 'delete_item') {
      const { id } = body;
      await prisma.shoppingItem.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
