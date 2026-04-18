/**
 * Flydata邮件发布系统 - 邮件发送核心模块
 * 通过后端API调用SMTP发送邮件（无需云函数）
 */

// ============================================
// 发送邮件（单封）- 通过后端API
// ============================================
async function sendSingleEmail(config, toAddress, subject, htmlBody) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toAddress: toAddress,
        subject: subject,
        htmlBody: htmlBody,
        fromAddress: config.from_address,
        fromAlias: config.from_alias,
        region: config.region || 'cn-hangzhou',
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '发送失败');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('网络错误，请检查服务器是否正常运行');
    }
    throw error;
  }
}

// ============================================
// 批量发送邮件
// ============================================
let isSendingPaused = false;
let isSendingCancelled = false;

async function sendBatchEmails(subject, recipients, content) {
  const config = await getUserConfig();
  
  if (!config) {
    addLogEntry('错误：未配置阿里云AccessKey', 'error');
    showToast('请先在设置中配置阿里云信息', 'error');
    return;
  }

  // 重置状态
  isSendingPaused = false;
  isSendingCancelled = false;

  let successCount = 0;
  let failedCount = 0;
  const total = recipients.length;

  // 并发控制
  const concurrency = 3;
  let currentIndex = 0;

  async function sendNext() {
    while (currentIndex < total && !isSendingCancelled) {
      // 检查暂停状态
      while (isSendingPaused && !isSendingCancelled) {
        await sleep(500);
      }

      if (isSendingCancelled) break;

      const index = currentIndex++;
      const email = recipients[index];

      try {
        await sendSingleEmail(config, email, subject, content);
        successCount++;
        addLogEntry(`✓ [${index + 1}/${total}] ${email} 发送成功`, 'success');
      } catch (error) {
        failedCount++;
        addLogEntry(`✗ [${index + 1}/${total}] ${email} 失败: ${error.message}`, 'error');
        
        // 记录到数据库
        await logSendResult(email, subject, 'failed', error.message);
        continue;
      }

      // 记录成功日志
      await logSendResult(email, subject, 'success');

      // 更新进度
      updateProgress(successCount, failedCount, total);

      // 延迟避免触发限流
      await sleep(500);
    }
  }

  // 启动并发任务
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(sendNext());
  }

  await Promise.all(workers);

  // 发送完成
  if (!isSendingCancelled) {
    addLogEntry(`\n========== 发送完成 ==========`, 'warning');
    addLogEntry(`总数: ${total}, 成功: ${successCount}, 失败: ${failedCount}`, 'warning');
    
    setTimeout(() => {
      showToast(`发送完成！成功: ${successCount}, 失败: ${failedCount}`, successCount > 0 ? 'success' : 'error', 5000);
    }, 1000);
  }
}

// ============================================
// 暂停/继续发送
// ============================================
function pauseSending() {
  isSendingPaused = !isSendingPaused;
  const btn = document.getElementById('pauseBtn');
  if (btn) {
    btn.innerHTML = isSendingPaused ? 
      '<i class="fas fa-play"></i> 继续' : 
      '<i class="fas fa-pause"></i> 暂停';
  }
  addLogEntry(isSendingPaused ? '已暂停' : '已继续', 'warning');
}

// ============================================
// 取消发送
// ============================================
function cancelSending() {
  isSendingCancelled = true;
  isSendingPaused = false;
  addLogEntry('用户取消发送', 'error');
  
  setTimeout(() => {
    const modal = document.getElementById('sendProgressModal');
    if (modal) modal.remove();
  }, 1000);
}

// ============================================
// 更新进度显示
// ============================================
function updateProgress(success, failed, total) {
  const completed = success + failed;
  const percent = Math.round((completed / total) * 100);
  
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  const progressText = document.getElementById('progressText');
  const successCountEl = document.getElementById('successCount');
  const failedCountEl = document.getElementById('failedCount');

  if (progressBar) progressBar.style.width = percent + '%';
  if (progressPercent) progressPercent.textContent = percent + '%';
  if (progressText) progressText.textContent = `${completed} / ${total}`;
  if (successCountEl) successCountEl.textContent = success;
  if (failedCountEl) failedCountEl.textContent = failed;
}

// ============================================
// 添加日志条目
// ============================================
function addLogEntry(message, type = '') {
  const logContainer = document.getElementById('progressLog');
  if (!logContainer) return;

  const time = new Date().toLocaleTimeString('zh-CN');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${escapeHtml(message)}`;
  
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// ============================================
// 记录发送结果到数据库
// ============================================
async function logSendResult(email, subject, status, errorMessage = null) {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();

    await supabase
      .from('send_logs')
      .insert([{
        user_id: user.id,
        email: email,
        subject: subject,
        status: status,
        error_message: errorMessage
      }]);
  } catch (error) {
    console.error('记录发送日志失败:', error);
  }
}

// ============================================
// 加载发送日志
// ============================================
async function loadSendLogs() {
  try {
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('send_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    renderSendLogs(data || []);
  } catch (error) {
    console.error('加载发送日志失败:', error);
  }
}

// ============================================
// 渲染发送日志表格
// ============================================
function renderSendLogs(logs) {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;
  
  if (!logs || logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-secondary);">
          暂无发送日志
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(log => `
    <tr>
      <td>${escapeHtml(log.email)}</td>
      <td>${escapeHtml(log.subject)}</td>
      <td>
        <span style="color: ${log.status === 'success' ? 'var(--success-color)' : 'var(--error-color)'}">
          ${log.status === 'success' ? '✓ 成功' : '✗ 失败'}
        </span>
        ${log.error_message ? `<br><small style="color: var(--text-disabled);">${escapeHtml(log.error_message)}</small>` : ''}
      </td>
      <td>${formatDate(log.sent_at, 'YYYY-MM-DD HH:mm:ss')}</td>
    </tr>
  `).join('');
}

// ============================================
// 工具函数：延迟
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
