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

    console.log('🔄 Initializing clean Baytna household & user profiles...');

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
        passwordHash: 'dalida',
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
        passwordHash: 'dalida',
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
        currentWeightKg: 85.0,
        targetWeightKg: 78.0,
        activityLevel: 'ACTIVE',
        dailyCalorieTarget: 2350,
        dailyWaterTargetMl: 3200,
        macrosProteinG: 155,
        macrosCarbsG: 230,
        macrosFatG: 65,
        isSharedWithPartner: true,
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
        isSharedWithPartner: true,
      },
    });

    isInitialized = true;
    console.log('✅ Baytna clean initialization complete!');
  } catch (err) {
    console.warn('Auto-init non-fatal warning:', err);
  }
}
