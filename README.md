# Flydata邮件发布系统

基于阿里云邮件推送服务（DirectMail）的多用户邮件群发客户端，所有数据存储在Supabase云端数据库。

## 功能特性

- **多用户支持**：支持用户注册登录，数据按用户隔离
- **富文本编辑**：集成Quill编辑器，支持格式化文本、图片、链接等
- **联系人管理**：支持增删改查、分组管理、CSV导入导出
- **邮件模板**：支持创建、保存、加载邮件模板
- **批量发送**：支持向全部联系人、指定分组或自定义邮箱列表发送邮件
- **发送进度**：实时显示发送进度、成功/失败统计
- **发送日志**：记录所有发送历史，可按需查看
- **云端存储**：所有数据存储在Supabase，支持跨设备同步

## 快速开始

### 1. 创建Supabase项目

1. 访问 [Supabase](https://supabase.com) 并创建账号
2. 创建新项目，记录以下信息：
   - Project URL（项目URL）
   - Anon Key（匿名密钥）

### 2. 初始化数据库

1. 在Supabase Dashboard中，进入SQL Editor
2. 复制 `sql/schema.sql` 文件的内容并执行
3. 进入Authentication页面，启用Email/Password认证方式

### 3. 配置前端

打开 `js/supabase-client.js` 文件，修改以下配置：

```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',      // 替换为你的Supabase项目URL
  anonKey: 'your-anon-key-here'                  // 替换为你的Supabase Anon Key
};
```

### 4. 配置阿里云DirectMail

1. 登录阿里云控制台
2. 开通邮件推送服务（DirectMail）
3. 创建AccessKey（建议使用RAM子账号）
4. 配置发信域名并通过验证
5. 在应用的"设置"页面填入配置信息

### 5. 部署到阿里云ESA Pages

#### 方法一：通过Git仓库部署

1. 将项目推送到Git仓库
2. 在阿里云ESA控制台创建Pages应用
3. 连接Git仓库，选择主分支
4. 配置构建命令（无需构建，直接部署）
5. 点击部署

#### 方法二：手动上传

1. 压缩整个项目文件夹
2. 在阿里云ESA控制台创建Pages应用
3. 选择手动上传，上传压缩包
4. 等待部署完成

### 6. 访问应用

部署完成后，通过分配的域名访问应用：
- 登录/注册页面：`https://your-domain.esa.pages.dev/`
- 首次使用需要注册账号

## 项目结构

```
MailClient/
├── index.html              # 登录/注册页面
├── app.html                # 应用主界面
├── css/
│   ├── style.css           # 全局样式
│   └── modal.css           # 弹窗样式
├── js/
│   ├── supabase-client.js  # Supabase客户端配置
│   ├── auth.js             # 认证模块
│   ├── config.js           # 阿里云配置管理
│   ├── contacts.js         # 联系人管理
│   ├── templates.js        # 邮件模板管理
│   ├── editor.js           # 富文本编辑器
│   ├── mailer.js           # 邮件发送核心
│   ├── queue.js            # 发送队列管理
│   ├── utils.js            # 工具函数
│   └── app.js              # 主应用逻辑
├── sql/
│   └── schema.sql          # 数据库Schema
└── README.md               # 使用说明
```

## 技术栈

- **前端**：原生HTML/CSS/JavaScript
- **数据库**：Supabase PostgreSQL
- **认证**：Supabase Auth
- **编辑器**：Quill.js
- **CSV处理**：PapaParse
- **加密**：CryptoJS
- **图标**：Font Awesome
- **部署**：阿里云ESA Pages

## 依赖库（CDN）

- @supabase/supabase-js@2.39.0
- quill@2.0.0
- papaparse@5.4.1
- crypto-js@4.2.0
- font-awesome@6.4.0

## 安全说明

1. **AccessKey安全**：
   - 建议使用RAM子账号，仅授予DirectMail必要权限
   - AccessKey Secret在数据库中加密存储
   - 定期轮换密钥

2. **数据安全**：
   - 所有数据传输使用HTTPS加密
   - Supabase启用Row Level Security (RLS)
   - 每个用户只能访问自己的数据

3. **XSS防护**：
   - 用户输入内容进行HTML转义
   - Quill编辑器输出经过sanitization

## 注意事项

1. **阿里云DirectMail限制**：
   - 需要预先配置并验证发信域名
   - 注意每日发送配额限制
   - 避免高频发送触发限流

2. **Supabase免费额度**：
   - 数据库存储：500MB
   - 带宽：2GB/月
   - 注意监控使用量

3. **浏览器兼容性**：
   - 支持现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
   - 不支持IE浏览器

## 常见问题

### Q: 注册后收不到验证邮件？
A: 检查垃圾邮件文件夹，或在Supabase Dashboard的Authentication页面确认用户状态。

### Q: 发送邮件失败？
A: 检查以下几点：
- 阿里云AccessKey是否正确
- 发信域名是否已验证
- 收件人邮箱格式是否正确
- 网络连接是否正常

### Q: 如何修改Supabase配置？
A: 编辑 `js/supabase-client.js` 文件中的 `SUPABASE_CONFIG` 对象。

### Q: 可以自定义发件人名称吗？
A: 可以在"设置"页面配置"发件人昵称"。

## 许可证

MIT License

## 更新日志

### v1.0.0 (2026-04-18)
- 初始版本发布
- 支持用户注册登录
- 支持联系人管理和CSV导入导出
- 支持邮件模板管理
- 支持批量发送邮件
- 支持发送进度显示和日志记录
