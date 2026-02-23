import { db, type FeedingRecord } from '../db';
import { getToday, getNowTime, showToast, getApp, renderPageHeader } from '../utils';

export async function renderFeeding() {
    const app = getApp();
    const today = getToday();

    app.innerHTML = `
    ${renderPageHeader('喂养记录', '🍼')}

    <div class="card">
      <div class="form-group">
        <label>⏰ 时间</label>
        <input type="time" id="feedTime" value="${getNowTime()}" />
      </div>

      <h3>🤱 亲喂</h3>
      <div class="inline-row">
        <div class="form-group">
          <label>左侧 (分钟)</label>
          <input type="number" id="breastLeft" value="0" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>右侧 (分钟)</label>
          <input type="number" id="breastRight" value="0" min="0" step="1" />
        </div>
      </div>

      <h3>🍼 瓶喂</h3>
      <div class="inline-row">
        <div class="form-group">
          <label>母乳 (ml)</label>
          <input type="number" id="bottleBM" value="0" min="0" step="5" />
        </div>
        <div class="form-group">
          <label>配方 (ml)</label>
          <input type="number" id="bottleFormula" value="0" min="0" step="5" />
        </div>
      </div>

      <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
    </div>

    <div class="record-list" id="feedingList">
      <h3>📋 今日记录</h3>
      <div id="listContent"></div>
    </div>
  `;

    // Save handler
    document.getElementById('saveBtn')?.addEventListener('click', async () => {
        const record: FeedingRecord = {
            date: today,
            time: (document.getElementById('feedTime') as HTMLInputElement).value,
            breastLeft: Number((document.getElementById('breastLeft') as HTMLInputElement).value) || 0,
            breastRight: Number((document.getElementById('breastRight') as HTMLInputElement).value) || 0,
            bottleBreastMilk: Number((document.getElementById('bottleBM') as HTMLInputElement).value) || 0,
            bottleFormula: Number((document.getElementById('bottleFormula') as HTMLInputElement).value) || 0,
            createdAt: Date.now(),
        };

        await db.feeding.add(record);
        showToast('喂养记录已保存 ✅');

        // Reset form
        (document.getElementById('feedTime') as HTMLInputElement).value = getNowTime();
        (document.getElementById('breastLeft') as HTMLInputElement).value = '0';
        (document.getElementById('breastRight') as HTMLInputElement).value = '0';
        (document.getElementById('bottleBM') as HTMLInputElement).value = '0';
        (document.getElementById('bottleFormula') as HTMLInputElement).value = '0';

        await loadFeedingList(today);
    });

    await loadFeedingList(today);
}

async function loadFeedingList(date: string) {
    const container = document.getElementById('listContent');
    if (!container) return;

    const records = await db.feeding.where('date').equals(date).sortBy('createdAt');

    if (records.length === 0) {
        container.innerHTML = `<p class="empty-state">暂无记录，请添加第一条</p>`;
        return;
    }

    let html = '';
    let totalMilk = 0;
    let totalBreast = 0;
    for (const f of records) {
        const details = [];
        if (f.breastLeft > 0 || f.breastRight > 0) {
            details.push(`亲喂 左${f.breastLeft}′ 右${f.breastRight}′`);
            totalBreast += f.breastLeft + f.breastRight;
        }
        if (f.bottleBreastMilk > 0) { details.push(`母乳${f.bottleBreastMilk}ml`); totalMilk += f.bottleBreastMilk; }
        if (f.bottleFormula > 0) { details.push(`配方${f.bottleFormula}ml`); totalMilk += f.bottleFormula; }

        html += `
      <div class="record-item">
        <span class="record-time">${f.time}</span>
        <span class="record-detail">${details.join(' | ')}</span>
        <div class="record-actions">
          <button class="btn-delete" data-id="${f.id}">✕</button>
        </div>
      </div>`;
    }

    html += `<div class="card" style="margin-top:12px;text-align:center;">
    <strong>共${records.length}次</strong> · 瓶喂${totalMilk}ml · 亲喂${totalBreast}min
  </div>`;

    container.innerHTML = html;

    // Delete handlers
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = Number((e.currentTarget as HTMLElement).dataset.id);
            if (!confirm('确认删除？')) return;
            await db.feeding.delete(id);
            showToast('已删除');
            await loadFeedingList(date);
        });
    });
}
