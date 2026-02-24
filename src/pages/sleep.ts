import { sleep, type SleepRecord } from '../api';
import { getToday, showToast, getApp, renderPageHeader } from '../utils';

function buildHourOptions(selected?: number): string {
  let html = '';
  for (let h = 0; h < 24; h++) {
    const label = String(h).padStart(2, '0');
    html += `<option value="${h}" ${h === selected ? 'selected' : ''}>${label}</option>`;
  }
  return html;
}

function buildMinuteOptions(selected?: number): string {
  const mins = [0, 15, 30, 45];
  let html = '';
  for (const m of mins) {
    const label = String(m).padStart(2, '0');
    html += `<option value="${m}" ${m === selected ? 'selected' : ''}>${label}</option>`;
  }
  return html;
}

function getNowRounded(): { hour: number; minute: number } {
  const d = new Date();
  const mins = [0, 15, 30, 45];
  const raw = d.getMinutes();
  // Round to nearest 15
  const nearest = mins.reduce((prev, curr) => Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev);
  let hour = d.getHours();
  if (nearest === 0 && raw > 45) hour = (hour + 1) % 24; // rolled over
  return { hour, minute: nearest };
}

function getTimeFromSelectors(prefix: string): string {
  const h = (document.getElementById(`${prefix}H`) as HTMLSelectElement).value;
  const m = (document.getElementById(`${prefix}M`) as HTMLSelectElement).value;
  if (h === '' || m === '') return '';
  return `${String(Number(h)).padStart(2, '0')}:${String(Number(m)).padStart(2, '0')}`;
}

export async function renderSleep() {
  const app = getApp();
  const today = getToday();
  const now = getNowRounded();

  app.innerHTML = `
    ${renderPageHeader('睡眠记录', '😴')}

    <div class="card">
      <div class="sleep-time-picker">
        <div class="time-block time-block-sleep">
          <div class="time-block-label">🌙 入睡</div>
          <div class="time-select-row">
            <select id="startH" class="time-select"><option value="" selected>时</option>${buildHourOptions()}</select>
            <span class="time-colon">:</span>
            <select id="startM" class="time-select"><option value="" selected>分</option>${buildMinuteOptions()}</select>
          </div>
        </div>
        <div class="time-arrow">→</div>
        <div class="time-block time-block-wake">
          <div class="time-block-label">☀️ 醒来</div>
          <div class="time-select-row">
            <select id="endH" class="time-select">${buildHourOptions(now.hour)}</select>
            <span class="time-colon">:</span>
            <select id="endM" class="time-select">${buildMinuteOptions(now.minute)}</select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>睡觉方向</label>
        <div class="toggle-group" id="sleepDirection">
          <button class="toggle-btn" data-value="左">⬅️ 左</button>
          <button class="toggle-btn active" data-value="中">⬆️ 中</button>
          <button class="toggle-btn" data-value="右">➡️ 右</button>
        </div>
      </div>

      <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
    </div>

    <div class="record-list" id="sleepList">
      <h3>📋 今日记录</h3>
      <div id="listContent"></div>
    </div>
  `;

  // Toggle group
  document.querySelectorAll('#sleepDirection .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#sleepDirection .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Save
  document.getElementById('saveBtn')?.addEventListener('click', async () => {
    const startTime = getTimeFromSelectors('start');
    if (!startTime) {
      showToast('请选择入睡时间');
      return;
    }

    const activeDir = document.querySelector('#sleepDirection .toggle-btn.active') as HTMLElement;
    const record: SleepRecord = {
      date: today,
      startTime,
      endTime: getTimeFromSelectors('end'),
      direction: activeDir?.dataset.value || '中',
      createdAt: Date.now(),
    };

    await sleep.add(record);
    showToast('睡眠记录已保存 ✅');

    // Reset: clear start, refresh end to now
    (document.getElementById('startH') as HTMLSelectElement).value = '';
    (document.getElementById('startM') as HTMLSelectElement).value = '';
    const nowAgain = getNowRounded();
    (document.getElementById('endH') as HTMLSelectElement).value = String(nowAgain.hour);
    (document.getElementById('endM') as HTMLSelectElement).value = String(nowAgain.minute);

    await loadSleepList(today);
  });

  await loadSleepList(today);
}

async function loadSleepList(date: string) {
  const container = document.getElementById('listContent');
  if (!container) return;

  const records = await sleep.list(date);

  if (records.length === 0) {
    container.innerHTML = `<p class="empty-state">暂无记录</p>`;
    return;
  }

  let totalMin = 0;
  let html = '';
  for (const s of records) {
    let duration = '';
    if (s.startTime && s.endTime) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      totalMin += diff;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      duration = `${h}h${m > 0 ? m + 'min' : ''}`;
    }
    html += `
      <div class="record-item compact-record">
        <span class="record-time">${s.startTime}→${s.endTime || '...'}</span>
        <div class="tag-row">
          ${duration ? `<span class="tag tag-blue">${duration}</span>` : '<span class="tag tag-gray">进行中</span>'}
          ${s.direction ? `<span class="tag tag-orange">${s.direction}侧</span>` : ''}
        </div>
        <div class="record-actions">
          <button class="btn-delete" data-id="${s.id}">✕</button>
        </div>
      </div>`;
  }

  const totalH = Math.floor(totalMin / 60);
  const totalM = totalMin % 60;
  html += `<div class="card" style="margin-top:12px;text-align:center;">
    <strong>共${records.length}次</strong> · 总计${totalH}h${totalM}min
  </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).dataset.id);
      if (!confirm('确认删除？')) return;
      await sleep.remove(id);
      showToast('已删除');
      await loadSleepList(date);
    });
  });
}
