const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDemo() {
  console.log('🧹 Clearing all demo data from Baytna database...');
  try {
    await prisma.aIChatMessage.deleteMany({});
    await prisma.rewardRedemption.deleteMany({});
    await prisma.rewardCatalog.deleteMany({});
    await prisma.householdTask.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.invoiceReceipt.deleteMany({});
    await prisma.shoppingItem.deleteMany({});
    await prisma.mealPlan.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.waterLog.deleteMany({});
    await prisma.medicalRecord.deleteMany({});
    await prisma.workoutLog.deleteMany({});
    await prisma.weightLog.deleteMany({});
    await prisma.prayerRecord.deleteMany({});
    await prisma.pointsTransaction.deleteMany({});

    console.log('✅ All demo records deleted successfully!');

    // Ensure Household exists
    await prisma.household.upsert({
      where: { id: 'baytna-main' },
      update: {},
      create: {
        id: 'baytna-main',
        name: 'بيتنا - فادي ورحمة ❤️',
        monthlyBudgetTarget: 16000.0,
      },
    });

    // Ensure users exist
    await prisma.user.upsert({
      where: { id: 'fady' },
      update: {},
      create: {
        id: 'fady',
        householdId: 'baytna-main',
        displayName: 'فادي',
        role: 'OWNER_FADY',
        avatar: '👨🏻‍💻',
        passwordHash: 'dalida',
        pinHash: '0000',
      },
    });

    await prisma.user.upsert({
      where: { id: 'rahma' },
      update: {},
      create: {
        id: 'rahma',
        householdId: 'baytna-main',
        displayName: 'رحمة',
        role: 'OWNER_RAHMA',
        avatar: '👩🏻‍🍳',
        passwordHash: 'dalida',
        pinHash: '0000',
      },
    });

    console.log('👥 Fady and Rahma user accounts preserved.');
  } catch (err) {
    console.error('Error clearing demo data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearDemo();
