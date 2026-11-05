import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDatabaseInitialized } from '@/lib/init-db';

export const dynamic = 'force-dynamic';

// In-memory memory-backed buffer for instant cross-lambda delivery
interface MemoryNotif {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: string;
  title: string;
  body: string;
  emoji: string;
  isRead: boolean;
  createdAt: number;
}

declare global {
  var __baytna_memory_notifs: MemoryNotif[] | undefined;
}

globalThis.__baytna_memory_notifs = globalThis.__baytna_memory_notifs || [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'fady';

  try {
    await ensureDatabaseInitialized();

    // 1. Fetch unread notifications from DB
    const dbNotifs = await prisma.partnerNotification.findMany({
      where: {
        toUserId: userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // 2. Fetch unread notifications from memory buffer (filtered for last 30 minutes)
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    const memoryNotifs = (globalThis.__baytna_memory_notifs || []).filter(
      (n) => n.toUserId === userId && !n.isRead && n.createdAt > thirtyMinsAgo
    );

    // Merge and deduplicate by id
    const map = new Map<string, any>();
    for (const n of [...memoryNotifs, ...dbNotifs]) {
      if (!map.has(n.id)) {
        map.set(n.id, n);
      }
    }

    const notifications = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (err: any) {
    // Fallback to memory
    const memoryNotifs = (globalThis.__baytna_memory_notifs || []).filter(
      (n) => n.toUserId === userId && !n.isRead
    );
    return NextResponse.json({
      success: true,
      notifications: memoryNotifs,
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    const data = await request.json();
    const { action } = data;

    // 1. Mark as read
    if (action === 'mark_read') {
      const { ids } = data;
      if (Array.isArray(ids) && ids.length > 0) {
        try {
          await prisma.partnerNotification.updateMany({
            where: { id: { in: ids } },
            data: { isRead: true },
          });
        } catch {}

        if (globalThis.__baytna_memory_notifs) {
          for (const item of globalThis.__baytna_memory_notifs) {
            if (ids.includes(item.id)) {
              item.isRead = true;
            }
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    // 2. Send Partner Notification
    const { fromUserId, toUserId, type, title, body, emoji } = data;

    if (!fromUserId || !title || !body) {
      return NextResponse.json(
        { success: false, message: 'بيانات الإشعار غير مكتملة' },
        { status: 400 }
      );
    }

    const targetToUserId = toUserId || (fromUserId === 'fady' ? 'rahma' : 'fady');
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Add to memory buffer first
    const memItem: MemoryNotif = {
      id: notifId,
      fromUserId,
      toUserId: targetToUserId,
      type: type || 'LOVE_NOTE',
      title,
      body,
      emoji: emoji || '❤️',
      isRead: false,
      createdAt: Date.now(),
    };
    globalThis.__baytna_memory_notifs = globalThis.__baytna_memory_notifs || [];
    globalThis.__baytna_memory_notifs.unshift(memItem);
    if (globalThis.__baytna_memory_notifs.length > 50) {
      globalThis.__baytna_memory_notifs.pop();
    }

    // Persist to SQLite DB
    let record;
    try {
      record = await prisma.partnerNotification.create({
        data: {
          id: notifId,
          fromUserId,
          toUserId: targetToUserId,
          type: type || 'LOVE_NOTE',
          title,
          body,
          emoji: emoji || '❤️',
          isRead: false,
        },
      });
    } catch {
      record = memItem;
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال إشعار المحبة إلى ${targetToUserId === 'fady' ? 'فادي' : 'رحمة'} بنجاح ❤️`,
      notification: record,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
