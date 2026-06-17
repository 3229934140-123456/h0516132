import { create } from 'zustand'

export interface Client {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  companyType: string
  createdAt: string
  updatedAt: string
}

export interface Contract {
  id: string
  clientId: string
  contractNo: string
  name: string
  amount: number
  signedDate: string
  startDate: string
  endDate: string
  status: 'draft' | 'active' | 'completed' | 'terminated'
  description: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  contractId: string
  clientId: string
  name: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  startDate: string
  endDate?: string
  manager: string
  progress: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  contractId: string
  paymentTermId?: string
  amount: number
  paymentDate: string
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other'
  contractNo?: string
  contractName?: string
  clientName?: string
}

export interface PaymentTermWithDetails {
  id: string
  contractId: string
  termNo: number
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'invoiced' | 'paid' | 'overdue'
  paidAmount: number
  paidDate?: string
  createdAt: string
  updatedAt: string
  contractNo?: string
  contractName?: string
  clientName?: string
  clientEmail?: string
  contactPerson?: string
  projectName?: string
}

export interface PaymentRecordWithDetails {
  id: string
  contractId: string
  paymentTermId?: string
  amount: number
  paymentDate: string
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other'
  referenceNo?: string
  remark?: string
  createdAt: string
  contractNo?: string
  contractName?: string
  clientName?: string
}

export interface Statistics {
  totalClients: number
  activeContracts: number
  completedProjects: number
  totalRevenue: number
  pendingPayments: number
  overduePayments: number
  thisMonthRevenue: number
  thisYearRevenue: number
  monthlyData: { month: string; revenue: number; clients: number }[]
}

const initialStatistics: Statistics = {
  totalClients: 0,
  activeContracts: 0,
  completedProjects: 0,
  totalRevenue: 0,
  pendingPayments: 0,
  overduePayments: 0,
  thisMonthRevenue: 0,
  thisYearRevenue: 0,
  monthlyData: [],
}

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

interface DataState {
  clients: Client[]
  contracts: Contract[]
  projects: Project[]
  payments: Payment[]
  paymentTerms: PaymentTermWithDetails[]
  paymentRecords: PaymentRecordWithDetails[]
  statistics: Statistics
  loading: boolean
  error: string | null

  fetchClients: () => Promise<void>
  fetchContracts: () => Promise<void>
  fetchProjects: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchPaymentTerms: () => Promise<void>
  fetchPaymentRecords: () => Promise<void>
  fetchStatistics: () => Promise<void>
  fetchAll: () => Promise<void>
  createPaymentRecord: (data: Omit<PaymentRecordWithDetails, 'id' | 'createdAt' | 'contractNo' | 'contractName' | 'clientName'>) => Promise<boolean>
}

export const useStore = create<DataState & UIState>((set, get) => ({
  clients: [],
  contracts: [],
  projects: [],
  payments: [],
  paymentTerms: [],
  paymentRecords: [],
  statistics: initialStatistics,
  loading: false,
  error: null,

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  fetchClients: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error('获取客户列表失败')
      const result = await res.json()
      set({ clients: result.success && result.data ? result.data : [] })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  fetchContracts: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/contracts')
      if (!res.ok) throw new Error('获取合同列表失败')
      const result = await res.json()
      set({ contracts: result.success && result.data ? result.data : [] })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('获取项目列表失败')
      const result = await res.json()
      set({ projects: result.success && result.data ? result.data : [] })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  fetchPayments: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/payments')
      if (!res.ok) throw new Error('获取付款列表失败')
      const result = await res.json()
      set({ payments: result.success && result.data ? result.data : [] })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  fetchPaymentTerms: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/contracts/payment-terms/all')
      if (!res.ok) throw new Error('获取付款节点失败')
      const result = await res.json()
      set({ paymentTerms: result.success && result.data ? result.data : [] })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  fetchPaymentRecords: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/payments')
      if (!res.ok) throw new Error('获取收款记录失败')
      const result = await res.json()
      set({ paymentRecords: result.success && result.data ? result.data : [] })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  fetchStatistics: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/statistics')
      if (!res.ok) throw new Error('获取统计数据失败')
      const data = await res.json()
      set({ statistics: data || initialStatistics })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  createPaymentRecord: async (data) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('创建收款记录失败')
      await Promise.all([get().fetchPaymentRecords(), get().fetchPaymentTerms(), get().fetchStatistics()])
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
      return false
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [clientsRes, contractsRes, projectsRes, paymentsRes, paymentTermsRes, paymentRecordsRes, statisticsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/contracts'),
        fetch('/api/projects'),
        fetch('/api/payments'),
        fetch('/api/contracts/payment-terms/all'),
        fetch('/api/payments'),
        fetch('/api/statistics'),
      ])
      const clientsJson = clientsRes.ok ? await clientsRes.json() : { success: false, data: [] }
      const contractsJson = contractsRes.ok ? await contractsRes.json() : { success: false, data: [] }
      const projectsJson = projectsRes.ok ? await projectsRes.json() : { success: false, data: [] }
      const paymentsJson = paymentsRes.ok ? await paymentsRes.json() : { success: false, data: [] }
      const paymentTermsJson = paymentTermsRes.ok ? await paymentTermsRes.json() : { success: false, data: [] }
      const paymentRecordsJson = paymentRecordsRes.ok ? await paymentRecordsRes.json() : { success: false, data: [] }
      const statisticsJson = statisticsRes.ok ? await statisticsRes.json() : initialStatistics

      set({
        clients: clientsJson.success && clientsJson.data ? clientsJson.data : [],
        contracts: contractsJson.success && contractsJson.data ? contractsJson.data : [],
        projects: projectsJson.success && projectsJson.data ? projectsJson.data : [],
        payments: paymentsJson.success && paymentsJson.data ? paymentsJson.data : [],
        paymentTerms: paymentTermsJson.success && paymentTermsJson.data ? paymentTermsJson.data : [],
        paymentRecords: paymentRecordsJson.success && paymentRecordsJson.data ? paymentRecordsJson.data : [],
        statistics: statisticsJson || initialStatistics,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },
}))
