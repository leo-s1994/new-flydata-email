'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { bulkImportContacts } from '@/actions/contact-actions'
import Papa from 'papaparse'
import { Upload, Loader2, FileText } from 'lucide-react'

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // 解析CSV预览
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        setPreview(data.slice(0, 5)) // 只显示前5条预览
      },
    })
  }

  async function handleImport() {
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()

      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      })

      const contacts = result.data.map((row: any) => ({
        name: row['姓名'] || row['name'] || row['Name'] || '',
        email: row['邮箱'] || row['email'] || row['Email'] || '',
        group_name: row['分组'] || row['group'] || row['Group'] || '默认分组',
      })).filter((c: any) => c.name && c.email)

      if (contacts.length === 0) {
        alert('未找到有效的联系人数据，请确保CSV包含"姓名"和"邮箱"列')
        setLoading(false)
        return
      }

      await bulkImportContacts(contacts)
      onSuccess()
      onOpenChange(false)
      setFile(null)
      setPreview([])
    } catch (error: any) {
      alert(`导入失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="导入联系人">
        <div className="space-y-4">
          {/* 文件上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择CSV文件
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csvInput"
              />
              <label htmlFor="csvInput" className="cursor-pointer">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  点击选择CSV文件或拖拽到此处
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CSV应包含"姓名"和"邮箱"列
                </p>
              </label>
            </div>
            {file && (
              <p className="mt-2 text-sm text-green-600">
                已选择: {file.name}
              </p>
            )}
          </div>

          {/* 预览 */}
          {preview.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预览（前5条）
              </label>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">姓名</th>
                      <th className="px-3 py-2 text-left">邮箱</th>
                      <th className="px-3 py-2 text-left">分组</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{row['姓名'] || row['name'] || row['Name']}</td>
                        <td className="px-3 py-2">{row['邮箱'] || row['email'] || row['Email']}</td>
                        <td className="px-3 py-2">
                          {row['分组'] || row['group'] || row['Group'] || '默认分组'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                开始导入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
