# 本地测试指南

## ⚠️ 重要提示

**不能直接打开HTML文件！** 必须通过Node.js服务器访问应用，否则邮件发送API无法工作。

## 🧪 本地测试步骤

### 步骤1：安装依赖

```bash
cd d:\MailClient
npm install
```

这会安装以下依赖：
- express: Web服务器
- nodemailer: SMTP邮件发送
- cors: 跨域支持

### 步骤2：启动服务器

```bash
npm start
```

或直接运行：
```bash
node server.js
```

您应该看到：
```
Flydata邮件发布系统正在运行...
访问地址: http://localhost:3000
邮件API: http://localhost:3000/api/send-email
```

### 步骤3：访问应用

在浏览器中打开：**http://localhost:3000**

⚠️ **不要**直接双击 `index.html` 文件！

### 步骤4：测试邮件发送

1. 注册/登录账号
2. 在"设置"页面配置阿里云信息
3. 添加联系人
4. 在"写信"页面编写邮件
5. 点击"发送邮件"

---

## 🔍 调试技巧

### 检查API是否正常工作

在浏览器控制台（F12）中运行：

```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

应该返回：
```json
{ "status": "ok", "timestamp": "..." }
```

### 检查邮件发送API

```javascript
fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    toAddress: 'test@example.com',
    subject: '测试',
    htmlBody: '<p>测试内容</p>',
    fromAddress: 'your@domain.com',
    accessKeyId: 'YOUR_KEY',
    accessKeySecret: 'YOUR_SECRET'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

### 查看服务器日志

在终端中可以看到：
- API请求日志
- 邮件发送成功/失败信息
- 错误详情

---

## ❌ 常见错误

### 错误1: Unexpected token '<', "<!DOCTYPE "... is not valid JSON

**原因**: 直接打开HTML文件，没有通过服务器访问

**解决**: 
1. 启动服务器：`npm start`
2. 访问：http://localhost:3000

### 错误2: Failed to fetch

**原因**: 服务器未启动或端口被占用

**解决**:
1. 确认服务器正在运行
2. 检查端口3000是否可用
3. 查看终端是否有错误信息

### 错误3: 缺少必填参数

**原因**: 阿里云配置未保存

**解决**:
1. 进入"设置"页面
2. 填写完整的阿里云配置
3. 点击"保存配置"

---

## 🌐 部署后使用

部署到阿里云ESA Pages后，无需担心这个问题，因为所有请求都会通过服务器处理。

部署后的URL类似：
```
https://flydata-email-xxx.esa.pages.dev
```

直接访问该URL即可，不需要额外配置。

---

## 💡 开发建议

在开发过程中，始终使用以下方式访问：

✅ **正确**: http://localhost:3000  
❌ **错误**: file:///d:/MailClient/index.html
