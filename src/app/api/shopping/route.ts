import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseInitialized();

    const items = await prisma.shoppingItem.findMany({
      where: { householdId: 'baytna-main' },
      orderBy: [
        { isPurchased: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      items: items || [],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      items: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
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

    // 2. Edit shopping item
    if (action === 'edit_item') {
      const { id, name, category, quantity, unit, estimatedPrice, assignedToUserId } = body;
      const updated = await prisma.shoppingItem.update({
        where: { id },
        data: {
          name,
          category,
          quantity: quantity ? parseFloat(quantity) : 1,
          unit: unit || 'قطعة',
          needBuyQty: quantity ? parseFloat(quantity) : 1,
          estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : 0,
          assignedToUserId: assignedToUserId || null,
        },
      });

      return NextResponse.json({ success: true, item: updated });
    }

    // 3. Toggle purchased
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

    // 4. Delete item
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
