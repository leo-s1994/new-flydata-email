'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getConfig, saveConfig, testConnection } from '@/actions/config-actions'
import { Save, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  const [formData, setFormData] = useState({
    access_key_id: '',
    access_key_secret: '',
    region: 'cn-hangzhou',
    from_address: '',
    from_alias: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    try {
      const config = await getConfig()
      if (config.hasConfig) {
        setFormData({
          access_key_id: config.access_key_id,
          access_key_secret: '', // 不显示已保存的secret
          region: config.region,
          from_address: config.from_address,
          from_alias: config.from_alias || '',
        })
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (
      !formData.access_key_id ||
      !formData.access_key_secret ||
      !formData.from_address
    ) {
      alert('请填写所有必填字段')
      return
    }

    setSaving(true)
    try {
      await saveConfig(formData)
      alert('配置保存成功')
      setTestResult(null)
    } catch (error: any) {
      alert(`保存失败: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testConnection()
      setTestResult(result)
    } catch (error: any) {
      setTestResult({ success: false, error: error.message })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">阿里云配置</h1>
        <p className="text-gray-600 mt-1">配置阿里云DirectMail邮件推送服务</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* AccessKey ID */}
        <div>
          <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700 mb-2">
            AccessKey ID *
          </label>
          <Input
            id="accessKeyId"
            placeholder="输入AccessKey ID"
            value={formData.access_key_id}
            onChange={(e) =>
              setFormData({ ...formData, access_key_id: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            在阿里云控制台获取AccessKey
          </p>
        </div>

        {/* AccessKey Secret */}
        <div>
          <label htmlFor="accessKeySecret" className="block text-sm font-medium text-gray-700 mb-2">
            AccessKey Secret *
          </label>
          <Input
            id="accessKeySecret"
            type="password"
            placeholder={formData.access_key_id ? '输入新的Secret（留空则不变）' : '输入AccessKey Secret'}
            value={formData.access_key_secret}
            onChange={(e) =>
              setFormData({ ...formData, access_key_secret: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Secret将被加密存储，不会明文显示
          </p>
        </div>

        {/* Region */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            区域 *
          </label>
          <select
            id="region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="cn-hangzhou">华东1（杭州）</option>
            <option value="ap-southeast-1">亚太东南1（新加坡）</option>
          </select>
        </div>

        {/* From Address */}
        <div>
          <label htmlFor="fromAddress" className="block text-sm font-medium text-gray-700 mb-2">
            发件人邮箱 *
          </label>
          <Input
            id="fromAddress"
            type="email"
            placeholder="例如: noreply@yourdomain.com"
            value={formData.from_address}
            onChange={(e) =>
              setFormData({ ...formData, from_address: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            需要在阿里云DirectMail中验证的发信域名
          </p>
        </div>

        {/* From Alias */}
        <div>
          <label htmlFor="fromAlias" className="block text-sm font-medium text-gray-700 mb-2">
            发件人名称
          </label>
          <Input
            id="fromAlias"
            placeholder="例如: Flydata通知"
            value={formData.from_alias}
            onChange={(e) =>
              setFormData({ ...formData, from_alias: e.target.value })
            }
          />
        </div>

        {/* 测试连接结果 */}
        {testResult && (
          <div
            className={`rounded-lg p-4 flex items-center gap-3 ${
              testResult.success
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span>
              {testResult.success
                ? '连接测试成功！'
                : `连接失败: ${testResult.error}`}
            </span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              '测试连接'
            )}
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 帮助信息 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">配置说明</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>在阿里云控制台创建AccessKey</li>
          <li>在DirectMail服务中验证发信域名</li>
          <li>确保发信域名DNS解析正确配置</li>
          <li>免费额度: 每日200封，每月1000封</li>
        </ol>
      </div>
    </div>
  )
}
