import { db, type SupplementRecord } from '../db';
import { getToday, showToast, getApp, renderPageHeader } from '../utils';

const SUPPLEMENT_LIST = [
    { key: 'AD', emoji: '🟠', label: 'AD' },
    { key: 'D3', emoji: '🟡', label: 'D3' },
    { key: '铁', emoji: '⚫', label: '铁' },
    { key: '水', emoji: '💧', label: '水' },
    { key: '益生菌', emoji: '🦠', label: '益生菌' },
    { key: '乳糖酶', emoji: '🧪', label: '乳糖酶' },
    { key: 'DHA', emoji: '🐟', label: 'DHA' },
];

export async function renderSupplement() {
    const app = getApp();
    const today = getToday();

    // Load existing record for today
    let existing = await db.supplement.where('date').equals(today).first();
    let items: Record<string, boolean> = {};
    for (const s of SUPPLEMENT_LIST) {
        items[s.key] = existing?.items[s.key] || false;
    }

    app.innerHTML = `
    ${renderPageHeader('补剂&药物', '💊')}

    <div class="card">
      <p style="color:var(--color-text-secondary); margin-bottom: var(--spacing);">点击标记已服用的补剂：</p>
      <div class="supplement-grid" id="supplementGrid">
        ${SUPPLEMENT_LIST.map(s => `
          <div class="supplement-item ${items[s.key] ? 'checked' : ''}" data-key="${s.key}">
            <span class="check-icon">${items[s.key] ? '✓' : ''}</span>
            <span>${s.emoji} ${s.label}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
  `;

    // Toggle supplement items
    document.querySelectorAll('.supplement-item').forEach(el => {
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
            await db.supplement.update(existing.id!, { items: { ...items } });
        } else {
            const record: SupplementRecord = {
                date: today,
                items: { ...items },
                createdAt: Date.now(),
            };
            await db.supplement.add(record);
            existing = await db.supplement.where('date').equals(today).first();
        }
        showToast('补剂记录已保存 ✅');
    });
}
