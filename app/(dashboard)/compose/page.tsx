'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SendModal } from '@/components/email/SendModal'
import { SaveTemplateDialog } from '@/components/templates/SaveTemplateDialog'
import { getConfig } from '@/actions/config-actions'
import { getTemplates } from '@/actions/template-actions'
import { Mail, Save, Loader2, AlertCircle } from 'lucide-react'

// 动态导入编辑器，禁用SSR
const EmailEditor = dynamic(() => import('@/components/editor/EmailEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function ComposePage() {
  const { user } = useAuth()
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [hasConfig, setHasConfig] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      const [config, templatesData] = await Promise.all([
        getConfig(),
        getTemplates(),
      ])
      setHasConfig(config.hasConfig)
      setTemplates(templatesData || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTemplate = () => {
    const template = templates.find((t) => t.id === selectedTemplate)
    if (template) {
      setSubject(template.subject)
      setContent(template.content)
    }
  }

  const handleSendClick = () => {
    if (!subject.trim()) {
      alert('请输入邮件主题')
      return
    }
    if (!content.trim()) {
      alert('请输入邮件内容')
      return
    }
    if (!hasConfig) {
      alert('请先在设置页面配置阿里云信息')
      return
    }
    setShowSendModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">写信</h1>
        <p className="text-gray-600 mt-1">编写并发送邮件给您的联系人</p>
      </div>

      {!hasConfig && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">未配置阿里云信息</p>
            <p className="text-sm text-yellow-700 mt-1">
              请先前往{' '}
              <a href="/settings" className="underline font-medium">
                设置页面
              </a>{' '}
              配置阿里云AccessKey等信息后才能发送邮件。
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* 模板选择 */}
        {templates.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">加载模板:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">选择模板...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadTemplate}
              disabled={!selectedTemplate}
            >
              加载
            </Button>
          </div>
        )}

        {/* 主题输入 */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            邮件主题
          </label>
          <Input
            id="subject"
            placeholder="请输入邮件主题"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full"
          />
        </div>

        {/* 富文本编辑器 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮件内容
          </label>
          <EmailEditor
            initialContent={content}
            onChange={setContent}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSaveTemplateDialog(true)}
            disabled={!subject.trim() || !content.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            保存为模板
          </Button>

          <Button
            type="button"
            onClick={handleSendClick}
            disabled={!subject.trim() || !content.trim() || !hasConfig}
          >
            <Mail className="mr-2 h-4 w-4" />
            发送邮件
          </Button>
        </div>
      </div>

      {/* 发送确认弹窗 */}
      <SendModal
        open={showSendModal}
        onOpenChange={setShowSendModal}
        subject={subject}
        content={content}
      />

      {/* 保存模板弹窗 */}
      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        subject={subject}
        content={content}
      />
    </div>
  )
}
