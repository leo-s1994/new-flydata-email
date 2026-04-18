'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ContactInput {
  name: string
  email: string
  group_name?: string
}

export async function getContacts() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getContactGroups() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('group_name')
    .order('group_name')

  if (error) {
    throw new Error(error.message)
  }

  const groups = Array.from(new Set(data.map((c) => c.group_name)))
  return groups
}

export async function createContact(input: ContactInput) {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    throw new Error('未登录')
  }

  const { error } = await supabase.from('contacts').insert({
    user_id: user.user.id,
    name: input.name,
    email: input.email,
    group_name: input.group_name || '默认分组',
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function updateContact(id: string, input: ContactInput) {
  const supabase = createClient()

  const { error } = await supabase
    .from('contacts')
    .update({
      name: input.name,
      email: input.email,
      group_name: input.group_name || '默认分组',
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function deleteContact(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from('contacts').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function bulkImportContacts(contacts: ContactInput[]) {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    throw new Error('未登录')
  }

  const records = contacts.map((c) => ({
    user_id: user.user.id,
    name: c.name,
    email: c.email,
    group_name: c.group_name || '默认分组',
  }))

  const { error } = await supabase.from('contacts').insert(records)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/contacts')
  return { success: true, count: contacts.length }
}
