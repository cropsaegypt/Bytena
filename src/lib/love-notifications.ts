// Baytna Love & Caring Notifications Service for Fady & Rahma ❤️

export type LoveNotificationType = 
  | 'COOKING_STARTED' 
  | 'PRAYER_COMPLETED' 
  | 'SHOPPING_DONE' 
  | 'HEALTH_CARE' 
  | 'LOVE_NOTE' 
  | 'PERIODIC_SPARK';

export interface LoveNotificationPayload {
  id?: string;
  type: LoveNotificationType;
  fromUserId: 'fady' | 'rahma';
  toUserId?: 'fady' | 'rahma';
  title: string;
  body: string;
  timestamp?: number;
  emoji?: string;
}

// Preset messages library
export const LOVE_MESSAGES_CATALOG = {
  COOKING_STARTED: [
    { title: 'غداء بحب من إيد رحمة 👩🏻‍🍳❤️', body: 'رحمة حبيبتك بدأت تجهزلك أحلى غداء بكل حب.. متتأخرش عليها يا فادي!' },
    { title: 'روائح البيت الحلوة بدأت 🍲✨', body: 'ست الكل رحمة في المطبخ دلوقتي بتعملك أكلة على مزاجك مخصوص علشانك 💕' },
    { title: 'سفرة بيتنا بتجهز 🍽️❤️', body: 'رحمة بتطبخلك بكل حب.. جهز نفسك لأحلى قعدة وغداء سوا يا غالي' },
  ],
  PRAYER_COMPLETED_FADY: [
    { title: 'دعوة حلوة ليكي من فادي 🤲❤️', body: 'فادي حبيبك لسه مخلص الصلاة حالا، ودعالكم ربنا يديم حبكم وبركة بيتكم يا ست الكل 🌸' },
    { title: 'تقبل الله من فادي ✨', body: 'فادي أدى فرضه وذكرك في دعائه بالستر والرضا والسعادة الدائمة سوا يا رحمة 💕' },
  ],
  PRAYER_COMPLETED_RAHMA: [
    { title: 'دعوة من قلب رحمة لفادي 🤲✨', body: 'رحمة صلت ودعتلك ربنا يفتحها في وشك ويحفظك ليها يا سندي يا غالي 🌸' },
    { title: 'تقبل الله من ست البنات ❤️', body: 'رحمة لسه مخلصة صلاتها بتدعيلك بالصحة والتوفيق والبركة في رزقك يا فادي 💕' },
  ],
  SHOPPING_DONE: [
    { title: 'طلبات البيت وصلت 🛍️❤️', body: 'فادي جاب طلبات البيت وبيقولك تسلم إيدك مقدماً يا قمر بيتنا وعقبال كل مرة سوا!' },
    { title: 'فادي جهز النواقص 🛒✨', body: 'فادي اشترى طلبات المطبخ وبيفكرك إنه بيحبك ومش ناسيكي في أي حاجة ❤️' },
  ],
  HEALTH_CARE_TO_RAHMA: [
    { title: 'تذكير محبة من فادي 💧❤️', body: 'فادي بيفكرك تشربي كوباية ماية دلوقتي عشان صحتك ونضارتك يا أحلى رحمة 💕' },
    { title: 'راحة ورواق لست الكل 🌸', body: 'فادي بيقولك متتعبيش نفسك في شغل البيت وريحي شوية عشان خاطري ❤️' },
  ],
  HEALTH_CARE_TO_FADY: [
    { title: 'عاش يا بطل من رحمة 💪❤️', body: 'رحمة فخورة بيك وبتمرينك وبتقولك ربنا يديم عليك صحتك وقوتك يا سندي 🌟' },
    { title: 'صحتك غالية عندي يا فادي 💧💕', body: 'رحمة بتفكرك تشرب ماية وتاخد نفسك من الشغل شوية يا حبيبي' },
  ],
  PERIODIC_SPARKS: [
    { title: 'خاطرة حب لبيتنا ❤️', body: 'أم محمود بتفكركم: فادي ورحمة أحسن وأجمل اتنين لايقين على بعض في الدنيا دي كلها 🌸' },
    { title: 'بيتنا دايماً عامر بالحب 🏡✨', body: 'مساء الحب والروقان.. ربنا يحفظ بيتكم ويديم المودة والسكينة بينكم يا أغلى كابل 💕' },
    { title: 'صباح السعادة لـ فادي ورحمة ☀️❤️', body: 'صباح الورد والياسمين على أطيب قلبين.. يومكم جميل ومليان حب وبركة سوا' },
    { title: 'رسالة ود وتقدير 💕', body: 'كل تفصيلة صغيرة في بيتنا وراها تعب واهتمام منكم.. ربنا يديمكم نعمة لبعض 🌹' },
  ],
};

// Play a gentle sweet chime using Web Audio API (no external asset needed)
export function playLoveChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Note 1 (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Note 2 (G#5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);

    // Note 3 (B5 - higher sweet chime)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(987.77, ctx.currentTime + 0.3);
    gain3.gain.setValueAtTime(0.12, ctx.currentTime + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.3);
    osc3.stop(ctx.currentTime + 0.9);
  } catch (e) {
    // Audio context not allowed before user gesture, harmless
  }
}

// Request Notification Permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;

  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    return false;
  }
}

// Send real system notification & in-app event
export function triggerLoveNotification(payload: LoveNotificationPayload) {
  if (typeof window === 'undefined') return;

  const fullPayload: LoveNotificationPayload = {
    ...payload,
    id: payload.id || `love_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: payload.timestamp || Date.now(),
    toUserId: payload.toUserId || (payload.fromUserId === 'fady' ? 'rahma' : 'fady'),
  };

  // 1. Play sweet chime sound & vibrate
  playLoveChime();
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 80, 150]);
    } catch {}
  }

  // 2. Dispatch custom event for in-app floating toast
  window.dispatchEvent(
    new CustomEvent('baytna_love_notification', {
      detail: fullPayload,
    })
  );

  // 3. Save to local love history
  try {
    const raw = localStorage.getItem('baytna_love_history') || '[]';
    const history: LoveNotificationPayload[] = JSON.parse(raw);
    history.unshift(fullPayload);
    localStorage.setItem('baytna_love_history', JSON.stringify(history.slice(0, 50)));
  } catch {}

  // 4. Trigger Real Native Device Notification (if allowed)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: fullPayload.title,
          body: fullPayload.body,
          icon: '/icons/icon-192.png',
        });
      } else {
        new Notification(fullPayload.title, {
          body: fullPayload.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/favicon-64.png',
        });
      }
    } catch (e) {
      console.warn('Native notification trigger failed:', e);
    }
  }
}
