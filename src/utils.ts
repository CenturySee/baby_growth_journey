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
