import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAIService } from '@/lib/ai/service';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const { searchParams } = new URL(request.url);
    const persona = searchParams.get('persona') || 'om_mahmoud';

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
    return NextResponse.json({
      success: true,
      messages: [
        {
          id: 'w1',
          persona: 'om_mahmoud',
          role: 'assistant',
          content: 'صباح الفل يا ست الكل! يومنا النهارده هادي، متشيليش هم المطبخ وفادي مبسوط جداً بالبشاميل ومتنسيش تشربي مية وتاخدي بريك ليكي ❤️'
        }
      ]
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { message, persona, userId } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'الرسالة فارغة' }, { status: 400 });
    }

    // 1. Try to save user message to DB
    try {
      await prisma.aIChatMessage.create({
        data: {
          householdId: 'baytna-main',
          userId: userId || null,
          persona: persona || 'om_mahmoud',
          role: 'user',
          content: message.trim(),
        },
      });
    } catch {}

    // 2. Fetch context if possible
    let context: any = { userId: userId || 'rahma' };
    try {
      if (persona === 'family_assistant') {
        const expenses = await prisma.expense.findMany({ where: { householdId: 'baytna-main' } });
        const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
        context.totalSpent = totalSpent;
      }
    } catch {}

    // 3. Generate response via Modular AI Service
    const aiService = getAIService();
    let result;

    if (persona === 'fady_coach') {
      result = await aiService.chatWithFitnessCoach(message, context);
    } else if (persona === 'family_assistant') {
      result = await aiService.chatWithFamilyAssistant(message, context);
    } else {
      result = await aiService.chatWithOmMahmoud(message, context);
    }

    // 4. Try to save AI assistant message
    let savedAI = {
      id: String(Date.now()),
      householdId: 'baytna-main',
      userId: null,
      persona: persona || 'om_mahmoud',
      role: 'assistant',
      content: result.message,
      toolCallsJson: result.suggestedAction ? JSON.stringify(result.suggestedAction) : null,
      createdAt: new Date().toISOString(),
    };

    try {
      savedAI = await prisma.aIChatMessage.create({
        data: {
          householdId: 'baytna-main',
          userId: null,
          persona: persona || 'om_mahmoud',
          role: 'assistant',
          content: result.message,
          toolCallsJson: result.suggestedAction ? JSON.stringify(result.suggestedAction) : null,
        },
      }) as any;
    } catch {}

    return NextResponse.json({
      success: true,
      reply: savedAI,
      suggestedAction: result.suggestedAction,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      reply: {
        id: String(Date.now()),
        role: 'assistant',
        content: 'يا صباح الفل والسعادة يا سكرة! أنا معاكي خطوة بخطوة في بيتنا ودايماً جنبك في أي وقت ❤️',
        createdAt: new Date().toISOString(),
      }
    });
  }
}
