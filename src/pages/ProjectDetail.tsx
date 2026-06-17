import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, type PaymentTermWithDetails, type ProjectFile as StoreProjectFile } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaymentModal } from '@/components/ui/PaymentModal';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { formatCurrency, formatDate, getProjectStatusText } from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Bell,
  Upload,
  Trash2,
  FolderOpen,
  File,
  Clock,
  DollarSign,
  Building2,
  Edit3,
  Star,
} from 'lucide-react';

type TypeFilter = 'all' | 'requirement' | 'deliverable' | 'other';
type VersionFilter = 'all' | string;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    projects,
    clients,
    contracts,
    paymentTerms: storePaymentTerms,
    projectFiles: storeProjectFiles,
    fetchProjectFiles,
    uploadProjectFile,
    deleteProjectFile,
    updateProjectFile,
  } = useStore();

  const project = projects.find((p) => p.id === id);
  const client = clients.find((c) => c.id === project?.clientId);
  const contract = contracts.find((c) => c.id === project?.contractId);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [versionFilter, setVersionFilter] = useState<VersionFilter>('all');
  const [onlyFinal, setOnlyFinal] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<PaymentTermWithDetails | null>(null);
  const [editingFile, setEditingFile] = useState<StoreProjectFile | null>(null);
  const [editVersion, setEditVersion] = useState('');
  const [editIsFinal, setEditIsFinal] = useState(false);
  const [editRemark, setEditRemark] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      void fetchProjectFiles(id);
    }
  }, [id, fetchProjectFiles]);

  const paymentTerms = useMemo(() => {
    if (contract) {
      return storePaymentTerms.filter((p) => p.contractId === contract.id);
    }
    return [];
  }, [contract, storePaymentTerms]);

  const projectFiles = useMemo(() => {
    if (id && storeProjectFiles[id]) {
      return storeProjectFiles[id];
    }
    return [];
  }, [id, storeProjectFiles]);

  const availableVersions = useMemo(() => {
    const versions = new Set(projectFiles.map((f) => f.version));
    return Array.from(versions).sort();
  }, [projectFiles]);

  const filteredFiles = useMemo(() => {
    return projectFiles.filter((f) => {
      if (typeFilter !== 'all' && f.type !== typeFilter) return false;
      if (versionFilter !== 'all' && f.version !== versionFilter) return false;
      if (onlyFinal && !f.isFinal) return false;
      return true;
    });
  }, [projectFiles, typeFilter, versionFilter, onlyFinal]);

  const totalPaid = useMemo(
    () => paymentTerms.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
    [paymentTerms],
  );

  const handleMarkPaid = (term: PaymentTermWithDetails) => {
    setSelectedTerm(term);
    setPaymentModalOpen(true);
  };

  const handleSendReminder = (termId: string) => {
    const term = paymentTerms.find((t) => t.id === termId);
    if (term) {
      const remaining = term.amount - (term.paidAmount || 0);
      alert(`已向客户发送付款提醒：${term.description} - ${formatCurrency(remaining)}`);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;

    const type = typeFilter === 'all' ? 'other' : typeFilter;
    const files = Array.from(e.target.files);

    for (const file of files) {
      await uploadProjectFile(id, {
        name: file.name,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        type,
        uploadedBy: project?.manager || '当前用户',
        version: 'v1.0',
        isFinal: false,
        remark: '',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!id) return;
    await deleteProjectFile(id, fileId);
  };

  const handleEditFile = (file: StoreProjectFile) => {
    setEditingFile(file);
    setEditVersion(file.version);
    setEditIsFinal(file.isFinal);
    setEditRemark(file.remark);
  };

  const handleSaveEdit = async () => {
    if (!id || !editingFile) return;
    const success = await updateProjectFile(id, editingFile.id, {
      version: editVersion,
      isFinal: editIsFinal,
      remark: editRemark,
    });
    if (success) {
      setEditingFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeLabel = (type: TypeFilter | 'requirement' | 'deliverable' | 'other') => {
    switch (type) {
      case 'requirement': return '需求文档';
      case 'deliverable': return '交付文件';
      case 'other': return '其他';
      default: return '全部';
    }
  };

  const getUploadButtonText = () => {
    if (typeFilter === 'all') return '上传文件';
    return `上传${getTypeLabel(typeFilter)}`;
  };

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState title="项目不存在" description="未找到对应的项目信息" />
      </div>
    );
  }

  const getPaymentStatusBadge = (term: PaymentTermWithDetails) => {
    const remaining = term.amount - (term.paidAmount || 0);
    const isPaid = remaining <= 0;
    const isOverdue = term.status === 'overdue';

    if (isPaid) {
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2.5 py-1 text-xs font-medium text-forest-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>已结清</span>
        </div>
      );
    }
    if (isOverdue) {
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          <Bell className="h-3.5 w-3.5" />
          <span>已逾期</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3.5 w-3.5" />
        <span>待收款</span>
      </div>
    );
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-forest-200 bg-white px-3 py-2 text-sm text-forest-900 placeholder:text-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2";
  const labelClass = "block text-sm font-medium text-forest-700 mb-1.5";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-forest-900">{project.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-forest-500">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {client?.name || '未关联客户'}
            </span>
            <StatusBadge status={project.status === 'in_progress' ? 'active' : project.status === 'completed' ? 'completed' : project.status === 'on_hold' ? 'paused' : 'pending'} category="project" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-forest-600" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between">
                <span className="text-forest-500">项目状态</span>
                <Badge variant="secondary">{getProjectStatusText(project.status)}</Badge>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-forest-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  开始日期
                </span>
                <span className="text-forest-800">{formatDate(project.startDate, 'date')}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-forest-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  结束日期
                </span>
                <span className="text-forest-800">{project.endDate ? formatDate(project.endDate, 'date') : '-'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-forest-500 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  负责人
                </span>
                <span className="text-forest-800">{project.manager || '未指定'}</span>
              </div>
              <div className="border-t border-forest-100 pt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-forest-500 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    合同金额
                  </span>
                  <span className="font-semibold text-forest-900">{formatCurrency(contract?.amount || 0)}</span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-forest-500">已收款</span>
                  <span className="font-semibold text-forest-700">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-forest-100">
                  <div
                    className="h-full rounded-full bg-forest-600"
                    style={{ width: `${contract?.amount ? (totalPaid / contract.amount) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-forest-500">
                  收款进度: {contract?.amount ? Math.round((totalPaid / contract.amount) * 100) : 0}%
                </p>
              </div>
            </div>
            {project.description && (
              <div className="border-t border-forest-100 pt-4">
                <p className="mb-2 text-sm text-forest-500">项目描述</p>
                <p className="text-sm text-forest-700">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-forest-600" />
              付款节点
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentTerms.length === 0 ? (
              <EmptyState title="暂无付款节点" description="该合同未设置付款节点" />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-forest-200" />
                <div className="space-y-6">
                  {paymentTerms.map((term, index) => {
                    const remaining = term.amount - (term.paidAmount || 0);
                    const isPaid = remaining <= 0;
                    const isOverdue = term.status === 'overdue';
                    return (
                      <div key={term.id} className="relative pl-10">
                        <div
                          className={`absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            isPaid
                              ? 'border-forest-600 bg-forest-600'
                              : isOverdue
                              ? 'border-red-500 bg-white'
                              : 'border-amber-500 bg-white'
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div className="rounded-lg border border-forest-200 bg-white p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-forest-900">
                                第{term.termNo}期 - {term.description}
                              </h4>
                              <p className="mt-1 text-xs text-forest-500">
                                到期日期: {formatDate(term.dueDate, 'date')}
                              </p>
                            </div>
                            {getPaymentStatusBadge(term)}
                          </div>
                          <div className="mb-3">
                            <div className="flex items-baseline gap-3 mb-2">
                              <span className="text-lg font-bold text-forest-900">
                                应收 {formatCurrency(term.amount)}
                              </span>
                              <span className="text-sm text-forest-600">
                                / 已收 {formatCurrency(term.paidAmount || 0)}
                              </span>
                            </div>
                            {(term.paidAmount || 0) > 0 && (
                              <div className="mb-2">
                                <div className="h-2 w-full bg-forest-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-300",
                                      isPaid ? "bg-forest-600" : "bg-amber-500"
                                    )}
                                    style={{ width: `${((term.paidAmount || 0) / term.amount) * 100}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-xs text-forest-500">
                                  收款进度: {Math.round(((term.paidAmount || 0) / term.amount) * 100)}%
                                </p>
                              </div>
                            )}
                            {remaining > 0 && (
                              <p className="text-sm font-semibold text-red-600">
                                剩余未收 {formatCurrency(remaining)}
                              </p>
                            )}
                          </div>
                          {!isPaid && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" onClick={() => handleMarkPaid(term)}>
                                <CheckCircle2 className="h-4 w-4" />
                                标记收款
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleSendReminder(term.id)}>
                                <Bell className="h-4 w-4" />
                                发送提醒
                              </Button>
                            </div>
                          )}
                          {isPaid && (
                            <p className="text-xs text-forest-500">已完成收款</p>
                          )}
                        </div>
                        {index < paymentTerms.length - 1 && <div className="h-4" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-forest-600" />
              文件管理
            </CardTitle>
            <Button onClick={handleUploadClick}>
              <Upload className="h-4 w-4" />
              {getUploadButtonText()}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              {(['all', 'requirement', 'deliverable', 'other'] as TypeFilter[]).map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(t)}
                >
                  {getTypeLabel(t)}
                  <Badge variant="secondary" className="ml-2">
                    {t === 'all'
                      ? projectFiles.length
                      : projectFiles.filter((f) => f.type === t).length}
                  </Badge>
                </Button>
              ))}
            </div>
            <div className="h-6 w-px bg-forest-200" />
            <select
              className={cn(inputClass, "h-9 w-auto min-w-[140px] py-1.5")}
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
            >
              <option value="all">全部版本</option>
              {availableVersions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-forest-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-forest-300 text-forest-600 focus:ring-forest-500"
                checked={onlyFinal}
                onChange={(e) => setOnlyFinal(e.target.checked)}
              />
              仅看最终版
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <EmptyState
              title="暂无文件"
              description="点击上方按钮上传文件，或调整筛选条件"
            />
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="rounded-lg border border-forest-200 p-4 hover:bg-forest-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-100">
                        <File className="h-5 w-5 text-forest-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-forest-900 truncate">{file.name}</p>
                          <Badge variant="outline" className="shrink-0">
                            {file.version}
                          </Badge>
                          {file.isFinal && (
                            <Badge className="shrink-0 bg-amber-100 text-amber-800 border-amber-200">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              最终版
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-forest-500">
                          {file.fileName} · {formatFileSize(file.fileSize)} · {formatDate(file.uploadedAt, 'date')} · {file.uploadedBy}
                        </p>
                        {file.remark && (
                          <p className="mt-2 text-sm text-forest-600 bg-forest-50 rounded px-2.5 py-1.5 border border-forest-100">
                            {file.remark}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFile(file)}
                      >
                        <Edit3 className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm">
                        下载
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedTerm(null);
        }}
        paymentTerm={selectedTerm}
      />

      <Modal
        open={!!editingFile}
        onClose={() => setEditingFile(null)}
        title="编辑文件信息"
        description={editingFile?.name}
      >
        <ModalBody className="space-y-4">
          <div>
            <label className={labelClass}>版本号</label>
            <input
              type="text"
              className={inputClass}
              value={editVersion}
              onChange={(e) => setEditVersion(e.target.value)}
              placeholder="如 v1.0"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-forest-700 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-forest-300 text-forest-600 focus:ring-forest-500"
                checked={editIsFinal}
                onChange={(e) => setEditIsFinal(e.target.checked)}
              />
              标记为最终版
            </label>
          </div>
          <div>
            <label className={labelClass}>备注</label>
            <textarea
              className={cn(inputClass, "h-24 resize-none py-2")}
              value={editRemark}
              onChange={(e) => setEditRemark(e.target.value)}
              placeholder="填写文件备注说明"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setEditingFile(null)}>
            取消
          </Button>
          <Button variant="default" onClick={handleSaveEdit}>
            保存
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
