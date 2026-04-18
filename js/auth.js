/**
 * Flydata邮件发布系统 - 认证模块
 */

// ============================================
// 密码显示/隐藏切换
// ============================================
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// ============================================
// Tab切换
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;

      // 更新tab状态
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // 更新表单显示
      forms.forEach(form => {
        form.classList.remove('active');
        if (form.id === targetTab + 'Form') {
          form.classList.add('active');
        }
      });
    });
  });

  // 绑定表单提交事件
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  // 检查是否已登录
  checkAuthStatus();
});

// ============================================
// 登录处理
// ============================================
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('请填写完整信息', 'error');
    return;
  }

  showLoading('登录中...');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      throw error;
    }

    hideLoading();
    showToast('登录成功', 'success');

    // 跳转到主应用页面
    setTimeout(() => {
      window.location.href = 'app.html';
    }, 1000);

  } catch (error) {
    hideLoading();
    console.error('登录错误:', error);

    let message = '登录失败，请重试';
    if (error.message.includes('Invalid login credentials')) {
      message = '邮箱或密码错误';
    } else if (error.message.includes('Email not confirmed')) {
      message = '邮箱未验证，请先验证邮箱';
    }

    showToast(message, 'error');
  }
}

// ============================================
// 注册处理
// ============================================
async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!email || !password || !confirmPassword) {
    showToast('请填写完整信息', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('密码长度至少为6个字符', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('两次输入的密码不一致', 'error');
    return;
  }

  showLoading('注册中...');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: window.location.origin + '/app.html'
      }
    });

    if (error) {
      throw error;
    }

    hideLoading();

    if (data.user && !data.session) {
      // 需要邮箱验证
      showToast('注册成功！请查收验证邮件', 'success', 5000);
      // 清空表单
      document.getElementById('registerForm').reset();
      // 切换到登录tab
      document.querySelector('[data-tab="login"]').click();
    } else {
      showToast('注册成功！', 'success');
      // 自动登录，跳转到主应用
      setTimeout(() => {
        window.location.href = 'app.html';
      }, 1000);
    }

  } catch (error) {
    hideLoading();
    console.error('注册错误:', error);

    let message = '注册失败，请重试';
    if (error.message.includes('User already registered')) {
      message = '该邮箱已被注册';
    } else if (error.message.includes('Invalid email')) {
      message = '邮箱格式不正确';
    }

    showToast(message, 'error');
  }
}

// ============================================
// 检查登录状态
// ============================================
async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    if (user) {
      // 已登录，跳转到主应用
      window.location.href = 'app.html';
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
  }
}

// ============================================
// 退出登录
// ============================================
async function logout() {
  try {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    showToast('已退出登录', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    console.error('退出登录失败:', error);
    showToast('退出失败', 'error');
  }
}

// ============================================
// 获取当前用户信息
// ============================================
async function getUserInfo() {
  const user = await getCurrentUser();
  if (user) {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at
    };
  }
  return null;
}
