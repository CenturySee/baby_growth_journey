import { db, type CareRecord } from '../db';
import { getToday, showToast, getApp, renderPageHeader } from '../utils';

const CARE_ITEMS = [
    { key: '洗脸', emoji: '🧼' },
    { key: '鼻腔清洁', emoji: '👃' },
    { key: '洗手', emoji: '🤲' },
    { key: '保湿', emoji: '💧' },
    { key: '洗澡', emoji: '🛁' },
    { key: '剪指甲', emoji: '✂️' },
    { key: '口腔清洁', emoji: '🦷' },
];

export async function renderCare() {
    const app = getApp();
    const today = getToday();

    // Load existing
    let existing = await db.care.where('date').equals(today).first();
    let items: Record<string, boolean> = {};
    for (const c of CARE_ITEMS) {
        items[c.key] = existing?.items[c.key] || false;
    }

    app.innerHTML = `
    ${renderPageHeader('护理记录', '🧴')}

    <div class="card">
      <p style="color:var(--color-text-secondary); margin-bottom: var(--spacing);">点击标记已完成的护理项目：</p>
      <div class="care-grid" id="careGrid">
        ${CARE_ITEMS.map(c => `
          <div class="care-item ${items[c.key] ? 'checked' : ''}" data-key="${c.key}">
            <span class="check-icon">${items[c.key] ? '✓' : ''}</span>
            <span>${c.emoji} ${c.key}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
  `;

    // Toggle items
    document.querySelectorAll('.care-item').forEach(el => {
        el.addEventListener('click', () => {
            const key = (el as HTMLElement).dataset.key!;
            items[key] = !items[key];
            el.classList.toggle('checked');
            const icon = el.querySelector('.check-icon')!;
            icon.textContent = items[key] ? '✓' : '';
        });
    });

    // Save
    document.getElementById('saveBtn')?.addEventListener('click', async () => {
        if (existing) {
            await db.care.update(existing.id!, { items: { ...items } });
        } else {
            const record: CareRecord = {
                date: today,
                items: { ...items },
                createdAt: Date.now(),
            };
            await db.care.add(record);
            existing = await db.care.where('date').equals(today).first();
        }
        showToast('护理记录已保存 ✅');
    });
}
