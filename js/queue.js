/**
 * Flydata邮件发布系统 - 发送队列管理模块
 * 此模块提供额外的队列管理功能
 */

// 队列状态
let sendQueue = {
  tasks: [],
  isRunning: false,
  isPaused: false,
  currentIndex: 0
};

// ============================================
// 初始化发送队列
// ============================================
function initSendQueue() {
  sendQueue = {
    tasks: [],
    isRunning: false,
    isPaused: false,
    currentIndex: 0
  };
}

// ============================================
// 添加任务到队列
// ============================================
function addToQueue(task) {
  sendQueue.tasks.push({
    ...task,
    status: 'pending',
    addedAt: new Date().toISOString()
  });
}

// ============================================
// 开始处理队列
// ============================================
async function startQueue(config, subject, content, concurrency = 5) {
  if (sendQueue.isRunning) {
    showToast('队列正在运行中', 'warning');
    return;
  }

  sendQueue.isRunning = true;
  sendQueue.isPaused = false;
  sendQueue.currentIndex = 0;

  const total = sendQueue.tasks.length;
  let successCount = 0;
  let failedCount = 0;

  async function processTask() {
    while (sendQueue.currentIndex < total && sendQueue.isRunning) {
      // 检查暂停状态
      while (sendQueue.isPaused && sendQueue.isRunning) {
        await sleep(500);
      }

      if (!sendQueue.isRunning) break;

      const index = sendQueue.currentIndex++;
      const task = sendQueue.tasks[index];

      try {
        await sendSingleEmail(config, task.email, subject, content);
        task.status = 'success';
        successCount++;
      } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        failedCount++;
      }

      // 更新进度
      updateProgress(successCount, failedCount, total);
      
      // 延迟
      await sleep(200);
    }
  }

  // 启动并发worker
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(processTask());
  }

  await Promise.all(workers);

  sendQueue.isRunning = false;
  
  return { success: successCount, failed: failedCount, total };
}

// ============================================
// 暂停队列
// ============================================
function pauseQueue() {
  sendQueue.isPaused = true;
}

// ============================================
// 继续队列
// ============================================
function resumeQueue() {
  sendQueue.isPaused = false;
}

// ============================================
// 停止队列
// ============================================
function stopQueue() {
  sendQueue.isRunning = false;
  sendQueue.isPaused = false;
}

// ============================================
// 获取队列状态
// ============================================
function getQueueStatus() {
  return {
    total: sendQueue.tasks.length,
    pending: sendQueue.tasks.filter(t => t.status === 'pending').length,
    success: sendQueue.tasks.filter(t => t.status === 'success').length,
    failed: sendQueue.tasks.filter(t => t.status === 'failed').length,
    isRunning: sendQueue.isRunning,
    isPaused: sendQueue.isPaused
  };
}
