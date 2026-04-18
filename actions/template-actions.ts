'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface TemplateInput {
  name: string
  subject: string
  content: string
  category?: string
}

export async function getTemplates() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createTemplate(input: TemplateInput) {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    throw new Error('未登录')
  }

  const { error } = await supabase.from('templates').insert({
    user_id: user.user.id,
    name: input.name,
    subject: input.subject,
    content: input.content,
    category: input.category,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/templates')
  return { success: true }
}

export async function updateTemplate(id: string, input: TemplateInput) {
  const supabase = createClient()

  const { error } = await supabase
    .from('templates')
    .update({
      name: input.name,
      subject: input.subject,
      content: input.content,
      category: input.category,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from('templates').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/templates')
  return { success: true }
}
