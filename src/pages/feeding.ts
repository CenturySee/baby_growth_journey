import { feeding, type FeedingRecord } from '../api';
import { getToday, showToast, getApp, renderPageHeader, getNowFloored, renderTimeSelector, getTimeFromSelectors, resetTimeSelector } from '../utils';

export async function renderFeeding() {
  const app = getApp();
  const today = getToday();
  const now = getNowFloored();

  app.innerHTML = `
    ${renderPageHeader('喂养记录', '🍼')}

    <div class="card">
      ${renderTimeSelector('feedTime', '⏰ 时间', now)}

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
    const time = getTimeFromSelectors('feedTime');
    if (!time) { showToast('请选择时间'); return; }

    const record: FeedingRecord = {
      date: today,
      time,
      breastLeft: Number((document.getElementById('breastLeft') as HTMLInputElement).value) || 0,
      breastRight: Number((document.getElementById('breastRight') as HTMLInputElement).value) || 0,
      bottleBreastMilk: Number((document.getElementById('bottleBM') as HTMLInputElement).value) || 0,
      bottleFormula: Number((document.getElementById('bottleFormula') as HTMLInputElement).value) || 0,
      createdAt: Date.now(),
    };

    await feeding.add(record);
    showToast('喂养记录已保存 ✅');

    // Reset form
    resetTimeSelector('feedTime', getNowFloored());
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

  const records = await feeding.list(date);

  if (records.length === 0) {
    container.innerHTML = `<p class="empty-state">暂无记录，请添加第一条</p>`;
    return;
  }

  let html = '';
  let totalMilk = 0;
  let totalBreast = 0;
  for (const f of records) {
    if (f.breastLeft > 0 || f.breastRight > 0) {
      totalBreast += f.breastLeft + f.breastRight;
    }
    if (f.bottleBreastMilk > 0) totalMilk += f.bottleBreastMilk;
    if (f.bottleFormula > 0) totalMilk += f.bottleFormula;

    html += `
      <div class="record-item compact-record">
        <span class="record-time">${f.time}</span>
        <div class="tag-row">
          ${f.breastLeft > 0 ? `<span class="tag tag-pink">左${f.breastLeft}′</span>` : ''}
          ${f.breastRight > 0 ? `<span class="tag tag-pink">右${f.breastRight}′</span>` : ''}
          ${f.bottleBreastMilk > 0 ? `<span class="tag tag-blue">母乳${f.bottleBreastMilk}ml</span>` : ''}
          ${f.bottleFormula > 0 ? `<span class="tag tag-green">配方${f.bottleFormula}ml</span>` : ''}
        </div>
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
      await feeding.remove(id);
      showToast('已删除');
      await loadFeedingList(date);
    });
  });
}
