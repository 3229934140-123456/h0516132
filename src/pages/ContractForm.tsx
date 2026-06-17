import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Building2,
  FileText,
  Package,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

interface PaymentTermForm {
  id: string
  description: string
  percentage: number
  amount: number
  dueDate: string
}

export default function ContractForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { clients, contracts } = useStore()

  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [serviceContent, setServiceContent] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermForm[]>([])
  const [error, setError] = useState('')

  const defaultTerms = useMemo<PaymentTermForm[]>(
    () => [
      {
        id: crypto.randomUUID(),
        description: '定金',
        percentage: 30,
        amount: 0,
        dueDate: '',
      },
      {
        id: crypto.randomUUID(),
        description: '验收款',
        percentage: 50,
        amount: 0,
        dueDate: '',
      },
      {
        id: crypto.randomUUID(),
        description: '尾款',
        percentage: 20,
        amount: 0,
        dueDate: '',
      },
    ],
    []
  )

  useEffect(() => {
    if (isEdit) {
      const contract = contracts.find((c) => c.id === id)
      if (contract) {
        setClientId(contract.clientId)
        setTitle(contract.name)
        setTotalAmount(contract.amount)
        setStartDate(contract.startDate)
        setEndDate(contract.endDate)
        setPaymentTerms(defaultTerms)
      }
    } else {
      setPaymentTerms(defaultTerms)
    }
  }, [isEdit, id, contracts, defaultTerms])

  useEffect(() => {
    setPaymentTerms((prev) =>
      prev.map((term) => ({
        ...term,
        amount: Math.round((totalAmount * term.percentage) / 100),
      }))
    )
  }, [totalAmount])

  const totalPercentage = paymentTerms.reduce((sum, t) => sum + t.percentage, 0)
  const totalTermsAmount = paymentTerms.reduce((sum, t) => sum + t.amount, 0)

  const addPaymentTerm = () => {
    setPaymentTerms((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: '新增节点',
        percentage: 0,
        amount: 0,
        dueDate: '',
      },
    ])
  }

  const removePaymentTerm = (termId: string) => {
    if (paymentTerms.length <= 1) return
    setPaymentTerms((prev) => prev.filter((t) => t.id !== termId))
  }

  const updatePaymentTerm = (
    termId: string,
    field: keyof PaymentTermForm,
    value: string | number
  ) => {
    setPaymentTerms((prev) =>
      prev.map((t) => {
        if (t.id !== termId) return t
        const updated = { ...t, [field]: value }
        if (field === 'percentage') {
          updated.amount = Math.round((totalAmount * Number(value)) / 100)
        } else if (field === 'amount') {
          updated.percentage =
            totalAmount > 0 ? Math.round((Number(value) / totalAmount) * 100) : 0
        }
        return updated
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!clientId) {
      setError('请选择客户')
      return
    }
    if (!title.trim()) {
      setError('请输入合同标题')
      return
    }
    if (totalAmount <= 0) {
      setError('合同金额必须大于0')
      return
    }
    if (totalPercentage !== 100) {
      setError(`付款节点比例总和必须为100%，当前为${totalPercentage}%`)
      return
    }

    const contractData = {
      clientId,
      contractNo: `HT-${Date.now()}`,
      name: title,
      title,
      amount: totalAmount,
      status: isEdit ? undefined : ('draft' as const),
      description: serviceContent,
      deliverables,
      startDate,
      endDate,
      signedDate: startDate,
    }

    try {
      const url = isEdit ? `/api/contracts/${id}` : '/api/contracts'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }

      navigate('/contracts')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  const inputClass = cn(
    'w-full rounded-lg border border-forest-200 bg-white px-3 py-2 text-sm text-forest-900',
    'placeholder:text-forest-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20'
  )

  const labelClass = 'mb-1.5 block text-sm font-medium text-forest-700'

  return (
    <Layout title={isEdit ? '编辑合同' : '新建合同'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/contracts')}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/contracts')}
            >
              取消
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              {isEdit ? '保存修改' : '创建合同'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-forest-600" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <Building2 className="mr-1 inline h-4 w-4" />
                    客户 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">请选择客户</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    合同标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="请输入合同标题"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      <Calendar className="mr-1 inline h-4 w-4" />
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Calendar className="mr-1 inline h-4 w-4" />
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>服务内容</label>
                  <textarea
                    value={serviceContent}
                    onChange={(e) => setServiceContent(e.target.value)}
                    placeholder="请输入服务内容描述"
                    rows={4}
                    className={cn(inputClass, 'resize-none')}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <Package className="mr-1 inline h-4 w-4" />
                    交付物
                  </label>
                  <textarea
                    value={deliverables}
                    onChange={(e) => setDeliverables(e.target.value)}
                    placeholder="请输入交付物清单，每行一项"
                    rows={3}
                    className={cn(inputClass, 'resize-none')}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-forest-600" />
                  付款节点
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentTerm}
                >
                  <Plus className="h-4 w-4" />
                  添加节点
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentTerms.map((term, index) => (
                  <div
                    key={term.id}
                    className="rounded-lg border border-forest-200 bg-forest-50/50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium text-forest-700">
                        节点 {index + 1}
                      </span>
                      {paymentTerms.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePaymentTerm(term.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-4">
                        <label className="mb-1 block text-xs text-forest-500">
                          节点描述
                        </label>
                        <input
                          type="text"
                          value={term.description}
                          onChange={(e) =>
                            updatePaymentTerm(term.id, 'description', e.target.value)
                          }
                          className={inputClass}
                          placeholder="如：定金"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs text-forest-500">
                          比例 (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={term.percentage}
                          onChange={(e) =>
                            updatePaymentTerm(
                              term.id,
                              'percentage',
                              Number(e.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs text-forest-500">
                          金额 (元)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={term.amount}
                          onChange={(e) =>
                            updatePaymentTerm(term.id, 'amount', Number(e.target.value))
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-forest-500">
                          到期日期
                        </label>
                        <input
                          type="date"
                          value={term.dueDate}
                          onChange={(e) =>
                            updatePaymentTerm(term.id, 'dueDate', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-lg border border-forest-200 bg-white px-4 py-3">
                  <div className="text-sm text-forest-600">
                    <span className="mr-6">
                      比例合计：
                      <span
                        className={cn(
                          'font-semibold',
                          totalPercentage === 100
                            ? 'text-forest-700'
                            : 'text-red-600'
                        )}
                      >
                        {totalPercentage}%
                      </span>
                    </span>
                    <span>
                      金额合计：
                      <span className="font-semibold text-forest-700">
                        {formatCurrency(totalTermsAmount)}
                      </span>
                    </span>
                  </div>
                  {totalPercentage !== 100 && (
                    <span className="text-xs text-red-500">
                      比例必须等于100%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-forest-600" />
                  合同金额
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>
                    总金额 (元) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    placeholder="请输入合同总金额"
                    className={cn(inputClass, 'text-lg font-semibold')}
                  />
                </div>
                <div className="rounded-lg bg-forest-50 p-4">
                  <div className="mb-2 text-sm text-forest-500">金额大写</div>
                  <div className="text-base font-medium text-forest-800">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Layout>
  )
}
