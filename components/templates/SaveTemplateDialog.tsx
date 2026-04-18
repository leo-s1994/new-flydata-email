'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTemplate } from '@/actions/template-actions'
import { Save, Loader2 } from 'lucide-react'

interface SaveTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  content: string
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  subject,
  content,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      alert('请输入模板名称')
      return
    }

    setLoading(true)
    try {
      await createTemplate({
        name,
        subject,
        content,
        category: category || undefined,
      })
      onOpenChange(false)
      setName('')
      setCategory('')
      alert('模板保存成功')
    } catch (error: any) {
      alert(`保存失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="保存为模板">
        <div className="space-y-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
              模板名称 *
            </label>
            <Input
              id="templateName"
              placeholder="输入模板名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="templateCategory" className="block text-sm font-medium text-gray-700 mb-2">
              分类（可选）
            </label>
            <Input
              id="templateCategory"
              placeholder="例如: 营销邮件、通知等"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <strong>主题:</strong> {subject}
            </p>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              <strong>内容预览:</strong> {content.replace(/<[^>]*>/g, '').slice(0, 100)}...
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存模板
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
