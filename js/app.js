/**
 * Flydata邮件发布系统 - 主应用逻辑
 */

// ============================================
// 初始化检查
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  // 检查登录状态
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // 显示用户邮箱
  document.getElementById('userEmail').textContent = user.email;

  // 初始化侧边栏菜单
  initSidebar();

  // 初始化编辑器
  initEditor();

  // 加载配置
  loadConfig();

  // 加载联系人
  loadContacts();

  // 加载模板列表
  loadTemplatesList();

  // 加载发送日志
  loadSendLogs();
});

// ============================================
// 侧边栏菜单
// ============================================
function initSidebar() {
  const menuItems = document.querySelectorAll('.menu-item[data-panel]');
  const panels = document.querySelectorAll('.panel');
  const pageTitle = document.getElementById('pageTitle');

  const titles = {
    compose: '写信',
    contacts: '联系人',
    templates: '模板',
    logs: '发送日志',
    settings: '设置'
  };

  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      const panel = this.dataset.panel;

      // 更新菜单激活状态
      menuItems.forEach(m => m.classList.remove('active'));
      this.classList.add('active');

      // 更新面板显示
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(panel + 'Panel').classList.add('active');

      // 更新标题
      pageTitle.textContent = titles[panel];

      // 刷新对应面板数据
      if (panel === 'contacts') loadContacts();
      if (panel === 'templates') loadTemplatesList();
      if (panel === 'logs') loadSendLogs();
      if (panel === 'settings') loadConfig();
    });
  });
}

// ============================================
// 打开发送弹窗
// ============================================
function openSendModal() {
  const subject = document.getElementById('emailSubject').value.trim();
  const content = getEditorContent();

  if (!subject) {
    showToast('请输入邮件主题', 'warning');
    return;
  }

  if (!content || content === '<p><br></p>') {
    showToast('请输入邮件内容', 'warning');
    return;
  }

  // 创建发送确认弹窗
  const modal = document.createElement('div');
  modal.className = 'modal-overlay progress-modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>发送邮件</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">选择收件人</label>
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="recipientType" value="all" checked onchange="toggleRecipientSelect()"> 全部联系人
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="recipientType" value="group" onchange="toggleRecipientSelect()"> 指定分组
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="recipientType" value="single" onchange="toggleRecipientSelect()"> 单个邮箱
            </label>
          </div>
          
          <div id="groupSelectContainer" style="display: none;">
            <select id="groupSelect" class="form-select">
              <option value="">请选择分组</option>
            </select>
          </div>
          
          <div id="singleEmailContainer" style="display: none;">
            <input type="text" id="singleEmail" class="form-input" placeholder="输入邮箱地址，多个邮箱用逗号分隔">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="startSending('${subject}', '${encodeURIComponent(content)}')">
          <i class="fas fa-paper-plane"></i> 开始发送
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 加载分组列表
  loadGroupsForSelect();
}

function toggleRecipientSelect() {
  const type = document.querySelector('input[name="recipientType"]:checked').value;
  document.getElementById('groupSelectContainer').style.display = type === 'group' ? 'block' : 'none';
  document.getElementById('singleEmailContainer').style.display = type === 'single' ? 'block' : 'none';
}

async function loadGroupsForSelect() {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('contacts')
      .select('group_name')
      .eq('user_id', user.id)
      .order('group_name');

    if (error) throw error;

    const groups = [...new Set(data.map(c => c.group_name))];
    const select = document.getElementById('groupSelect');
    
    groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = group;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('加载分组失败:', error);
  }
}

// ============================================
// 开始发送邮件
// ============================================
async function startSending(subject, encodedContent) {
  const content = decodeURIComponent(encodedContent);
  const type = document.querySelector('input[name="recipientType"]:checked').value;
  
  let recipients = [];

  try {
    showLoading('获取收件人列表...');
    
    const supabase = getSupabase();
    const user = await getCurrentUser();

    if (type === 'all') {
      const { data, error } = await supabase
        .from('contacts')
        .select('email')
        .eq('user_id', user.id);
      
      if (error) throw error;
      recipients = data.map(c => c.email);
    } else if (type === 'group') {
      const group = document.getElementById('groupSelect').value;
      if (!group) {
        hideLoading();
        showToast('请选择分组', 'warning');
        return;
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .select('email')
        .eq('user_id', user.id)
        .eq('group_name', group);
      
      if (error) throw error;
      recipients = data.map(c => c.email);
    } else {
      const emails = document.getElementById('singleEmail').value.trim();
      if (!emails) {
        hideLoading();
        showToast('请输入邮箱地址', 'warning');
        return;
      }
      recipients = emails.split(/[,，]/).map(e => e.trim()).filter(e => e);
    }

    if (recipients.length === 0) {
      hideLoading();
      showToast('没有找到收件人', 'warning');
      return;
    }

    hideLoading();

    // 关闭当前弹窗，显示进度弹窗
    document.querySelector('.progress-modal')?.remove();
    showProgressModal(subject, recipients, content);

  } catch (error) {
    hideLoading();
    console.error('获取收件人失败:', error);
    showToast('获取收件人失败', 'error');
  }
}

// ============================================
// 显示发送进度弹窗
// ============================================
function showProgressModal(subject, recipients, content) {
  const total = recipients.length;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay progress-modal show';
  modal.id = 'sendProgressModal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>发送进度</h3>
        <button class="modal-close" onclick="cancelSending()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="progress-stats">
          <div class="stat-card total">
            <div class="stat-value" id="totalCount">${total}</div>
            <div class="stat-label">总数</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value" id="successCount">0</div>
            <div class="stat-label">成功</div>
          </div>
          <div class="stat-card failed">
            <div class="stat-value" id="failedCount">0</div>
            <div class="stat-label">失败</div>
          </div>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-bar-fill" id="progressBar" style="width: 0%"></div>
          </div>
          <div class="progress-info">
            <span id="progressPercent">0%</span>
            <span id="progressText">0 / ${total}</span>
          </div>
        </div>
        
        <div class="progress-log" id="progressLog"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="pauseBtn" onclick="pauseSending()">
          <i class="fas fa-pause"></i> 暂停
        </button>
        <button class="btn btn-danger" onclick="cancelSending()">
          <i class="fas fa-times"></i> 取消
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 开始发送
  sendBatchEmails(subject, recipients, content);
}

// ============================================
// 保存为模板
// ============================================
function saveAsTemplate() {
  const subject = document.getElementById('emailSubject').value.trim();
  const content = getEditorContent();

  if (!subject) {
    showToast('请输入邮件主题', 'warning');
    return;
  }

  if (!content || content === '<p><br></p>') {
    showToast('请输入邮件内容', 'warning');
    return;
  }

  openSaveTemplateModal(subject, content);
}
