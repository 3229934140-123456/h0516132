import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import type { Contract, PaymentTerm, ReminderRecord } from '../../shared/types.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, status } = req.query
    let contracts = db.getContracts()
    if (clientId) {
      contracts = contracts.filter((c) => c.clientId === clientId)
    }
    if (status) {
      contracts = contracts.filter((c) => c.status === status)
    }
    res.json({
      success: true,
      data: contracts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取合同列表失败',
    })
  }
})

router.get('/payment-terms/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query
    let terms = db.getPaymentTerms()
    if (status) {
      terms = terms.filter((t) => t.status === status)
    }
    const termsWithDetails = terms.map((t) => {
      const contract = db.getContractById(t.contractId)
      const client = contract ? db.getClientById(contract.clientId) : undefined
      const project = contract ? db.getProjectsByContractId(contract.id)[0] : undefined
      return {
        ...t,
        contractNo: contract?.contractNo,
        contractName: contract?.name,
        clientName: client?.name,
        clientEmail: client?.email,
        contactPerson: client?.contactPerson,
        projectName: project?.name,
      }
    })
    termsWithDetails.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    res.json({
      success: true,
      data: termsWithDetails,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取付款节点失败',
    })
  }
})

router.get('/confirm/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const contract = db.getContractByToken(token)
    if (!contract) {
      res.status(404).json({
        success: false,
        error: '合同不存在或链接无效',
      })
      return
    }
    const client = db.getClientById(contract.clientId)
    const paymentTerms = db.getPaymentTermsByContractId(contract.id)
    res.json({
      success: true,
      data: {
        ...contract,
        client,
        paymentTerms,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取合同信息失败',
    })
  }
})

router.post('/confirm/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const contract = db.getContractByToken(token)
    if (!contract) {
      res.status(404).json({
        success: false,
        error: '合同不存在或链接无效',
      })
      return
    }
    if (contract.status === 'active' || contract.status === 'completed') {
      res.json({
        success: true,
        data: contract,
        message: '合同已确认',
      })
      return
    }
    const updated = db.confirmContract(token)
    if (!updated) {
      res.status(400).json({
        success: false,
        error: '确认合同失败',
      })
      return
    }
    res.json({
      success: true,
      data: updated,
      message: '合同确认成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '确认合同失败',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = db.getContractById(id)
    if (!contract) {
      res.status(404).json({
        success: false,
        error: '合同不存在',
      })
      return
    }
    const client = db.getClientById(contract.clientId)
    const paymentTerms = db.getPaymentTermsByContractId(id)
    const projects = db.getProjectsByContractId(id)
    const paymentRecords = db.getPaymentRecordsByContractId(id)
    const totalPaid = paymentRecords.reduce((sum, r) => sum + r.amount, 0)
    res.json({
      success: true,
      data: {
        ...contract,
        client,
        paymentTerms,
        projects,
        paymentRecords,
        totalPaid,
        remainingAmount: contract.amount - totalPaid,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取合同详情失败',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentTerms, ...contractData } = req.body as Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'confirmToken'> & {
      paymentTerms?: Array<Omit<PaymentTerm, 'id' | 'contractId' | 'createdAt' | 'updatedAt'>>
    }
    if (!contractData.clientId || !contractData.contractNo || !contractData.name || !contractData.amount) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：客户ID、合同编号、名称、金额',
      })
      return
    }
    const client = db.getClientById(contractData.clientId)
    if (!client) {
      res.status(400).json({
        success: false,
        error: '关联客户不存在',
      })
      return
    }
    const contract = db.createContract(contractData)

    if (paymentTerms && Array.isArray(paymentTerms)) {
      paymentTerms.forEach((term, index) => {
        db.createPaymentTerm({
          ...term,
          contractId: contract.id,
          termNo: term.termNo || index + 1,
          status: term.status || 'pending',
          paidAmount: term.paidAmount || 0,
        })
      })
    }

    const terms = db.getPaymentTermsByContractId(contract.id)

    res.status(201).json({
      success: true,
      data: {
        ...contract,
        paymentTerms: terms,
      },
      message: '合同创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建合同失败',
    })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { paymentTerms, ...contractData } = req.body as Partial<Contract> & {
      paymentTerms?: Array<(Omit<PaymentTerm, 'id' | 'contractId' | 'createdAt' | 'updatedAt'> & { id?: string })>
    }
    const existing = db.getContractById(id)
    if (!existing) {
      res.status(404).json({
        success: false,
        error: '合同不存在',
      })
      return
    }

    const updated = db.updateContract(id, contractData)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '合同不存在',
      })
      return
    }

    if (paymentTerms && Array.isArray(paymentTerms)) {
      const existingTerms = db.getPaymentTermsByContractId(id)
      const existingTermMap = new Map(existingTerms.map((t) => [t.id, t]))
      const inputTermIds = new Set(paymentTerms.map((t) => t.id).filter(Boolean) as string[])

      for (const term of paymentTerms) {
        if (term.id && existingTermMap.has(term.id)) {
          const existingTerm = existingTermMap.get(term.id)!
          if (existingTerm.paidAmount > 0 || existingTerm.invoiceStatus !== 'uninvoiced') {
            db.updatePaymentTerm(term.id, {
              description: term.description,
              amount: term.amount,
              dueDate: term.dueDate,
            })
          } else {
            db.deletePaymentTerm(term.id)
            db.createPaymentTerm({
              ...term,
              contractId: id,
              termNo: term.termNo,
              status: term.status || 'pending',
              paidAmount: term.paidAmount || 0,
            })
          }
        } else {
          db.createPaymentTerm({
            ...term,
            contractId: id,
            termNo: term.termNo,
            status: term.status || 'pending',
            paidAmount: term.paidAmount || 0,
          })
        }
      }

      for (const existingTerm of existingTerms) {
        if (
          !inputTermIds.has(existingTerm.id) &&
          existingTerm.paidAmount <= 0 &&
          existingTerm.invoiceStatus === 'uninvoiced'
        ) {
          db.deletePaymentTerm(existingTerm.id)
        }
      }
    }

    const terms = db.getPaymentTermsByContractId(id)

    res.json({
      success: true,
      data: {
        ...updated,
        paymentTerms: terms,
      },
      message: '合同更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新合同失败',
    })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const projects = db.getProjectsByContractId(id)
    if (projects.length > 0) {
      res.status(400).json({
        success: false,
        error: '该合同下存在项目，无法删除',
      })
      return
    }
    const paymentTerms = db.getPaymentTermsByContractId(id)
    const hasPaidTerms = paymentTerms.some((t) => t.status === 'paid' || t.paidAmount > 0)
    if (hasPaidTerms) {
      res.status(400).json({
        success: false,
        error: '该合同存在已付款节点，无法删除',
      })
      return
    }
    const deleted = db.deleteContract(id)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '合同不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '合同删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除合同失败',
    })
  }
})

router.get('/:id/payment-terms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = db.getContractById(id)
    if (!contract) {
      res.status(404).json({
        success: false,
        error: '合同不存在',
      })
      return
    }
    const terms = db.getPaymentTermsByContractId(id)
    res.json({
      success: true,
      data: terms,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取付款节点失败',
    })
  }
})

router.post('/:id/payment-terms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = db.getContractById(id)
    if (!contract) {
      res.status(404).json({
        success: false,
        error: '合同不存在',
      })
      return
    }
    const data = req.body as Omit<PaymentTerm, 'id' | 'contractId' | 'createdAt' | 'updatedAt'>
    if (!data.description || !data.amount || !data.dueDate) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：描述、金额、到期日期',
      })
      return
    }
    const term = db.createPaymentTerm({
      ...data,
      contractId: id,
    })
    res.status(201).json({
      success: true,
      data: term,
      message: '付款节点创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建付款节点失败',
    })
  }
})

router.put('/payment-terms/:termId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { termId } = req.params
    const data = req.body as Partial<PaymentTerm>
    const updated = db.updatePaymentTerm(termId, data)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    res.json({
      success: true,
      data: updated,
      message: '付款节点更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新付款节点失败',
    })
  }
})

router.put('/payment-terms/:termId/invoice', async (req: Request, res: Response): Promise<void> => {
  try {
    const { termId } = req.params
    const { invoiceStatus, invoiceAmount, invoiceDate, invoiceNo } = req.body as {
      invoiceStatus?: 'uninvoiced' | 'invoiced' | 'partial_invoiced'
      invoiceAmount?: number
      invoiceDate?: string
      invoiceNo?: string
    }
    const existing = db.getPaymentTermById(termId)
    if (!existing) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    const updateData: Partial<PaymentTerm> = {}
    if (invoiceStatus !== undefined) updateData.invoiceStatus = invoiceStatus
    if (invoiceAmount !== undefined) updateData.invoiceAmount = invoiceAmount
    if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate
    if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo

    const updated = db.updatePaymentTerm(termId, updateData)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    res.json({
      success: true,
      data: updated,
      message: '开票信息更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新开票信息失败',
    })
  }
})

router.delete('/payment-terms/:termId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { termId } = req.params
    const term = db.getPaymentTermById(termId)
    if (!term) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    if (term.status === 'paid' || term.paidAmount > 0) {
      res.status(400).json({
        success: false,
        error: '该付款节点已产生付款，无法删除',
      })
      return
    }
    const deleted = db.deletePaymentTerm(termId)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '付款节点删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除付款节点失败',
    })
  }
})

router.get('/payment-terms/:termId/detail', async (req: Request, res: Response): Promise<void> => {
  try {
    const { termId } = req.params
    const term = db.getPaymentTermById(termId)
    if (!term) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    const paymentRecords = db.getPaymentRecordsByPaymentTermId(termId)
    const reminders = db.getRemindersByPaymentTerm(termId)
    const invoices = term.invoiceStatus !== 'uninvoiced'
      ? [
          {
            invoiceStatus: term.invoiceStatus,
            invoiceAmount: term.invoiceAmount,
            invoiceDate: term.invoiceDate,
            invoiceNo: term.invoiceNo,
          },
        ]
      : []

    res.json({
      success: true,
      data: {
        term,
        invoices,
        paymentRecords,
        reminders,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取付款节点详情失败',
    })
  }
})

router.post('/payment-terms/:termId/reminder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { termId } = req.params
    const term = db.getPaymentTermById(termId)
    if (!term) {
      res.status(404).json({
        success: false,
        error: '付款节点不存在',
      })
      return
    }
    const data = req.body as Omit<ReminderRecord, 'id' | 'paymentTermId' | 'createdAt'>
    if (!data.type || !data.content) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：类型、内容',
      })
      return
    }
    const reminder = db.createReminder({
      ...data,
      paymentTermId: termId,
    })
    res.status(201).json({
      success: true,
      data: reminder,
      message: '催款记录创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建催款记录失败',
    })
  }
})

export default router
