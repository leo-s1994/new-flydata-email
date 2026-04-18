'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

export interface ConfigInput {
  access_key_id: string
  access_key_secret: string
  region: string
  from_address: string
  from_alias?: string
}

export async function getConfig() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('configs')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message)
  }

  // 不返回加密的secret
  if (data) {
    return {
      ...data,
      access_key_secret: '', // 前端不需要看到secret
      hasConfig: true,
    }
  }

  return {
    access_key_id: '',
    access_key_secret: '',
    region: 'cn-hangzhou',
    from_address: '',
    from_alias: '',
    hasConfig: false,
  }
}

export async function saveConfig(input: ConfigInput) {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    throw new Error('未登录')
  }

  // 加密AccessKey Secret
  const encryptedSecret = encrypt(input.access_key_secret)

  const { error } = await supabase.from('configs').upsert({
    user_id: user.user.id,
    access_key_id: input.access_key_id,
    access_key_secret: encryptedSecret,
    region: input.region,
    from_address: input.from_address,
    from_alias: input.from_alias,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function testConnection() {
  const supabase = createClient()

  const { data: config, error: configError } = await supabase
    .from('configs')
    .select('*')
    .single()

  if (configError || !config) {
    return { success: false, error: '未配置阿里云信息' }
  }

  try {
    // 解密AccessKey Secret
    const accessKeySecret = decrypt(config.access_key_secret)

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

    await transporter.verify()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
