import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAIService } from '@/lib/ai/service';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized();

    const recipes = await prisma.recipe.findMany({
      where: { householdId: 'baytna-main' },
      orderBy: { createdAt: 'desc' },
    });

    const mealPlans = await prisma.mealPlan.findMany({
      where: { householdId: 'baytna-main' },
      include: { recipe: true },
      orderBy: { date: 'asc' },
    });

    const fadyWishlist = recipes.filter(
      (r) => r.suggestedByUserId === 'fady' || r.isFavoriteFady
    );

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
      mealPlans: mealPlans || [],
      fadyWishlist: fadyWishlist || [],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      recipes: [],
      mealPlans: [],
      fadyWishlist: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { action } = body;

    // AI suggestion for ingredients/steps
    if (action === 'suggest_recipe_details') {
      const { mealName } = body;
      const aiService = getAIService();
      const details = await aiService.generateRecipeDetails(mealName || '');
      return NextResponse.json({ success: true, details });
    }

    // 1. Add new recipe
    if (action === 'create_recipe') {
      const { title, category, servings, prepTimeMins, ingredients, instructions, calories, proteinG, carbsG, fatG, estimatedCost, suggestedByUserId } = body;

      let finalCalories = calories;
      let finalProtein = proteinG;
      let finalCarbs = carbsG;
      let finalFat = fatG;

      if (!calories || calories === 0) {
        try {
          const aiService = getAIService();
          const est = await aiService.estimateMealNutrition(title);
          finalCalories = est.calories;
          finalProtein = est.proteinG;
          finalCarbs = est.carbsG;
          finalFat = est.fatG;
        } catch {}
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

    // 2. Edit recipe
    if (action === 'edit_recipe') {
      const { id, title, category, servings, prepTimeMins, ingredients, instructions, estimatedCost } = body;

      const updated = await prisma.recipe.update({
        where: { id },
        data: {
          title,
          category: category || 'LUNCH',
          servings: servings ? parseInt(servings) : 2,
          prepTimeMins: prepTimeMins ? parseInt(prepTimeMins) : 30,
          ingredientsJson: JSON.stringify(ingredients || []),
          instructionsJson: JSON.stringify(instructions || []),
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        },
      });

      return NextResponse.json({ success: true, recipe: updated });
    }

    // 3. Delete recipe
    if (action === 'delete_recipe') {
      const { id } = body;
      await prisma.mealPlan.deleteMany({ where: { recipeId: id } });
      await prisma.recipe.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // 4. Schedule a meal plan
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

    // 5. Delete meal plan
    if (action === 'delete_meal_plan') {
      const { id } = body;
      await prisma.mealPlan.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // 6. Generate Shopping List from Meals
    if (action === 'generate_shopping') {
      const { mealPlanIds } = body;
      let plans;
      if (mealPlanIds && mealPlanIds.length > 0) {
        plans = await prisma.mealPlan.findMany({
          where: { id: { in: mealPlanIds } },
          include: { recipe: true },
        });
      } else {
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
            const existing = await prisma.shoppingItem.findFirst({
              where: {
                householdId: 'baytna-main',
                name: { contains: ing.name },
                isPurchased: false,
              },
            });

            if (existing) {
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
