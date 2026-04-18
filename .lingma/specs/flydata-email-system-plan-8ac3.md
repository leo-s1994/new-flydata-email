# Flydata邮件发布系统 - Next.js 重构实施方案

## Context（背景）

用户需要**完全重新开发**Flydata邮件发布系统，从当前的原生JavaScript/Express架构迁移到 **Next.js 14+ 全栈框架**。这是一个基于阿里云邮件推送服务(DirectMail)的多用户邮件群发客户端，所有数据存储在Supabase云端数据库。

### 核心需求
1. **技术栈**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
2. **认证方式**: Supabase Auth (邮箱/密码登录)，进入应用前必须验证
3. **富媒体编辑器**: 增强版Quill/Tiptap编辑器，支持表格、代码块、视频等
4. **邮件发送**: 通过阿里云DirectMail SMTP协议批量发送邮件
5. **配置管理**: 阿里云AccessKey等配置通过弹窗设置
6. **部署目标**: 最终部署到支持Next.js的平台（阿里云ESA Pages或类似平台）

### 现有功能模块
- 用户注册/登录（Supabase Auth）
- 联系人管理（增删改查、分组、CSV导入导出）
- 邮件模板管理
- 富文本邮件编辑
- 批量邮件发送（全部联系人/指定分组/自定义列表）
- 发送进度实时跟踪
- 发送日志记录
- 阿里云配置管理

---

## 技术方案

### 1. 技术栈选择

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **框架** | Next.js 14+ (App Router) | 支持Server Components、Server Actions、SSR |
| **语言** | TypeScript | 类型安全，更好的开发体验 |
| **样式** | Tailwind CSS + shadcn/ui | 快速构建响应式UI，组件库加速开发 |
| **状态管理** | React Context + TanStack Query | 全局状态用Context，服务端状态用Query |
| **数据库** | Supabase PostgreSQL | 复用现有Schema和RLS策略 |
| **认证** | @supabase/ssr + Middleware | Cookie-based会话，中间件保护路由 |
| **富文本编辑器** | Tiptap (ProseMirror) | 比Quill更适合React，扩展性强 |
| **邮件发送** | Nodemailer + Server Actions | 服务端处理SMTP，密钥不暴露给客户端 |
| **队列系统** | 数据库Job表 (初期) | 后台处理批量邮件，可选升级Upstash Redis |
| **CSV处理** | PapaParse | 客户端解析CSV文件 |
| **加密** | crypto-js | AccessKey Secret加密存储 |

### 2. 项目结构

```
flydata-email-nextjs/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # 认证路由组（无侧边栏）
│   │   ├── login/page.tsx            # 登录页面
│   │   ├── register/page.tsx         # 注册页面
│   │   └── layout.tsx                # 认证布局（居中，无侧边栏）
│   │
│   ├── (dashboard)/                  # 受保护的路由组
│   │   ├── compose/page.tsx          # 写信页面
│   │   ├── contacts/page.tsx         # 联系人管理
│   │   ├── templates/page.tsx        # 模板管理
│   │   ├── logs/page.tsx             # 发送日志
│   │   ├── settings/page.tsx         # 阿里云配置
│   │   ├── layout.tsx                # Dashboard布局（带侧边栏）
│   │   └── page.tsx                  # 重定向到/compose
│   │
│   ├── globals.css                   # 全局样式
│   ├── layout.tsx                    # 根布局（Providers、字体）
│   └── not-found.tsx                 # 404页面
│
├── components/                       # React组件
│   ├── ui/                           # shadcn/ui基础组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── toast.tsx
│   │
│   ├── auth/                         # 认证组件
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   │
│   ├── layout/                       # 布局组件
│   │   ├── Sidebar.tsx               # 侧边栏导航
│   │   └── Topbar.tsx                # 顶部栏
│   │
│   ├── editor/                       # 编辑器组件
│   │   ├── EmailEditor.tsx           # Tiptap编辑器封装
│   │   └── EditorToolbar.tsx         # 自定义工具栏
│   │
│   ├── contacts/                     # 联系人组件
│   │   ├── ContactTable.tsx
│   │   ├── ContactForm.tsx
│   │   └── CSVImportDialog.tsx
│   │
│   ├── templates/                    # 模板组件
│   │   ├── TemplateList.tsx
│   │   └── SaveTemplateDialog.tsx
│   │
│   ├── email/                        # 邮件发送组件
│   │   ├── SendModal.tsx             # 发送确认弹窗
│   │   └── ProgressTracker.tsx       # 进度跟踪器
│   │
│   └── settings/                     # 设置组件
│       └── ConfigForm.tsx            # 阿里云配置表单
│
├── lib/                              # 工具库
│   ├── supabase/
│   │   ├── client.ts                 # 浏览器端Supabase客户端
│   │   └── server.ts                 # 服务端Supabase客户端
│   │
│   ├── email/
│   │   └── mailer.ts                 # Nodemailer配置
│   │
│   └── utils.ts                      # 通用工具函数
│
├── actions/                          # Server Actions
│   ├── auth-actions.ts               # 登录、注册、登出
│   ├── contact-actions.ts            # 联系人CRUD
│   ├── template-actions.ts           # 模板CRUD
│   ├── config-actions.ts             # 配置管理
│   └── email-actions.ts              # 邮件发送
│
├── hooks/                            # 自定义Hooks
│   ├── useAuth.ts                    # 认证状态
│   ├── useContacts.ts                # 联系人查询
│   └── useTemplates.ts               # 模板查询
│
├── providers/                        # Context Providers
│   ├── AuthProvider.tsx              # 认证上下文
│   └── QueryProvider.tsx             # TanStack Query提供者
│
├── types/                            # TypeScript类型
│   └── database.types.ts             # 从Supabase自动生成
│
├── middleware.ts                     # Next.js中间件（路由保护）
├── next.config.js                    # Next.js配置
├── tailwind.config.ts                # Tailwind配置
├── tsconfig.json
├── package.json
└── .env.local.example                # 环境变量模板
```

### 3. 核心实现细节

#### 3.1 认证流程

**Middleware路由保护** (`middleware.ts`):
```typescript
import { createMiddlewareClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // 未登录用户重定向到登录页
  if (!session && req.nextUrl.pathname.startsWith('/(dashboard)')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // 已登录用户访问登录页时重定向到首页
  if (session && req.nextUrl.pathname.startsWith('/(auth)')) {
    return NextResponse.redirect(new URL('/compose', req.url));
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

**登录Server Action** (`actions/auth-actions.ts`):
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string
  });
  
  if (error) {
    return { error: error.message };
  }
  
  redirect('/compose');
}
```

#### 3.2 富文本编辑器 (Tiptap)

**EmailEditor组件** (`components/editor/EmailEditor.tsx`):
```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface EmailEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

export default function EmailEditor({ initialContent, onChange }: EmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight,
      Link.configure({ openOnClick: false }),
      Image
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    }
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  );
}
```

**动态导入避免SSR问题**:
```typescript
// 在父组件中
const EmailEditor = dynamic(() => import('@/components/editor/EmailEditor'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded" />
});
```

#### 3.3 邮件发送 (Server Actions)

**批量发送逻辑** (`actions/email-actions.ts`):
```typescript
'use server';

import nodemailer from 'nodemailer';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils';

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  content: string
) {
  const supabase = createClient();
  
  // 1. 获取用户配置
  const { data: config, error: configError } = await supabase
    .from('configs')
    .select('*')
    .single();
  
  if (configError || !config) {
    throw new Error('未配置阿里云信息');
  }
  
  // 2. 解密AccessKey Secret
  const accessKeySecret = decrypt(config.access_key_secret);
  
  // 3. 创建SMTP传输器
  const transporter = nodemailer.createTransport({
    host: config.region === 'cn-hangzhou' 
      ? 'smtpdm.aliyun.com' 
      : 'smtpdm.ap-southeast-1.aliyuncs.com',
    port: 80,
    secure: false,
    auth: {
      user: config.from_address,
      pass: accessKeySecret
    }
  });
  
  // 4. 并发控制发送
  const concurrency = 3;
  let successCount = 0;
  let failedCount = 0;
  const logs = [];
  
  for (let i = 0; i < recipients.length; i += concurrency) {
    const batch = recipients.slice(i, i + concurrency);
    
    await Promise.all(batch.map(async (email) => {
      try {
        await transporter.sendMail({
          from: config.from_alias 
            ? `"${config.from_alias}" <${config.from_address}>`
            : config.from_address,
          to: email,
          subject,
          html: content
        });
        
        successCount++;
        logs.push({ email, status: 'success' });
        
        // 记录到数据库
        await supabase.from('send_logs').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          email,
          subject,
          status: 'success'
        });
        
      } catch (error) {
        failedCount++;
        logs.push({ email, status: 'failed', error: error.message });
        
        await supabase.from('send_logs').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          email,
          subject,
          status: 'failed',
          error_message: error.message
        });
      }
    }));
    
    // 延迟避免触发限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return { successCount, failedCount, total: recipients.length, logs };
}
```

#### 3.4 进度跟踪

**ProgressTracker组件** (`components/email/ProgressTracker.tsx`):
```typescript
'use client';

import { useState, useEffect } from 'react';

interface ProgressTrackerProps {
  jobId: string;
  onComplete?: (result: any) => void;
}

export default function ProgressTracker({ jobId, onComplete }: ProgressTrackerProps) {
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    success: 0,
    failed: 0,
    logs: []
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      // 轮询获取进度（实际项目中调用Server Action）
      const status = await getJobStatus(jobId);
      setProgress(status);
      
      if (status.completed >= status.total) {
        clearInterval(interval);
        onComplete?.(status);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [jobId]);

  const percent = Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{progress.total}</div>
          <div className="text-sm text-gray-500">总数</div>
        </div>
        <div className="text-center text-green-600">
          <div className="text-2xl font-bold">{progress.success}</div>
          <div className="text-sm">成功</div>
        </div>
        <div className="text-center text-red-600">
          <div className="text-2xl font-bold">{progress.failed}</div>
          <div className="text-sm">失败</div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-center text-sm text-gray-600">
        {progress.completed} / {progress.total} ({percent}%)
      </div>
    </div>
  );
}
```

### 4. 数据库Schema

**复用现有Supabase Schema**（无需修改）:

```sql
-- configs表 - 阿里云配置
CREATE TABLE configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_key_id TEXT NOT NULL,
  access_key_secret TEXT NOT NULL,  -- 加密存储
  region TEXT NOT NULL DEFAULT 'cn-hangzhou',
  from_address TEXT NOT NULL,
  from_alias TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- contacts表 - 联系人
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  group_name TEXT DEFAULT '默认分组',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- templates表 - 邮件模板
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- send_logs表 - 发送日志
CREATE TABLE send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS策略（每个用户只能访问自己的数据）
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own configs" ON configs FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can access own contacts" ON contacts FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can access own templates" ON templates FOR ALL
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can access own send_logs" ON send_logs FOR ALL
  TO authenticated USING (auth.uid() = user_id);
```

### 5. 环境变量配置

**.env.local**:
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 加密密钥（32字节，用于加密AccessKey Secret）
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# 阿里云SMTP配置（可选，也可在数据库中配置）
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=80
```

---

## 实施步骤

### Phase 1: 项目初始化 (第1天)
- [ ] 创建Next.js 14项目（TypeScript + Tailwind CSS）
- [ ] 安装依赖包：
  ```bash
  npm install @supabase/ssr @supabase/supabase-js
  npm install @tanstack/react-query
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-link @tiptap/extension-image
  npm install nodemailer crypto-js papaparse
  npm install zod
  npx shadcn-ui@latest init
  ```
- [ ] 配置Supabase客户端（browser + server）
- [ ] 设置Tailwind主题色（匹配现有蓝色主题 #1890ff）
- [ ] 创建根布局和Providers

### Phase 2: 认证系统 (第1-2天)
- [ ] 创建登录页面 (`app/(auth)/login/page.tsx`)
- [ ] 创建注册页面 (`app/(auth)/register/page.tsx`)
- [ ] 实现Server Actions: `login()`, `register()`, `logout()`
- [ ] 创建AuthProvider Context
- [ ] 配置Middleware路由保护
- [ ] 测试完整认证流程

### Phase 3: 核心布局与导航 (第2天)
- [ ] 创建Dashboard布局 (`app/(dashboard)/layout.tsx`)
- [ ] 实现Sidebar组件（侧边栏导航）
- [ ] 实现Topbar组件（顶部栏）
- [ ] 添加响应式移动端菜单
- [ ] 创建所有路由的占位页面

### Phase 4: 富文本编辑器 (第2-3天)
- [ ] 集成Tiptap编辑器
- [ ] 构建自定义工具栏
- [ ] 添加扩展：表格、代码块、图片、链接
- [ ] 实现自动保存草稿（localStorage）
- [ ] 测试编辑器功能

### Phase 5: 联系人管理 (第3-4天)
- [ ] 创建ContactTable组件
- [ ] 实现ContactForm弹窗（新增/编辑）
- [ ] 添加CSV导入功能（PapaParse）
- [ ] 添加CSV导出功能
- [ ] 实现搜索功能（防抖）
- [ ] Server Actions: `createContact()`, `updateContact()`, `deleteContact()`
- [ ] 使用TanStack Query优化数据获取

### Phase 6: 模板管理 (第4天)
- [ ] 创建TemplateList组件
- [ ] 实现SaveTemplateDialog
- [ ] 添加加载模板到编辑器功能
- [ ] Server Actions: `createTemplate()`, `updateTemplate()`, `deleteTemplate()`

### Phase 7: 邮件发送核心 (第5-6天)
- [ ] 创建SendModal组件（收件人选择）
- [ ] 实现Server Action: `sendBulkEmail()`
- [ ] 配置Nodemailer连接阿里云SMTP
- [ ] 实现并发控制（最多3个同时发送）
- [ ] 添加发送间隔（500ms避免限流）
- [ ] 创建ProgressTracker组件
- [ ] 实现暂停/取消功能
- [ ] 端到端测试邮件发送

### Phase 8: 设置与配置 (第6天)
- [ ] 创建ConfigForm组件
- [ ] 实现AccessKey Secret加密存储
- [ ] 添加"测试连接"功能
- [ ] Server Actions: `saveConfig()`, `getConfig()`

### Phase 9: 发送日志 (第6-7天)
- [ ] 创建LogTable组件
- [ ] 使用TanStack Query获取日志
- [ ] 添加状态筛选（成功/失败）
- [ ] 添加日期范围筛选
- [ ] 实现日志导出CSV

### Phase 10: 优化与测试 (第7-8天)
- [ ] 添加加载状态和骨架屏
- [ ] 完善错误处理和用户提示
- [ ] 性能优化（代码分割、懒加载）
- [ ] 可访问性检查（WCAG合规）
- [ ] 跨浏览器测试
- [ ] 编写README文档

### Phase 11: 部署 (第8-9天)
- [ ] 配置生产环境变量
- [ ] 选择部署平台（Vercel推荐，或阿里云ESA）
- [ ] 部署到生产环境
- [ ] 配置自定义域名
- [ ] 监控错误日志
- [ ] 性能监控设置

---

## 验证与测试

### 本地测试流程

1. **启动开发服务器**:
   ```bash
   npm run dev
   # 访问 http://localhost:3000
   ```

2. **测试认证流程**:
   - 注册新账号
   - 验证邮箱（如需要）
   - 登录并确认跳转到/compose
   - 测试登出功能

3. **测试联系人管理**:
   - 添加单个联系人
   - 编辑联系人信息
   - 删除联系人
   - 导入CSV文件（准备测试用的CSV）
   - 导出CSV并验证内容
   - 搜索联系人

4. **测试模板管理**:
   - 在写信页面编辑内容
   - 保存为模板
   - 加载模板到编辑器
   - 删除模板

5. **测试邮件发送**:
   - 配置阿里云AccessKey（设置页面）
   - 点击"测试连接"验证配置
   - 编写邮件主题和内容
   - 选择收件人（全部/分组/自定义）
   - 开始发送并观察进度
   - 验证发送日志记录

6. **测试安全性**:
   - 未登录访问/dashboard路由应重定向到/login
   - AccessKey Secret不应在浏览器Network面板中明文显示
   - 不同用户的数据应完全隔离

### 关键验证点

✅ **功能完整性**:
- 所有CRUD操作正常工作
- 邮件能够成功发送到真实邮箱
- 进度跟踪实时更新
- CSV导入导出无数据丢失

✅ **性能指标**:
- 首屏加载时间 < 2秒
- 页面切换无明显卡顿
- 批量发送100封邮件不阻塞UI

✅ **安全性**:
- RLS策略生效（用户只能访问自己的数据）
- AccessKey Secret加密存储
- 输入验证防止SQL注入/XSS

✅ **响应式设计**:
- 桌面端（1920x1080）正常显示
- 平板端（768x1024）适配良好
- 移动端（375x667）可用

---

## 潜在挑战与解决方案

### 挑战1: Serverless环境下的长时间运行任务

**问题**: Next.js Serverless Functions有执行时间限制（10-60秒），但批量发送邮件可能需要数分钟。

**解决方案**:
- **方案A（推荐初期）**: 使用数据库Job表 + 后台轮询
  - Server Action创建Job记录后立即返回
  - 客户端每2秒轮询Job状态
  - 适合小规模发送（<500封）
  
- **方案B（生产环境）**: 使用Upstash QStash或阿里云函数计算
  - 将邮件发送任务推送到消息队列
  - 由独立的Worker处理
  - 支持大规模发送和自动重试

### 挑战2: Tiptap编辑器的SSR兼容性

**问题**: Tiptap依赖浏览器API，直接在服务端渲染会报错。

**解决方案**:
```typescript
// 使用Next.js动态导入禁用SSR
const EmailEditor = dynamic(() => import('@/components/editor/EmailEditor'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px]" />
});
```

### 挑战3: 阿里云DirectMail限流

**问题**: 发送频率过高会触发阿里云限流。

**解决方案**:
- 并发控制：最多3个SMTP连接同时发送
- 发送间隔：每封邮件间隔500ms
- 每日配额监控：在数据库中记录当日发送量
- 指数退避：遇到限流错误时逐步增加等待时间

### 挑战4: 大CSV文件导入性能

**问题**: 导入1000+联系人的CSV文件会导致浏览器卡顿。

**解决方案**:
- 使用Web Workers在后台线程解析CSV
- 分批次插入数据库（每批100条）
- 显示解析和导入进度条
- 提供取消导入选项

---

## 关键技术决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 框架 | Next.js 14 App Router | 现代化全栈方案，SSR+CSR混合渲染 |
| 编辑器 | Tiptap | React原生支持，扩展性强于Quill |
| 状态管理 | Context + TanStack Query | 轻量级，足够应对当前复杂度 |
| 邮件队列 | 数据库Job表（初期） | 零额外成本，简化部署 |
| 样式方案 | Tailwind CSS | 开发效率高，易于维护 |
| 组件库 | shadcn/ui | 可定制性强，无障碍支持好 |
| 部署平台 | Vercel（首选） | Next.js官方支持，零配置部署 |

---

## 下一步行动

1. **确认Supabase项目**: 确保已有可用的Supabase项目和数据库Schema
2. **获取阿里云AccessKey**: 准备好阿里云DirectMail的AccessKey ID和Secret
3. **开始Phase 1**: 初始化Next.js项目并安装依赖
4. **逐步实施**: 按照上述Phase顺序推进，每完成一个Phase进行验证

**预计总工期**: 8-9个工作日（单人开发）

**风险提示**: 
- 阿里云DirectMail需要预先验证发信域名
- Supabase免费额度有限（500MB存储，2GB带宽/月）
- 大规模邮件发送建议升级到付费套餐或使用专业邮件服务
