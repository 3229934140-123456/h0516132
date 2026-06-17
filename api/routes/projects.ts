import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import type { Project, ProjectFile } from '../../shared/types.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, contractId, status } = req.query
    let projects = db.getProjects()
    if (clientId) {
      projects = projects.filter((p) => p.clientId === clientId)
    }
    if (contractId) {
      projects = projects.filter((p) => p.contractId === contractId)
    }
    if (status) {
      projects = projects.filter((p) => p.status === status)
    }
    res.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取项目列表失败',
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const project = db.getProjectById(id)
    if (!project) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      })
      return
    }
    const client = db.getClientById(project.clientId)
    const contract = db.getContractById(project.contractId)
    const files = db.getProjectFilesByProjectId(id)
    res.json({
      success: true,
      data: {
        ...project,
        client,
        contract,
        files,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取项目详情失败',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
    if (!data.contractId || !data.clientId || !data.name) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：合同ID、客户ID、项目名称',
      })
      return
    }
    const client = db.getClientById(data.clientId)
    if (!client) {
      res.status(400).json({
        success: false,
        error: '关联客户不存在',
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
    const project = db.createProject(data)
    res.status(201).json({
      success: true,
      data: project,
      message: '项目创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建项目失败',
    })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body as Partial<Project>
    const updated = db.updateProject(id, data)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      })
      return
    }
    res.json({
      success: true,
      data: updated,
      message: '项目更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新项目失败',
    })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const files = db.getProjectFilesByProjectId(id)
    if (files.length > 0) {
      res.status(400).json({
        success: false,
        error: '该项目下存在文件，无法删除',
      })
      return
    }
    const deleted = db.deleteProject(id)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '项目删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除项目失败',
    })
  }
})

router.get('/:id/files', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const project = db.getProjectById(id)
    if (!project) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      })
      return
    }
    const files = db.getProjectFilesByProjectId(id)
    res.json({
      success: true,
      data: files,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取项目文件失败',
    })
  }
})

router.post('/:id/files', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const project = db.getProjectById(id)
    if (!project) {
      res.status(404).json({
        success: false,
        error: '项目不存在',
      })
      return
    }
    const data = req.body as Omit<ProjectFile, 'id' | 'projectId' | 'uploadedAt'>
    if (!data.name || !data.fileName) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：文件名称、文件原名',
      })
      return
    }
    const file = db.createProjectFile({
      ...data,
      type: data.type || 'other',
      projectId: id,
    })
    res.status(201).json({
      success: true,
      data: file,
      message: '文件上传成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '上传文件失败',
    })
  }
})

router.delete('/files/:fileId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params
    const file = db.getProjectFileById(fileId)
    if (!file) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      })
      return
    }
    const deleted = db.deleteProjectFile(fileId)
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '文件删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除文件失败',
    })
  }
})

router.put('/files/:fileId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params
    const file = db.getProjectFileById(fileId)
    if (!file) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      })
      return
    }
    const data = req.body as Partial<Pick<ProjectFile, 'name' | 'version' | 'isFinal' | 'remark'>>
    const updated = db.updateProjectFile(fileId, data)
    if (!updated) {
      res.status(404).json({
        success: false,
        error: '文件不存在',
      })
      return
    }
    res.json({
      success: true,
      data: updated,
      message: '文件更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新文件失败',
    })
  }
})

export default router
