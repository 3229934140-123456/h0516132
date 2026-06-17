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
  confirmToken: string
  confirmedAt?: string
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

export interface ProjectFile {
  id: string
  projectId: string
  name: string
  fileName: string
  fileSize: number
  fileType: string
  type: 'requirement' | 'deliverable' | 'other'
  uploadedBy: string
  uploadedAt: string
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

interface ContractWithDetails extends Contract {
  client?: Client
  paymentTerms?: PaymentTermWithDetails[]
}

interface CreateContractData {
  clientId: string
  contractNo: string
  name: string
  amount: number
  signedDate: string
  startDate: string
  endDate: string
  status?: 'draft' | 'active' | 'completed' | 'terminated'
  description: string
  paymentTerms?: Array<{
    termNo?: number
    description: string
    amount: number
    dueDate: string
    status?: 'pending' | 'invoiced' | 'paid' | 'overdue'
    paidAmount?: number
  }>
}

interface DataState {
  clients: Client[]
  contracts: Contract[]
  projects: Project[]
  payments: Payment[]
  paymentTerms: PaymentTermWithDetails[]
  paymentRecords: PaymentRecordWithDetails[]
  projectFiles: Record<string, ProjectFile[]>
  statistics: Statistics
  loading: boolean
  error: string | null

  fetchClients: () => Promise<void>
  fetchContracts: () => Promise<void>
  fetchProjects: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchPaymentTerms: () => Promise<void>
  fetchPaymentRecords: () => Promise<void>
  fetchProjectFiles: (projectId: string) => Promise<void>
  uploadProjectFile: (projectId: string, fileData: Omit<ProjectFile, 'id' | 'projectId' | 'uploadedAt'>) => Promise<boolean>
  deleteProjectFile: (projectId: string, fileId: string) => Promise<boolean>
  fetchStatistics: () => Promise<void>
  fetchAll: () => Promise<void>
  fetchContractByToken: (token: string) => Promise<ContractWithDetails | null>
  confirmContract: (token: string) => Promise<boolean>
  createContract: (data: CreateContractData) => Promise<Contract | null>
  createPaymentRecord: (data: Omit<PaymentRecordWithDetails, 'id' | 'createdAt' | 'contractNo' | 'contractName' | 'clientName'>) => Promise<boolean>
  updateClient: (id: string, data: Partial<Client>) => Promise<boolean>
}

export const useStore = create<DataState & UIState>((set, get) => ({
  clients: [],
  contracts: [],
  projects: [],
  payments: [],
  paymentTerms: [],
  paymentRecords: [],
  projectFiles: {},
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

  fetchProjectFiles: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`/api/projects/${projectId}/files`)
      if (!res.ok) throw new Error('获取项目文件失败')
      const result = await res.json()
      set((state) => ({
        projectFiles: {
          ...state.projectFiles,
          [projectId]: result.success && result.data ? result.data : [],
        },
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
    } finally {
      set({ loading: false })
    }
  },

  uploadProjectFile: async (projectId, fileData) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      })
      if (!res.ok) throw new Error('上传文件失败')
      await get().fetchProjectFiles(projectId)
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
      return false
    }
  },

  deleteProjectFile: async (projectId, fileId) => {
    try {
      const res = await fetch(`/api/projects/files/${fileId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('删除文件失败')
      await get().fetchProjectFiles(projectId)
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
      return false
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

  fetchContractByToken: async (token) => {
    try {
      const res = await fetch(`/api/contracts/confirm/${token}`)
      if (!res.ok) throw new Error('获取合同信息失败')
      const result = await res.json()
      return result.success && result.data ? result.data : null
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
      return null
    }
  },

  confirmContract: async (token) => {
    try {
      const res = await fetch(`/api/contracts/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('确认合同失败')
      await Promise.all([get().fetchContracts(), get().fetchPaymentTerms()])
      return true
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
      return false
    }
  },

  createContract: async (data) => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('创建合同失败')
      const result = await res.json()
      await Promise.all([get().fetchContracts(), get().fetchPaymentTerms()])
      return result.success && result.data ? result.data : null
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' })
      return null
    }
  },

  updateClient: async (id, data) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('更新客户失败')
      await get().fetchClients()
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
