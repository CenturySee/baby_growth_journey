import { Router, type Request, type Response } from 'express';
import db from './db.js';

const router = Router();

// ---- Middleware: extract family code ----
function getFamilyCode(req: Request, res: Response): string | null {
    const code = req.headers['x-family-code'] as string;
    if (!code) {
        res.status(401).json({ error: '未提供家庭码' });
        return null;
    }
    return code;
}

// ---- Login / Register ----
router.post('/login', (req: Request, res: Response) => {
    const { familyCode } = req.body;
    if (!familyCode || typeof familyCode !== 'string' || familyCode.length < 4) {
        res.status(400).json({ error: '家庭码至少4位' });
        return;
    }

    const existing = db.prepare('SELECT code FROM family WHERE code = ?').get(familyCode);
    if (!existing) {
        db.prepare('INSERT INTO family (code, created_at) VALUES (?, ?)').run(familyCode, Date.now());
    }

    res.json({ success: true, familyCode });
});

// ---- Generic CRUD for simple tables ----
const TABLE_MAP: Record<string, { table: string; columns: string[] }> = {
    feeding: {
        table: 'feeding',
        columns: ['date', 'time', 'breast_left', 'breast_right', 'bottle_breast_milk', 'bottle_formula', 'created_at'],
    },
    diaper: {
        table: 'diaper',
        columns: ['date', 'time', 'type', 'color', 'amount', 'note', 'image', 'created_at'],
    },
    sleep: {
        table: 'sleep',
        columns: ['date', 'time:start_time', 'end_time', 'direction', 'created_at'],
    },
    education: {
        table: 'education',
        columns: ['date', 'category', 'duration', 'content', 'created_at'],
    },
};

// Field mapping: frontend camelCase -> backend snake_case
function toSnake(field: string): string {
    const map: Record<string, string> = {
        breastLeft: 'breast_left',
        breastRight: 'breast_right',
        bottleBreastMilk: 'bottle_breast_milk',
        bottleFormula: 'bottle_formula',
        startTime: 'start_time',
        endTime: 'end_time',
        createdAt: 'created_at',
        familyCode: 'family_code',
    };
    return map[field] || field;
}

function toCamel(field: string): string {
    const map: Record<string, string> = {
        breast_left: 'breastLeft',
        breast_right: 'breastRight',
        bottle_breast_milk: 'bottleBreastMilk',
        bottle_formula: 'bottleFormula',
        start_time: 'startTime',
        end_time: 'endTime',
        created_at: 'createdAt',
        family_code: 'familyCode',
    };
    return map[field] || field;
}

function rowToCamel(row: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(row)) {
        if (key === 'family_code') continue; // don't expose
        result[toCamel(key)] = value;
    }
    return result;
}

// ---- Supplement (single record per day, upsert) ----
// NOTE: Specific routes MUST come before generic /data/:table routes
router.get('/data/supplement', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date } = req.query;
    if (!date) { res.status(400).json({ error: '需要date参数' }); return; }

    const row = db.prepare(
        'SELECT * FROM supplement WHERE family_code = ? AND date = ? LIMIT 1'
    ).get(fc, date) as any;

    if (row) {
        const result = rowToCamel(row);
        result.items = JSON.parse(row.items);
        res.json(result);
    } else {
        res.json(null);
    }
});

router.post('/data/supplement', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date, items } = req.body;
    const itemsStr = JSON.stringify(items);

    const existing = db.prepare(
        'SELECT id FROM supplement WHERE family_code = ? AND date = ?'
    ).get(fc, date) as any;

    if (existing) {
        db.prepare('UPDATE supplement SET items = ?, created_at = ? WHERE id = ?')
            .run(itemsStr, Date.now(), existing.id);
        res.json({ id: existing.id });
    } else {
        const result = db.prepare(
            'INSERT INTO supplement (family_code, date, items, created_at) VALUES (?, ?, ?, ?)'
        ).run(fc, date, itemsStr, Date.now());
        res.json({ id: result.lastInsertRowid });
    }
});

// ---- Care (single record per day, upsert) ----
router.get('/data/care', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date } = req.query;
    if (!date) { res.status(400).json({ error: '需要date参数' }); return; }

    const row = db.prepare(
        'SELECT * FROM care WHERE family_code = ? AND date = ? LIMIT 1'
    ).get(fc, date) as any;

    if (row) {
        const result = rowToCamel(row);
        result.items = JSON.parse(row.items);
        res.json(result);
    } else {
        res.json(null);
    }
});

router.post('/data/care', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date, items } = req.body;
    const itemsStr = JSON.stringify(items);

    const existing = db.prepare(
        'SELECT id FROM care WHERE family_code = ? AND date = ?'
    ).get(fc, date) as any;

    if (existing) {
        db.prepare('UPDATE care SET items = ?, created_at = ? WHERE id = ?')
            .run(itemsStr, Date.now(), existing.id);
        res.json({ id: existing.id });
    } else {
        const result = db.prepare(
            'INSERT INTO care (family_code, date, items, created_at) VALUES (?, ?, ?, ?)'
        ).run(fc, date, itemsStr, Date.now());
        res.json({ id: result.lastInsertRowid });
    }
});

// ---- Daily Note (single record per day, upsert) ----
router.get('/data/dailyNote', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date } = req.query;
    if (!date) { res.status(400).json({ error: '需要date参数' }); return; }

    const row = db.prepare(
        'SELECT * FROM daily_note WHERE family_code = ? AND date = ? LIMIT 1'
    ).get(fc, date) as any;

    res.json(row ? rowToCamel(row) : null);
});

router.post('/data/dailyNote', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date, temperature, vaccine, note } = req.body;

    const existing = db.prepare(
        'SELECT id FROM daily_note WHERE family_code = ? AND date = ?'
    ).get(fc, date) as any;

    if (existing) {
        db.prepare('UPDATE daily_note SET temperature = ?, vaccine = ?, note = ?, created_at = ? WHERE id = ?')
            .run(temperature || 0, vaccine || '', note || '', Date.now(), existing.id);
        res.json({ id: existing.id });
    } else {
        const result = db.prepare(
            'INSERT INTO daily_note (family_code, date, temperature, vaccine, note, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(fc, date, temperature || 0, vaccine || '', note || '', Date.now());
        res.json({ id: result.lastInsertRowid });
    }
});

// ---- Generic CRUD for simple tables (MUST come after specific routes) ----

// GET /api/data/:table?date=YYYY-MM-DD
router.get('/data/:table', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const tableName = req.params.table as string;
    if (!TABLE_MAP[tableName]) {
        res.status(400).json({ error: '未知表名' });
        return;
    }

    const { date } = req.query;
    if (!date) {
        res.status(400).json({ error: '需要date参数' });
        return;
    }

    const rows = db.prepare(
        `SELECT * FROM ${tableName} WHERE family_code = ? AND date = ? ORDER BY created_at ASC`
    ).all(fc, date);

    res.json(rows.map(rowToCamel));
});

// POST /api/data/:table
router.post('/data/:table', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const tableName = req.params.table as string;
    const config = TABLE_MAP[tableName];
    if (!config) {
        res.status(400).json({ error: '未知表名' });
        return;
    }

    const body = req.body;
    const snakeBody: any = { family_code: fc };
    for (const [key, value] of Object.entries(body)) {
        if (key === 'id') continue;
        snakeBody[toSnake(key)] = value;
    }

    const cols = Object.keys(snakeBody);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map(c => snakeBody[c]);

    const result = db.prepare(
        `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`
    ).run(...values);

    res.json({ id: result.lastInsertRowid, ...rowToCamel(snakeBody) });
});

// DELETE /api/data/:table/:id
router.delete('/data/:table/:id', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const tableName = req.params.table as string;
    if (!TABLE_MAP[tableName]) {
        res.status(400).json({ error: '未知表名' });
        return;
    }

    const id = Number(req.params.id);
    db.prepare(`DELETE FROM ${tableName} WHERE id = ? AND family_code = ?`).run(id, fc);
    res.json({ success: true });
});

// ---- Settings ----
router.get('/settings', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const rows = db.prepare('SELECT key, value FROM settings WHERE family_code = ?').all(fc) as any[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json(settings);
});

router.post('/settings', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { key, value } = req.body;
    db.prepare(
        'INSERT INTO settings (family_code, key, value) VALUES (?, ?, ?) ON CONFLICT(family_code, key) DO UPDATE SET value = excluded.value'
    ).run(fc, key, value);

    res.json({ success: true });
});

// ---- Stats ----
router.get('/stats', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const { date } = req.query;
    if (!date) { res.status(400).json({ error: '需要date参数' }); return; }

    const feedings = db.prepare('SELECT * FROM feeding WHERE family_code = ? AND date = ?').all(fc, date) as any[];
    const diapers = db.prepare('SELECT * FROM diaper WHERE family_code = ? AND date = ?').all(fc, date) as any[];
    const sleeps = db.prepare('SELECT * FROM sleep WHERE family_code = ? AND date = ?').all(fc, date) as any[];
    const supplement = db.prepare('SELECT * FROM supplement WHERE family_code = ? AND date = ? LIMIT 1').get(fc, date) as any;
    const care = db.prepare('SELECT * FROM care WHERE family_code = ? AND date = ? LIMIT 1').get(fc, date) as any;

    const totalMilk = feedings.reduce((s: number, f: any) => s + f.bottle_breast_milk + f.bottle_formula, 0);
    const totalBreastMin = feedings.reduce((s: number, f: any) => s + f.breast_left + f.breast_right, 0);
    const poopCount = diapers.filter((d: any) => d.type === 'poop' || d.type === 'both').length;

    let sleepMinutes = 0;
    for (const s of sleeps) {
        if (s.start_time && s.end_time) {
            const [sh, sm] = s.start_time.split(':').map(Number);
            const [eh, em] = s.end_time.split(':').map(Number);
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 24 * 60;
            sleepMinutes += diff;
        }
    }

    let supplementsDone = 0, supplementsTotal = 0;
    if (supplement) {
        const items = JSON.parse(supplement.items);
        supplementsTotal = Object.keys(items).length;
        supplementsDone = Object.values(items).filter(Boolean).length;
    }

    let careDone = 0, careTotal = 0;
    if (care) {
        const items = JSON.parse(care.items);
        careTotal = Object.keys(items).length;
        careDone = Object.values(items).filter(Boolean).length;
    }

    res.json({
        feedingCount: feedings.length,
        totalMilk,
        totalBreastMin,
        diaperCount: diapers.length,
        poopCount,
        sleepHours: Math.round(sleepMinutes / 6) / 10,
        supplementsDone,
        supplementsTotal,
        careDone,
        careTotal,
    });
});

// ---- Export all data ----
router.get('/export', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const data: any = {};
    for (const table of ['feeding', 'diaper', 'sleep', 'education']) {
        const rows = db.prepare(`SELECT * FROM ${table} WHERE family_code = ?`).all(fc);
        data[table] = rows.map(rowToCamel);
    }

    // Supplement & care: parse items JSON
    const supplements = db.prepare('SELECT * FROM supplement WHERE family_code = ?').all(fc) as any[];
    data.supplement = supplements.map(r => {
        const row = rowToCamel(r);
        row.items = JSON.parse(r.items);
        return row;
    });

    const cares = db.prepare('SELECT * FROM care WHERE family_code = ?').all(fc) as any[];
    data.care = cares.map(r => {
        const row = rowToCamel(r);
        row.items = JSON.parse(r.items);
        return row;
    });

    data.dailyNote = db.prepare('SELECT * FROM daily_note WHERE family_code = ?').all(fc).map(rowToCamel);

    const settings = db.prepare('SELECT key, value FROM settings WHERE family_code = ?').all(fc) as any[];
    data.settings = settings;

    data.exportDate = new Date().toISOString();
    res.json(data);
});

// ---- Import data ----
router.post('/import', (req: Request, res: Response) => {
    const fc = getFamilyCode(req, res);
    if (!fc) return;

    const data = req.body;
    let imported = 0;

    const insertMany = db.transaction(() => {
        // Feeding
        if (Array.isArray(data.feeding)) {
            const stmt = db.prepare('INSERT INTO feeding (family_code, date, time, breast_left, breast_right, bottle_breast_milk, bottle_formula, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            for (const r of data.feeding) {
                stmt.run(fc, r.date, r.time, r.breastLeft || 0, r.breastRight || 0, r.bottleBreastMilk || 0, r.bottleFormula || 0, r.createdAt || Date.now());
                imported++;
            }
        }

        // Diaper
        if (Array.isArray(data.diaper)) {
            const stmt = db.prepare('INSERT INTO diaper (family_code, date, time, type, color, amount, note, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            for (const r of data.diaper) {
                stmt.run(fc, r.date, r.time, r.type, r.color || '', r.amount || '', r.note || '', r.image || '', r.createdAt || Date.now());
                imported++;
            }
        }

        // Sleep
        if (Array.isArray(data.sleep)) {
            const stmt = db.prepare('INSERT INTO sleep (family_code, date, start_time, end_time, direction, created_at) VALUES (?, ?, ?, ?, ?, ?)');
            for (const r of data.sleep) {
                stmt.run(fc, r.date, r.startTime, r.endTime || '', r.direction || '', r.createdAt || Date.now());
                imported++;
            }
        }

        // Education
        if (Array.isArray(data.education)) {
            const stmt = db.prepare('INSERT INTO education (family_code, date, category, duration, content, created_at) VALUES (?, ?, ?, ?, ?, ?)');
            for (const r of data.education) {
                stmt.run(fc, r.date, r.category, r.duration || 0, r.content || '', r.createdAt || Date.now());
                imported++;
            }
        }

        // Supplement
        if (Array.isArray(data.supplement)) {
            for (const r of data.supplement) {
                const itemsStr = typeof r.items === 'string' ? r.items : JSON.stringify(r.items);
                const existing = db.prepare('SELECT id FROM supplement WHERE family_code = ? AND date = ?').get(fc, r.date) as any;
                if (existing) {
                    db.prepare('UPDATE supplement SET items = ?, created_at = ? WHERE id = ?').run(itemsStr, r.createdAt || Date.now(), existing.id);
                } else {
                    db.prepare('INSERT INTO supplement (family_code, date, items, created_at) VALUES (?, ?, ?, ?)').run(fc, r.date, itemsStr, r.createdAt || Date.now());
                }
                imported++;
            }
        }

        // Care
        if (Array.isArray(data.care)) {
            for (const r of data.care) {
                const itemsStr = typeof r.items === 'string' ? r.items : JSON.stringify(r.items);
                const existing = db.prepare('SELECT id FROM care WHERE family_code = ? AND date = ?').get(fc, r.date) as any;
                if (existing) {
                    db.prepare('UPDATE care SET items = ?, created_at = ? WHERE id = ?').run(itemsStr, r.createdAt || Date.now(), existing.id);
                } else {
                    db.prepare('INSERT INTO care (family_code, date, items, created_at) VALUES (?, ?, ?, ?)').run(fc, r.date, itemsStr, r.createdAt || Date.now());
                }
                imported++;
            }
        }

        // Daily notes
        if (Array.isArray(data.dailyNote)) {
            for (const r of data.dailyNote) {
                const existing = db.prepare('SELECT id FROM daily_note WHERE family_code = ? AND date = ?').get(fc, r.date) as any;
                if (existing) {
                    db.prepare('UPDATE daily_note SET temperature = ?, vaccine = ?, note = ?, created_at = ? WHERE id = ?')
                        .run(r.temperature || 0, r.vaccine || '', r.note || '', r.createdAt || Date.now(), existing.id);
                } else {
                    db.prepare('INSERT INTO daily_note (family_code, date, temperature, vaccine, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                        .run(fc, r.date, r.temperature || 0, r.vaccine || '', r.note || '', r.createdAt || Date.now());
                }
                imported++;
            }
        }

        // Settings
        if (Array.isArray(data.settings)) {
            for (const s of data.settings) {
                db.prepare('INSERT INTO settings (family_code, key, value) VALUES (?, ?, ?) ON CONFLICT(family_code, key) DO UPDATE SET value = excluded.value')
                    .run(fc, s.key, s.value);
                imported++;
            }
        }
    });

    insertMany();
    res.json({ success: true, imported });
});

export default router;
