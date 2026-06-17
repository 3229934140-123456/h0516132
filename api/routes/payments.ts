import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import type { PaymentRecord } from '../../shared/types.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractId } = req.query
    let records = db.getPaymentRecords()
    if (contractId) {
      records = records.filter((r) => r.contractId === contractId)
    }
    records = records.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    const recordsWithDetails = records.map((r) => {
      const contract = db.getContractById(r.contractId)
      const client = contract ? db.getClientById(contract.clientId) : undefined
      return {
        ...r,
        contractNo: contract?.contractNo,
        contractName: contract?.name,
        clientName: client?.name,
      }
    })
    res.json({
      success: true,
      data: recordsWithDetails,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取付款记录失败',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const record = db.getPaymentRecordById(id)
    if (!record) {
      res.status(404).json({
        success: false,
        error: '付款记录不存在',
      })
      return
    }
    const contract = db.getContractById(record.contractId)
    const client = contract ? db.getClientById(contract.clientId) : undefined
    const paymentTerm = record.paymentTermId ? db.getPaymentTermById(record.paymentTermId) : undefined
    res.json({
      success: true,
      data: {
        ...record,
        contract,
        client,
        paymentTerm,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取付款详情失败',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<PaymentRecord, 'id' | 'createdAt'>
    if (!data.contractId || !data.amount || !data.paymentDate || !data.paymentMethod) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：合同ID、金额、付款日期、付款方式',
      })
      return
    }
    const contract = db.getContractById(data.contractId)
    if (!contract) {
      res.status(400).json({
        success: false,
        error: '关联合同不存在',
      })
      return
    }
    const record = db.createPaymentRecord(data)
    if (data.paymentTermId) {
      const term = db.getPaymentTermById(data.paymentTermId)
      if (term) {
        const newPaidAmount = term.paidAmount + data.amount
        let newStatus = term.status
        if (newPaidAmount >= term.amount) {
          newStatus = 'paid'
        } else if (newPaidAmount > 0) {
          newStatus = 'paid'
        }
        db.updatePaymentTerm(data.paymentTermId, {
          paidAmount: newPaidAmount,
          paidDate: data.paymentDate,
          status: newStatus,
        })
      }
    }
    res.status(201).json({
      success: true,
      data: record,
      message: '付款记录创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建付款记录失败',
    })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const record = db.getPaymentRecordById(id)
    if (!record) {
      res.status(404).json({
        success: false,
        error: '付款记录不存在',
      })
      return
    }
    if (record.paymentTermId) {
      const term = db.getPaymentTermById(record.paymentTermId)
      if (term) {
        const newPaidAmount = Math.max(0, term.paidAmount - record.amount)
        let newStatus = term.status
        if (newPaidAmount <= 0) {
          newStatus = 'pending'
        }
        db.updatePaymentTerm(record.paymentTermId, {
          paidAmount: newPaidAmount,
          paidDate: newPaidAmount > 0 ? term.paidDate : undefined,
          status: newStatus,
        })
      }
    }
    const deleted = db.deletePaymentRecord(id)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '付款记录不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '付款记录删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除付款记录失败',
    })
  }
})

export default router
