import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import type { Client } from '../../shared/types.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = db.getClients()
    res.json({
      success: true,
      data: clients,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取客户列表失败',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const client = db.getClientById(id)
    if (!client) {
      res.status(404).json({
        success: false,
        error: '客户不存在',
      })
      return
    }
    const contracts = db.getContractsByClientId(id)
    const projects = db.getProjectsByClientId(id)
    res.json({
      success: true,
      data: {
        ...client,
        contracts,
        projects,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取客户详情失败',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
    if (!data.name || !data.contactPerson || !data.phone) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：名称、联系人、电话',
      })
      return
    }
    const client = db.createClient(data)
    res.status(201).json({
      success: true,
      data: client,
      message: '客户创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建客户失败',
    })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body as Partial<Client>
    const updated = db.updateClient(id, data)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '客户不存在',
      })
      return
    }
    res.json({
      success: true,
      data: updated,
      message: '客户更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新客户失败',
    })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contracts = db.getContractsByClientId(id)
    if (contracts.length > 0) {
      res.status(400).json({
        success: false,
        error: '该客户下存在合同，无法删除',
      })
      return
    }
    const deleted = db.deleteClient(id)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '客户不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '客户删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除客户失败',
    })
  }
})

export default router
