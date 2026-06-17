import type {
  Client,
  Contract,
  PaymentTerm,
  Project,
  ProjectFile,
  PaymentRecord,
} from '../shared/types.js'

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

const now = (): string => new Date().toISOString()

class Database {
  private clients = new Map<string, Client>()
  private contracts = new Map<string, Contract>()
  private paymentTerms = new Map<string, PaymentTerm>()
  private projects = new Map<string, Project>()
  private projectFiles = new Map<string, ProjectFile>()
  private paymentRecords = new Map<string, PaymentRecord>()

  constructor() {
    this.initSeedData()
  }

  private initSeedData(): void {
    const seedClients: Client[] = [
      {
        id: 'c1',
        name: '北京华盛科技有限公司',
        contactPerson: '张伟',
        phone: '13800138001',
        email: 'zhangwei@huasheng.com',
        address: '北京市海淀区中关村大街1号',
        companyType: '有限责任公司',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
      },
      {
        id: 'c2',
        name: '上海远见贸易有限公司',
        contactPerson: '李娜',
        phone: '13900139002',
        email: 'lina@yuanjian.com',
        address: '上海市浦东新区陆家嘴金融中心200号',
        companyType: '有限责任公司',
        createdAt: '2025-02-20T09:30:00.000Z',
        updatedAt: '2025-02-20T09:30:00.000Z',
      },
      {
        id: 'c3',
        name: '深圳智造集团股份有限公司',
        contactPerson: '王强',
        phone: '13700137003',
        email: 'wangqiang@zhizao.com',
        address: '深圳市南山区科技园南区88栋',
        companyType: '股份有限公司',
        createdAt: '2025-03-10T14:20:00.000Z',
        updatedAt: '2025-03-10T14:20:00.000Z',
      },
    ]

    const seedContracts: Contract[] = [
      {
        id: 'k1',
        clientId: 'c1',
        contractNo: 'HT-2025-001',
        name: '企业OA系统开发合同',
        amount: 580000,
        signedDate: '2025-01-20',
        startDate: '2025-02-01',
        endDate: '2025-08-31',
        status: 'active',
        description: '为北京华盛科技定制开发企业级OA管理系统',
        createdAt: '2025-01-20T10:00:00.000Z',
        updatedAt: '2025-01-20T10:00:00.000Z',
      },
      {
        id: 'k2',
        clientId: 'c1',
        contractNo: 'HT-2025-002',
        name: '数据可视化平台建设',
        amount: 320000,
        signedDate: '2025-03-15',
        startDate: '2025-04-01',
        endDate: '2025-09-30',
        status: 'active',
        description: '搭建商业智能数据可视化分析平台',
        createdAt: '2025-03-15T11:00:00.000Z',
        updatedAt: '2025-03-15T11:00:00.000Z',
      },
      {
        id: 'k3',
        clientId: 'c2',
        contractNo: 'HT-2025-003',
        name: '电商平台升级改造合同',
        amount: 850000,
        signedDate: '2025-02-25',
        startDate: '2025-03-10',
        endDate: '2025-10-31',
        status: 'active',
        description: '上海远见贸易电商平台全面升级改造项目',
        createdAt: '2025-02-25T14:00:00.000Z',
        updatedAt: '2025-02-25T14:00:00.000Z',
      },
      {
        id: 'k4',
        clientId: 'c3',
        contractNo: 'HT-2025-004',
        name: 'MES生产执行系统',
        amount: 1200000,
        signedDate: '2025-03-20',
        startDate: '2025-04-15',
        endDate: '2025-12-31',
        status: 'active',
        description: '深圳智造集团MES生产制造执行系统',
        createdAt: '2025-03-20T09:00:00.000Z',
        updatedAt: '2025-03-20T09:00:00.000Z',
      },
      {
        id: 'k5',
        clientId: 'c2',
        contractNo: 'HT-2024-088',
        name: '官网改版项目',
        amount: 86000,
        signedDate: '2024-11-10',
        startDate: '2024-11-15',
        endDate: '2024-12-31',
        status: 'completed',
        description: '企业官方网站设计与开发改版',
        createdAt: '2024-11-10T10:00:00.000Z',
        updatedAt: '2024-12-31T18:00:00.000Z',
      },
    ]

    const seedPaymentTerms: PaymentTerm[] = [
      {
        id: 'pt1',
        contractId: 'k1',
        termNo: 1,
        description: '首付款',
        amount: 174000,
        dueDate: '2025-02-10',
        status: 'paid',
        paidAmount: 174000,
        paidDate: '2025-02-08',
        createdAt: '2025-01-20T10:00:00.000Z',
        updatedAt: '2025-02-08T16:00:00.000Z',
      },
      {
        id: 'pt2',
        contractId: 'k1',
        termNo: 2,
        description: '需求确认完成',
        amount: 232000,
        dueDate: '2025-04-30',
        status: 'paid',
        paidAmount: 232000,
        paidDate: '2025-04-28',
        createdAt: '2025-01-20T10:00:00.000Z',
        updatedAt: '2025-04-28T15:30:00.000Z',
      },
      {
        id: 'pt3',
        contractId: 'k1',
        termNo: 3,
        description: '系统上线验收',
        amount: 174000,
        dueDate: '2025-08-31',
        status: 'pending',
        paidAmount: 0,
        createdAt: '2025-01-20T10:00:00.000Z',
        updatedAt: '2025-01-20T10:00:00.000Z',
      },
      {
        id: 'pt4',
        contractId: 'k3',
        termNo: 1,
        description: '合同签订首付款',
        amount: 255000,
        dueDate: '2025-03-15',
        status: 'paid',
        paidAmount: 255000,
        paidDate: '2025-03-14',
        createdAt: '2025-02-25T14:00:00.000Z',
        updatedAt: '2025-03-14T10:00:00.000Z',
      },
      {
        id: 'pt5',
        contractId: 'k3',
        termNo: 2,
        description: '设计稿确认',
        amount: 170000,
        dueDate: '2025-05-15',
        status: 'invoiced',
        paidAmount: 0,
        createdAt: '2025-02-25T14:00:00.000Z',
        updatedAt: '2025-05-10T09:00:00.000Z',
      },
      {
        id: 'pt6',
        contractId: 'k4',
        termNo: 1,
        description: '预付款',
        amount: 360000,
        dueDate: '2025-04-20',
        status: 'paid',
        paidAmount: 360000,
        paidDate: '2025-04-18',
        createdAt: '2025-03-20T09:00:00.000Z',
        updatedAt: '2025-04-18T14:00:00.000Z',
      },
    ]

    const seedProjects: Project[] = [
      {
        id: 'p1',
        contractId: 'k1',
        clientId: 'c1',
        name: '华盛OA系统开发',
        status: 'in_progress',
        startDate: '2025-02-01',
        manager: '陈明',
        progress: 65,
        description: '企业OA管理系统，涵盖考勤、审批、文档管理等模块',
        createdAt: '2025-02-01T09:00:00.000Z',
        updatedAt: '2025-06-01T10:00:00.000Z',
      },
      {
        id: 'p2',
        contractId: 'k2',
        clientId: 'c1',
        name: '华盛数据可视化平台',
        status: 'planning',
        startDate: '2025-04-01',
        manager: '刘洋',
        progress: 15,
        description: 'BI数据可视化分析平台建设',
        createdAt: '2025-04-01T09:00:00.000Z',
        updatedAt: '2025-05-10T10:00:00.000Z',
      },
      {
        id: 'p3',
        contractId: 'k3',
        clientId: 'c2',
        name: '远见电商平台升级',
        status: 'in_progress',
        startDate: '2025-03-10',
        manager: '赵雪',
        progress: 42,
        description: '电商平台全面技术架构升级和功能改造',
        createdAt: '2025-03-10T09:00:00.000Z',
        updatedAt: '2025-06-05T10:00:00.000Z',
      },
      {
        id: 'p4',
        contractId: 'k4',
        clientId: 'c3',
        name: '智造MES系统实施',
        status: 'in_progress',
        startDate: '2025-04-15',
        manager: '孙磊',
        progress: 28,
        description: '生产制造执行系统，覆盖车间全流程管理',
        createdAt: '2025-04-15T09:00:00.000Z',
        updatedAt: '2025-06-10T10:00:00.000Z',
      },
    ]

    const seedProjectFiles: ProjectFile[] = [
      {
        id: 'f1',
        projectId: 'p1',
        name: '需求规格说明书V1.2',
        fileName: 'OA需求规格说明书V1.2.pdf',
        fileSize: 2456000,
        fileType: 'application/pdf',
        uploadedBy: '陈明',
        uploadedAt: '2025-03-15T10:30:00.000Z',
      },
      {
        id: 'f2',
        projectId: 'p1',
        name: '系统架构设计文档',
        fileName: 'OA系统架构设计.docx',
        fileSize: 1820000,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedBy: '陈明',
        uploadedAt: '2025-03-25T14:20:00.000Z',
      },
      {
        id: 'f3',
        projectId: 'p3',
        name: 'UI设计稿',
        fileName: '电商平台UI设计稿.fig',
        fileSize: 8520000,
        fileType: 'application/figma',
        uploadedBy: '赵雪',
        uploadedAt: '2025-04-20T11:00:00.000Z',
      },
      {
        id: 'f4',
        projectId: 'p4',
        name: 'MES业务流程梳理',
        fileName: 'MES业务流程梳理.xlsx',
        fileSize: 960000,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: '孙磊',
        uploadedAt: '2025-05-05T16:45:00.000Z',
      },
    ]

    const seedPaymentRecords: PaymentRecord[] = [
      {
        id: 'pr1',
        contractId: 'k1',
        paymentTermId: 'pt1',
        amount: 174000,
        paymentDate: '2025-02-08',
        paymentMethod: 'bank_transfer',
        referenceNo: 'BK20250208001',
        remark: 'OA系统首付款',
        createdAt: '2025-02-08T16:00:00.000Z',
      },
      {
        id: 'pr2',
        contractId: 'k1',
        paymentTermId: 'pt2',
        amount: 232000,
        paymentDate: '2025-04-28',
        paymentMethod: 'bank_transfer',
        referenceNo: 'BK20250428003',
        remark: 'OA系统第二笔款',
        createdAt: '2025-04-28T15:30:00.000Z',
      },
      {
        id: 'pr3',
        contractId: 'k3',
        paymentTermId: 'pt4',
        amount: 255000,
        paymentDate: '2025-03-14',
        paymentMethod: 'bank_transfer',
        referenceNo: 'BK20250314007',
        remark: '电商平台升级首付款',
        createdAt: '2025-03-14T10:00:00.000Z',
      },
      {
        id: 'pr4',
        contractId: 'k4',
        paymentTermId: 'pt6',
        amount: 360000,
        paymentDate: '2025-04-18',
        paymentMethod: 'bank_transfer',
        referenceNo: 'BK20250418012',
        remark: 'MES系统预付款',
        createdAt: '2025-04-18T14:00:00.000Z',
      },
      {
        id: 'pr5',
        contractId: 'k5',
        amount: 86000,
        paymentDate: '2025-01-05',
        paymentMethod: 'bank_transfer',
        referenceNo: 'BK20250105020',
        remark: '官网改版尾款',
        createdAt: '2025-01-05T10:00:00.000Z',
      },
    ]

    seedClients.forEach((c) => this.clients.set(c.id, c))
    seedContracts.forEach((c) => this.contracts.set(c.id, c))
    seedPaymentTerms.forEach((p) => this.paymentTerms.set(p.id, p))
    seedProjects.forEach((p) => this.projects.set(p.id, p))
    seedProjectFiles.forEach((f) => this.projectFiles.set(f.id, f))
    seedPaymentRecords.forEach((r) => this.paymentRecords.set(r.id, r))
  }

  // ============ Clients ============
  getClients(): Client[] {
    return Array.from(this.clients.values())
  }

  getClientById(id: string): Client | undefined {
    return this.clients.get(id)
  }

  createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const client: Client = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.clients.set(client.id, client)
    return client
  }

  updateClient(id: string, data: Partial<Client>): Client | undefined {
    const existing = this.clients.get(id)
    if (!existing) return undefined
    const updated: Client = { ...existing, ...data, updatedAt: now() }
    this.clients.set(id, updated)
    return updated
  }

  deleteClient(id: string): boolean {
    return this.clients.delete(id)
  }

  // ============ Contracts ============
  getContracts(): Contract[] {
    return Array.from(this.contracts.values())
  }

  getContractById(id: string): Contract | undefined {
    return this.contracts.get(id)
  }

  getContractsByClientId(clientId: string): Contract[] {
    return Array.from(this.contracts.values()).filter((c) => c.clientId === clientId)
  }

  createContract(data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Contract {
    const contract: Contract = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.contracts.set(contract.id, contract)
    return contract
  }

  updateContract(id: string, data: Partial<Contract>): Contract | undefined {
    const existing = this.contracts.get(id)
    if (!existing) return undefined
    const updated: Contract = { ...existing, ...data, updatedAt: now() }
    this.contracts.set(id, updated)
    return updated
  }

  deleteContract(id: string): boolean {
    return this.contracts.delete(id)
  }

  // ============ Payment Terms ============
  getPaymentTerms(): PaymentTerm[] {
    return Array.from(this.paymentTerms.values())
  }

  getPaymentTermById(id: string): PaymentTerm | undefined {
    return this.paymentTerms.get(id)
  }

  getPaymentTermsByContractId(contractId: string): PaymentTerm[] {
    return Array.from(this.paymentTerms.values()).filter((p) => p.contractId === contractId)
  }

  createPaymentTerm(
    data: Omit<PaymentTerm, 'id' | 'createdAt' | 'updatedAt'>,
  ): PaymentTerm {
    const term: PaymentTerm = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.paymentTerms.set(term.id, term)
    return term
  }

  updatePaymentTerm(id: string, data: Partial<PaymentTerm>): PaymentTerm | undefined {
    const existing = this.paymentTerms.get(id)
    if (!existing) return undefined
    const updated: PaymentTerm = { ...existing, ...data, updatedAt: now() }
    this.paymentTerms.set(id, updated)
    return updated
  }

  deletePaymentTerm(id: string): boolean {
    return this.paymentTerms.delete(id)
  }

  // ============ Projects ============
  getProjects(): Project[] {
    return Array.from(this.projects.values())
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.get(id)
  }

  getProjectsByClientId(clientId: string): Project[] {
    return Array.from(this.projects.values()).filter((p) => p.clientId === clientId)
  }

  getProjectsByContractId(contractId: string): Project[] {
    return Array.from(this.projects.values()).filter((p) => p.contractId === contractId)
  }

  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const project: Project = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.projects.set(project.id, project)
    return project
  }

  updateProject(id: string, data: Partial<Project>): Project | undefined {
    const existing = this.projects.get(id)
    if (!existing) return undefined
    const updated: Project = { ...existing, ...data, updatedAt: now() }
    this.projects.set(id, updated)
    return updated
  }

  deleteProject(id: string): boolean {
    return this.projects.delete(id)
  }

  // ============ Project Files ============
  getProjectFiles(): ProjectFile[] {
    return Array.from(this.projectFiles.values())
  }

  getProjectFileById(id: string): ProjectFile | undefined {
    return this.projectFiles.get(id)
  }

  getProjectFilesByProjectId(projectId: string): ProjectFile[] {
    return Array.from(this.projectFiles.values()).filter((f) => f.projectId === projectId)
  }

  createProjectFile(data: Omit<ProjectFile, 'id'>): ProjectFile {
    const file: ProjectFile = {
      ...data,
      id: generateId(),
    }
    this.projectFiles.set(file.id, file)
    return file
  }

  deleteProjectFile(id: string): boolean {
    return this.projectFiles.delete(id)
  }

  // ============ Payment Records ============
  getPaymentRecords(): PaymentRecord[] {
    return Array.from(this.paymentRecords.values())
  }

  getPaymentRecordById(id: string): PaymentRecord | undefined {
    return this.paymentRecords.get(id)
  }

  getPaymentRecordsByContractId(contractId: string): PaymentRecord[] {
    return Array.from(this.paymentRecords.values()).filter((r) => r.contractId === contractId)
  }

  createPaymentRecord(data: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
    const record: PaymentRecord = {
      ...data,
      id: generateId(),
      createdAt: now(),
    }
    this.paymentRecords.set(record.id, record)
    return record
  }

  deletePaymentRecord(id: string): boolean {
    return this.paymentRecords.delete(id)
  }
}

export const db = new Database()
