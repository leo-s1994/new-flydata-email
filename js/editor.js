/**
 * Flydata邮件发布系统 - 富文本编辑器模块
 */

let quillEditor = null;

// ============================================
// 初始化Quill编辑器
// ============================================
function initEditor() {
  if (typeof Quill === 'undefined') {
    console.error('Quill库未加载');
    return;
  }

  quillEditor = new Quill('#editor', {
    theme: 'snow',
    placeholder: '在此编写邮件内容...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  });

  // 自动保存草稿（使用localStorage临时存储）
  let saveTimer = null;
  quillEditor.on('text-change', function() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveDraft();
    }, 1000);
  });

  // 加载草稿
  loadDraft();
}

// ============================================
// 获取编辑器内容（HTML）
// ============================================
function getEditorContent() {
  if (!quillEditor) return '';
  return quillEditor.root.innerHTML;
}

// ============================================
// 设置编辑器内容
// ============================================
function setEditorContent(html) {
  if (!quillEditor) return;
  quillEditor.root.innerHTML = html;
}

// ============================================
// 获取纯文本内容
// ============================================
function getPlainText() {
  if (!quillEditor) return '';
  return quillEditor.getText();
}

// ============================================
// 清空编辑器
// ============================================
function clearEditor() {
  if (!quillEditor) return;
  quillEditor.setText('');
  document.getElementById('emailSubject').value = '';
  clearDraft();
}

// ============================================
// 保存草稿到localStorage
// ============================================
function saveDraft() {
  try {
    const subject = document.getElementById('emailSubject').value;
    const content = getEditorContent();
    
    if (content && content !== '<p><br></p>') {
      localStorage.setItem('email_draft_subject', subject);
      localStorage.setItem('email_draft_content', content);
    }
  } catch (e) {
    console.warn('保存草稿失败:', e);
  }
}

// ============================================
// 加载草稿
// ============================================
function loadDraft() {
  try {
    const subject = localStorage.getItem('email_draft_subject');
    const content = localStorage.getItem('email_draft_content');
    
    if (subject) {
      document.getElementById('emailSubject').value = subject;
    }
    
    if (content && content !== '<p><br></p>') {
      setEditorContent(content);
    }
  } catch (e) {
    console.warn('加载草稿失败:', e);
  }
}

// ============================================
// 清空草稿
// ============================================
function clearDraft() {
  try {
    localStorage.removeItem('email_draft_subject');
    localStorage.removeItem('email_draft_content');
  } catch (e) {
    console.warn('清空草稿失败:', e);
  }
}
