import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = db.getClients()
    const contracts = db.getContracts()
    const projects = db.getProjects()
    const paymentRecords = db.getPaymentRecords()
    const paymentTerms = db.getPaymentTerms()

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const totalPaidAmount = paymentRecords.reduce((sum, r) => sum + r.amount, 0)
    const totalReceivable = paymentTerms
      .filter((t) => t.status !== 'paid')
      .reduce((sum, t) => sum + (t.amount - t.paidAmount), 0)
    const totalOverdue = paymentTerms
      .filter((t) => {
        const due = new Date(t.dueDate)
        return t.status !== 'paid' && due < now
      })
      .reduce((sum, t) => sum + (t.amount - t.paidAmount), 0)

    const thisMonthPaid = paymentRecords
      .filter((r) => {
        const d = new Date(r.paymentDate)
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth
      })
      .reduce((sum, r) => sum + r.amount, 0)

    const thisYearPaid = paymentRecords
      .filter((r) => new Date(r.paymentDate).getFullYear() === currentYear)
      .reduce((sum, r) => sum + r.amount, 0)

    const monthlyData: { month: string; revenue: number; clients: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const monthPaid = paymentRecords
        .filter((r) => {
          const pd = new Date(r.paymentDate)
          return pd.getFullYear() === y && pd.getMonth() === m
        })
        .reduce((sum, r) => sum + r.amount, 0)
      const monthLabel = `${y}年${m + 1}月`
      monthlyData.push({ month: monthLabel, revenue: monthPaid, clients: 0 })
    }

    res.json({
      totalClients: clients.length,
      activeContracts: contracts.filter((c) => c.status === 'active').length,
      completedProjects: projects.filter((p) => p.status === 'completed').length,
      totalRevenue: totalPaidAmount,
      pendingPayments: totalReceivable,
      overduePayments: totalOverdue,
      thisMonthRevenue: thisMonthPaid,
      thisYearRevenue: thisYearPaid,
      monthlyData,
    })
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = db.getClients()
    const contracts = db.getContracts()
    const projects = db.getProjects()
    const paymentRecords = db.getPaymentRecords()
    const paymentTerms = db.getPaymentTerms()

    const totalContractAmount = contracts.reduce((sum, c) => sum + c.amount, 0)
    const totalPaidAmount = paymentRecords.reduce((sum, r) => sum + r.amount, 0)
    const totalReceivable = paymentTerms
      .filter((t) => t.status !== 'paid')
      .reduce((sum, t) => sum + (t.amount - t.paidAmount), 0)

    const contractStatusCounts = contracts.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const projectStatusCounts = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const paymentTermStatusCounts = paymentTerms.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    res.json({
      success: true,
      data: {
        clients: {
          total: clients.length,
        },
        contracts: {
          total: contracts.length,
          totalAmount: totalContractAmount,
          statusCounts: contractStatusCounts,
        },
        projects: {
          total: projects.length,
          statusCounts: projectStatusCounts,
        },
        payments: {
          totalPaid: totalPaidAmount,
          totalReceivable,
          termStatusCounts: paymentTermStatusCounts,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取概览统计失败',
    })
  }
})

router.get('/contracts-by-client', async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = db.getClients()
    const data = clients.map((client) => {
      const contracts = db.getContractsByClientId(client.id)
      const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0)
      const paymentRecords = contracts.flatMap((c) => db.getPaymentRecordsByContractId(c.id))
      const paidAmount = paymentRecords.reduce((sum, r) => sum + r.amount, 0)
      return {
        clientId: client.id,
        clientName: client.name,
        contractCount: contracts.length,
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
      }
    })
    data.sort((a, b) => b.totalAmount - a.totalAmount)
    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取客户合同统计失败',
    })
  }
})

router.get('/payment-trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = '6' } = req.query
    const monthCount = parseInt(months as string, 10)
    const now = new Date()
    const trendData: Array<{
      month: string
      label: string
      contractAmount: number
      paidAmount: number
    }> = []

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      const label = `${year}年${month}月`

      const contracts = db.getContracts().filter((c) => {
        const signed = new Date(c.signedDate)
        return signed.getFullYear() === year && signed.getMonth() + 1 === month
      })
      const contractAmount = contracts.reduce((sum, c) => sum + c.amount, 0)

      const payments = db.getPaymentRecords().filter((r) => {
        const pd = new Date(r.paymentDate)
        return pd.getFullYear() === year && pd.getMonth() + 1 === month
      })
      const paidAmount = payments.reduce((sum, r) => sum + r.amount, 0)

      trendData.push({
        month: monthStr,
        label,
        contractAmount,
        paidAmount,
      })
    }

    res.json({
      success: true,
      data: trendData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取付款趋势失败',
    })
  }
})

router.get('/project-progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = db.getProjects()
    const data = projects.map((p) => {
      const client = db.getClientById(p.clientId)
      const contract = db.getContractById(p.contractId)
      return {
        projectId: p.id,
        projectName: p.name,
        clientName: client?.name,
        contractNo: contract?.contractNo,
        status: p.status,
        progress: p.progress,
        manager: p.manager,
        startDate: p.startDate,
        endDate: p.endDate,
      }
    })
    data.sort((a, b) => b.progress - a.progress)
    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取项目进度失败',
    })
  }
})

router.get('/receivable-list', async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentTerms = db.getPaymentTerms()
    const today = new Date()
    const data = paymentTerms
      .filter((t) => t.status !== 'paid')
      .map((t) => {
        const contract = db.getContractById(t.contractId)
        const client = contract ? db.getClientById(contract.clientId) : undefined
        const dueDate = new Date(t.dueDate)
        const isOverdue = t.status === 'overdue' || (dueDate < today && t.paidAmount < t.amount)
        const daysOverdue = isOverdue
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        return {
          termId: t.id,
          termNo: t.termNo,
          description: t.description,
          contractId: t.contractId,
          contractNo: contract?.contractNo,
          contractName: contract?.name,
          clientName: client?.name,
          dueDate: t.dueDate,
          totalAmount: t.amount,
          paidAmount: t.paidAmount,
          remainingAmount: t.amount - t.paidAmount,
          status: isOverdue ? 'overdue' : t.status,
          daysOverdue,
        }
      })
    data.sort((a, b) => b.daysOverdue - a.daysOverdue || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取应收款列表失败',
    })
  }
})

router.get('/reconciliation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { month } = req.query
    const monthStr = month as string | undefined

    const isInMonth = (dateStr?: string): boolean => {
      if (!monthStr || !dateStr) return true
      const d = new Date(dateStr)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}` === monthStr
    }

    const paymentTerms = db.getPaymentTerms()
    const paymentRecords = db.getPaymentRecords()
    const clients = db.getClients()
    const contracts = db.getContracts()

    const filteredTerms = paymentTerms.filter((t) => {
      if (!monthStr) return true
      return isInMonth(t.invoiceDate) || paymentRecords.some((r) => r.paymentTermId === t.id && isInMonth(r.paymentDate))
    })

    const filteredRecords = paymentRecords.filter((r) => isInMonth(r.paymentDate))

    const termRecordsMap = new Map<string, number>()
    filteredRecords.forEach((r) => {
      if (r.paymentTermId) {
        termRecordsMap.set(r.paymentTermId, (termRecordsMap.get(r.paymentTermId) || 0) + r.amount)
      }
    })

    const byTerm = filteredTerms.map((t) => {
      const contract = db.getContractById(t.contractId)
      const client = contract ? db.getClientById(contract.clientId) : undefined
      const paidAmount = termRecordsMap.get(t.id) || t.paidAmount || 0
      const remainingAmount = t.amount - paidAmount

      let invoicedUnpaid = 0
      let uninvoicedPaid = 0
      let partialReceived = 0

      const invoiceAmount = t.invoiceAmount || 0
      if (t.invoiceStatus === 'invoiced' || t.invoiceStatus === 'partial_invoiced') {
        if (paidAmount < invoiceAmount) {
          invoicedUnpaid = invoiceAmount - paidAmount
        }
      }
      if ((!t.invoiceStatus || t.invoiceStatus === 'uninvoiced') && paidAmount > 0) {
        uninvoicedPaid = paidAmount
      }
      if (paidAmount > 0 && paidAmount < t.amount) {
        partialReceived = paidAmount
      }

      return {
        termId: t.id,
        termNo: t.termNo,
        description: t.description,
        contractNo: contract?.contractNo,
        clientName: client?.name,
        invoiceStatus: t.invoiceStatus,
        invoiceAmount: t.invoiceAmount || 0,
        invoiceDate: t.invoiceDate,
        invoiceNo: t.invoiceNo,
        termAmount: t.amount,
        paidAmount,
        remainingAmount,
        status: t.status,
        invoicedUnpaid,
        uninvoicedPaid,
        partialReceived,
      }
    })

    const contractMap = new Map<string, {
      contractId: string
      contractNo: string
      contractName: string
      clientName: string
      invoicedAmount: number
      receivedAmount: number
      invoicedUnpaid: number
      uninvoicedPaid: number
      partialReceived: number
    }>()

    byTerm.forEach((t) => {
      const contract = contracts.find((c) => c.contractNo === t.contractNo)
      if (!contract) return
      if (!contractMap.has(contract.id)) {
        const client = clients.find((c) => c.id === contract.clientId)
        contractMap.set(contract.id, {
          contractId: contract.id,
          contractNo: contract.contractNo,
          contractName: contract.name,
          clientName: client?.name || '',
          invoicedAmount: 0,
          receivedAmount: 0,
          invoicedUnpaid: 0,
          uninvoicedPaid: 0,
          partialReceived: 0,
        })
      }
      const entry = contractMap.get(contract.id)!
      entry.invoicedAmount += t.invoiceAmount
      entry.receivedAmount += t.paidAmount
      entry.invoicedUnpaid += t.invoicedUnpaid
      entry.uninvoicedPaid += t.uninvoicedPaid
      entry.partialReceived += t.partialReceived
    })

    const byContract = Array.from(contractMap.values())

    const clientMap = new Map<string, {
      clientId: string
      clientName: string
      invoicedAmount: number
      receivedAmount: number
      invoicedUnpaid: number
      uninvoicedPaid: number
      partialReceived: number
    }>()

    byContract.forEach((c) => {
      const client = clients.find((cl) => cl.name === c.clientName)
      const clientId = client?.id || c.clientName
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          clientName: c.clientName,
          invoicedAmount: 0,
          receivedAmount: 0,
          invoicedUnpaid: 0,
          uninvoicedPaid: 0,
          partialReceived: 0,
        })
      }
      const entry = clientMap.get(clientId)!
      entry.invoicedAmount += c.invoicedAmount
      entry.receivedAmount += c.receivedAmount
      entry.invoicedUnpaid += c.invoicedUnpaid
      entry.uninvoicedPaid += c.uninvoicedPaid
      entry.partialReceived += c.partialReceived
    })

    const byClient = Array.from(clientMap.values())

    const summary = {
      totalInvoiced: byClient.reduce((sum, c) => sum + c.invoicedAmount, 0),
      totalReceived: byClient.reduce((sum, c) => sum + c.receivedAmount, 0),
      invoicedUnpaid: byClient.reduce((sum, c) => sum + c.invoicedUnpaid, 0),
      uninvoicedPaid: byClient.reduce((sum, c) => sum + c.uninvoicedPaid, 0),
      partialReceived: byClient.reduce((sum, c) => sum + c.partialReceived, 0),
    }

    res.json({
      success: true,
      data: {
        summary,
        byClient,
        byContract,
        byTerm,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取对账数据失败',
    })
  }
})

export default router
