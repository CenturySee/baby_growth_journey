import Dexie, { type Table } from 'dexie';

// ---- Interfaces ----
export interface FeedingRecord {
  id?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  breastLeft: number;  // minutes
  breastRight: number; // minutes
  bottleBreastMilk: number; // ml
  bottleFormula: number; // ml
  createdAt: number;
}

export interface DiaperRecord {
  id?: number;
  date: string;
  time: string;
  type: 'pee' | 'poop' | 'both';
  color: string;
  amount: string;
  note: string;
  image?: string; // base64 data URL
  createdAt: number;
}

export interface SupplementRecord {
  id?: number;
  date: string;
  items: { [key: string]: boolean }; // e.g. {AD: true, D3: false, ...}
  createdAt: number;
}

export interface SleepRecord {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  direction: string; // 左/中/右
  createdAt: number;
}

export interface EducationRecord {
  id?: number;
  date: string;
  category: string; // 视觉训练 / 听觉训练 / 大动作训练 / 精细动作
  duration: number; // minutes
  content: string;
  createdAt: number;
}

export interface CareRecord {
  id?: number;
  date: string;
  items: { [key: string]: boolean };
  createdAt: number;
}

export interface DailyNote {
  id?: number;
  date: string;
  temperature: number;
  vaccine: string;
  note: string;
  createdAt: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

// ---- Database ----
class BabyDB extends Dexie {
  feeding!: Table<FeedingRecord>;
  diaper!: Table<DiaperRecord>;
  supplement!: Table<SupplementRecord>;
  sleep!: Table<SleepRecord>;
  education!: Table<EducationRecord>;
  care!: Table<CareRecord>;
  dailyNote!: Table<DailyNote>;
  settings!: Table<Settings>;

  constructor() {
    super('BabyGrowthDB');
    this.version(1).stores({
      feeding: '++id, date, createdAt',
      diaper: '++id, date, createdAt',
      supplement: '++id, date',
      sleep: '++id, date, createdAt',
      education: '++id, date, createdAt',
      care: '++id, date',
      dailyNote: '++id, date',
      settings: '++id, &key',
    });
    // v2: added image field to diaper
    this.version(2).stores({
      feeding: '++id, date, createdAt',
      diaper: '++id, date, createdAt',
      supplement: '++id, date',
      sleep: '++id, date, createdAt',
      education: '++id, date, createdAt',
      care: '++id, date',
      dailyNote: '++id, date',
      settings: '++id, &key',
    });
  }
}

export const db = new BabyDB();

// ---- Helper Functions ----

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.where('key').equals(key).first();
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) {
    await db.settings.update(existing.id!, { value });
  } else {
    await db.settings.add({ key, value });
  }
}

// ---- Export All Data ----
export async function exportAllData(): Promise<string> {
  const data = {
    feeding: await db.feeding.toArray(),
    diaper: await db.diaper.toArray(),
    supplement: await db.supplement.toArray(),
    sleep: await db.sleep.toArray(),
    education: await db.education.toArray(),
    care: await db.care.toArray(),
    dailyNote: await db.dailyNote.toArray(),
    settings: await db.settings.toArray(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

// ---- Import Data ----
export async function importAllData(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr);

  await db.transaction('rw', [db.feeding, db.diaper, db.supplement, db.sleep, db.education, db.care, db.dailyNote, db.settings], async () => {
    // Clear existing data
    await db.feeding.clear();
    await db.diaper.clear();
    await db.supplement.clear();
    await db.sleep.clear();
    await db.education.clear();
    await db.care.clear();
    await db.dailyNote.clear();
    await db.settings.clear();

    // Import
    if (data.feeding) await db.feeding.bulkAdd(data.feeding.map((r: any) => { delete r.id; return r; }));
    if (data.diaper) await db.diaper.bulkAdd(data.diaper.map((r: any) => { delete r.id; return r; }));
    if (data.supplement) await db.supplement.bulkAdd(data.supplement.map((r: any) => { delete r.id; return r; }));
    if (data.sleep) await db.sleep.bulkAdd(data.sleep.map((r: any) => { delete r.id; return r; }));
    if (data.education) await db.education.bulkAdd(data.education.map((r: any) => { delete r.id; return r; }));
    if (data.care) await db.care.bulkAdd(data.care.map((r: any) => { delete r.id; return r; }));
    if (data.dailyNote) await db.dailyNote.bulkAdd(data.dailyNote.map((r: any) => { delete r.id; return r; }));
    if (data.settings) await db.settings.bulkAdd(data.settings.map((r: any) => { delete r.id; return r; }));
  });
}

// ---- Stats for a day ----
export interface DayStats {
  feedingCount: number;
  totalMilk: number;  // ml (bottle only)
  totalBreastMin: number;
  diaperCount: number;
  poopCount: number;
  sleepHours: number;
  supplementsDone: number;
  supplementsTotal: number;
  careDone: number;
  careTotal: number;
}

export async function getDayStats(date: string): Promise<DayStats> {
  const feedings = await db.feeding.where('date').equals(date).toArray();
  const diapers = await db.diaper.where('date').equals(date).toArray();
  const sleeps = await db.sleep.where('date').equals(date).toArray();
  const supplements = await db.supplement.where('date').equals(date).toArray();
  const cares = await db.care.where('date').equals(date).toArray();

  const totalMilk = feedings.reduce((s, f) => s + f.bottleBreastMilk + f.bottleFormula, 0);
  const totalBreastMin = feedings.reduce((s, f) => s + f.breastLeft + f.breastRight, 0);
  const poopCount = diapers.filter(d => d.type === 'poop' || d.type === 'both').length;

  // Calculate sleep hours
  let sleepMinutes = 0;
  for (const s of sleeps) {
    if (s.startTime && s.endTime) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // overnight
      sleepMinutes += diff;
    }
  }

  let supplementsDone = 0;
  let supplementsTotal = 0;
  if (supplements.length > 0) {
    const items = supplements[0].items;
    supplementsTotal = Object.keys(items).length;
    supplementsDone = Object.values(items).filter(Boolean).length;
  }

  let careDone = 0;
  let careTotal = 0;
  if (cares.length > 0) {
    const items = cares[0].items;
    careTotal = Object.keys(items).length;
    careDone = Object.values(items).filter(Boolean).length;
  }

  return {
    feedingCount: feedings.length,
    totalMilk,
    totalBreastMin,
    diaperCount: diapers.length,
    poopCount,
    sleepHours: Math.round(sleepMinutes / 6) / 10, // round to 1 decimal
    supplementsDone,
    supplementsTotal,
    careDone,
    careTotal,
  };
}
