const KOLKATA_TZ = 'Asia/Kolkata';

const pad2 = (value: number): string => String(value).padStart(2, '0');

const todayKolkata = (now: Date = new Date()): string => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: KOLKATA_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (!year || !month || !day) {
        throw new Error('Unable to resolve Asia/Kolkata date');
    }
    return `${year}-${month}-${day}`;
};

const addDays = (isoDate: string, days: number): string => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d));
    utc.setUTCDate(utc.getUTCDate() + days);
    return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
};

const calendarDaysBetween = (fromIso: string, toIso: string): number => {
    const [fy, fm, fd] = fromIso.split('-').map(Number);
    const [ty, tm, td] = toIso.split('-').map(Number);
    const from = Date.UTC(fy, fm - 1, fd);
    const to = Date.UTC(ty, tm - 1, td);
    return Math.floor((to - from) / 86_400_000);
};

const datePart = (value: string): string => value.slice(0, 10);

export { addDays, calendarDaysBetween, datePart, todayKolkata };
