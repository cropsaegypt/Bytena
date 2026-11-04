/**
 * Date and Currency Utilities with Arabic Locale Support
 */

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatArabicDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  const dayName = ARABIC_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = ARABIC_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}، ${dayNum} ${monthName} ${year}`;
}

export function formatShortArabicDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  const dayNum = d.getDate();
  const monthName = ARABIC_MONTHS[d.getMonth()];
  return `${dayNum} ${monthName}`;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 جنيه';
  return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ج.م`;
}

export function getGreetingByTime(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return `صباح الفل والبركة يا ${name} ☀️`;
  } else if (hour >= 12 && hour < 17) {
    return `نهارك سعيد ومنور يا ${name} 🌿`;
  } else if (hour >= 17 && hour < 23) {
    return `مساء الروقان والخير يا ${name} 🌙`;
  } else {
    return `ليلة هادئة ونوم عوافي يا ${name} ✨`;
  }
}
