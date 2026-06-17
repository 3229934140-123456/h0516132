import type {
  Client,
  Contract,
  PaymentTerm,
  Project,
  ProjectFile,
  PaymentRecord,
  ReminderRecord,
  ReconciliationRecord,
} from '../shared/types.js'

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

const generateToken = (): string => {
  return 'confirm-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

const now = (): string => new Date().toISOString()

class Database {
  private clients = new Map<string, Client>()
  private contracts = new Map<string, Contract>()
  private paymentTerms = new Map<string, PaymentTerm>()
  private projects = new Map<string, Project>()
  private projectFiles = new Map<string, ProjectFile>()
  private paymentRecords = new Map<string, PaymentRecord>()
  private reminderRecords = new Map<string, ReminderRecord>()
  private reconciliationRecords = new Map<string, ReconciliationRecord>()

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
        confirmToken: 'confirm-k1',
        confirmedAt: '2025-01-21T10:00:00.000Z',
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
        confirmToken: 'confirm-k2',
        confirmedAt: '2025-03-16T11:00:00.000Z',
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
        confirmToken: 'confirm-k3',
        confirmedAt: '2025-02-26T14:00:00.000Z',
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
        confirmToken: 'confirm-k4',
        confirmedAt: '2025-03-21T09:00:00.000Z',
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
        confirmToken: 'confirm-k5',
        confirmedAt: '2024-11-11T10:00:00.000Z',
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
        invoiceStatus: 'invoiced',
        invoiceAmount: 174000,
        invoiceDate: '2025-01-25',
        invoiceNo: 'INV-2025-0001',
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
        invoiceStatus: 'invoiced',
        invoiceAmount: 232000,
        invoiceDate: '2025-04-10',
        invoiceNo: 'INV-2025-0025',
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
        invoiceStatus: 'uninvoiced',
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
        invoiceStatus: 'invoiced',
        invoiceAmount: 255000,
        invoiceDate: '2025-03-01',
        invoiceNo: 'INV-2025-0012',
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
        invoiceStatus: 'invoiced',
        invoiceAmount: 170000,
        invoiceDate: '2025-05-08',
        invoiceNo: 'INV-2025-0033',
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
        invoiceStatus: 'partial_invoiced',
        invoiceAmount: 180000,
        invoiceDate: '2025-04-10',
        invoiceNo: 'INV-2025-0028',
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
        type: 'requirement',
        uploadedBy: '陈明',
        uploadedAt: '2025-03-15T10:30:00.000Z',
        version: 'v1.2',
        isFinal: true,
        remark: '客户确认的最终需求版本',
      },
      {
        id: 'f2',
        projectId: 'p1',
        name: '系统架构设计文档',
        fileName: 'OA系统架构设计.docx',
        fileSize: 1820000,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        type: 'requirement',
        uploadedBy: '陈明',
        uploadedAt: '2025-03-25T14:20:00.000Z',
        version: 'v1.0',
        isFinal: false,
        remark: '初稿，待技术评审',
      },
      {
        id: 'f3',
        projectId: 'p3',
        name: 'UI设计稿',
        fileName: '电商平台UI设计稿.fig',
        fileSize: 8520000,
        fileType: 'application/figma',
        type: 'deliverable',
        uploadedBy: '赵雪',
        uploadedAt: '2025-04-20T11:00:00.000Z',
        version: 'v2.0',
        isFinal: true,
        remark: '客户确认通过的最终设计稿',
      },
      {
        id: 'f4',
        projectId: 'p4',
        name: 'MES业务流程梳理',
        fileName: 'MES业务流程梳理.xlsx',
        fileSize: 960000,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        type: 'requirement',
        uploadedBy: '孙磊',
        uploadedAt: '2025-05-05T16:45:00.000Z',
        version: 'v1.0',
        isFinal: false,
        remark: '',
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

    const seedReminders: ReminderRecord[] = [
      {
        id: 'r1',
        paymentTermId: 'pt5',
        type: 'email',
        content: '发送邮件提醒客户支付设计稿确认款 ¥170,000，已开票 INV-2025-0033',
        createdAt: '2025-06-01T10:00:00.000Z',
      },
      {
        id: 'r2',
        paymentTermId: 'pt5',
        type: 'phone',
        content: '电话联系客户财务，对方表示本周内安排付款',
        createdAt: '2025-06-10T14:30:00.000Z',
      },
      {
        id: 'r3',
        paymentTermId: 'pt3',
        type: 'wechat',
        content: '微信发送 OA 系统上线验收款的到期提醒，预计 8 月底到期',
        createdAt: '2025-06-15T09:15:00.000Z',
      },
    ]

    const seedReconciliation: ReconciliationRecord[] = [
      {
        id: 'rec1',
        month: '2025-04',
        entityType: 'client',
        entityId: 'c1',
        status: 'verified',
        remark: '4月账务已核对无误',
        createdAt: '2025-05-05T10:00:00.000Z',
        updatedAt: '2025-05-05T10:00:00.000Z',
      },
      {
        id: 'rec2',
        month: '2025-04',
        entityType: 'contract',
        entityId: 'k1',
        status: 'verified',
        remark: 'OA系统两笔款项均已到账',
        createdAt: '2025-05-05T10:00:00.000Z',
        updatedAt: '2025-05-05T10:00:00.000Z',
      },
      {
        id: 'rec3',
        month: '2025-04',
        entityType: 'term',
        entityId: 'pt2',
        status: 'verified',
        remark: '',
        createdAt: '2025-05-05T10:00:00.000Z',
        updatedAt: '2025-05-05T10:00:00.000Z',
      },
      {
        id: 'rec4',
        month: '2025-04',
        entityType: 'term',
        entityId: 'pt6',
        status: 'pending',
        remark: '开票金额与付款金额不一致，需进一步核实',
        createdAt: '2025-05-06T14:00:00.000Z',
        updatedAt: '2025-05-06T14:00:00.000Z',
      },
      {
        id: 'rec5',
        month: '2025-05',
        entityType: 'client',
        entityId: 'c2',
        status: 'discrepancy',
        remark: '5月开票INV-2025-0033客户表示未收到发票',
        createdAt: '2025-06-10T11:00:00.000Z',
        updatedAt: '2025-06-10T11:00:00.000Z',
      },
      {
        id: 'rec6',
        month: '2025-05',
        entityType: 'term',
        entityId: 'pt5',
        status: 'discrepancy',
        remark: '已开票未收到款，电话联系中',
        createdAt: '2025-06-10T11:00:00.000Z',
        updatedAt: '2025-06-10T11:00:00.000Z',
      },
    ]

    seedClients.forEach((c) => this.clients.set(c.id, c))
    seedContracts.forEach((c) => this.contracts.set(c.id, c))
    seedPaymentTerms.forEach((p) => this.paymentTerms.set(p.id, p))
    seedProjects.forEach((p) => this.projects.set(p.id, p))
    seedProjectFiles.forEach((f) => this.projectFiles.set(f.id, f))
    seedPaymentRecords.forEach((r) => this.paymentRecords.set(r.id, r))
    seedReminders.forEach((r) => this.reminderRecords.set(r.id, r))
    seedReconciliation.forEach((r) => this.reconciliationRecords.set(r.id, r))
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

  createContract(data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'confirmToken'>): Contract {
    const contract: Contract = {
      ...data,
      id: generateId(),
      confirmToken: generateToken(),
      createdAt: now(),
      updatedAt: now(),
    }
    this.contracts.set(contract.id, contract)
    return contract
  }

  getContractByToken(token: string): Contract | undefined {
    return Array.from(this.contracts.values()).find((c) => c.confirmToken === token)
  }

  confirmContract(token: string): Contract | undefined {
    const contract = this.getContractByToken(token)
    if (!contract) return undefined
    const updated: Contract = {
      ...contract,
      status: 'active',
      confirmedAt: now(),
      updatedAt: now(),
    }
    this.contracts.set(contract.id, updated)
    return updated
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
    data: Omit<PaymentTerm, 'id' | 'createdAt' | 'updatedAt' | 'invoiceStatus'> & { invoiceStatus?: 'uninvoiced' | 'invoiced' | 'partial_invoiced' },
  ): PaymentTerm {
    const term: PaymentTerm = {
      ...data,
      id: generateId(),
      invoiceStatus: data.invoiceStatus || 'uninvoiced',
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

  deletePaymentTermsByContractId(contractId: string): void {
    const terms = this.getPaymentTermsByContractId(contractId)
    terms.forEach((t) => {
      if (t.paidAmount <= 0 && t.invoiceStatus === 'uninvoiced') {
        this.paymentTerms.delete(t.id)
      }
    })
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

  createProjectFile(data: Omit<ProjectFile, 'id' | 'uploadedAt' | 'version' | 'isFinal' | 'remark'> & { version?: string; isFinal?: boolean; remark?: string }): ProjectFile {
    const file: ProjectFile = {
      ...data,
      id: generateId(),
      uploadedAt: now(),
      version: data.version || 'v1.0',
      isFinal: data.isFinal ?? false,
      remark: data.remark || '',
    }
    this.projectFiles.set(file.id, file)
    return file
  }

  updateProjectFile(id: string, data: Partial<Pick<ProjectFile, 'name' | 'version' | 'isFinal' | 'remark'>>): ProjectFile | undefined {
    const existing = this.projectFiles.get(id)
    if (!existing) return undefined
    const updated: ProjectFile = { ...existing, ...data }
    this.projectFiles.set(id, updated)
    return updated
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

  getPaymentRecordsByPaymentTermId(paymentTermId: string): PaymentRecord[] {
    return Array.from(this.paymentRecords.values()).filter((r) => r.paymentTermId === paymentTermId)
  }

  // ============ Reminder Records ============
  getReminders(): ReminderRecord[] {
    return Array.from(this.reminderRecords.values())
  }

  getReminderById(id: string): ReminderRecord | undefined {
    return this.reminderRecords.get(id)
  }

  getRemindersByPaymentTerm(termId: string): ReminderRecord[] {
    return Array.from(this.reminderRecords.values())
      .filter((r) => r.paymentTermId === termId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  createReminder(data: Omit<ReminderRecord, 'id' | 'createdAt'>): ReminderRecord {
    const reminder: ReminderRecord = {
      ...data,
      id: generateId(),
      createdAt: now(),
    }
    this.reminderRecords.set(reminder.id, reminder)
    return reminder
  }

  // ============ Reconciliation Records ============
  getReconciliationByMonth(month: string): ReconciliationRecord[] {
    return Array.from(this.reconciliationRecords.values()).filter((r) => r.month === month)
  }

  upsertReconciliation(
    data: Pick<ReconciliationRecord, 'month' | 'entityType' | 'entityId' | 'status' | 'remark'>,
  ): ReconciliationRecord {
    const existing = Array.from(this.reconciliationRecords.values()).find(
      (r) => r.month === data.month && r.entityType === data.entityType && r.entityId === data.entityId,
    )
    if (existing) {
      const updated: ReconciliationRecord = {
        ...existing,
        status: data.status,
        remark: data.remark,
        updatedAt: now(),
      }
      this.reconciliationRecords.set(existing.id, updated)
      return updated
    }
    const record: ReconciliationRecord = {
      id: generateId(),
      month: data.month,
      entityType: data.entityType,
      entityId: data.entityId,
      status: data.status,
      remark: data.remark,
      createdAt: now(),
      updatedAt: now(),
    }
    this.reconciliationRecords.set(record.id, record)
    return record
  }
}

export const db = new Database()
