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
    if (data.paymentTermId) {
      const term = db.getPaymentTermById(data.paymentTermId)
      if (!term) {
        res.status(400).json({
          success: false,
          error: '付款节点不存在',
        })
        return
      }
      const remaining = term.amount - term.paidAmount
      if (remaining <= 0) {
        res.status(400).json({
          success: false,
          error: '该付款节点已全额结清，不能再收款',
        })
        return
      }
      if (data.amount > remaining) {
        res.status(400).json({
          success: false,
          error: `收款金额不能超过剩余应收金额 ¥${remaining.toFixed(2)}`,
        })
        return
      }
    }
    const record = db.createPaymentRecord(data)
    let updatedTerm = undefined
    if (data.paymentTermId) {
      const term = db.getPaymentTermById(data.paymentTermId)
      if (term) {
        const newPaidAmount = term.paidAmount + data.amount
        let newStatus = term.status
        let newPaidDate = term.paidDate
        if (newPaidAmount >= term.amount) {
          newStatus = 'paid'
          newPaidDate = data.paymentDate
        } else if (newPaidAmount > 0) {
          newStatus = term.status
        }
        updatedTerm = db.updatePaymentTerm(data.paymentTermId, {
          paidAmount: newPaidAmount,
          paidDate: newPaidDate,
          status: newStatus,
        })
      }
    }
    const isFullPayment = data.paymentTermId
      ? (db.getPaymentTermById(data.paymentTermId)?.paidAmount || 0) >= (db.getPaymentTermById(data.paymentTermId)?.amount || 0)
      : false
    const remainingAfter = data.paymentTermId
      ? (db.getPaymentTermById(data.paymentTermId)?.amount || 0) - (db.getPaymentTermById(data.paymentTermId)?.paidAmount || 0)
      : 0
    res.status(201).json({
      success: true,
      data: {
        record,
        paymentTerm: updatedTerm,
        isFullPayment,
        remainingAfter,
      },
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
