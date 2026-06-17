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

export interface PaymentTerm {
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

export interface PaymentRecord {
  id: string
  contractId: string
  paymentTermId?: string
  amount: number
  paymentDate: string
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other'
  referenceNo?: string
  remark?: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
