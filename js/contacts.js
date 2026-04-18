/**
 * Flydata邮件发布系统 - 联系人管理模块
 */

// ============================================
// 加载联系人列表
// ============================================
async function loadContacts(searchTerm = '') {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) return;

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,group_name.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    renderContactsTable(data || []);
  } catch (error) {
    console.error('加载联系人失败:', error);
    showToast('加载联系人失败', 'error');
  }
}

// ============================================
// 渲染联系人表格
// ============================================
function renderContactsTable(contacts) {
  const tbody = document.getElementById('contactsTableBody');
  
  if (!contacts || contacts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-secondary);">
          暂无联系人
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = contacts.map(contact => `
    <tr>
      <td>${escapeHtml(contact.name)}</td>
      <td>${escapeHtml(contact.email)}</td>
      <td>${escapeHtml(contact.group_name)}</td>
      <td>
        <div class="contact-actions">
          <button class="btn btn-sm btn-secondary" onclick="editContact('${contact.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact.id}', '${escapeHtml(contact.name)}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================
// 搜索联系人
// ============================================
const searchContacts = debounce(function() {
  const searchTerm = document.getElementById('contactSearch').value.trim();
  loadContacts(searchTerm);
}, 300);

// ============================================
// 打开联系人编辑弹窗
// ============================================
function openContactModal(contactId = null) {
  const isEdit = !!contactId;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.id = 'contactModal';
  modal.innerHTML = `
    <div class="modal-content small">
      <div class="modal-header">
        <h3>${isEdit ? '编辑联系人' : '添加联系人'}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <form id="contactForm">
          <input type="hidden" id="contactId" value="${contactId || ''}">
          
          <div class="form-group">
            <label class="form-label">姓名</label>
            <input type="text" id="contactName" class="form-input" placeholder="请输入姓名" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input type="email" id="contactEmail" class="form-input" placeholder="请输入邮箱" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">分组</label>
            <input type="text" id="contactGroup" class="form-input" placeholder="例如：客户、同事" value="默认分组">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeContactModal()">取消</button>
        <button class="btn btn-primary" onclick="saveContact()">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 绑定关闭事件
  modal.querySelector('.modal-close').addEventListener('click', closeContactModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeContactModal();
  });

  // 如果是编辑，加载联系人数据
  if (isEdit) {
    loadContactData(contactId);
  }
}

function closeContactModal() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.remove();
}

// ============================================
// 加载联系人数据（编辑模式）
// ============================================
async function loadContactData(contactId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error) throw error;

    document.getElementById('contactName').value = data.name;
    document.getElementById('contactEmail').value = data.email;
    document.getElementById('contactGroup').value = data.group_name;
  } catch (error) {
    console.error('加载联系人数据失败:', error);
    showToast('加载失败', 'error');
  }
}

// ============================================
// 保存联系人
// ============================================
async function saveContact() {
  const contactId = document.getElementById('contactId').value;
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const groupName = document.getElementById('contactGroup').value.trim() || '默认分组';

  if (!name || !email) {
    showToast('请填写必填项', 'warning');
    return;
  }

  if (!isValidEmail(email)) {
    showToast('邮箱格式不正确', 'warning');
    return;
  }

  showLoading('保存中...');

  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();

    let error;

    if (contactId) {
      // 更新
      const result = await supabase
        .from('contacts')
        .update({
          name: name,
          email: email,
          group_name: groupName,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);
      error = result.error;
    } else {
      // 新增
      const result = await supabase
        .from('contacts')
        .insert([{
          user_id: user.id,
          name: name,
          email: email,
          group_name: groupName
        }]);
      error = result.error;
    }

    if (error) throw error;

    hideLoading();
    closeContactModal();
    showToast('保存成功', 'success');
    loadContacts();

  } catch (error) {
    hideLoading();
    console.error('保存联系人失败:', error);
    showToast('保存失败', 'error');
  }
}

// ============================================
// 编辑联系人
// ============================================
function editContact(contactId) {
  openContactModal(contactId);
}

// ============================================
// 删除联系人
// ============================================
async function deleteContact(contactId, name) {
  const confirmed = await confirmDialog(`确定要删除联系人"${name}"吗？`, '删除确认');
  
  if (!confirmed) return;

  showLoading('删除中...');

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;

    hideLoading();
    showToast('删除成功', 'success');
    loadContacts();

  } catch (error) {
    hideLoading();
    console.error('删除联系人失败:', error);
    showToast('删除失败', 'error');
  }
}

// ============================================
// 导入CSV
// ============================================
function importCSV() {
  document.getElementById('csvFileInput').click();
}

function handleCSVFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoading('解析CSV文件...');

  Papa.parse(file, {
    header: true,
    encoding: 'UTF-8',
    complete: async function(results) {
      try {
        const rows = results.data.filter(row => row.email && row.email.trim());
        
        if (rows.length === 0) {
          hideLoading();
          showToast('CSV文件中没有找到有效的联系人', 'warning');
          return;
        }

        // 验证并准备数据
        const contacts = rows.map(row => ({
          name: row.name || row.姓名 || '未命名',
          email: row.email || row.邮箱 || row.Email,
          group_name: row.group || row.分组 || row.Group || '默认分组'
        })).filter(c => isValidEmail(c.email));

        if (contacts.length === 0) {
          hideLoading();
          showToast('没有有效的邮箱地址', 'warning');
          return;
        }

        // 批量插入
        await batchInsertContacts(contacts);
        
        hideLoading();
        showToast(`成功导入 ${contacts.length} 个联系人`, 'success');
        loadContacts();

      } catch (error) {
        hideLoading();
        console.error('导入CSV失败:', error);
        showToast('导入失败', 'error');
      }

      // 清空文件输入
      event.target.value = '';
    },
    error: function(error) {
      hideLoading();
      console.error('解析CSV失败:', error);
      showToast('解析CSV失败', 'error');
    }
  });
}

// ============================================
// 批量插入联系人
// ============================================
async function batchInsertContacts(contacts) {
  const supabase = getSupabase();
  const user = await getCurrentUser();

  const data = contacts.map(c => ({
    user_id: user.id,
    name: c.name,
    email: c.email,
    group_name: c.group_name
  }));

  const { error } = await supabase
    .from('contacts')
    .insert(data);

  if (error) throw error;
}

// ============================================
// 导出CSV
// ============================================
async function exportCSV() {
  try {
    showLoading('导出数据...');

    const supabase = getSupabase();
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('contacts')
      .select('name, email, group_name')
      .eq('user_id', user.id)
      .order('group_name');

    if (error) throw error;

    if (!data || data.length === 0) {
      hideLoading();
      showToast('没有可导出的联系人', 'warning');
      return;
    }

    // 转换为CSV
    const csv = Papa.unparse({
      fields: ['name', 'email', 'group_name'],
      data: data.map(c => ({
        name: c.name,
        email: c.email,
        group_name: c.group_name
      }))
    });

    // 下载文件
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    hideLoading();
    showToast('导出成功', 'success');

  } catch (error) {
    hideLoading();
    console.error('导出CSV失败:', error);
    showToast('导出失败', 'error');
  }
}

// ============================================
// HTML转义
// ============================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
