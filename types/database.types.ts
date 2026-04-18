// Supabase数据库类型定义

export interface Config {
  id: string
  user_id: string
  access_key_id: string
  access_key_secret: string
  region: string
  from_address: string
  from_alias?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string
  group_name: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  user_id: string
  name: string
  subject: string
  content: string
  category?: string
  created_at: string
  updated_at: string
}

export interface SendLog {
  id: string
  user_id: string
  email: string
  subject: string
  status: 'pending' | 'success' | 'failed'
  error_message?: string
  sent_at: string
}

export interface EmailJob {
  id: string
  user_id: string
  total: number
  completed: number
  success: number
  failed: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}
