import { education, type EducationRecord } from '../api';
import { getToday, showToast, getApp, renderPageHeader } from '../utils';

const CATEGORIES = ['视觉训练', '听觉训练', '大动作训练', '精细动作'];

export async function renderEducation() {
  const app = getApp();
  const today = getToday();

  app.innerHTML = `
    ${renderPageHeader('早教/锻炼', '🎓')}

    <div class="card">
      <div class="form-group">
        <label>类别</label>
        <div class="toggle-group" id="eduCategory">
          ${CATEGORIES.map((c, i) => `
            <button class="toggle-btn ${i === 0 ? 'active' : ''}" data-value="${c}">${c}</button>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label>⏱️ 时长 (分钟)</label>
        <input type="number" id="eduDuration" value="5" min="1" step="1" />
      </div>

      <div class="form-group">
        <label>📝 内容描述</label>
        <input type="text" id="eduContent" placeholder="例如：黑白卡、摇铃..." />
      </div>

      <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
    </div>

    <div class="record-list" id="eduList">
      <h3>📋 今日记录</h3>
      <div id="listContent"></div>
    </div>
  `;

  // Toggle
  document.querySelectorAll('#eduCategory .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#eduCategory .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Save
  document.getElementById('saveBtn')?.addEventListener('click', async () => {
    const activeBtn = document.querySelector('#eduCategory .toggle-btn.active') as HTMLElement;
    const record: EducationRecord = {
      date: today,
      category: activeBtn?.dataset.value || CATEGORIES[0],
      duration: Number((document.getElementById('eduDuration') as HTMLInputElement).value) || 5,
      content: (document.getElementById('eduContent') as HTMLInputElement).value,
      createdAt: Date.now(),
    };

    await education.add(record);
    showToast('早教记录已保存 ✅');
    (document.getElementById('eduContent') as HTMLInputElement).value = '';
    await loadEduList(today);
  });

  await loadEduList(today);
}

async function loadEduList(date: string) {
  const container = document.getElementById('listContent');
  if (!container) return;

  const records = await education.list(date);

  if (records.length === 0) {
    container.innerHTML = `<p class="empty-state">暂无记录</p>`;
    return;
  }

  let totalMin = 0;
  let html = '';
  for (const e of records) {
    totalMin += e.duration;
    html += `
      <div class="record-item compact-record">
        <div class="tag-row">
          <span class="tag tag-purple">${e.category}</span>
          <span class="tag tag-blue">${e.duration}min</span>
          ${e.content ? `<span class="tag tag-gray">${e.content}</span>` : ''}
        </div>
        <div class="record-actions">
          <button class="btn-delete" data-id="${e.id}">✕</button>
        </div>
      </div>`;
  }

  html += `<div class="card" style="margin-top:12px;text-align:center;">
    <strong>共${records.length}次</strong> · 总计${totalMin}分钟
  </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).dataset.id);
      if (!confirm('确认删除？')) return;
      await education.remove(id);
      showToast('已删除');
      await loadEduList(date);
    });
  });
}
