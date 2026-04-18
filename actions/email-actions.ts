'use server'

import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/utils'
import nodemailer from 'nodemailer'
import { revalidatePath } from 'next/cache'

export interface SendEmailInput {
  recipients: string[]
  subject: string
  content: string
}

export async function sendBulkEmail(input: SendEmailInput) {
  const supabase = createClient()

  // 1. 获取用户配置
  const { data: config, error: configError } = await supabase
    .from('configs')
    .select('*')
    .single()

  if (configError || !config) {
    throw new Error('未配置阿里云信息，请先在设置页面配置')
  }

  // 2. 解密AccessKey Secret
  const accessKeySecret = decrypt(config.access_key_secret)

  // 3. 创建SMTP传输器
  const host =
    config.region === 'cn-hangzhou'
      ? 'smtpdm.aliyun.com'
      : 'smtpdm.ap-southeast-1.aliyuncs.com'

  const transporter = nodemailer.createTransport({
    host,
    port: 80,
    secure: false,
    auth: {
      user: config.from_address,
      pass: accessKeySecret,
    },
  })

  // 4. 获取当前用户
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    throw new Error('未登录')
  }

  // 5. 并发控制发送
  const concurrency = 3
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < input.recipients.length; i += concurrency) {
    const batch = input.recipients.slice(i, i + concurrency)

    await Promise.all(
      batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: config.from_alias
              ? `"${config.from_alias}" <${config.from_address}>`
              : config.from_address,
            to: email,
            subject: input.subject,
            html: input.content,
          })

          successCount++

          // 记录到数据库
          await supabase.from('send_logs').insert({
            user_id: user.user.id,
            email,
            subject: input.subject,
            status: 'success',
          })
        } catch (error: any) {
          failedCount++

          await supabase.from('send_logs').insert({
            user_id: user.user.id,
            email,
            subject: input.subject,
            status: 'failed',
            error_message: error.message,
          })
        }
      })
    )

    // 延迟避免触发限流
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  revalidatePath('/logs')

  return {
    successCount,
    failedCount,
    total: input.recipients.length,
  }
}

export async function getSendLogs(filters?: {
  status?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = createClient()

  let query = supabase.from('send_logs').select('*').order('sent_at', {
    ascending: false,
  })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.startDate) {
    query = query.gte('sent_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('sent_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data
}
