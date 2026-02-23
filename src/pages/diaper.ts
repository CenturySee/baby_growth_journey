import { db, type DiaperRecord } from '../db';
import { getToday, getNowTime, showToast, getApp, renderPageHeader } from '../utils';

// Color options per type
const PEE_COLORS = [
  { value: '透明', label: '透明', bg: '#f5f5f0', text: '#999' },
  { value: '浅黄', label: '浅黄', bg: '#FFF8DC', text: '#B8A040' },
  { value: '黄色', label: '黄色', bg: '#FFE44D', text: '#8B7500' },
  { value: '深黄', label: '深黄', bg: '#FFCC00', text: '#7A6200' },
  { value: '橙黄', label: '橙黄', bg: '#FFA500', text: '#fff' },
  { value: '橙色', label: '橙色', bg: '#FF8C00', text: '#fff' },
];

const POOP_COLORS = [
  { value: '金黄色', label: '金黄色', bg: '#FFD700', text: '#7A6200' },
  { value: '土黄色', label: '土黄色', bg: '#D2A35C', text: '#fff' },
  { value: '黄绿色', label: '黄绿色', bg: '#9ACD32', text: '#fff' },
  { value: '墨绿色', label: '墨绿色', bg: '#3B5323', text: '#fff' },
  { value: '咖啡色', label: '咖啡色', bg: '#6F4E37', text: '#fff' },
  { value: '红色', label: '红色', bg: '#CD5C5C', text: '#fff' },
  { value: '黑色', label: '黑色', bg: '#2D2D2D', text: '#fff' },
];

function getColorsForType(type: string) {
  if (type === 'pee') return PEE_COLORS;
  return POOP_COLORS; // poop and both use poop colors
}

let currentImageData: string | undefined = undefined;

export async function renderDiaper() {
  const app = getApp();
  const today = getToday();
  currentImageData = undefined;

  let currentType = 'pee';

  app.innerHTML = `
    ${renderPageHeader('尿布情况', '🧷')}

    <div class="card">
      <div class="form-group">
        <label>⏰ 时间</label>
        <input type="time" id="diaperTime" value="${getNowTime()}" />
      </div>

      <div class="form-group">
        <label>类型</label>
        <div class="toggle-group" id="diaperType">
          <button class="toggle-btn active" data-value="pee">💧 小便</button>
          <button class="toggle-btn" data-value="poop">💩 大便</button>
          <button class="toggle-btn" data-value="both">💧💩 大+小</button>
        </div>
      </div>

      <div class="form-group">
        <label>颜色</label>
        <div class="toggle-group" id="diaperColor"></div>
      </div>

      <div class="form-group">
        <label>量</label>
        <div class="toggle-group" id="diaperAmount">
          <button class="toggle-btn" data-value="少">少</button>
          <button class="toggle-btn active" data-value="中">中</button>
          <button class="toggle-btn" data-value="多">多</button>
        </div>
      </div>

      <div class="form-group">
        <label>📷 拍照记录</label>
        <div class="image-upload-area" id="imageUploadArea">
          <input type="file" id="imageInput" accept="image/*" capture="environment" style="display:none" />
          <div class="image-placeholder" id="imagePlaceholder">
            <span style="font-size:32px">📷</span>
            <span>点击拍照或上传图片</span>
          </div>
          <div class="image-preview-container" id="imagePreviewContainer" style="display:none">
            <img id="imagePreview" class="image-preview" />
            <button class="btn-remove-image" id="removeImageBtn">✕ 移除</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>备注</label>
        <input type="text" id="diaperNote" placeholder="其他说明..." />
      </div>

      <button class="btn btn-save btn-full" id="saveBtn">✅ 保存</button>
    </div>

    <div class="record-list" id="diaperList">
      <h3>📋 今日记录</h3>
      <div id="listContent"></div>
    </div>
  `;

  // Render initial colors for pee
  renderColorOptions(currentType);

  // Toggle group logic for amount
  setupToggleGroup('diaperAmount');

  // Type toggle - re-render colors when type changes
  document.querySelectorAll('#diaperType .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#diaperType .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = (btn as HTMLElement).dataset.value || 'pee';
      renderColorOptions(currentType);
    });
  });

  // Image upload
  const imagePlaceholder = document.getElementById('imagePlaceholder')!;
  const imageInput = document.getElementById('imageInput') as HTMLInputElement;
  const imagePreviewContainer = document.getElementById('imagePreviewContainer')!;
  const imagePreview = document.getElementById('imagePreview') as HTMLImageElement;
  const removeImageBtn = document.getElementById('removeImageBtn')!;

  imagePlaceholder.addEventListener('click', () => imageInput.click());

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    // Compress and convert to base64
    currentImageData = await compressImage(file, 800, 0.7);
    imagePreview.src = currentImageData;
    imagePlaceholder.style.display = 'none';
    imagePreviewContainer.style.display = 'block';
  });

  removeImageBtn.addEventListener('click', () => {
    currentImageData = undefined;
    imageInput.value = '';
    imagePlaceholder.style.display = 'flex';
    imagePreviewContainer.style.display = 'none';
  });

  // Save
  document.getElementById('saveBtn')?.addEventListener('click', async () => {
    const record: DiaperRecord = {
      date: today,
      time: (document.getElementById('diaperTime') as HTMLInputElement).value,
      type: getToggleValue('diaperType') as 'pee' | 'poop' | 'both',
      color: getToggleValue('diaperColor'),
      amount: getToggleValue('diaperAmount'),
      note: (document.getElementById('diaperNote') as HTMLInputElement).value,
      image: currentImageData,
      createdAt: Date.now(),
    };

    await db.diaper.add(record);
    showToast('尿布记录已保存 ✅');
    (document.getElementById('diaperTime') as HTMLInputElement).value = getNowTime();
    (document.getElementById('diaperNote') as HTMLInputElement).value = '';

    // Reset image
    currentImageData = undefined;
    imageInput.value = '';
    imagePlaceholder.style.display = 'flex';
    imagePreviewContainer.style.display = 'none';

    await loadDiaperList(today);
  });

  await loadDiaperList(today);
}

function renderColorOptions(type: string) {
  const container = document.getElementById('diaperColor');
  if (!container) return;

  const colors = getColorsForType(type);
  container.innerHTML = colors.map((c, i) => `
        <button class="toggle-btn color-btn ${i === 0 ? 'active' : ''}" data-value="${c.value}"
                style="background:${c.bg}; color:${c.text}; border-color:${c.bg};">
            ${c.label}
        </button>
    `).join('');

  // Bind click events
  container.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toggle-btn').forEach(b => {
        b.classList.remove('active');
        (b as HTMLElement).style.outline = 'none';
      });
      btn.classList.add('active');
      (btn as HTMLElement).style.outline = '3px solid var(--color-primary)';
      (btn as HTMLElement).style.outlineOffset = '2px';
    });
  });

  // Set initial outline on first item
  const first = container.querySelector('.toggle-btn.active') as HTMLElement;
  if (first) {
    first.style.outline = '3px solid var(--color-primary)';
    first.style.outlineOffset = '2px';
  }
}

function setupToggleGroup(groupId: string) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function getToggleValue(groupId: string): string {
  const active = document.querySelector(`#${groupId} .toggle-btn.active`) as HTMLElement;
  return active?.dataset.value || '';
}

async function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function loadDiaperList(date: string) {
  const container = document.getElementById('listContent');
  if (!container) return;

  const records = await db.diaper.where('date').equals(date).sortBy('createdAt');

  if (records.length === 0) {
    container.innerHTML = `<p class="empty-state">暂无记录</p>`;
    return;
  }

  const typeMap: Record<string, string> = { pee: '💧小便', poop: '💩大便', both: '💧💩大+小' };
  let html = '';
  for (const d of records) {
    // Find color config for the badge
    const allColors = [...PEE_COLORS, ...POOP_COLORS];
    const colorCfg = allColors.find(c => c.value === d.color);
    const colorBadge = colorCfg
      ? `<span class="color-badge" style="background:${colorCfg.bg};color:${colorCfg.text}">${d.color}</span>`
      : (d.color || '');

    html += `
      <div class="record-item diaper-record-item">
        <div class="record-info">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="record-time">${d.time}</span>
            <span>${typeMap[d.type] || d.type}</span>
            ${colorBadge}
            ${d.amount ? `<span>· ${d.amount}</span>` : ''}
          </div>
          ${d.note ? `<div class="record-detail">${d.note}</div>` : ''}
          ${d.image ? `<img src="${d.image}" class="record-thumbnail" onclick="this.classList.toggle('expanded')" />` : ''}
        </div>
        <div class="record-actions">
          <button class="btn-delete" data-id="${d.id}">✕</button>
        </div>
      </div>`;
  }

  const poopCount = records.filter(r => r.type === 'poop' || r.type === 'both').length;
  html += `<div class="card" style="margin-top:12px;text-align:center;">
    <strong>共${records.length}次</strong> · 大便${poopCount}次
  </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).dataset.id);
      if (!confirm('确认删除？')) return;
      await db.diaper.delete(id);
      showToast('已删除');
      await loadDiaperList(date);
    });
  });
}
