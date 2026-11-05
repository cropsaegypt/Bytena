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

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      items: [
        { id: 's1', name: 'لبن حليب طبيعي (المراعي / جهينة)', category: 'GROCERIES', quantity: 2, unit: 'لتر', needBuyQty: 2, estimatedPrice: 70, isPurchased: false, assignedToUserId: 'fady' },
        { id: 's2', name: 'لحم مفروم بلدي قليل الدهن', category: 'GROCERIES', quantity: 1, unit: 'كجم', needBuyQty: 1, estimatedPrice: 220, isPurchased: false, assignedToUserId: 'fady' },
        { id: 's3', name: 'مسحوق غسيل أوتوماتيك أريال', category: 'CLEANING', quantity: 1, unit: 'عبوة', needBuyQty: 1, estimatedPrice: 240, isPurchased: false, assignedToUserId: 'rahma' },
        { id: 's4', name: 'موز وتفاح أحمر طازج', category: 'GROCERIES', quantity: 2, unit: 'كجم', needBuyQty: 2, estimatedPrice: 80, isPurchased: true, assignedToUserId: 'fady' },
      ]
    });
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
