import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  CheckCircle2,
  Shield,
  Building2,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

interface PaymentTermDetail {
  id: string
  description: string
  amount: number
  status: string
  dueDate: string
}

interface ContractConfirmData {
  id: string
  clientId: string
  contractNo: string
  name: string
  title?: string
  amount: number
  status: string
  description: string
  startDate: string
  endDate: string
  confirmToken?: string
  confirmedAt?: string
  createdAt: string
  signedDate?: string
  client?: {
    id: string
    name: string
    contactPerson: string
    phone: string
    email: string
    address: string
  }
  paymentTerms?: PaymentTermDetail[]
}

export default function ContractConfirm() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const fetchContractByToken = useStore((s) => s.fetchContractByToken)
  const confirmContract = useStore((s) => s.confirmContract)

  const [contract, setContract] = useState<ContractConfirmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [showContract, setShowContract] = useState(true)

  useEffect(() => {
    const fetchContract = async () => {
      if (!token) return
      setLoading(true)
      setError('')
      try {
        const result = await fetchContractByToken(token)
        if (result) {
          setContract(result as unknown as ContractConfirmData)
          if (result.status === 'active' || result.status === 'completed') {
            setConfirmed(true)
          }
        } else {
          setError('合同不存在或链接无效')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    fetchContract()
  }, [token, fetchContractByToken])

  const handleConfirm = async () => {
    if (!agreed || !contract || !token) return
    setConfirming(true)
    setError('')
    try {
      const success = await confirmContract(token)
      if (success) {
        setConfirmed(true)
        if (contract.confirmedAt) {
          setContract({ ...contract, status: 'active', confirmedAt: contract.confirmedAt })
        }
      } else {
        throw new Error('确认失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认失败，请重试')
    } finally {
      setConfirming(false)
    }
  }

  const paymentTerms = contract?.paymentTerms || []

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
          <p className="text-forest-600">加载合同信息中...</p>
        </div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-forest-900">加载失败</h2>
          <p className="mb-6 text-forest-600">{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 p-6">
        <div className="w-full max-w-md text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-forest-300" />
          <h2 className="mb-2 text-xl font-semibold text-forest-900">合同不存在</h2>
          <p className="mb-6 text-forest-600">该合同可能已被删除或链接无效</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100 py-8 px-4 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <FileText className="h-8 w-8 text-forest-600" />
          </div>
          <h1 className="text-2xl font-bold text-forest-900 sm:text-3xl">
            合同确认
          </h1>
          <p className="mt-2 text-sm text-forest-500">
            请仔细阅读以下合同内容，确认无误后签署
          </p>
        </div>

        {confirmed ? (
          <div className="rounded-2xl border border-forest-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-100">
              <CheckCircle2 className="h-10 w-10 text-forest-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-forest-900">
              合同已确认
            </h2>
            <p className="mb-6 text-forest-600">
              感谢您的确认，合同已于 {formatDate(contract.confirmedAt || new Date().toISOString())} 生效。
              我们将尽快开始为您提供服务。
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setShowContract(!showContract)}>
                {showContract ? '隐藏合同' : '查看合同'}
              </Button>
              <Button onClick={() => navigate('/')}>返回首页</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-forest-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-forest-100 pb-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-forest-900">
                    {contract.title || contract.name}
                  </h2>
                  <p className="mt-1 text-sm text-forest-500">
                    合同编号：{contract.contractNo}
                  </p>
                </div>
                <Badge variant="amber" className="shrink-0">
                  <Shield className="mr-1 h-3.5 w-3.5" />
                  待确认
                </Badge>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-100">
                    <Building2 className="h-5 w-5 text-forest-600" />
                  </div>
                  <div>
                    <p className="text-xs text-forest-500">客户</p>
                    <p className="font-medium text-forest-900">
                      {contract.client?.name || '未指定'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-100">
                    <DollarSign className="h-5 w-5 text-forest-600" />
                  </div>
                  <div>
                    <p className="text-xs text-forest-500">合同金额</p>
                    <p className="font-semibold text-forest-900">
                      {formatCurrency(contract.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-100">
                    <Calendar className="h-5 w-5 text-forest-600" />
                  </div>
                  <div>
                    <p className="text-xs text-forest-500">期限</p>
                    <p className="font-medium text-forest-900">
                      {contract.startDate && contract.endDate
                        ? `${formatDate(contract.startDate, 'date')} 至 ${formatDate(contract.endDate, 'date')}`
                        : '未设置'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-forest-200 bg-white shadow-sm">
              <button
                onClick={() => setShowContract(!showContract)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <h3 className="flex items-center gap-2 font-semibold text-forest-900">
                  <FileText className="h-5 w-5 text-forest-600" />
                  合同详细内容
                </h3>
                {showContract ? (
                  <ChevronUp className="h-5 w-5 text-forest-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-forest-400" />
                )}
              </button>
              {showContract && (
                <div className="border-t border-forest-100 p-6 pt-0">
                  <div
                    className="mx-auto w-full max-w-2xl overflow-hidden rounded-sm border border-forest-200 bg-white shadow-md"
                    style={{ aspectRatio: '1 / 1.414' }}
                  >
                    <div className="h-full overflow-y-auto p-8 sm:p-10 text-left">
                      <div className="text-center">
                        <h1 className="text-xl font-bold text-forest-900 sm:text-2xl">
                          服务合同
                        </h1>
                        <p className="mt-2 text-sm text-forest-500">
                          合同编号：{contract.contractNo}
                        </p>
                      </div>
                      <div className="my-6 border-t border-forest-200" />
                      <div className="space-y-4 text-sm leading-relaxed text-forest-800 sm:text-base">
                        <p>
                          <span className="font-medium">甲方（客户）：</span>
                          {contract.client?.name || '________'}
                        </p>
                        {contract.client?.contactPerson && (
                          <p>
                            <span className="font-medium">联系人：</span>
                            {contract.client.contactPerson}
                            {contract.client.phone && `（${contract.client.phone}）`}
                          </p>
                        )}
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
                            {contract.description || '详见附件，双方另行约定。'}
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
                            {paymentTerms.length > 0 ? paymentTerms.map((term, i) => (
                              <p key={term.id}>
                                {i + 1}. {term.description}：
                                {formatCurrency(term.amount)}
                                （{Math.round((term.amount / contract.amount) * 100)}%）
                                {term.dueDate && `，于 ${formatDate(term.dueDate, 'date')} 前支付`}
                              </p>
                            )) : (
                              <p>双方另行约定</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">第四条 合同期限</p>
                          <p className="pl-4">
                            {contract.startDate && contract.endDate
                              ? `自 ${formatDate(contract.startDate, 'date')} 起至 ${formatDate(contract.endDate, 'date')} 止，共计服务期限。`
                              : '双方另行约定服务期限。'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">第五条 双方权利与义务</p>
                          <p className="pl-4">
                            1. 甲方应按合同约定及时支付相关费用，并配合乙方开展工作。
                          </p>
                          <p className="pl-4">
                            2. 乙方应按照约定的标准和要求提供服务，确保服务质量。
                          </p>
                          <p className="pl-4">
                            3. 双方应对合作过程中知悉的对方商业秘密承担保密义务。
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">第六条 违约责任</p>
                          <p className="pl-4">
                            任何一方违反本合同约定，应承担相应的违约责任，
                            给对方造成损失的，应予以赔偿。
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">第七条 争议解决</p>
                          <p className="pl-4">
                            因本合同引起的争议，双方应友好协商解决；
                            协商不成的，任何一方均可向有管辖权的人民法院提起诉讼。
                          </p>
                        </div>
                        <div className="pt-4">
                          <p>
                            本合同一式两份，甲乙双方各执一份，自双方确认之日起生效，
                            具有同等法律效力。
                          </p>
                        </div>
                        <div className="mt-10 grid grid-cols-2 gap-8">
                          <div>
                            <p className="font-medium">甲方（盖章确认）：</p>
                            <p className="mt-10 text-sm text-forest-500">
                              日期：____________
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">乙方（盖章确认）：</p>
                            <p className="mt-10 text-sm text-forest-500">
                              日期：____________
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 rounded-2xl border border-forest-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-forest-900">付款节点</h3>
              <div className="space-y-3">
                {paymentTerms.length === 0 ? (
                  <div className="py-4 text-center text-sm text-forest-500">
                    暂无付款节点
                  </div>
                ) : (
                  paymentTerms.map((term, index) => (
                    <div
                      key={term.id}
                      className="flex items-center justify-between rounded-lg border border-forest-100 bg-forest-50/50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-forest-700 shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-forest-900">
                            {term.description}
                          </p>
                          {term.dueDate && (
                            <p className="text-xs text-forest-500">
                              到期：{formatDate(term.dueDate, 'date')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-forest-900">
                          {formatCurrency(term.amount)}
                        </p>
                        <p className="text-xs text-forest-500">
                          {Math.round((term.amount / contract.amount) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-forest-200 bg-white p-6 shadow-sm sm:p-8">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <label className="mb-6 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-forest-300 text-forest-600 focus:ring-forest-500"
                />
                <span className="text-sm text-forest-700">
                  我已仔细阅读并理解本合同的全部内容，同意遵守合同中的各项条款，
                  确认合同信息准确无误。
                </span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="sm:w-auto"
                  onClick={() => window.close()}
                >
                  稍后确认
                </Button>
                <Button
                  className={cn(
                    'w-full sm:w-auto',
                    !agreed && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={!agreed || confirming}
                  onClick={handleConfirm}
                >
                  {confirming ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      确认中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      确认并签署合同
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-forest-400">
          如有疑问，请联系我们的客服人员
        </p>
      </div>
    </div>
  )
}
