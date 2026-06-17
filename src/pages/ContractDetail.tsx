import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Copy,
  Check,
  Link as LinkIcon,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  FolderKanban,
  ChevronRight,
  ExternalLink,
  Printer,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import {
  Modal,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

interface PaymentTermDetail {
  id: string
  description: string
  amount: number
  status: 'pending' | 'invoiced' | 'paid' | 'overdue'
  dueDate: string
  paidAmount: number
  paidDate?: string
  invoiceStatus: 'uninvoiced' | 'invoiced' | 'partial_invoiced'
  invoiceAmount?: number
  invoiceDate?: string
  invoiceNo?: string
}

interface ContractDetailData {
  id: string
  clientId: string
  contractNo: string
  name: string
  title: string
  amount: number
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled'
  description: string
  startDate: string
  endDate: string
  confirmToken: string
  confirmedAt?: string
  createdAt: string
  client?: {
    id: string
    name: string
    contactPerson: string
    phone: string
    email: string
    address: string
  }
  paymentTerms?: PaymentTermDetail[]
  projects?: Array<{
    id: string
    name: string
    status: string
    progress: number
  }>
  totalPaid?: number
  remainingAmount?: number
}

const statusMap: Record<string, 'active' | 'pending' | 'completed' | 'cancelled' | 'overdue' | 'paused'> = {
  draft: 'pending',
  pending: 'pending',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
  terminated: 'cancelled',
}

export default function ContractDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { projects, paymentTerms, fetchPaymentTerms, updatePaymentTermInvoice } = useStore()
  const [contract, setContract] = useState<ContractDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<PaymentTermDetail | null>(null)
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceStatus: 'uninvoiced' as 'uninvoiced' | 'invoiced' | 'partial_invoiced',
    invoiceAmount: '',
    invoiceDate: '',
    invoiceNo: '',
  })

  useEffect(() => {
    const fetchContract = async () => {
      if (!id) return
      try {
        const res = await fetch(`/api/contracts/${id}`)
        if (!res.ok) throw new Error('获取合同详情失败')
        const result = await res.json()
        setContract(result.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchContract()
    fetchPaymentTerms()
  }, [id, fetchPaymentTerms])

  const relatedProjects = projects.filter((p) => p.contractId === id)

  const generateConfirmLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/contracts/confirm/${contract?.confirmToken}`
  }

  const copyConfirmLink = async () => {
    const link = generateConfirmLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败', error)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待支付', className: 'bg-amber-100 text-amber-700' },
      invoiced: { label: '已开票', className: 'bg-blue-100 text-blue-700' },
      paid: { label: '已支付', className: 'bg-forest-100 text-forest-700' },
      overdue: { label: '已逾期', className: 'bg-red-100 text-red-700' },
    }
    return statusMap[status] || statusMap.pending
  }

  const getInvoiceStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      uninvoiced: { label: '未开票', className: 'bg-gray-100 text-gray-600' },
      invoiced: { label: '已开票', className: 'bg-blue-100 text-blue-700' },
      partial_invoiced: { label: '部分开票', className: 'bg-purple-100 text-purple-700' },
    }
    return statusMap[status] || statusMap.uninvoiced
  }

  const handleOpenInvoiceModal = (term: PaymentTermDetail) => {
    setSelectedTerm(term)
    setInvoiceForm({
      invoiceStatus: term.invoiceStatus || 'uninvoiced',
      invoiceAmount: term.invoiceAmount?.toString() || '',
      invoiceDate: term.invoiceDate || '',
      invoiceNo: term.invoiceNo || '',
    })
    setInvoiceModalOpen(true)
  }

  const handleSaveInvoice = async () => {
    if (!selectedTerm) return

    const data: {
      invoiceStatus?: 'uninvoiced' | 'invoiced' | 'partial_invoiced'
      invoiceAmount?: number
      invoiceDate?: string
      invoiceNo?: string
    } = {
      invoiceStatus: invoiceForm.invoiceStatus,
    }

    if (invoiceForm.invoiceAmount) {
      data.invoiceAmount = parseFloat(invoiceForm.invoiceAmount)
    }
    if (invoiceForm.invoiceDate) {
      data.invoiceDate = invoiceForm.invoiceDate
    }
    if (invoiceForm.invoiceNo) {
      data.invoiceNo = invoiceForm.invoiceNo
    }

    const success = await updatePaymentTermInvoice(selectedTerm.id, data)
    if (success) {
      setInvoiceModalOpen(false)
      setSelectedTerm(null)
    }
  }

  if (loading) {
    return (
      <Layout title="合同详情">
        <div className="flex items-center justify-center py-20">
          <div className="text-forest-500">加载中...</div>
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout title="合同详情">
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="mb-4 h-16 w-16 text-forest-300" />
          <p className="mb-4 text-forest-500">合同不存在</p>
          <Button variant="outline" onClick={() => navigate('/contracts')}>
            返回列表
          </Button>
        </div>
      </Layout>
    )
  }

  const totalPaid = contract.totalPaid || 0
  const remainingAmount = contract.remainingAmount || contract.amount - totalPaid
  const paidPercentage = contract.amount > 0 ? Math.round((totalPaid / contract.amount) * 100) : 0

  const contractPaymentTerms = paymentTerms
    .filter((t) => t.contractId === id)
    .sort((a, b) => a.termNo - b.termNo)

  return (
    <Layout title="合同详情">
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Button variant="ghost" onClick={() => navigate('/contracts')}>
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Button>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              打印
            </Button>
            <Button variant="outline" onClick={() => navigate(`/contracts/${id}/edit`)}>
              <Edit className="h-4 w-4" />
              编辑
            </Button>
            {contract.status === 'draft' && (
              <Button onClick={copyConfirmLink}>
                <ExternalLink className="h-4 w-4" />
                发送确认
              </Button>
            )}
            <Button variant="outline" onClick={copyConfirmLink}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制链接
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-5 w-5 text-forest-600" />
                    {contract.title || contract.name}
                  </CardTitle>
                  <p className="text-sm text-forest-500">
                    合同编号：{contract.contractNo}
                  </p>
                </div>
                <StatusBadge
                  status={statusMap[contract.status] || 'pending'}
                  category="contract"
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100">
                      <Building2 className="h-4 w-4 text-forest-600" />
                    </div>
                    <div>
                      <p className="text-xs text-forest-500">客户</p>
                      <p className="font-medium text-forest-900">
                        {contract.client?.name || '未关联客户'}
                      </p>
                      {contract.client?.contactPerson && (
                        <p className="text-sm text-forest-500">
                          {contract.client.contactPerson} · {contract.client.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100">
                      <DollarSign className="h-4 w-4 text-forest-600" />
                    </div>
                    <div>
                      <p className="text-xs text-forest-500">合同金额</p>
                      <p className="text-xl font-semibold text-forest-900">
                        {formatCurrency(contract.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100">
                      <Calendar className="h-4 w-4 text-forest-600" />
                    </div>
                    <div>
                      <p className="text-xs text-forest-500">合同期限</p>
                      <p className="font-medium text-forest-900">
                        {contract.startDate && contract.endDate
                          ? `${formatDate(contract.startDate, 'date')} 至 ${formatDate(contract.endDate, 'date')}`
                          : '未设置'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100">
                      <Calendar className="h-4 w-4 text-forest-600" />
                    </div>
                    <div>
                      <p className="text-xs text-forest-500">创建时间</p>
                      <p className="font-medium text-forest-900">
                        {formatDate(contract.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-forest-50 p-4">
                  <p className="mb-2 text-sm font-medium text-forest-700">收款进度</p>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-forest-600">
                      已收款：{formatCurrency(totalPaid)}
                    </span>
                    <span className="text-sm text-forest-600">
                      待收款：{formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-forest-200">
                    <div
                      className="h-full rounded-full bg-forest-600 transition-all"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-xs text-forest-500">
                    {paidPercentage}%
                  </p>
                </div>

                {contract.description && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-forest-700">服务内容</p>
                    <p className="whitespace-pre-wrap rounded-lg bg-forest-50/50 p-4 text-sm text-forest-700">
                      {contract.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-forest-600" />
                  付款节点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractPaymentTerms.map((term, index) => {
                    const badge = getPaymentStatusBadge(term.status)
                    const invoiceBadge = getInvoiceStatusBadge(term.invoiceStatus || 'uninvoiced')
                    return (
                      <div
                        key={term.id}
                        className="flex items-center justify-between rounded-lg border border-forest-200 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                              term.status === 'paid'
                                ? 'bg-forest-100 text-forest-700'
                                : 'bg-forest-100 text-forest-500'
                            )}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-forest-900">
                              {term.description}
                            </p>
                            {term.dueDate && (
                              <p className="text-xs text-forest-500">
                                到期日期：{formatDate(term.dueDate, 'date')}
                              </p>
                            )}
                            {term.invoiceNo && (
                              <p className="text-xs text-forest-500">
                                发票号：{term.invoiceNo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-forest-900">
                              {formatCurrency(term.amount)}
                            </p>
                            {term.paidAmount > 0 && (
                              <p className="text-xs text-forest-500">
                                已付：{formatCurrency(term.paidAmount)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge className={badge.className}>{badge.label}</Badge>
                            <button
                              onClick={() => handleOpenInvoiceModal(term)}
                              className="flex items-center gap-1 text-xs text-forest-500 hover:text-forest-700"
                            >
                              <Badge className={`${invoiceBadge.className} cursor-pointer`}>
                                {invoiceBadge.label}
                              </Badge>
                              <Edit className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-forest-600" />
                  关联项目
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/projects')}
                >
                  查看全部
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {relatedProjects.length === 0 ? (
                  <div className="py-8 text-center text-sm text-forest-500">
                    暂无关联项目
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatedProjects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="flex items-center justify-between rounded-lg border border-forest-200 p-4 transition-colors hover:bg-forest-50"
                      >
                        <div>
                          <p className="font-medium text-forest-900">
                            {project.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-forest-100">
                              <div
                                className="h-full rounded-full bg-forest-500"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-forest-500">
                              {project.progress}%
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-forest-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-forest-600" />
                  客户确认链接
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-forest-600">
                  将此链接发送给客户，客户可在线查看并确认合同。
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateConfirmLink()}
                    className="flex-1 truncate rounded-lg border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-700"
                  />
                  <Button variant="outline" size="icon" onClick={copyConfirmLink}>
                    {copied ? (
                      <Check className="h-4 w-4 text-forest-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button className="w-full" onClick={copyConfirmLink}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制链接
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制确认链接
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-forest-600" />
                  合同预览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="mx-auto aspect-[1/1.414] w-full overflow-hidden rounded-sm border border-forest-200 bg-white shadow-lg"
                  style={{ maxHeight: '500px' }}
                >
                  <div className="h-full overflow-y-auto p-6 text-left">
                    <div className="text-center">
                      <h1 className="text-lg font-bold text-forest-900">
                        服务合同
                      </h1>
                      <p className="mt-1 text-xs text-forest-500">
                        合同编号：{contract.contractNo}
                      </p>
                    </div>
                    <div className="my-4 border-t border-forest-200" />
                    <div className="space-y-3 text-xs leading-relaxed text-forest-800">
                      <p>
                        <span className="font-medium">甲方（客户）：</span>
                        {contract.client?.name || '________'}
                      </p>
                      <p>
                        <span className="font-medium">乙方（服务商）：</span>
                        ____________________
                      </p>
                      <p className="pt-2">
                        甲乙双方本着平等自愿、诚实信用的原则，经友好协商，
                        就甲方委托乙方提供相关服务事宜达成如下协议：
                      </p>
                      <div>
                        <p className="font-medium">第一条 服务内容</p>
                        <p className="whitespace-pre-wrap pl-4">
                          {contract.description || '详见附件'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">第二条 合同金额</p>
                        <p className="pl-4">
                          本合同总金额为人民币：
                          <span className="font-semibold">
                            {formatCurrency(contract.amount)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">第三条 付款方式</p>
                        <div className="pl-4">
                          {contractPaymentTerms.map((term, i) => (
                            <p key={term.id}>
                              {i + 1}. {term.description}：
                              {formatCurrency(term.amount)}
                              （{Math.round((term.amount / contract.amount) * 100)}%）
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">第四条 合同期限</p>
                        <p className="pl-4">
                          {contract.startDate && contract.endDate
                            ? `自 ${formatDate(contract.startDate, 'date')} 起至 ${formatDate(contract.endDate, 'date')} 止`
                            : '双方另行约定'}
                        </p>
                      </div>
                      <div className="pt-4">
                        <p>本合同一式两份，甲乙双方各执一份，具有同等法律效力。</p>
                      </div>
                      <div className="mt-8 grid grid-cols-2 gap-8">
                        <div>
                          <p className="font-medium">甲方（盖章）：</p>
                          <p className="mt-8">日期：____________</p>
                        </div>
                        <div>
                          <p className="font-medium">乙方（盖章）：</p>
                          <p className="mt-8">日期：____________</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false)
          setSelectedTerm(null)
        }}
        title="开票信息"
        description={selectedTerm?.description}
      >
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">
                开票状态
              </label>
              <select
                value={invoiceForm.invoiceStatus}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({
                    ...prev,
                    invoiceStatus: e.target.value as 'uninvoiced' | 'invoiced' | 'partial_invoiced',
                  }))
                }
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm text-forest-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              >
                <option value="uninvoiced">未开票</option>
                <option value="invoiced">已开票</option>
                <option value="partial_invoiced">部分开票</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">
                开票金额
              </label>
              <input
                type="number"
                value={invoiceForm.invoiceAmount}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({
                    ...prev,
                    invoiceAmount: e.target.value,
                  }))
                }
                placeholder="请输入开票金额"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm text-forest-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">
                开票日期
              </label>
              <input
                type="date"
                value={invoiceForm.invoiceDate}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({
                    ...prev,
                    invoiceDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm text-forest-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">
                发票号码
              </label>
              <input
                type="text"
                value={invoiceForm.invoiceNo}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({
                    ...prev,
                    invoiceNo: e.target.value,
                  }))
                }
                placeholder="请输入发票号码"
                className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm text-forest-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setInvoiceModalOpen(false)
              setSelectedTerm(null)
            }}
          >
            取消
          </Button>
          <Button variant="default" onClick={handleSaveInvoice}>
            保存
          </Button>
        </ModalFooter>
      </Modal>
    </Layout>
  )
}
