/**
 * Flydata邮件发布系统 - 工具函数模块
 */

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型: success, error, warning, info
 * @param {number} duration - 显示时长（毫秒）
 */
function showToast(message, type = 'info', duration = 3000) {
  // 移除已存在的toast
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${getToastIcon(type)}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // 动画显示
  setTimeout(() => toast.classList.add('show'), 10);

  // 自动隐藏
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function getToastIcon(type) {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

/**
 * 显示加载遮罩
 * @param {string} message - 加载提示文字
 */
function showLoading(message = '加载中...') {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.querySelector('.loading-text').textContent = message;
    overlay.style.display = 'flex';
  } else {
    const loadingHTML = `
      <div id="loading-overlay" class="loading-overlay">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p class="loading-text">${message}</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
  }
}

/**
 * 隐藏加载遮罩
 */
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期对象或字符串
 * @param {string} format - 格式模板
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
function debounce(func, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function}
 */
function throttle(func, limit = 300) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 生成唯一ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板', 'success');
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('已复制到剪贴板', 'success');
  }
}

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @param {string} title - 标题
 * @returns {Promise<boolean>}
 */
function confirmDialog(message, title = '确认操作') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay confirm-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel">取消</button>
          <button class="btn btn-primary btn-confirm">确认</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
      modal.remove();
    };

    modal.querySelector('.modal-close').addEventListener('click', () => {
      close();
      resolve(false);
    });

    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      close();
      resolve(false);
    });

    modal.querySelector('.btn-confirm').addEventListener('click', () => {
      close();
      resolve(true);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        close();
        resolve(false);
      }
    });
  });
}
