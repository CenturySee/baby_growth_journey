// ---- Family Code Management ----
const FAMILY_CODE_KEY = 'baby_growth_family_code';

export function getFamilyCode(): string | null {
    return localStorage.getItem(FAMILY_CODE_KEY);
}

export function setFamilyCode(code: string): void {
    localStorage.setItem(FAMILY_CODE_KEY, code);
}

export function clearFamilyCode(): void {
    localStorage.removeItem(FAMILY_CODE_KEY);
}

// ---- API Base ----
function getApiBase(): string {
    // In dev, proxy via vite; in production, same origin
    return '/api';
}

function getHeaders(): Record<string, string> {
    const fc = getFamilyCode();
    return {
        'Content-Type': 'application/json',
        ...(fc ? { 'X-Family-Code': fc } : {}),
    };
}

// ---- Generic HTTP helpers ----
async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${getApiBase()}${path}`, { headers: getHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

async function apiPost<T>(path: string, data: any): Promise<T> {
    const res = await fetch(`${getApiBase()}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

async function apiDelete(path: string): Promise<void> {
    const res = await fetch(`${getApiBase()}${path}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
}

// ---- Login ----
export async function login(familyCode: string): Promise<boolean> {
    const result = await apiPost<{ success: boolean }>('/login', { familyCode });
    if (result.success) {
        setFamilyCode(familyCode);
    }
    return result.success;
}

// ---- Interfaces ----
export interface FeedingRecord {
    id?: number;
    date: string;
    time: string;
    breastLeft: number;
    breastRight: number;
    bottleBreastMilk: number;
    bottleFormula: number;
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
    image?: string;
    createdAt: number;
}

export interface SupplementRecord {
    id?: number;
    date: string;
    items: { [key: string]: boolean };
    createdAt: number;
}

export interface SleepRecord {
    id?: number;
    date: string;
    startTime: string;
    endTime: string;
    direction: string;
    createdAt: number;
}

export interface EducationRecord {
    id?: number;
    date: string;
    category: string;
    duration: number;
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

export interface DayStats {
    feedingCount: number;
    totalMilk: number;
    totalBreastMin: number;
    diaperCount: number;
    poopCount: number;
    sleepHours: number;
    supplementsDone: number;
    supplementsTotal: number;
    careDone: number;
    careTotal: number;
}

// ---- Data API Functions ----

// Feeding
export const feeding = {
    async list(date: string): Promise<FeedingRecord[]> {
        return apiGet(`/data/feeding?date=${date}`);
    },
    async add(record: FeedingRecord): Promise<FeedingRecord> {
        return apiPost('/data/feeding', record);
    },
    async remove(id: number): Promise<void> {
        return apiDelete(`/data/feeding/${id}`);
    },
};

// Diaper
export const diaper = {
    async list(date: string): Promise<DiaperRecord[]> {
        return apiGet(`/data/diaper?date=${date}`);
    },
    async add(record: DiaperRecord): Promise<DiaperRecord> {
        return apiPost('/data/diaper', record);
    },
    async remove(id: number): Promise<void> {
        return apiDelete(`/data/diaper/${id}`);
    },
};

// Sleep
export const sleep = {
    async list(date: string): Promise<SleepRecord[]> {
        return apiGet(`/data/sleep?date=${date}`);
    },
    async add(record: SleepRecord): Promise<SleepRecord> {
        return apiPost('/data/sleep', record);
    },
    async remove(id: number): Promise<void> {
        return apiDelete(`/data/sleep/${id}`);
    },
};

// Education
export const education = {
    async list(date: string): Promise<EducationRecord[]> {
        return apiGet(`/data/education?date=${date}`);
    },
    async add(record: EducationRecord): Promise<EducationRecord> {
        return apiPost('/data/education', record);
    },
    async remove(id: number): Promise<void> {
        return apiDelete(`/data/education/${id}`);
    },
};

// Supplement (single record per day)
export const supplement = {
    async get(date: string): Promise<SupplementRecord | null> {
        return apiGet(`/data/supplement?date=${date}`);
    },
    async save(date: string, items: { [key: string]: boolean }): Promise<void> {
        await apiPost('/data/supplement', { date, items });
    },
};

// Care (single record per day)
export const care = {
    async get(date: string): Promise<CareRecord | null> {
        return apiGet(`/data/care?date=${date}`);
    },
    async save(date: string, items: { [key: string]: boolean }): Promise<void> {
        await apiPost('/data/care', { date, items });
    },
};

// Daily Note (single per day)
export const dailyNote = {
    async get(date: string): Promise<DailyNote | null> {
        return apiGet(`/data/dailyNote?date=${date}`);
    },
    async save(data: Partial<DailyNote> & { date: string }): Promise<void> {
        await apiPost('/data/dailyNote', data);
    },
};

// Settings
export async function getSetting(key: string): Promise<string | undefined> {
    const settings = await apiGet<Record<string, string>>('/settings');
    return settings[key];
}

export async function setSetting(key: string, value: string): Promise<void> {
    await apiPost('/settings', { key, value });
}

// Stats
export async function getDayStats(date: string): Promise<DayStats> {
    return apiGet(`/stats?date=${date}`);
}

// Export
export async function exportAllData(): Promise<string> {
    const data = await apiGet('/export');
    return JSON.stringify(data, null, 2);
}

// Import
export async function importAllData(jsonStr: string): Promise<number> {
    const data = JSON.parse(jsonStr);
    const result = await apiPost<{ success: boolean; imported: number }>('/import', data);
    return result.imported;
}
