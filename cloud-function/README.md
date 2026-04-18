# 云函数部署指南 - DirectMail API代理

## 为什么需要云函数？

由于浏览器的CORS（跨域资源共享）安全限制，前端JavaScript无法直接调用阿里云DirectMail API。我们需要一个服务器端代理来解决这个问题。

## 部署步骤

### 步骤1：创建函数计算服务

1. **登录阿里云控制台**
   - 访问 https://fc.console.aliyun.com/

2. **创建服务**
   - 点击"服务及函数" → "创建服务"
   - 服务名称：`flydata-email`
   - 其他保持默认，点击"确定"

### 步骤2：创建函数

1. **在刚创建的服务中，点击"创建函数"**

2. **选择"从零开始创建"**
   - 函数名称：`sendmail-proxy`
   - 运行环境：Node.js 18
   - 请求处理程序类型：HTTP触发器
   - 代码上传方式：在线编辑

3. **点击"创建"**

### 步骤3：上传代码

1. **在函数详情页面，进入"代码"标签**

2. **复制 `cloud-function/index.js` 的内容**

3. **粘贴到在线编辑器中**

4. **点击"部署代码"**

### 步骤4：配置HTTP触发器

1. **进入"触发器管理"标签**

2. **创建触发器**
   - 触发器类型：HTTP触发器
   - 认证方式：匿名访问（或根据需求选择）
   - CORS配置：启用
   - 允许Methods：POST, OPTIONS

3. **记录触发器URL**
   - 类似：`https://xxx.fc.aliyuncs.com/2016-08-15/proxy/flydata-email/sendmail-proxy`

### 步骤5：配置前端

1. **打开 `js/mailer.js` 文件**

2. **修改第11行的URL**：
   ```javascript
   const CLOUD_FUNCTION_URL = 'https://your-actual-url.fc.aliyuncs.com/...';
   ```

3. **保存并提交到GitHub**

### 步骤6：测试

1. **部署应用到ESA Pages**

2. **配置阿里云DirectMail信息**

3. **发送测试邮件**

---

## 本地测试云函数

### 方法一：使用Funcraft工具

```bash
# 安装Funcraft
npm install @alicloud/fun -g

# 进入云函数目录
cd cloud-function

# 本地启动
fun local start

# 测试调用
curl -X POST http://localhost:8000/2016-08-15/proxy/sendmail \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "test@example.com",
    "subject": "测试",
    "htmlBody": "<p>测试内容</p>",
    "fromAddress": "noreply@yourdomain.com",
    "accessKeyId": "your-key",
    "accessKeySecret": "your-secret"
  }'
```

### 方法二：使用Serverless Devs

```bash
# 安装
npm install @serverless-devs/s -g

# 初始化
s init

# 部署
s deploy
```

---

## 安全建议

1. **不要在前端硬编码AccessKey**
   - 当前实现中，AccessKey通过请求传递
   - 生产环境建议在云函数中配置环境变量

2. **启用函数认证**
   - 在HTTP触发器中启用签名认证
   - 或使用API Gateway进行鉴权

3. **设置资源限制**
   - 配置函数的最大并发数
   - 设置超时时间（建议30秒）

4. **监控和日志**
   - 启用函数计算的日志服务
   - 监控调用次数和错误率

---

## 费用说明

阿里云函数计算提供免费额度：
- 每月100万次调用免费
- 对于邮件发送场景，通常足够使用

详细定价：https://www.aliyun.com/price/product#/fc/detail

---

## 常见问题

### Q: 为什么不能直接从浏览器调用DirectMail API？
A: 浏览器的CORS安全策略阻止跨域请求，且在前端暴露AccessKey非常不安全。

### Q: 可以使用其他云服务商的函数吗？
A: 可以，腾讯云SCF、华为云FunctionGraph等都可以，代码基本相同。

### Q: 云函数响应慢怎么办？
A: 
- 检查函数内存配置（建议512MB）
- 优化代码逻辑
- 使用预留实例减少冷启动

---

## 替代方案

如果不想使用云函数，可以考虑：

1. **使用SMTP方式**
   - 在Node.js服务器中使用nodemailer
   - 通过ESA Pages的Serverless Function

2. **使用第三方邮件服务**
   - SendGrid、Mailgun等提供前端SDK
   - 但仍建议通过后端代理

3. **自建代理服务器**
   - 使用Express + VPS
   - 成本较高，不推荐

---

**部署完成后，记得测试邮件发送功能！**
