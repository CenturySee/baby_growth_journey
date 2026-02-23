import { db, getDayStats, getSetting, exportAllData, importAllData } from '../db';
import { getToday, isToday, addDays, daysBetween, showToast, getApp } from '../utils';
import { navigate } from '../router';

let currentDate = getToday();

export function setHomeDate(date: string) {
  currentDate = date;
}

export async function renderHome() {
  currentDate = getToday();
  const app = getApp();
  const birthDate = await getSetting('birthDate');

  app.innerHTML = `
    <h1>👶 宝宝成长记录</h1>

    ${birthDate ? (daysBetween(birthDate, currentDate) >= 0 ? `<div class="day-label">宝宝第 <strong>${daysBetween(birthDate, currentDate) + 1}</strong> 天</div>` : `<div class="day-label">⚠️ 所选日期早于出生日期 (${birthDate})</div>`) : ''}

    <div class="date-row">
      <button class="btn-date-nav" id="prevDay">◀</button>
      <input type="date" id="dateInput" value="${currentDate}" />
      <button class="btn-date-nav" id="nextDay">▶</button>
    </div>

    <div class="icon-grid" id="iconGrid">
      <div class="icon-card" data-route="/feeding">
        <span class="emoji">🍼</span>
        <span class="label">喂养记录</span>
      </div>
      <div class="icon-card" data-route="/diaper">
        <span class="emoji">🧷</span>
        <span class="label">尿布情况</span>
      </div>
      <div class="icon-card" data-route="/sleep">
        <span class="emoji">😴</span>
        <span class="label">睡眠记录</span>
      </div>
      <div class="icon-card" data-route="/care">
        <span class="emoji">🧴</span>
        <span class="label">护理记录</span>
      </div>
      <div class="icon-card" data-route="/education">
        <span class="emoji">🎓</span>
        <span class="label">早教锻炼</span>
      </div>
      <div class="icon-card" data-route="/supplement">
        <span class="emoji">💊</span>
        <span class="label">补剂药物</span>
      </div>
      <div class="icon-card icon-card-center" data-route="/dailynote">
        <span class="emoji">📝</span>
        <span class="label">今日小记</span>
      </div>
    </div>

    <h3>📊 今日统计</h3>
    <div class="stats-grid" id="statsGrid">
      <div class="stat-item"><div class="stat-value">-</div><div class="stat-label">加载中...</div></div>
    </div>

    <div id="dayRecords"></div>

    <div class="backup-section">
      <div class="settings-row">
        <button class="settings-link" id="settingsBtn">⚙️ 设置出生日期</button>
      </div>
      <button class="btn btn-outline btn-full" id="exportBtn">📤 导出备份数据</button>
      <button class="btn btn-outline btn-full" id="importBtn">📥 导入恢复数据</button>
      <input type="file" id="importFile" accept=".json" style="display:none" />
    </div>
  `;

  // Event listeners
  bindEvents();
  await loadStats();
  await loadDayRecords();
}

function bindEvents() {
  // Icon click
  document.querySelectorAll('.icon-card').forEach(card => {
    card.addEventListener('click', () => {
      const route = (card as HTMLElement).dataset.route;
      if (route) navigate(route);
    });
  });

  // Date navigation
  document.getElementById('prevDay')?.addEventListener('click', () => {
    currentDate = addDays(currentDate, -1);
    (document.getElementById('dateInput') as HTMLInputElement).value = currentDate;
    refreshData();
  });

  document.getElementById('nextDay')?.addEventListener('click', () => {
    currentDate = addDays(currentDate, 1);
    (document.getElementById('dateInput') as HTMLInputElement).value = currentDate;
    refreshData();
  });

  document.getElementById('dateInput')?.addEventListener('change', (e) => {
    currentDate = (e.target as HTMLInputElement).value;
    refreshData();
  });

  // Settings
  document.getElementById('settingsBtn')?.addEventListener('click', async () => {
    const current = await getSetting('birthDate') || '';
    const val = prompt('请输入宝宝出生日期 (YYYY-MM-DD):', current);
    if (val) {
      const { setSetting } = await import('../db');
      await setSetting('birthDate', val);
      showToast('出生日期已保存');
      renderHome();
    }
  });

  // Export
  document.getElementById('exportBtn')?.addEventListener('click', async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baby_data_${getToday()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出');
    } catch (e) {
      showToast('导出失败');
    }
  });

  // Import
  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importFile')?.click();
  });

  document.getElementById('importFile')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!confirm('导入将覆盖当前所有数据，是否继续？')) return;
    try {
      const text = await file.text();
      await importAllData(text);
      showToast('数据已恢复');
      renderHome();
    } catch (e) {
      showToast('导入失败，请检查文件格式');
    }
  });
}

async function refreshData() {
  const birthDate = await getSetting('birthDate');
  const dayLabel = document.querySelector('.day-label');
  if (dayLabel && birthDate) {
    const days = daysBetween(birthDate, currentDate);
    dayLabel.innerHTML = days >= 0
      ? `宝宝第 <strong>${days + 1}</strong> 天`
      : `⚠️ 所选日期早于出生日期 (${birthDate})`;
  }
  await loadStats();
  await loadDayRecords();
}

async function loadStats() {
  const stats = await getDayStats(currentDate);
  const grid = document.getElementById('statsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${stats.feedingCount}</div>
      <div class="stat-label">喂养次数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.totalMilk}<small>ml</small></div>
      <div class="stat-label">瓶喂奶量</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.totalBreastMin}<small>min</small></div>
      <div class="stat-label">亲喂时长</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.diaperCount}</div>
      <div class="stat-label">尿布次数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.poopCount}</div>
      <div class="stat-label">大便次数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.sleepHours}<small>h</small></div>
      <div class="stat-label">睡眠时长</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.supplementsDone}/${stats.supplementsTotal || '-'}</div>
      <div class="stat-label">补剂完成</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.careDone}/${stats.careTotal || '-'}</div>
      <div class="stat-label">护理完成</div>
    </div>
  `;
}

async function loadDayRecords() {
  const container = document.getElementById('dayRecords');
  if (!container) return;

  const readonly = !isToday(currentDate);
  const readonlyClass = readonly ? 'readonly' : '';

  // Load feeding records
  const feedings = await db.feeding.where('date').equals(currentDate).sortBy('createdAt');
  const diapers = await db.diaper.where('date').equals(currentDate).sortBy('createdAt');
  const sleeps = await db.sleep.where('date').equals(currentDate).sortBy('createdAt');
  const educations = await db.education.where('date').equals(currentDate).sortBy('createdAt');
  const dailyNotes = await db.dailyNote.where('date').equals(currentDate).toArray();

  let html = '';

  if (readonly) {
    html += `<div class="divider"></div>`;
    html += `<p class="empty-state" style="color:var(--color-primary);">📅 查看 ${currentDate} 的记录（只读）</p>`;
  }

  // Feeding
  if (feedings.length > 0) {
    html += `<div class="record-list"><h3>🍼 喂养记录</h3>`;
    for (const f of feedings) {
      const tags = [];
      if (f.breastLeft > 0) tags.push(`<span class="tag tag-pink">左${f.breastLeft}min</span>`);
      if (f.breastRight > 0) tags.push(`<span class="tag tag-pink">右${f.breastRight}min</span>`);
      if (f.bottleBreastMilk > 0) tags.push(`<span class="tag tag-blue">母乳${f.bottleBreastMilk}ml</span>`);
      if (f.bottleFormula > 0) tags.push(`<span class="tag tag-green">配方${f.bottleFormula}ml</span>`);
      html += `
        <div class="record-item compact-record ${readonlyClass}">
          <span class="record-time">${f.time}</span>
          <div class="tag-row">${tags.join('')}</div>
          <div class="record-actions">
            <button class="btn-delete" data-table="feeding" data-id="${f.id}">✕</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  // Diapers
  if (diapers.length > 0) {
    html += `<div class="record-list"><h3>🧷 尿布情况</h3>`;
    const typeTag: Record<string, string> = { pee: 'tag-blue', poop: 'tag-orange', both: 'tag-purple' };
    const typeLabel: Record<string, string> = { pee: '💧小便', poop: '💩大便', both: '💧💩大+小' };
    for (const d of diapers) {
      const tags = [`<span class="tag ${typeTag[d.type] || 'tag-blue'}">${typeLabel[d.type] || d.type}</span>`];
      if (d.color) tags.push(`<span class="tag tag-yellow">${d.color}</span>`);
      if (d.amount) tags.push(`<span class="tag tag-gray">${d.amount}</span>`);
      if (d.note) tags.push(`<span class="tag tag-gray">${d.note}</span>`);
      html += `
        <div class="record-item compact-record ${readonlyClass}">
          <span class="record-time">${d.time}</span>
          <div class="tag-row">${tags.join('')}</div>
          <div class="record-actions">
            <button class="btn-delete" data-table="diaper" data-id="${d.id}">✕</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  // Sleep
  if (sleeps.length > 0) {
    html += `<div class="record-list"><h3>😴 睡眠记录</h3>`;
    for (const s of sleeps) {
      let durationTag = '';
      if (s.startTime && s.endTime) {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        durationTag = `<span class="tag tag-blue">${h}h${m > 0 ? m + 'min' : ''}</span>`;
      }
      html += `
        <div class="record-item compact-record ${readonlyClass}">
          <span class="record-time">${s.startTime}→${s.endTime || '...'}</span>
          <div class="tag-row">
            ${durationTag}
            ${s.direction ? `<span class="tag tag-orange">${s.direction}侧</span>` : ''}
          </div>
          <div class="record-actions">
            <button class="btn-delete" data-table="sleep" data-id="${s.id}">✕</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  // Education
  if (educations.length > 0) {
    html += `<div class="record-list"><h3>🎓 早教锻炼</h3>`;
    for (const e of educations) {
      html += `
        <div class="record-item ${readonlyClass}">
          <span class="record-time">${e.category}</span>
          <span class="record-detail">${e.duration}分钟 ${e.content || ''}</span>
          <div class="record-actions">
            <button class="btn-delete" data-table="education" data-id="${e.id}">✕</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  // Daily note
  if (dailyNotes.length > 0) {
    const n = dailyNotes[0];
    html += `<div class="record-list"><h3>📝 今日小记</h3>`;
    html += `<div class="card">`;
    if (n.temperature) html += `<p>🌡️ 体温: ${n.temperature}°C</p>`;
    if (n.vaccine) html += `<p>💉 疫苗: ${n.vaccine}</p>`;
    if (n.note) html += `<p>📋 备注: ${n.note}</p>`;
    html += `</div></div>`;
  }

  if (!feedings.length && !diapers.length && !sleeps.length && !educations.length && !dailyNotes.length) {
    if (readonly) {
      html += `<p class="empty-state">暂无记录</p>`;
    }
  }

  container.innerHTML = html;

  // Bind delete buttons
  if (!readonly) {
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const el = e.currentTarget as HTMLElement;
        const table = el.dataset.table!;
        const id = Number(el.dataset.id);
        if (!confirm('确认删除？')) return;
        await (db as any)[table].delete(id);
        showToast('已删除');
        await loadStats();
        await loadDayRecords();
      });
    });
  }
}
