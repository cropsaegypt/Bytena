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
    const userId = searchParams.get('userId') || 'fady';

    const messages = await prisma.aIChatMessage.findMany({
      where: {
        householdId: 'baytna-main',
        persona,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (messages && messages.length > 0) {
      return NextResponse.json({ success: true, messages });
    }

    const defaultGreeting =
      persona === 'fady_coach'
        ? 'عاش يا وحش! أنا كوتش اللياقة بتاعك في بيتنا.. جاهز لأي استفسار عن تمرينك، سعراتك، وجدول أوزانك 💪'
        : persona === 'family_assistant'
        ? 'أهلاً بكما في المساعد العائلي لبيتنا! اسألني عن أي حاجة في الميزانية، النواقص، أو وجبات الأسبوع 🏡'
        : userId === 'fady'
        ? 'يا صباح الفل والروقان يا فادي يا بني يا حبيب قلبي! أنا أم محمود، عايشة معاكم في بيتنا عشان أفرش لكم الدنيا راحة وسعادة. قولي أساعدك في إيه؟ أكل، طلبات ناقصة، أو حابب توصي ست البنات رحمة بحاجة وأنا أبلغهالك فوراً؟ ❤️👵🏼'
        : 'يا صباح الفل والياسمين يا ست الكل يا رحمة يا سكرة! أنا أم محمود، عايشة معاكم في بيتنا عشان أفرش لكم الدنيا راحة وروقان. متشيليش هم المطبخ ولا أي حاجة، قوليلي أساعدك في إيه النهارده؟ ❤️👵🏼';

    return NextResponse.json({
      success: true,
      messages: [
        {
          id: 'welcome_msg',
          persona,
          role: 'assistant',
          content: defaultGreeting,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      messages: [
        {
          id: 'w1',
          persona: 'om_mahmoud',
          role: 'assistant',
          content: 'يا صباح الفل والرضا يا حبايب قلبي! أنا أم محمود، معاكم خطوة بخطوة في بيتنا الدافئ ❤️',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { message, persona, userId, geminiApiKey } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'الرسالة فارغة' }, { status: 400 });
    }

    const currentUserId = userId || 'fady';
    const cleanUserMsg = message.trim();

    // 1. Save user message to DB
    try {
      await prisma.aIChatMessage.create({
        data: {
          householdId: 'baytna-main',
          userId: currentUserId,
          persona: persona || 'om_mahmoud',
          role: 'user',
          content: cleanUserMsg,
        },
      });
    } catch {}

    // 2. Fetch Live Real Household Context
    let context: any = { userId: currentUserId };
    try {
      const [recipes, mealPlans, shoppingItems, expenses, household, userPrayers, waterLogs] = await Promise.all([
        prisma.recipe.findMany({ where: { householdId: 'baytna-main' }, take: 10 }),
        prisma.mealPlan.findMany({
          where: { householdId: 'baytna-main' },
          include: { recipe: true },
          take: 7,
          orderBy: { date: 'asc' },
        }),
        prisma.shoppingItem.findMany({
          where: { householdId: 'baytna-main', isPurchased: false },
          take: 15,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.expense.findMany({
          where: { householdId: 'baytna-main' },
          take: 30,
          orderBy: { expenseDate: 'desc' },
        }),
        prisma.household.findFirst({ where: { id: 'baytna-main' } }),
        prisma.prayerRecord.findFirst({ where: { userId: currentUserId }, orderBy: { date: 'desc' } }),
        prisma.waterLog.findMany({ where: { userId: currentUserId }, take: 10, orderBy: { date: 'desc' } }),
      ]);

      const totalSpent = (expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const monthlyBudget = household?.monthlyBudgetTarget || 16000;
      const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
      const todayWaterTotal = (waterLogs || []).reduce((acc, curr) => acc + (curr.amountMl || 0), 0);

      context = {
        userId: currentUserId,
        recipes: recipes || [],
        mealPlans: mealPlans || [],
        shoppingItems: shoppingItems || [],
        expenses: expenses || [],
        totalSpent,
        monthlyBudget,
        remainingBudget,
        prayers: userPrayers,
        todayWaterTotal,
        streakDays: 1,
      };
    } catch (ctxErr) {
      console.warn('Context gathering non-fatal error:', ctxErr);
    }

    // 3. Generate response via Modular AI Service (Google Gemini or Local Heuristic)
    const aiService = getAIService(geminiApiKey);
    let result;

    if (persona === 'fady_coach') {
      result = await aiService.chatWithFitnessCoach(cleanUserMsg, context);
    } else if (persona === 'family_assistant') {
      result = await aiService.chatWithFamilyAssistant(cleanUserMsg, context);
    } else {
      result = await aiService.chatWithOmMahmoud(cleanUserMsg, context);
    }

    // 4. If a bridge notification was generated (e.g. Fady telling Om Mahmoud to tell Rahma):
    if (result.bridgeNotification) {
      const { fromUserId, toUserId, title, body, emoji } = result.bridgeNotification;
      const bridgeNotifId = `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      try {
        await prisma.partnerNotification.create({
          data: {
            id: bridgeNotifId,
            fromUserId,
            toUserId,
            type: 'OM_MAHMOUD_BRIDGE',
            title,
            body,
            emoji: emoji || '👵🏼',
            isRead: false,
          },
        });
      } catch {}

      if (globalThis.__baytna_memory_notifs) {
        globalThis.__baytna_memory_notifs.unshift({
          id: bridgeNotifId,
          fromUserId,
          toUserId,
          type: 'OM_MAHMOUD_BRIDGE',
          title,
          body,
          emoji: emoji || '👵🏼',
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    // 5. Save and return AI assistant message
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
      bridgeNotificationSent: !!result.bridgeNotification,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      reply: {
        id: String(Date.now()),
        role: 'assistant',
        content: 'يا صباح الفل والسعادة يا سكرة! أنا معاكي خطوة بخطوة في بيتنا ودايماً جنبك في أي وقت ❤️',
        createdAt: new Date().toISOString(),
      },
    });
  }
}
