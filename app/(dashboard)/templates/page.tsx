'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTemplates, deleteTemplate } from '@/actions/template-actions'
import { formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, Loader2, FileText } from 'lucide-react'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data || [])
    } catch (error) {
      console.error('加载模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除此模板吗？')) return

    try {
      await deleteTemplate(id)
      await loadTemplates()
    } catch (error: any) {
      alert(`删除失败: ${error.message}`)
    }
  }

  function getFilteredTemplates() {
    if (!searchTerm) return templates

    const term = searchTerm.toLowerCase()
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term) ||
        (t.category && t.category.toLowerCase().includes(term))
    )
  }

  const filteredTemplates = getFilteredTemplates()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
          <p className="text-gray-600 mt-1">管理您的邮件模板</p>
        </div>
        <Button onClick={() => window.location.href = '/compose'}>
          <Plus className="mr-2 h-4 w-4" />
          新建模板
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <Input
          placeholder="搜索模板名称、主题或分类..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* 模板列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg border">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">暂无模板</p>
          <Button
            variant="link"
            onClick={() => (window.location.href = '/compose')}
            className="mt-2"
          >
            在写信页面创建第一个模板
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate flex-1">
                  {template.name}
                </h3>
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // 可以将模板内容复制到剪贴板或跳转到编辑页
                      navigator.clipboard.writeText(template.content)
                      alert('模板内容已复制到剪贴板')
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">主题:</span> {template.subject}
              </p>

              {template.category && (
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mb-3">
                  {template.category}
                </span>
              )}

              <div className="pt-3 border-t text-xs text-gray-500">
                创建于 {formatDate(template.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTemplates.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          共 {filteredTemplates.length} 个模板
        </div>
      )}
    </div>
  )
}
