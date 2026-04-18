'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createContact, updateContact, type ContactInput } from '@/actions/contact-actions'
import { Save, Loader2 } from 'lucide-react'

interface ContactFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: any
  onSuccess: () => void
}

export function ContactForm({ open, onOpenChange, contact, onSuccess }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [groupName, setGroupName] = useState('默认分组')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (contact) {
      setName(contact.name)
      setEmail(contact.email)
      setGroupName(contact.group_name || '默认分组')
    } else {
      setName('')
      setEmail('')
      setGroupName('默认分组')
    }
  }, [contact, open])

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      alert('请填写所有必填字段')
      return
    }

    setLoading(true)
    try {
      const input: ContactInput = { name, email, group_name: groupName }

      if (contact) {
        await updateContact(contact.id, input)
      } else {
        await createContact(input)
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      alert(`操作失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={contact ? '编辑联系人' : '添加联系人'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
              姓名 *
            </label>
            <Input
              id="contactName"
              placeholder="输入联系人姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱 *
            </label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="contactGroup" className="block text-sm font-medium text-gray-700 mb-2">
              分组
            </label>
            <Input
              id="contactGroup"
              placeholder="输入分组名称"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
