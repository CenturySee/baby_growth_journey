import { login } from '../api';
import { showToast, getApp } from '../utils';
import { navigate } from '../router';

export async function renderLogin() {
    const app = getApp();

    app.innerHTML = `
    <div class="login-page">
      <div class="login-logo">👶</div>
      <h1>宝宝成长记录</h1>
      <p class="login-subtitle">输入家庭码，多设备共享记录</p>

      <div class="card login-card">
        <div class="form-group">
          <label>🏠 家庭码</label>
          <input type="text" id="familyCodeInput" placeholder="请输入家庭码（至少4位）"
                 maxlength="20" autocomplete="off"
                 style="text-align:center; font-size:24px; letter-spacing:4px; font-weight:700;" />
        </div>

        <p class="login-hint">💡 首次输入会自动创建家庭<br>使用相同家庭码的设备共享数据</p>

        <button class="btn btn-primary btn-full" id="loginBtn"
                style="font-size:22px; min-height:56px;">
          🚀 进入
        </button>
      </div>
    </div>
  `;

    const input = document.getElementById('familyCodeInput') as HTMLInputElement;
    const loginBtn = document.getElementById('loginBtn')!;

    // Auto-focus
    input.focus();

    // Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    loginBtn.addEventListener('click', doLogin);

    async function doLogin() {
        const code = input.value.trim();
        if (code.length < 4) {
            showToast('家庭码至少4位');
            return;
        }

        loginBtn.textContent = '登录中...';
        (loginBtn as HTMLButtonElement).disabled = true;

        try {
            const ok = await login(code);
            if (ok) {
                showToast(`欢迎！家庭码: ${code}`);
                navigate('/');
            } else {
                showToast('登录失败，请重试');
            }
        } catch (e: any) {
            showToast('网络错误: ' + (e.message || '请检查网络'));
        } finally {
            loginBtn.textContent = '🚀 进入';
            (loginBtn as HTMLButtonElement).disabled = false;
        }
    }
}
