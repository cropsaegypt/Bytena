import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAIService } from '@/lib/ai/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    const recipes = await prisma.recipe.findMany({
      where: { householdId: 'baytna-main' },
      orderBy: { createdAt: 'desc' },
    });

    const mealPlans = await prisma.mealPlan.findMany({
      where: { householdId: 'baytna-main' },
      include: { recipe: true },
      orderBy: { date: 'asc' },
    });

    // Fady's suggestions / wishlist
    const fadyWishlist = recipes.filter(
      (r) => r.suggestedByUserId === 'fady' || r.isFavoriteFady
    );

    return NextResponse.json({
      success: true,
      recipes,
      mealPlans,
      fadyWishlist,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add new recipe
    if (action === 'create_recipe') {
      const { title, category, servings, prepTimeMins, ingredients, instructions, calories, proteinG, carbsG, fatG, estimatedCost, suggestedByUserId } = body;

      // Estimate nutrition if not fully provided
      let finalCalories = calories;
      let finalProtein = proteinG;
      let finalCarbs = carbsG;
      let finalFat = fatG;

      if (!calories || calories === 0) {
        const aiService = getAIService();
        const est = await aiService.estimateMealNutrition(title);
        finalCalories = est.calories;
        finalProtein = est.proteinG;
        finalCarbs = est.carbsG;
        finalFat = est.fatG;
      }

      const recipe = await prisma.recipe.create({
        data: {
          householdId: 'baytna-main',
          title,
          category: category || 'LUNCH',
          servings: servings ? parseInt(servings) : 2,
          prepTimeMins: prepTimeMins ? parseInt(prepTimeMins) : 30,
          ingredientsJson: JSON.stringify(ingredients || []),
          instructionsJson: JSON.stringify(instructions || []),
          calories: finalCalories || 450,
          proteinG: finalProtein || 25,
          carbsG: finalCarbs || 45,
          fatG: finalFat || 15,
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 60,
          suggestedByUserId: suggestedByUserId || null,
          isFavoriteFady: suggestedByUserId === 'fady',
        },
      });

      return NextResponse.json({ success: true, recipe });
    }

    // 2. Schedule a meal plan
    if (action === 'schedule_meal') {
      const { date, mealType, recipeId, customName, servings, notes } = body;
      const targetDate = new Date(date || new Date());

      const plan = await prisma.mealPlan.create({
        data: {
          householdId: 'baytna-main',
          date: targetDate,
          mealType: mealType || 'LUNCH',
          recipeId: recipeId || null,
          customName: customName || null,
          servings: servings ? parseInt(servings) : 2,
          notes: notes || null,
        },
        include: { recipe: true },
      });

      return NextResponse.json({ success: true, plan });
    }

    // 3. Generate Shopping List from Meals
    if (action === 'generate_shopping') {
      const { mealPlanIds } = body;
      let plans;
      if (mealPlanIds && mealPlanIds.length > 0) {
        plans = await prisma.mealPlan.findMany({
          where: { id: { in: mealPlanIds } },
          include: { recipe: true },
        });
      } else {
        // Default to all planned meals for today onwards
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        plans = await prisma.mealPlan.findMany({
          where: {
            householdId: 'baytna-main',
            date: { gte: todayStart },
          },
          include: { recipe: true },
        });
      }

      const addedItems: any[] = [];

      for (const plan of plans) {
        if (!plan.recipe || !plan.recipe.ingredientsJson) continue;
        try {
          const ingredients = JSON.parse(plan.recipe.ingredientsJson);
          for (const ing of ingredients) {
            // Check if existing shopping item exists
            const existing = await prisma.shoppingItem.findFirst({
              where: {
                householdId: 'baytna-main',
                name: { contains: ing.name },
                isPurchased: false,
              },
            });

            if (existing) {
              // Merge quantities
              await prisma.shoppingItem.update({
                where: { id: existing.id },
                data: {
                  needBuyQty: existing.needBuyQty + (ing.amount || 1),
                  quantity: existing.quantity + (ing.amount || 1),
                },
              });
            } else {
              const created = await prisma.shoppingItem.create({
                data: {
                  householdId: 'baytna-main',
                  name: ing.name,
                  category: 'GROCERIES',
                  quantity: ing.amount || 1,
                  unit: ing.unit || 'قطعة',
                  inStockQty: 0,
                  needBuyQty: ing.amount || 1,
                  estimatedPrice: ing.estimatedPrice || 0,
                  isPurchased: false,
                  sourceRecipeId: plan.recipe.id,
                  addedByVoiceOrAi: true,
                },
              });
              addedItems.push(created);
            }
          }
        } catch (e) {
          console.error('Error parsing ingredients for plan:', plan.id, e);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'تم استخراج المكونات ودمجها في طلبات البيت بنجاح',
        itemsCount: addedItems.length,
      });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
