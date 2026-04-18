-- Flydata邮件发布系统 - Supabase数据库Schema
-- 执行此脚本前，请确保已启用Supabase Auth的Email/Password认证

-- ============================================
-- 1. configs表 - 阿里云配置（按用户隔离）
-- ============================================
CREATE TABLE IF NOT EXISTS configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_key_id TEXT NOT NULL,
  access_key_secret TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'cn-hangzhou',
  from_address TEXT NOT NULL,
  from_alias TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configs(user_id);

ALTER TABLE configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own configs" ON configs;
CREATE POLICY "Users can access own configs"
  ON configs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. contacts表 - 联系人（按用户隔离）
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  group_name TEXT DEFAULT '默认分组',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_group ON contacts(group_name);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own contacts" ON contacts;
CREATE POLICY "Users can access own contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. templates表 - 邮件模板（按用户隔离）
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own templates" ON templates;
CREATE POLICY "Users can access own templates"
  ON templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. send_logs表 - 发送日志（按用户隔离）
-- ============================================
CREATE TABLE IF NOT EXISTS send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_send_logs_user_id ON send_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_send_logs_status ON send_logs(status);
CREATE INDEX IF NOT EXISTS idx_send_logs_sent_at ON send_logs(sent_at);

ALTER TABLE send_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own send_logs" ON send_logs;
CREATE POLICY "Users can access own send_logs"
  ON send_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 完成提示
-- ============================================
-- Schema创建完成！
-- 请在Supabase Dashboard的Authentication页面启用Email/Password认证
