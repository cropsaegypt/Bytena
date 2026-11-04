import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAIService } from '@/lib/ai/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const persona = searchParams.get('persona') || 'om_mahmoud';
    const userId = searchParams.get('userId') || 'rahma';

    const messages = await prisma.aIChatMessage.findMany({
      where: {
        householdId: 'baytna-main',
        persona,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, persona, userId } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'الرسالة فارغة' }, { status: 400 });
    }

    // 1. Save user message
    await prisma.aIChatMessage.create({
      data: {
        householdId: 'baytna-main',
        userId: userId || null,
        persona: persona || 'om_mahmoud',
        role: 'user',
        content: message.trim(),
      },
    });

    // 2. Fetch relevant context based on persona
    let context: any = {};
    if (persona === 'family_assistant') {
      const expenses = await prisma.expense.findMany({ where: { householdId: 'baytna-main' } });
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const shopping = await prisma.shoppingItem.findMany({ where: { householdId: 'baytna-main', isPurchased: false } });
      const meals = await prisma.mealPlan.findMany({ where: { householdId: 'baytna-main' }, include: { recipe: true } });
      context = { totalSpent, pendingShoppingCount: shopping.length, mealsCount: meals.length };
    } else if (persona === 'fady_coach') {
      const profile = await prisma.healthProfile.findUnique({ where: { userId: 'fady' } });
      context = profile || {};
    }

    // 3. Generate response via Modular AI Service (Gemini or Local Heuristic Fallback)
    const aiService = getAIService();
    let result;

    if (persona === 'fady_coach') {
      result = await aiService.chatWithFitnessCoach(message, context);
    } else if (persona === 'family_assistant') {
      result = await aiService.chatWithFamilyAssistant(message, context);
    } else {
      // Om Mahmoud
      result = await aiService.chatWithOmMahmoud(message, context);
    }

    // 4. Save AI assistant message
    const savedAI = await prisma.aIChatMessage.create({
      data: {
        householdId: 'baytna-main',
        userId: null,
        persona: persona || 'om_mahmoud',
        role: 'assistant',
        content: result.message,
        toolCallsJson: result.suggestedAction ? JSON.stringify(result.suggestedAction) : null,
      },
    });

    return NextResponse.json({
      success: true,
      reply: savedAI,
      suggestedAction: result.suggestedAction,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
