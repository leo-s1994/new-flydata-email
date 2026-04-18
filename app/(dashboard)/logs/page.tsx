'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { getSendLogs } from '@/actions/email-actions'
import { exportToCSV } from '@/lib/utils'
import { Download, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const filters: any = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }
      if (startDate) {
        filters.startDate = startDate
      }
      if (endDate) {
        filters.endDate = endDate + 'T23:59:59'
      }

      const data = await getSendLogs(filters)
      setLogs(data || [])
    } catch (error) {
      console.error('加载日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    exportToCSV(logs, `send_logs_${new Date().toISOString().split('T')[0]}.csv`)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="mr-1 h-3 w-3" />
            成功
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <XCircle className="mr-1 h-3 w-3" />
            失败
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            待发送
          </span>
        )
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">发送日志</h1>
        <p className="text-gray-600 mt-1">查看邮件发送历史记录</p>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">日期范围:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-gray-400">至</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex-1" />

          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLogs}>
              刷新
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={logs.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </div>
        </div>
      </div>

      {/* 日志表格 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无发送记录</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>收件人</TableHead>
                <TableHead>主题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发送时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.email}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-gray-500 whitespace-nowrap">
                    {new Date(log.sent_at).toLocaleString('zh-CN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 统计信息 */}
      {!loading && logs.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-sm text-gray-500">总记录数</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter((l) => l.status === 'success').length}
            </div>
            <div className="text-sm text-gray-500">成功</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter((l) => l.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-500">失败</div>
          </div>
        </div>
      )}
    </div>
  )
}
