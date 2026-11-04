import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAIService } from '@/lib/ai/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const household = await prisma.household.findFirst({
      where: { id: 'baytna-main' },
    });

    const expenses = await prisma.expense.findMany({
      where: { householdId: 'baytna-main' },
      include: {
        paidBy: { select: { id: true, displayName: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 50,
    });

    const invoices = await prisma.invoiceReceipt.findMany({
      where: { householdId: 'baytna-main' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate category breakdowns
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    return NextResponse.json({
      success: true,
      budget: household?.monthlyBudgetTarget || 16000,
      totalSpent,
      remaining: Math.max(0, (household?.monthlyBudgetTarget || 16000) - totalSpent),
      categoryTotals,
      expenses,
      invoices,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add manual expense
    if (action === 'add_expense') {
      const { title, amount, category, paidByUserId, paymentMethod, notes, expenseDate } = body;

      const expense = await prisma.expense.create({
        data: {
          householdId: 'baytna-main',
          title,
          amount: parseFloat(amount),
          category: category || 'FOOD',
          paidByUserId: paidByUserId || 'fady',
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || null,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        },
      });

      return NextResponse.json({ success: true, expense });
    }

    // 2. Scan Invoice with AI
    if (action === 'scan_invoice') {
      const { imageBase64, userId } = body;
      const aiService = getAIService();
      const parsed = await aiService.parseInvoice(imageBase64 || '');

      // Create draft invoice record
      const invoice = await prisma.invoiceReceipt.create({
        data: {
          householdId: 'baytna-main',
          imagePath: '/uploads/invoices/receipt_sample.jpg',
          storeName: parsed.storeName || 'سوبرماركت / متجر',
          invoiceDate: parsed.invoiceDate ? new Date(parsed.invoiceDate) : new Date(),
          totalAmount: parsed.totalAmount || 0,
          taxAmount: parsed.taxAmount || 0,
          discountAmount: parsed.discountAmount || 0,
          parsedItemsJson: JSON.stringify(parsed.items || []),
          status: 'DRAFT',
          uploadedByUserId: userId || 'fady',
        },
      });

      return NextResponse.json({
        success: true,
        invoice,
        parsed,
      });
    }

    // 3. Confirm Invoice and Record Expense
    if (action === 'confirm_invoice') {
      const { invoiceId, approvedAmount, approvedCategory, approvedTitle, markShoppingItemsPurchased, userId } = body;

      const invoice = await prisma.invoiceReceipt.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return NextResponse.json({ success: false, message: 'الفاتورة غير موجودة' }, { status: 404 });
      }

      // 1. Create expense
      const expense = await prisma.expense.create({
        data: {
          householdId: 'baytna-main',
          title: approvedTitle || `فاتورة ${invoice.storeName}`,
          amount: approvedAmount ? parseFloat(approvedAmount) : invoice.totalAmount,
          category: approvedCategory || 'FOOD',
          paidByUserId: userId || invoice.uploadedByUserId,
          invoiceReceiptId: invoice.id,
          paymentMethod: 'CARD',
          expenseDate: invoice.invoiceDate,
        },
      });

      // 2. Mark invoice confirmed
      await prisma.invoiceReceipt.update({
        where: { id: invoice.id },
        data: { status: 'CONFIRMED' },
      });

      // 3. Mark matched shopping items as purchased
      if (markShoppingItemsPurchased && invoice.parsedItemsJson) {
        try {
          const items = JSON.parse(invoice.parsedItemsJson);
          for (const it of items) {
            await prisma.shoppingItem.updateMany({
              where: {
                householdId: 'baytna-main',
                name: { contains: it.name },
                isPurchased: false,
              },
              data: { isPurchased: true },
            });
          }
        } catch (e) {}
      }

      return NextResponse.json({ success: true, expense });
    }

    // 4. Update monthly budget
    if (action === 'update_budget') {
      const { monthlyBudgetTarget } = body;
      const updated = await prisma.household.update({
        where: { id: 'baytna-main' },
        data: { monthlyBudgetTarget: parseFloat(monthlyBudgetTarget) },
      });
      return NextResponse.json({ success: true, household: updated });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
