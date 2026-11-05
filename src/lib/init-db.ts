import prisma from './prisma';

let isInitialized = false;

export async function ensureDatabaseInitialized() {
  if (isInitialized) return;

  try {
    const existing = await prisma.household.findFirst({
      where: { id: 'baytna-main' },
    });

    if (existing) {
      isInitialized = true;
      return;
    }

    console.log('🔄 Auto-initializing Baytna database on first run...');

    // 1. Create Household
    const household = await prisma.household.upsert({
      where: { id: 'baytna-main' },
      update: {},
      create: {
        id: 'baytna-main',
        name: 'بيتنا - فادي ورحمة ❤️',
        monthlyBudgetTarget: 16000.0,
      },
    });

    // 2. Create Users
    const fady = await prisma.user.upsert({
      where: { id: 'fady' },
      update: {},
      create: {
        id: 'fady',
        householdId: household.id,
        displayName: 'فادي',
        role: 'OWNER_FADY',
        avatar: '👨🏻‍💻',
        passwordHash: 'fady2026', // Initial password for Fady
        pinHash: '0000',
      },
    });

    const rahma = await prisma.user.upsert({
      where: { id: 'rahma' },
      update: {},
      create: {
        id: 'rahma',
        householdId: household.id,
        displayName: 'رحمة',
        role: 'OWNER_RAHMA',
        avatar: '👩🏻‍🍳',
        passwordHash: 'rahma2026', // Initial password for Rahma
        pinHash: '0000',
      },
    });

    // 3. Health Profiles
    await prisma.healthProfile.upsert({
      where: { userId: fady.id },
      update: {},
      create: {
        userId: fady.id,
        heightCm: 182.0,
        currentWeightKg: 85.5,
        targetWeightKg: 78.0,
        activityLevel: 'ACTIVE',
        dailyCalorieTarget: 2350,
        dailyWaterTargetMl: 3200,
        macrosProteinG: 155,
        macrosCarbsG: 230,
        macrosFatG: 65,
        isSharedWithPartner: false,
      },
    });

    await prisma.healthProfile.upsert({
      where: { userId: rahma.id },
      update: {},
      create: {
        userId: rahma.id,
        heightCm: 166.0,
        currentWeightKg: 65.0,
        targetWeightKg: 59.0,
        activityLevel: 'MODERATE',
        dailyCalorieTarget: 1850,
        dailyWaterTargetMl: 2600,
        macrosProteinG: 105,
        macrosCarbsG: 195,
        macrosFatG: 50,
        isSharedWithPartner: false,
      },
    });

    // 4. Recipes
    const bashamel = await prisma.recipe.create({
      data: {
        householdId: household.id,
        title: 'مكرونة بالبشاميل بلدي أصلية',
        category: 'LUNCH',
        servings: 4,
        prepTimeMins: 50,
        calories: 580,
        proteinG: 32,
        carbsG: 65,
        fatG: 22,
        estimatedCost: 140.0,
        suggestedByUserId: fady.id,
        isFavoriteFady: true,
        isFavoriteRahma: true,
        ingredientsJson: JSON.stringify([
          { name: 'مكرونة قلم', amount: 500, unit: 'جرام', estimatedPrice: 20 },
          { name: 'لحم مفروم', amount: 350, unit: 'جرام', estimatedPrice: 75 },
          { name: 'لبن حليب', amount: 1, unit: 'لتر', estimatedPrice: 35 },
          { name: 'دقيق', amount: 4, unit: 'ملاعق', estimatedPrice: 5 },
          { name: 'بصل مفروم', amount: 2, unit: 'حبة', estimatedPrice: 5 },
        ]),
        instructionsJson: JSON.stringify([
          'سلق المكرونة 8 دقائق وتصفيتها دون غسل.',
          'تشويح البصل وإضافة اللحم المفروم مع البهارات والملح والفلفل.',
          'تحضير البشاميل بالزبدة والدقيق والحليب الدافئ.',
          'رص الصينية والخبز بالفرن على 200 درجة لمدة 30 دقيقة.',
        ]),
      },
    });

    const healthyOatmeal = await prisma.recipe.create({
      data: {
        householdId: household.id,
        title: 'شوفان بالحليب والموز والعسل وزبدة الفول السوداني',
        category: 'BREAKFAST',
        servings: 2,
        prepTimeMins: 10,
        calories: 380,
        proteinG: 18,
        carbsG: 55,
        fatG: 11,
        estimatedCost: 35.0,
        suggestedByUserId: fady.id,
        isFavoriteFady: true,
        isFavoriteRahma: true,
        ingredientsJson: JSON.stringify([
          { name: 'شوفان حبة كاملة', amount: 100, unit: 'جرام', estimatedPrice: 15 },
          { name: 'لبن حليب خالي الدسم', amount: 400, unit: 'مل', estimatedPrice: 14 },
          { name: 'موز طازج', amount: 2, unit: 'حبة', estimatedPrice: 6 },
        ]),
        instructionsJson: JSON.stringify([
          'غلي الحليب وإضافة الشوفان وتركه 5 دقائق.',
          'تقديمه في أطباق مع شرائح الموز والعسل.',
        ]),
      },
    });

    // 5. Meal Plans for Today
    const today = new Date();
    await prisma.mealPlan.createMany({
      data: [
        {
          householdId: household.id,
          date: today,
          mealType: 'BREAKFAST',
          recipeId: healthyOatmeal.id,
          servings: 2,
          status: 'PREPARED',
          notes: 'فطار صحي وسريع قبل بداية اليوم 🍳',
        },
        {
          householdId: household.id,
          date: today,
          mealType: 'LUNCH',
          recipeId: bashamel.id,
          servings: 2,
          status: 'PLANNED',
          notes: 'فادي طلبها ورحمة جهزتها بكل حب ❤️',
        },
        {
          householdId: household.id,
          date: today,
          mealType: 'DINNER',
          customName: 'سلطة جبنة قريش بزيت الزيتون والزعتر وخيار وتوست',
          servings: 2,
          status: 'PLANNED',
          notes: 'عشاء خفيف ومريح للمعدة 🥗',
        },
      ],
    });

    // 6. Shopping Items
    await prisma.shoppingItem.createMany({
      data: [
        {
          householdId: household.id,
          name: 'لبن حليب طبيعي (المراعي / جهينة)',
          category: 'GROCERIES',
          quantity: 2,
          unit: 'لتر',
          inStockQty: 0,
          needBuyQty: 2,
          estimatedPrice: 70,
          isPurchased: false,
          assignedToUserId: fady.id,
        },
        {
          householdId: household.id,
          name: 'لحم مفروم بلدي قليل الدهن',
          category: 'GROCERIES',
          quantity: 1,
          unit: 'كجم',
          inStockQty: 0,
          needBuyQty: 1,
          estimatedPrice: 220,
          isPurchased: false,
          assignedToUserId: fady.id,
        },
        {
          householdId: household.id,
          name: 'مسحوق غسيل أوتوماتيك أريال',
          category: 'CLEANING',
          quantity: 1,
          unit: 'عبوة',
          inStockQty: 0,
          needBuyQty: 1,
          estimatedPrice: 240,
          isPurchased: false,
          assignedToUserId: rahma.id,
        },
      ],
    });

    // 7. Household Expenses
    await prisma.expense.createMany({
      data: [
        {
          householdId: household.id,
          title: 'مشتريات السوبرماركت الأسبوعية',
          amount: 850,
          category: 'FOOD',
          paidByUserId: fady.id,
          paymentMethod: 'CARD',
          expenseDate: new Date(),
          notes: 'خضار وألبان ولحوم الأسبوع',
        },
        {
          householdId: household.id,
          title: 'فاتورة الكهرباء والغاز الطبيعي',
          amount: 420,
          category: 'UTILITIES',
          paidByUserId: fady.id,
          paymentMethod: 'INSTAPAY',
          expenseDate: new Date(),
        },
      ],
    });

    // 8. Household Tasks
    await prisma.householdTask.createMany({
      data: [
        {
          householdId: household.id,
          title: 'مسح وترتيب الصالة وتلميع الطاولات',
          area: 'LIVING_ROOM',
          frequency: 'DAILY',
          assignedToUserId: rahma.id,
          isCompleted: true,
          pointsReward: 15,
        },
        {
          householdId: household.id,
          title: 'شراء طلبات السوبرماركت وحمل النواقص',
          area: 'GENERAL',
          frequency: 'WEEKLY',
          assignedToUserId: fady.id,
          isCompleted: false,
          pointsReward: 25,
        },
        {
          householdId: household.id,
          title: 'تفريغ وتعبئة غسالة الأطباق',
          area: 'KITCHEN',
          frequency: 'DAILY',
          assignedToUserId: fady.id,
          isCompleted: false,
          pointsReward: 15,
        },
      ],
    });

    // 9. Initial Rewards
    await prisma.rewardCatalog.createMany({
      data: [
        {
          householdId: household.id,
          title: 'خروجة عشاء رايقة على النيل',
          description: 'مطعم جميل وجلسة هادئة ومكافأة لأسبوع مليء بالإنجاز والتفاهم',
          pointsCost: 150,
          icon: '🌊',
        },
        {
          householdId: household.id,
          title: 'اختيار فيلم السهرة مع فشار ومشروب مفضل',
          description: 'صاحب المكافأة هو اللي يختار الفيلم بدون أي اعتراض!',
          pointsCost: 40,
          icon: '🎬',
        },
        {
          householdId: household.id,
          title: 'يوم راحة وإعفاء كامل من مهام البيت',
          description: 'الطرف الثاني يتولى شؤون البيت بالكامل لليوم',
          pointsCost: 120,
          icon: '🛋️',
        },
      ],
    });

    // 10. Initial Points
    await prisma.pointsTransaction.createMany({
      data: [
        { userId: fady.id, points: 50, reason: 'بداية استخدام نظام بيتنا ❤️', category: 'BONUS' },
        { userId: rahma.id, points: 50, reason: 'بداية استخدام نظام بيتنا ❤️', category: 'BONUS' },
      ],
    });

    isInitialized = true;
    console.log('✅ Baytna auto-initialization complete!');
  } catch (err) {
    console.warn('Auto-init non-fatal warning:', err);
  }
}
