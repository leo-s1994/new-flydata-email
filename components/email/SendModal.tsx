'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getContacts, getContactGroups } from '@/actions/contact-actions'
import { sendBulkEmail } from '@/actions/email-actions'
import { Users, Send, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface SendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  content: string
}

export function SendModal({ open, onOpenChange, subject, content }: SendModalProps) {
  const [sendType, setSendType] = useState<'all' | 'group' | 'custom'>('all')
  const [groups, setGroups] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [customEmails, setCustomEmails] = useState('')
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null)

  useEffect(() => {
    if (open) {
      loadContacts()
      setResult(null)
      setSendType('all')
      setSelectedGroup('')
      setCustomEmails('')
    }
  }, [open])

  async function loadContacts() {
    setLoading(true)
    try {
      const [contactsData, groupsData] = await Promise.all([
        getContacts(),
        getContactGroups(),
      ])
      setContacts(contactsData || [])
      setGroups(groupsData || [])
    } catch (error) {
      console.error('加载联系人失败:', error)
    } finally {
      setLoading(false)
    }
  }

  function getRecipients(): string[] {
    switch (sendType) {
      case 'all':
        return contacts.map((c) => c.email)
      case 'group':
        return contacts.filter((c) => c.group_name === selectedGroup).map((c) => c.email)
      case 'custom':
        return customEmails
          .split(/[\n,;]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      default:
        return []
    }
  }

  const recipientCount = getRecipients().length

  async function handleSend() {
    const recipients = getRecipients()
    if (recipients.length === 0) {
      alert('请选择收件人')
      return
    }

    setSending(true)
    try {
      const data = await sendBulkEmail({
        recipients,
        subject,
        content,
      })
      setResult({
        success: data.successCount,
        failed: data.failedCount,
        total: data.total,
      })
    } catch (error: any) {
      alert(`发送失败: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="发送邮件" className="max-w-2xl">
        {result ? (
          <div className="text-center py-8">
            {result.failed === 0 ? (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
            <h3 className="mt-4 text-lg font-semibold">发送完成</h3>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-gray-500">总数</div>
              </div>
              <div className="text-center text-green-600">
                <div className="text-2xl font-bold">{result.success}</div>
                <div className="text-sm">成功</div>
              </div>
              <div className="text-center text-red-600">
                <div className="text-2xl font-bold">{result.failed}</div>
                <div className="text-sm">失败</div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={() => onOpenChange(false)}>关闭</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {/* 收件人选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择收件人
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendType"
                      value="all"
                      checked={sendType === 'all'}
                      onChange={(e) => setSendType(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>全部联系人 ({contacts.length}人)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendType"
                      value="group"
                      checked={sendType === 'group'}
                      onChange={(e) => setSendType(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>指定分组</span>
                    {sendType === 'group' && (
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="ml-3 px-3 py-1 border rounded text-sm"
                      >
                        <option value="">选择分组...</option>
                        {groups.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      name="sendType"
                      value="custom"
                      checked={sendType === 'custom'}
                      onChange={(e) => setSendType(e.target.value as any)}
                      className="mr-2 mt-1"
                    />
                    <div className="flex-1">
                      <span>自定义邮箱列表</span>
                      {sendType === 'custom' && (
                        <textarea
                          value={customEmails}
                          onChange={(e) => setCustomEmails(e.target.value)}
                          placeholder="每行一个邮箱，或用逗号/分号分隔"
                          className="mt-2 w-full px-3 py-2 border rounded-lg text-sm h-24"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* 预览信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>主题:</strong> {subject}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>收件人数:</strong>{' '}
                  <span className="text-primary font-medium">{recipientCount}</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                取消
              </Button>
              <Button onClick={handleSend} disabled={sending || recipientCount === 0}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    开始发送
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
