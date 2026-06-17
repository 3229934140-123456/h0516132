import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | 'draft' | 'pending' | 'active' | 'cancelled'

const statusFilterLabels: Record<FilterStatus, string> = {
  all: '全部',
  draft: '草稿',
  pending: '待确认',
  active: '已确认',
  cancelled: '已取消',
}

const statusMap: Record<string, 'draft' | 'pending' | 'active' | 'completed' | 'cancelled'> = {
  draft: 'draft',
  pending: 'pending',
  active: 'active',
  completed: 'active',
  cancelled: 'cancelled',
  terminated: 'cancelled',
}

export default function ContractList() {
  const navigate = useNavigate()
  const { contracts, clients, paymentTerms } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clients.find((c) => c.id === contract.clientId)?.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const mappedStatus = statusMap[contract.status] || contract.status
      const matchesStatus =
        statusFilter === 'all' || mappedStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [contracts, clients, searchQuery, statusFilter])

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.name || '未知客户'
  }

  const getPaymentProgress = (contractId: string, totalAmount: number) => {
    const contractPayments = paymentTerms.filter(
      (p) => p.contractId === contractId && p.status === 'paid'
    )
    const paidAmount = contractPayments.reduce((sum, p) => sum + p.paidAmount, 0)
    const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
    return { paidAmount, percentage }
  }

  const getBadgeStatus = (status: string) => {
    const mapped = statusMap[status]
    if (mapped === 'draft') return 'pending' as const
    if (mapped === 'active') return 'active' as const
    if (mapped === 'cancelled') return 'cancelled' as const
    return (mapped || 'pending') as 'active' | 'pending' | 'completed' | 'cancelled' | 'overdue' | 'paused'
  }

  return (
    <Layout title="合同管理">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-400" />
              <input
                type="text"
                placeholder="搜索合同标题或客户名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-forest-200 bg-white py-2 pl-10 pr-4 text-sm text-forest-900 placeholder:text-forest-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-forest-200 bg-white p-1">
              <Filter className="mx-2 h-4 w-4 text-forest-400" />
              {(Object.keys(statusFilterLabels) as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-forest-700 text-white'
                      : 'text-forest-600 hover:bg-forest-100'
                  )}
                >
                  {statusFilterLabels[status]}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => navigate('/contracts/new')}>
            <Plus className="h-4 w-4" />
            新建合同
          </Button>
        </div>

        {filteredContracts.length === 0 ? (
          <EmptyState
            title="暂无合同"
            description="点击右上角按钮创建您的第一份合同"
            actionLabel="新建合同"
            onAction={() => navigate('/contracts/new')}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredContracts.map((contract) => {
              const { percentage, paidAmount } = getPaymentProgress(
                contract.id,
                contract.amount
              )
              return (
                <Card
                  key={contract.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-forest-300"
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-forest-500" />
                        <span className="truncate">{contract.name}</span>
                      </CardTitle>
                      <StatusBadge
                        status={getBadgeStatus(contract.status)}
                        category="contract"
                        className="shrink-0"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="flex items-center gap-2 text-sm text-forest-600">
                      <Building2 className="h-4 w-4 text-forest-400" />
                      <span className="truncate">{getClientName(contract.clientId)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-forest-500">合同金额</span>
                      <span className="text-lg font-semibold text-forest-900">
                        {formatCurrency(contract.amount)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-forest-500">付款进度</span>
                        <span className="font-medium text-forest-700">
                          {formatCurrency(paidAmount)} / {percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-forest-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            percentage === 100
                              ? 'bg-forest-600'
                              : 'bg-amber-500'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-forest-100 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-forest-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(contract.createdAt, 'date')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-forest-600">
                      查看详情
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
