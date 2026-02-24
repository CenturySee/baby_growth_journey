// Utility functions

export function getToday(): string {
    const d = new Date();
    return formatDateObj(d);
}

export function formatDateObj(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function getNowTime(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---- Shared 15-minute time selector helpers ----

export function getNowFloored(): { hour: number; minute: number } {
    const d = new Date();
    const minute = Math.floor(d.getMinutes() / 15) * 15; // always round DOWN
    return { hour: d.getHours(), minute };
}

export function buildHourOptions(selected?: number): string {
    let html = '';
    for (let h = 0; h < 24; h++) {
        const label = String(h).padStart(2, '0');
        html += `<option value="${h}" ${h === selected ? 'selected' : ''}>${label}</option>`;
    }
    return html;
}

export function buildMinuteOptions(selected?: number): string {
    const mins = [0, 15, 30, 45];
    let html = '';
    for (const m of mins) {
        const label = String(m).padStart(2, '0');
        html += `<option value="${m}" ${m === selected ? 'selected' : ''}>${label}</option>`;
    }
    return html;
}

export function getTimeFromSelectors(prefix: string): string {
    const h = (document.getElementById(`${prefix}H`) as HTMLSelectElement).value;
    const m = (document.getElementById(`${prefix}M`) as HTMLSelectElement).value;
    if (h === '' || m === '') return '';
    return `${String(Number(h)).padStart(2, '0')}:${String(Number(m)).padStart(2, '0')}`;
}

export function renderTimeSelector(id: string, label: string, defaultTime?: { hour: number; minute: number }): string {
    const hOpts = defaultTime !== undefined
        ? buildHourOptions(defaultTime.hour)
        : `<option value="" selected>时</option>${buildHourOptions()}`;
    const mOpts = defaultTime !== undefined
        ? buildMinuteOptions(defaultTime.minute)
        : `<option value="" selected>分</option>${buildMinuteOptions()}`;
    return `
      <div class="form-group">
        <label>${label}</label>
        <div class="time-select-row">
          <select id="${id}H" class="time-select">${hOpts}</select>
          <span class="time-colon">:</span>
          <select id="${id}M" class="time-select">${mOpts}</select>
        </div>
      </div>`;
}

export function resetTimeSelector(id: string, time?: { hour: number; minute: number }): void {
    if (time) {
        (document.getElementById(`${id}H`) as HTMLSelectElement).value = String(time.hour);
        (document.getElementById(`${id}M`) as HTMLSelectElement).value = String(time.minute);
    } else {
        (document.getElementById(`${id}H`) as HTMLSelectElement).value = '';
        (document.getElementById(`${id}M`) as HTMLSelectElement).value = '';
    }
}

export function isToday(dateStr: string): boolean {
    return dateStr === getToday();
}

export function showToast(message: string, duration = 2000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    el.classList.add('show');
    setTimeout(() => {
        el.classList.remove('show');
        el.classList.add('hidden');
    }, duration);
}

export function daysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return formatDateObj(d);
}

export function getApp(): HTMLElement {
    return document.getElementById('app')!;
}

// Create a standard page header with back button
export function renderPageHeader(title: string, emoji: string): string {
    return `
    <div class="page-header">
      <button class="btn-back" onclick="window.location.hash='/'">←</button>
      <h2>${emoji} ${title}</h2>
    </div>
  `;
}
