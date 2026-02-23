import { db, type DailyNote } from '../db';
import { getToday, showToast, getApp, renderPageHeader } from '../utils';

export async function renderDailyNote() {
    const app = getApp();
    const today = getToday();

    // Load existing
    const existing = await db.dailyNote.where('date').equals(today).first();

    app.innerHTML = `
    ${renderPageHeader('今日小记', '📝')}

    <div class="card">
      <div class="form-group">
        <label>🌡️ 体温 (°C)</label>
        <input type="number" id="temperature" value="${existing?.temperature ?? 36.5}" min="35" max="42" step="0.1" />
      </div>

      <div class="form-group">
        <label>💉 疫苗接种</label>
        <input type="text" id="vaccine" value="${existing?.vaccine || ''}" placeholder="例如：百白破第2针" />
      </div>

      <div class="form-group">
        <label>📋 备注</label>
        <textarea id="noteText" rows="4" placeholder="记录宝宝今天的特别情况...">${existing?.note || ''}</textarea>
      </div>

      <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
    </div>
  `;

    // Save
    document.getElementById('saveBtn')?.addEventListener('click', async () => {
        const data = {
            date: today,
            temperature: Number((document.getElementById('temperature') as HTMLInputElement).value) || 36.5,
            vaccine: (document.getElementById('vaccine') as HTMLInputElement).value,
            note: (document.getElementById('noteText') as HTMLTextAreaElement).value,
            createdAt: Date.now(),
        };

        if (existing) {
            await db.dailyNote.update(existing.id!, data);
        } else {
            await db.dailyNote.add(data as DailyNote);
        }
        showToast('小记已保存 ✅');
    });
}
