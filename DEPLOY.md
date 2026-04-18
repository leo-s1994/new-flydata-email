# 快速部署指南

## 📦 部署到阿里云ESA Pages

### 前置准备

1. ✅ 已完成Supabase项目创建和数据库初始化
2. ✅ 已修改 `js/supabase-client.js` 中的配置
3. ✅ 已在本地测试运行正常

---

## 方法一：通过GitHub部署（推荐）

### Step 1: 初始化Git仓库

```bash
cd d:\MailClient
git init
git add .
git commit -m "Initial commit: Flydata邮件发布系统"
```

### Step 2: 推送到GitHub

```bash
# 创建GitHub仓库后，执行：
git remote add origin https://github.com/YOUR_USERNAME/flydata-email.git
git branch -M main
git push -u origin main
```

### Step 3: 在阿里云ESA部署

1. 访问 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 点击 **"Pages"** → **"创建应用"**
3. 选择 **"从Git仓库导入"**
4. 连接GitHub账号
5. 选择 `flydata-email` 仓库
6. 配置构建设置：
   ```
   框架预设: 静态网站
   构建命令: (留空)
   输出目录: /
   ```
7. 点击 **"创建并部署"**

### Step 4: 等待部署完成

- 通常1-2分钟内完成
- 获取域名：`https://flydata-xxx.esa.pages.dev`

---

## 方法二：手动上传

### Step 1: 压缩项目

```powershell
# PowerShell
Compress-Archive -Path d:\MailClient\* -DestinationPath d:\MailClient.zip
```

### Step 2: 上传到ESA

1. 访问 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 点击 **"Pages"** → **"创建应用"**
3. 选择 **"手动上传"**
4. 上传 `MailClient.zip`
5. 点击 **"部署"**

---

## 🔧 部署后配置

### 1. 验证部署

访问部署后的URL，测试以下功能：
- [ ] 能正常打开登录页面
- [ ] 能注册新用户
- [ ] 能成功登录
- [ ] 能看到主界面

### 2. 配置自定义域名（可选）

1. 在ESA控制台进入应用详情
2. 点击 **"自定义域名"**
3. 添加域名，如：`mail.yourdomain.com`
4. 按提示配置DNS：
   ```
   类型: CNAME
   主机记录: mail
   记录值: xxx.esa.pages.dev
   ```
5. 等待DNS生效（通常几分钟到几小时）

### 3. 配置环境变量（推荐）

如果不想在代码中硬编码Supabase配置：

1. 在ESA控制台进入应用详情
2. 点击 **"环境变量"**
3. 添加变量：
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your-anon-key
   ```
4. 重新部署应用

---

## 🔄 更新部署

### Git方式
```bash
# 修改代码后
git add .
git commit -m "Update: 描述你的修改"
git push
# ESA会自动重新部署
```

### 手动上传方式
1. 重新压缩项目
2. 在ESA控制台点击 **"重新部署"**
3. 上传新的zip文件

---

## ⚠️ 常见问题排查

### 问题1: 页面显示空白

**检查步骤：**
```javascript
// 打开浏览器控制台(F12)，查看错误信息

// 常见原因1: Supabase配置错误
// 解决: 检查 js/supabase-client.js 中的配置是否正确

// 常见原因2: CDN资源加载失败
// 解决: 检查网络连接，确认能访问jsdelivr.net
```

### 问题2: 无法注册/登录

**检查步骤：**
1. 打开浏览器控制台，查看网络请求
2. 确认Supabase项目状态正常
3. 检查Anon Key是否正确
4. 确认Supabase已启用Email/Password认证

### 问题3: 发送邮件失败

**检查步骤：**
1. 确认已在"设置"页面配置阿里云信息
2. 检查AccessKey是否有DirectMail权限
3. 确认发信域名已在阿里云验证
4. 查看发送日志了解具体错误

---

## 📊 监控和维护

### 查看访问统计

在ESA控制台可以查看：
- 访问量(PV/UV)
- 带宽使用
- 响应时间
- 错误率

### 查看日志

1. 进入应用详情
2. 点击 **"日志查询"**
3. 可以查看访问日志和错误日志

### 性能优化建议

1. **启用CDN缓存**
   ```
   在ESA控制台 → 缓存配置
   设置静态资源缓存策略
   ```

2. **压缩资源**
   - 图片使用WebP格式
   - 启用Gzip压缩（ESA默认启用）

3. **监控Supabase用量**
   - 定期查看数据库大小
   - 清理旧的发送日志

---

## 🎯 部署检查清单

部署前：
- [ ] 修改 `js/supabase-client.js` 配置
- [ ] 在本地测试运行正常
- [ ] 执行了 `sql/schema.sql` 脚本
- [ ] 创建了 `.gitignore` 文件

部署后：
- [ ] 能正常访问网站
- [ ] 用户注册/登录功能正常
- [ ] 能配置阿里云信息
- [ ] 能添加联系人
- [ ] 能发送邮件
- [ ] （可选）配置了自定义域名
- [ ] （可选）配置了HTTPS证书

---

## 📞 需要帮助？

- 查看 [README.md](README.md) 了解详细功能
- 查看阿里云ESA文档：https://help.aliyun.com/product/esa.html
- 查看Supabase文档：https://supabase.com/docs

---

**祝您部署顺利！** 🚀
