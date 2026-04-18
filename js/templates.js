/**
 * Flydata邮件发布系统 - 邮件模板管理模块
 */

// ============================================
// 加载模板列表
// ============================================
async function loadTemplatesList() {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    renderTemplatesList(data || []);
  } catch (error) {
    console.error('加载模板失败:', error);
  }
}

// ============================================
// 渲染模板列表
// ============================================
function renderTemplatesList(templates) {
  const container = document.getElementById('templatesList');
  
  if (!container) return;
  
  if (!templates || templates.length === 0) {
    container.innerHTML = `
      <p style="text-align: center; color: var(--text-secondary); padding: 40px;">
        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
        暂无模板，点击右上角"新建模板"创建
      </p>
    `;
    return;
  }

  container.innerHTML = templates.map(template => `
    <div class="template-card" onclick="loadTemplate('${template.id}')">
      <h4>${escapeHtml(template.name)}</h4>
      <p>${escapeHtml(template.subject)}</p>
      ${template.category ? `<span style="display: inline-block; padding: 2px 8px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 11px; margin-bottom: 8px;">${escapeHtml(template.category)}</span>` : ''}
      <div class="template-meta">
        <span><i class="fas fa-clock"></i> ${formatDate(template.updated_at, 'YYYY-MM-DD HH:mm')}</span>
        <span>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editTemplate('${template.id}')" style="padding: 2px 8px;">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteTemplate('${template.id}', '${escapeHtml(template.name)}')" style="padding: 2px 8px;">
            <i class="fas fa-trash"></i>
          </button>
        </span>
      </div>
    </div>
  `).join('');
}

// ============================================
// 打开保存模板弹窗
// ============================================
function openSaveTemplateModal(existingSubject = '', existingContent = '') {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.id = 'saveTemplateModal';
  modal.innerHTML = `
    <div class="modal-content small">
      <div class="modal-header">
        <h3>保存模板</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <form id="saveTemplateForm">
          <input type="hidden" id="templateId" value="">
          
          <div class="form-group">
            <label class="form-label">模板名称</label>
            <input type="text" id="templateName" class="form-input" placeholder="例如：营销邮件模板" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">邮件主题</label>
            <input type="text" id="templateSubject" class="form-input" placeholder="邮件主题" value="${escapeHtml(existingSubject)}" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">分类（可选）</label>
            <input type="text" id="templateCategory" class="form-input" placeholder="例如：营销、通知">
          </div>
          
          <input type="hidden" id="templateContent" value="${encodeURIComponent(existingContent)}">
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeSaveTemplateModal()">取消</button>
        <button class="btn btn-primary" onclick="saveTemplate()">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 绑定关闭事件
  modal.querySelector('.modal-close').addEventListener('click', closeSaveTemplateModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSaveTemplateModal();
  });
}

function closeSaveTemplateModal() {
  const modal = document.getElementById('saveTemplateModal');
  if (modal) modal.remove();
}

// ============================================
// 保存模板
// ============================================
async function saveTemplate() {
  const templateId = document.getElementById('templateId').value;
  const name = document.getElementById('templateName').value.trim();
  const subject = document.getElementById('templateSubject').value.trim();
  const category = document.getElementById('templateCategory').value.trim();
  const content = decodeURIComponent(document.getElementById('templateContent').value);

  if (!name || !subject) {
    showToast('请填写必填项', 'warning');
    return;
  }

  if (!content || content === '<p><br></p>') {
    showToast('邮件内容不能为空', 'warning');
    return;
  }

  showLoading('保存中...');

  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();

    let error;

    if (templateId) {
      // 更新
      const result = await supabase
        .from('templates')
        .update({
          name: name,
          subject: subject,
          content: content,
          category: category || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);
      error = result.error;
    } else {
      // 新增
      const result = await supabase
        .from('templates')
        .insert([{
          user_id: user.id,
          name: name,
          subject: subject,
          content: content,
          category: category || null
        }]);
      error = result.error;
    }

    if (error) throw error;

    hideLoading();
    closeSaveTemplateModal();
    showToast('模板保存成功', 'success');
    loadTemplatesList();

  } catch (error) {
    hideLoading();
    console.error('保存模板失败:', error);
    showToast('保存失败', 'error');
  }
}

// ============================================
// 打开模板选择弹窗
// ============================================
async function openTemplatesModal() {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const templates = data || [];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay templates-modal show';
    modal.id = 'templatesModal';
    modal.innerHTML = `
      <div class="modal-content large">
        <div class="modal-header">
          <h3>选择模板</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${templates.length === 0 ? 
            '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">暂无模板</p>' :
            `<div class="templates-list">
              ${templates.map(t => `
                <div class="template-card" onclick="applyTemplate('${t.id}')">
                  <h4>${escapeHtml(t.name)}</h4>
                  <p>${escapeHtml(t.subject)}</p>
                  ${t.category ? `<span style="display: inline-block; padding: 2px 8px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 11px; margin-bottom: 8px;">${escapeHtml(t.category)}</span>` : ''}
                  <div class="template-meta">
                    <span><i class="fas fa-clock"></i> ${formatDate(t.updated_at, 'YYYY-MM-DD')}</span>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeTemplatesModal()">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', closeTemplatesModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTemplatesModal();
    });

  } catch (error) {
    console.error('加载模板失败:', error);
    showToast('加载模板失败', 'error');
  }
}

function closeTemplatesModal() {
  const modal = document.getElementById('templatesModal');
  if (modal) modal.remove();
}

// ============================================
// 应用模板到编辑器
// ============================================
async function applyTemplate(templateId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    // 设置主题和内容
    document.getElementById('emailSubject').value = data.subject;
    setEditorContent(data.content);

    closeTemplatesModal();
    showToast('模板已加载', 'success');

  } catch (error) {
    console.error('加载模板内容失败:', error);
    showToast('加载失败', 'error');
  }
}

// ============================================
// 加载模板到编辑器（从模板面板）
// ============================================
async function loadTemplate(templateId) {
  await applyTemplate(templateId);
  // 切换到写信面板
  document.querySelector('[data-panel="compose"]').click();
}

// ============================================
// 编辑模板
// ============================================
async function editTemplate(templateId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'saveTemplateModal';
    modal.innerHTML = `
      <div class="modal-content small">
        <div class="modal-header">
          <h3>编辑模板</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="saveTemplateForm">
            <input type="hidden" id="templateId" value="${data.id}">
            
            <div class="form-group">
              <label class="form-label">模板名称</label>
              <input type="text" id="templateName" class="form-input" value="${escapeHtml(data.name)}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">邮件主题</label>
              <input type="text" id="templateSubject" class="form-input" value="${escapeHtml(data.subject)}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">分类（可选）</label>
              <input type="text" id="templateCategory" class="form-input" value="${data.category ? escapeHtml(data.category) : ''}">
            </div>
            
            <input type="hidden" id="templateContent" value="${encodeURIComponent(data.content)}">
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeSaveTemplateModal()">取消</button>
          <button class="btn btn-primary" onclick="saveTemplate()">保存</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', closeSaveTemplateModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSaveTemplateModal();
    });

  } catch (error) {
    console.error('加载模板失败:', error);
    showToast('加载失败', 'error');
  }
}

// ============================================
// 删除模板
// ============================================
async function deleteTemplate(templateId, name) {
  const confirmed = await confirmDialog(`确定要删除模板"${name}"吗？`, '删除确认');
  
  if (!confirmed) return;

  showLoading('删除中...');

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    hideLoading();
    showToast('删除成功', 'success');
    loadTemplatesList();

  } catch (error) {
    hideLoading();
    console.error('删除模板失败:', error);
    showToast('删除失败', 'error');
  }
}
