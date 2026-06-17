import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, type PaymentTermWithDetails, type ProjectFile as StoreProjectFile } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaymentModal } from '@/components/ui/PaymentModal';
import { formatCurrency, formatDate, getProjectStatusText } from '@/utils/format';
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
} from 'lucide-react';

type FileCategory = 'requirement' | 'deliverable';

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
  } = useStore();

  const project = projects.find((p) => p.id === id);
  const client = clients.find((c) => c.id === project?.clientId);
  const contract = contracts.find((c) => c.id === project?.contractId);

  const [activeTab, setActiveTab] = useState<FileCategory>('requirement');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<PaymentTermWithDetails | null>(null);

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

  const handleUpload = async () => {
    if (!id) return;
    const fileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/figma', 'application/zip'];
    const extMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/figma': '.fig',
      'application/zip': '.zip',
    };
    const randomFileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    const randomExt = extMap[randomFileType] || '.bin';
    const type = activeTab;
    const prefix = type === 'requirement' ? '需求文档' : '交付文件';
    const count = projectFiles.filter((f) => f.type === type).length + 1;

    await uploadProjectFile(id, {
      name: `${prefix} ${count}`,
      fileName: `${prefix}_${Date.now()}${randomExt}`,
      fileSize: Math.floor(Math.random() * 9000000) + 1000000,
      fileType: randomFileType,
      type,
      uploadedBy: project?.manager || '当前用户',
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!id) return;
    await deleteProjectFile(id, fileId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState title="项目不存在" description="未找到对应的项目信息" />
      </div>
    );
  }

  const filteredFiles = projectFiles.filter((f) => f.type === activeTab);

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
                            <div className="flex items-baseline gap-3">
                              <span className="text-lg font-bold text-forest-900">
                                应收 {formatCurrency(term.amount)}
                              </span>
                              <span className="text-sm text-forest-600">
                                / 已收 {formatCurrency(term.paidAmount || 0)}
                              </span>
                            </div>
                            {remaining > 0 && (
                              <p className="mt-1 text-sm font-semibold text-red-600">
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-forest-600" />
              文件管理
            </CardTitle>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4" />
              上传文件
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant={activeTab === 'requirement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('requirement')}
            >
              需求文档
              <Badge variant="secondary" className="ml-2">
                {projectFiles.filter((f) => f.type === 'requirement').length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'deliverable' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('deliverable')}
            >
              交付文件
              <Badge variant="secondary" className="ml-2">
                {projectFiles.filter((f) => f.type === 'deliverable').length}
              </Badge>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <EmptyState
              title={`暂无${activeTab === 'requirement' ? '需求文档' : '交付文件'}`}
              description="点击上方按钮上传文件"
            />
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-forest-200 p-4 hover:bg-forest-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-100">
                      <File className="h-5 w-5 text-forest-600" />
                    </div>
                    <div>
                      <p className="font-medium text-forest-900">{file.name}</p>
                      <p className="text-xs text-forest-500">
                        {file.fileName} · {formatFileSize(file.fileSize)} · {formatDate(file.uploadedAt, 'date')} · {file.uploadedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
    </div>
  );
}
