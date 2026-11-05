import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    const tasks = await prisma.householdTask.findMany({
      where: { householdId: 'baytna-main' },
      include: { assignedTo: { select: { displayName: true, avatar: true } } },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      tasks: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const body = await request.json();
    const { action } = body;

    // 1. Add Task
    if (action === 'add_task') {
      const { title, area, pointsReward, assignedToUserId } = body;
      const task = await prisma.householdTask.create({
        data: {
          householdId: 'baytna-main',
          title,
          area: area || 'GENERAL',
          pointsReward: pointsReward ? parseInt(pointsReward) : 15,
          assignedToUserId: assignedToUserId || null,
        },
      });
      return NextResponse.json({ success: true, task });
    }

    // 2. Edit Task
    if (action === 'edit_task') {
      const { taskId, title, area, pointsReward, assignedToUserId } = body;
      const updated = await prisma.householdTask.update({
        where: { id: taskId },
        data: {
          title,
          area: area || 'GENERAL',
          pointsReward: pointsReward ? parseInt(pointsReward) : 15,
          assignedToUserId: assignedToUserId || null,
        },
      });
      return NextResponse.json({ success: true, task: updated });
    }

    // 3. Toggle Task
    if (action === 'toggle_task') {
      const { taskId, isCompleted, userId } = body;

      const updated = await prisma.householdTask.update({
        where: { id: taskId },
        data: {
          isCompleted,
          lastCompletedAt: isCompleted ? new Date() : null,
        },
      });

      if (isCompleted && userId) {
        await prisma.pointsTransaction.create({
          data: {
            userId,
            points: updated.pointsReward || 15,
            category: 'CHORES',
            reason: `إنجاز مهمة منزلية: ${updated.title} ✨`,
          },
        });
      }

      return NextResponse.json({ success: true, task: updated });
    }

    // 4. Delete Task
    if (action === 'delete_task') {
      const { taskId } = body;
      await prisma.householdTask.delete({ where: { id: taskId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
