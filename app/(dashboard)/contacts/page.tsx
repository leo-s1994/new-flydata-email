'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ContactForm } from '@/components/contacts/ContactForm'
import { CSVImportDialog } from '@/components/contacts/CSVImportDialog'
import { getContacts, deleteContact } from '@/actions/contact-actions'
import { exportToCSV } from '@/lib/utils'
import { Plus, Upload, Download, Search, Edit, Trash2, Loader2 } from 'lucide-react'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    setLoading(true)
    try {
      const data = await getContacts()
      setContacts(data || [])
    } catch (error) {
      console.error('加载联系人失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除此联系人吗？')) return

    try {
      await deleteContact(id)
      await loadContacts()
    } catch (error: any) {
      alert(`删除失败: ${error.message}`)
    }
  }

  function handleEdit(contact: any) {
    setEditingContact(contact)
    setShowForm(true)
  }

  function handleExport() {
    const filtered = getFilteredContacts()
    exportToCSV(filtered, `contacts_${new Date().toISOString().split('T')[0]}.csv`)
  }

  function getFilteredContacts() {
    let filtered = contacts

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term)
      )
    }

    if (selectedGroup !== 'all') {
      filtered = filtered.filter((c) => c.group_name === selectedGroup)
    }

    return filtered
  }

  function getGroups() {
    return Array.from(new Set(contacts.map((c) => c.group_name)))
  }

  const filteredContacts = getFilteredContacts()
  const groups = getGroups()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">联系人管理</h1>
        <p className="text-gray-600 mt-1">管理您的邮件联系人列表</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索姓名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 分组筛选 */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">全部分组</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={filteredContacts.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
            <Button onClick={() => { setEditingContact(null); setShowForm(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              添加
            </Button>
          </div>
        </div>
      </div>

      {/* 联系人表格 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无联系人数据</p>
            <Button
              variant="link"
              onClick={() => { setEditingContact(null); setShowForm(true); }}
              className="mt-2"
            >
              添加第一个联系人
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>分组</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {contact.group_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 统计信息 */}
      {!loading && filteredContacts.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          共 {filteredContacts.length} 个联系人
        </div>
      )}

      {/* 联系表单弹窗 */}
      <ContactForm
        open={showForm}
        onOpenChange={setShowForm}
        contact={editingContact}
        onSuccess={loadContacts}
      />

      {/* CSV导入弹窗 */}
      <CSVImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={loadContacts}
      />
    </div>
  )
}
