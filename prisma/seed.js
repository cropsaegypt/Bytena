const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Baytna database...');

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
      avatar: '/avatars/fady.png',
      pinHash: '1234', // default PIN
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
      avatar: '/avatars/rahma.png',
      pinHash: '1234', // default PIN
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

  // 4. Initial Weight Logs
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000 * 3);
  const weekAgo = new Date(Date.now() - 86400000 * 7);

  await prisma.weightLog.createMany({
    data: [
      { userId: fady.id, weightKg: 87.0, loggedAt: weekAgo, notes: 'بداية الالتزام بالجيم' },
      { userId: fady.id, weightKg: 86.2, loggedAt: yesterday, notes: 'تحسن ملحوظ ونزول دهون' },
      { userId: fady.id, weightKg: 85.5, loggedAt: today, notes: 'وزن الصباح على الريق' },
      { userId: rahma.id, weightKg: 66.2, loggedAt: weekAgo, notes: 'بداية برنامج البيت' },
      { userId: rahma.id, weightKg: 65.0, loggedAt: today, notes: 'نشاط ممتاز وشرب مية كافي' },
    ],
  });

  // 5. Workout Logs
  await prisma.workoutLog.create({
    data: {
      userId: fady.id,
      title: 'تمرين بنش وترايسبس بالجيم',
      category: 'GYM',
      durationMins: 55,
      burnedCalories: 420,
      exercisesJson: JSON.stringify([
        { name: 'بنش برس بالبار', sets: 4, reps: 10, weight: 65 },
        { name: 'تجميع دمبلز مائل', sets: 3, reps: 12, weight: 20 },
        { name: 'كيبل كروس أوفر', sets: 3, reps: 15, weight: 15 },
        { name: 'ترايسبس حبل', sets: 4, reps: 12, weight: 22 },
      ]),
      notes: 'أداء قوي وتركيز عالي في الأوزان',
    },
  });

  await prisma.workoutLog.create({
    data: {
      userId: rahma.id,
      title: 'كارديو وتمارين مقاومة منزلية',
      category: 'HOME',
      durationMins: 35,
      burnedCalories: 240,
      exercisesJson: JSON.stringify([
        { name: 'إحماء وإطالات', sets: 1, reps: 1, weight: 0 },
        { name: 'سكوات بوزن الجسم', sets: 3, reps: 15, weight: 0 },
        { name: 'لانجز خفيف', sets: 3, reps: 12, weight: 0 },
        { name: 'تمارين بطن وبلانك', sets: 3, reps: 30, weight: 0 },
      ]),
      notes: 'روقان وطاقة إيجابية ممتازة',
    },
  });

  // 6. Water Logs for today
  await prisma.waterLog.createMany({
    data: [
      { userId: fady.id, amountMl: 500, date: today },
      { userId: fady.id, amountMl: 500, date: today },
      { userId: fady.id, amountMl: 750, date: today },
      { userId: rahma.id, amountMl: 500, date: today },
      { userId: rahma.id, amountMl: 500, date: today },
      { userId: rahma.id, amountMl: 400, date: today },
    ],
  });

  // 7. Medical Records
  await prisma.medicalRecord.create({
    data: {
      userId: fady.id,
      title: 'تحليل دهون الدم والكوليسترول Lipid Profile',
      testType: 'BLOOD_TEST',
      testDate: new Date(Date.now() - 86400000 * 20),
      aiSummary: 'النتائج ممتازة، الكوليسترول الكلي ضمن المعدل الطبيعي (175 mg/dL)، ومستوى الـ HDL الجيد مرتفع بفضل الرياضة.',
      isSharedWithPartner: true,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      userId: rahma.id,
      title: 'فحص فيتامين د ومخزون الحديد Ferritin',
      testType: 'BLOOD_TEST',
      testDate: new Date(Date.now() - 86400000 * 15),
      aiSummary: 'فيتامين د في مستوى جيد (34 ng/mL)، ومخزون الحديد طبيعي مع نصيحة بالاستمرار على الأطعمة الغنية بالحديد والخضار الورقية.',
      isSharedWithPartner: true,
    },
  });

  // 8. Recipes
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
        'تحضير البشاميل بتحمير الدقيق في الزبدة ثم سكب الحليب الدافئ تدريجياً.',
        'خلط ثلث البشاميل مع المكرونة، ورص نصفها بالصينية ثم اللحم ثم باقي المكرونة والبشاميل على الوجه.',
        'الخبز بالفرن على 200 درجة لمدة 30 دقيقة حتى يتحمر الوجه.',
      ]),
    },
  });

  const grilledChicken = await prisma.recipe.create({
    data: {
      householdId: household.id,
      title: 'صينية دجاج مشوي بالبطاطس والليمون',
      category: 'LUNCH',
      servings: 3,
      prepTimeMins: 45,
      calories: 460,
      proteinG: 42,
      carbsG: 35,
      fatG: 14,
      estimatedCost: 130.0,
      suggestedByUserId: rahma.id,
      isFavoriteFady: true,
      isFavoriteRahma: true,
      ingredientsJson: JSON.stringify([
        { name: 'وراك أو صدور دجاج', amount: 1, unit: 'كجم', estimatedPrice: 100 },
        { name: 'بطاطس شرائح', amount: 500, unit: 'جرام', estimatedPrice: 15 },
        { name: 'عصير ليمون وثوم مفروم', amount: 3, unit: 'ملاعق', estimatedPrice: 5 },
        { name: 'زيت زيتون وبهارات مشكلة', amount: 2, unit: 'ملاعق', estimatedPrice: 10 },
      ]),
      instructionsJson: JSON.stringify([
        'تتبيل الدجاج بالليمون والثوم والزعتر والبهارات لمدة نصف ساعة.',
        'فرش البطاطس في الصينية ووضع الدجاج المتبل فوقها.',
        'تغطية الصينية بورق فويل والخبز 40 دقيقة ثم تحمير الوجه تحت الشواية.',
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
        { name: 'عسل نحل طبيعي', amount: 1, unit: 'ملعقة', estimatedPrice: 5 },
      ]),
      instructionsJson: JSON.stringify([
        'غلي الحليب وإضافة الشوفان وتركه ينضج على نار هادئة 5 دقائق.',
        'سكبه في أطباق التقديم وتزيينه بشرائح الموز ورشة عسل.',
      ]),
    },
  });

  // 9. Meal Plans for Today and Tomorrow
  await prisma.mealPlan.createMany({
    data: [
      {
        householdId: household.id,
        date: today,
        mealType: 'BREAKFAST',
        recipeId: healthyOatmeal.id,
        servings: 2,
        status: 'PREPARED',
        notes: 'فطار صحي وسريع قبل بداية اليوم',
      },
      {
        householdId: household.id,
        date: today,
        mealType: 'LUNCH',
        recipeId: bashamel.id,
        servings: 2,
        status: 'PLANNED',
        notes: 'فادي طلبها من يومين ورحمة وافقت ❤️',
      },
      {
        householdId: household.id,
        date: today,
        mealType: 'DINNER',
        customName: 'سلطة جبنة قريش بزيت الزيتون والزعتر وخيار وتوست',
        servings: 2,
        status: 'PLANNED',
        notes: 'عشاء خفيف ومريح للمعدة',
      },
      {
        householdId: household.id,
        date: new Date(Date.now() + 86400000),
        mealType: 'LUNCH',
        recipeId: grilledChicken.id,
        servings: 2,
        status: 'PLANNED',
        notes: 'غداء غني بالبروتين بعد تمرين الجيم',
      },
    ],
  });

  // 10. Shopping Items
  await prisma.shoppingItem.createMany({
    data: [
      {
        householdId: household.id,
        name: 'لبن حليب طبيعي (المراعي / جهينة)',
        category: 'GROCERIES',
        quantity: 3,
        unit: 'لتر',
        inStockQty: 1,
        needBuyQty: 2,
        estimatedPrice: 70,
        isPurchased: false,
        assignedToUserId: fady.id,
      },
      {
        householdId: household.id,
        name: 'مكرونة قلم (ريجينا أو الملكة)',
        category: 'GROCERIES',
        quantity: 2,
        unit: 'كيس',
        inStockQty: 0,
        needBuyQty: 2,
        estimatedPrice: 35,
        isPurchased: true,
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
        name: 'مسحوق غسيل أوتوماتيك أريال 4 كجم',
        category: 'CLEANING',
        quantity: 1,
        unit: 'عبوة',
        inStockQty: 0.2,
        needBuyQty: 1,
        estimatedPrice: 240,
        isPurchased: false,
        assignedToUserId: rahma.id,
      },
      {
        householdId: household.id,
        name: 'مناديل مطبخ وزينة رول',
        category: 'HOUSEHOLD',
        quantity: 2,
        unit: 'باكيت',
        inStockQty: 0,
        needBuyQty: 2,
        estimatedPrice: 55,
        isPurchased: false,
        assignedToUserId: rahma.id,
      },
      {
        householdId: household.id,
        name: 'موز وتفاح أحمر طازج',
        category: 'GROCERIES',
        quantity: 2,
        unit: 'كجم',
        inStockQty: 0.5,
        needBuyQty: 2,
        estimatedPrice: 80,
        isPurchased: true,
        assignedToUserId: fady.id,
      },
    ],
  });

  // 11. Initial Expenses
  await prisma.expense.createMany({
    data: [
      {
        householdId: household.id,
        title: 'مشتريات كارفور الأسبوعية (خضار وألبان ولحوم)',
        amount: 850,
        category: 'FOOD',
        paidByUserId: fady.id,
        paymentMethod: 'CARD',
        expenseDate: new Date(Date.now() - 86400000 * 2),
        notes: 'مشتريات أسبوعية للأكل والمطبخ',
      },
      {
        householdId: household.id,
        title: 'فاتورة الكهرباء والغاز الطبيعي',
        amount: 420,
        category: 'UTILITIES',
        paidByUserId: fady.id,
        paymentMethod: 'INSTAPAY',
        expenseDate: new Date(Date.now() - 86400000 * 4),
        notes: 'دفع فاتورة الشهر',
      },
      {
        householdId: household.id,
        title: 'منظفات وصابون وأكياس قمامة',
        amount: 230,
        category: 'CLEANING',
        paidByUserId: rahma.id,
        paymentMethod: 'CASH',
        expenseDate: new Date(Date.now() - 86400000 * 3),
      },
      {
        householdId: household.id,
        title: 'اشتراك الجيم الشهري - فادي',
        amount: 600,
        category: 'HEALTH_GYM',
        paidByUserId: fady.id,
        paymentMethod: 'CARD',
        expenseDate: new Date(Date.now() - 86400000 * 5),
      },
    ],
  });

  // 12. Prayer Records for Today
  await prisma.prayerRecord.create({
    data: {
      userId: fady.id,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: false,
      isha: false,
      morningDhikr: true,
      eveningDhikr: false,
      quranPages: 4,
      encouragementNote: 'ما شاء الله التزام رائع بالفجر وحاضر الصلوات 🌟',
    },
  });

  await prisma.prayerRecord.create({
    data: {
      userId: rahma.id,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: false,
      isha: false,
      morningDhikr: true,
      eveningDhikr: false,
      quranPages: 6,
      encouragementNote: 'اللهم بارك، ورد القرآن وأذكار الصباح في وقتها ❤️',
    },
  });

  // 13. Reward Catalog
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
      {
        householdId: household.id,
        title: 'مبلغ مصروف شخصي حر (500 جنيه)',
        description: 'لشراء أي شيء بدون قيود على الميزانية',
        pointsCost: 200,
        icon: '💵',
      },
    ],
  });

  // 14. Points Transactions
  await prisma.pointsTransaction.createMany({
    data: [
      { userId: fady.id, points: 20, reason: 'صلاة الفجر في وقتها وأذكار الصباح', category: 'PRAYER' },
      { userId: fady.id, points: 15, reason: 'تمرين الجيم والالتزام بالجدول', category: 'HEALTH' },
      { userId: fady.id, points: 25, reason: 'شراء مشتريات البيت الأسبوعية وحمل الطلبات', category: 'CHORES' },
      { userId: rahma.id, points: 20, reason: 'صلاة الفجر والورد القرآني', category: 'PRAYER' },
      { userId: rahma.id, points: 30, reason: 'إعداد صينية المكرونة بالبشاميل اللذيذة', category: 'KITCHEN' },
      { userId: rahma.id, points: 15, reason: 'تمرين المقاومة الخفيف بالمنزل', category: 'HEALTH' },
    ],
  });

  // 15. Household Tasks
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
        title: 'غسيل الملابس ونشرها وتطبيقها',
        area: 'LAUNDRY',
        frequency: 'WEEKLY',
        assignedToUserId: rahma.id,
        isCompleted: false,
        pointsReward: 20,
      },
      {
        householdId: household.id,
        title: 'شراء طلبات السوبرماركت الثقيلة وتفريغها',
        area: 'GENERAL',
        frequency: 'WEEKLY',
        assignedToUserId: fady.id,
        isCompleted: true,
        pointsReward: 25,
      },
      {
        householdId: household.id,
        title: 'تفريغ وتعبئة غسالة الأطباق وتنظيف الحوض',
        area: 'KITCHEN',
        frequency: 'DAILY',
        assignedToUserId: fady.id,
        isCompleted: false,
        pointsReward: 15,
      },
      {
        householdId: household.id,
        title: 'رمي القمامة وتنظيف صناديق التدوير',
        area: 'GENERAL',
        frequency: 'DAILY',
        assignedToUserId: fady.id,
        isCompleted: true,
        pointsReward: 10,
      },
    ],
  });

  // 16. Welcome AI Chat Messages
  await prisma.aIChatMessage.create({
    data: {
      householdId: household.id,
      userId: rahma.id,
      persona: 'om_mahmoud',
      role: 'assistant',
      content: 'صباح الفل والياسمين يا ست رحمة يا قمر! إيه رأيك نبدأ يومنا بهدوء وريلاكس؟ المطبخ زي الفل، وفادي كان نفسه في المكرونة بالبشاميل النهارده، والحمد لله مكوناتها متوفرة، متشيليش هم أي حاجة وأنا معاكي خطوة بخطوة يا حبيبتي ❤️',
    },
  });

  await prisma.aIChatMessage.create({
    data: {
      householdId: household.id,
      userId: fady.id,
      persona: 'fady_coach',
      role: 'assistant',
      content: 'عاش يا وحش! فورمتك في تحسن ملحوظ ووزنك نزل لـ 85.5 كجم بثبات عالي. النهارده عندنا تمرين قوي في الجيم أو يوم راحة مدروس، ركز على شرب المية وخد الـ 150 جرام بروتين بتوعك النهاردة كاملين 💪',
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
