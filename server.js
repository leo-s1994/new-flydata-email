/**
 * Flydata邮件发布系统 - Node.js服务器
 * 使用Nodemailer通过SMTP发送邮件
 * 无需云函数，零额外成本
 */

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// ============================================
// 邮件发送API
// ============================================
app.post('/api/send-email', async (req, res) => {
  try {
    const {
      toAddress,
      subject,
      htmlBody,
      fromAddress,
      fromAlias,
      accessKeyId,
      accessKeySecret,
      region = 'cn-hangzhou'
    } = req.body;

    // 验证必填参数
    if (!toAddress || !subject || !htmlBody || !fromAddress || !accessKeyId || !accessKeySecret) {
      return res.status(400).json({
        success: false,
        error: '缺少必填参数'
      });
    }

    // 阿里云DirectMail SMTP配置
    const smtpHost = region === 'cn-hangzhou' 
      ? 'smtpdm.aliyun.com' 
      : 'smtpdm.ap-southeast-1.aliyuncs.com';
    
    const smtpPort = 80; // 或 465 (SSL)

    // 创建SMTP传输器
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // true for 465, false for other ports
      auth: {
        user: fromAddress,
        pass: accessKeySecret // 使用AccessKey Secret作为SMTP密码
      }
    });

    // 邮件配置
    const mailOptions = {
      from: fromAlias ? `"${fromAlias}" <${fromAddress}>` : fromAddress,
      to: toAddress,
      subject: subject,
      html: htmlBody
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);

    console.log('邮件发送成功:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      message: '发送成功'
    });

  } catch (error) {
    console.error('邮件发送失败:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || '发送失败'
    });
  }
});

// ============================================
// 健康检查
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// SPA路由支持
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, () => {
  console.log(`Flydata邮件发布系统正在运行...`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`邮件API: http://localhost:${PORT}/api/send-email`);
});

module.exports = app;
