import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, type PaymentTermWithDetails } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
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

interface PaymentTerm {
  id: string;
  termNo: number;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
}

interface ProjectFile {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  category: 'requirement' | 'delivery';
}

type FileCategory = 'requirement' | 'delivery';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, clients, contracts, paymentTerms: storePaymentTerms } = useStore();

  const project = projects.find((p) => p.id === id);
  const client = clients.find((c) => c.id === project?.clientId);
  const contract = contracts.find((c) => c.id === project?.contractId);

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(() => {
    if (contract) {
      const contractPayments = storePaymentTerms.filter((p) => p.contractId === contract.id);
      if (contractPayments.length > 0) {
        return contractPayments.map((p, idx) => ({
          id: p.id,
          termNo: p.termNo || idx + 1,
          description: p.description || `第${idx + 1}期款项`,
          amount: p.amount,
          dueDate: p.dueDate,
          status: (p.status === 'invoiced' ? 'pending' : p.status) as 'pending' | 'paid' | 'overdue',
        }));
      }
    }
    return [
      { id: '1', termNo: 1, description: '首付款', amount: (contract?.amount || 0) * 0.3, dueDate: new Date().toISOString(), status: 'paid' },
      { id: '2', termNo: 2, description: '中期款', amount: (contract?.amount || 0) * 0.4, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
      { id: '3', termNo: 3, description: '尾款', amount: (contract?.amount || 0) * 0.3, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
    ];
  });

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
    { id: 'f1', name: '需求规格说明书', fileName: 'requirements_v1.0.pdf', fileSize: 2048000, uploadedAt: new Date().toISOString(), category: 'requirement' },
    { id: 'f2', name: '原型设计稿', fileName: 'prototype.fig', fileSize: 5120000, uploadedAt: new Date().toISOString(), category: 'requirement' },
    { id: 'f3', name: '第一版交付', fileName: 'delivery_v1.zip', fileSize: 10240000, uploadedAt: new Date().toISOString(), category: 'delivery' },
  ]);

  const [activeTab, setActiveTab] = useState<FileCategory>('requirement');

  const totalPaid = useMemo(
    () => paymentTerms.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    [paymentTerms],
  );

  const handleMarkPaid = (termId: string) => {
    setPaymentTerms((prev) =>
      prev.map((t) => (t.id === termId ? { ...t, status: 'paid' as const } : t)),
    );
  };

  const handleSendReminder = (termId: string) => {
    const term = paymentTerms.find((t) => t.id === termId);
    if (term) {
      alert(`已向客户发送付款提醒：${term.description} - ${formatCurrency(term.amount)}`);
    }
  };

  const handleUpload = () => {
    const newFile: ProjectFile = {
      id: `f${Date.now()}`,
      name: activeTab === 'requirement' ? `新需求文档 ${projectFiles.length + 1}` : `新交付文件 ${projectFiles.length + 1}`,
      fileName: `uploaded_${Date.now()}.pdf`,
      fileSize: Math.floor(Math.random() * 5000000) + 1000000,
      uploadedAt: new Date().toISOString(),
      category: activeTab,
    };
    setProjectFiles((prev) => [...prev, newFile]);
  };

  const handleDeleteFile = (fileId: string) => {
    setProjectFiles((prev) => prev.filter((f) => f.id !== fileId));
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

  const filteredFiles = projectFiles.filter((f) => f.category === activeTab);

  const getPaymentStatusBadge = (status: PaymentTerm['status']) => {
    const config = {
      paid: { className: 'bg-forest-100 text-forest-700', label: '已收款', icon: CheckCircle2 },
      pending: { className: 'bg-amber-100 text-amber-700', label: '待收款', icon: Clock },
      overdue: { className: 'bg-red-100 text-red-700', label: '已逾期', icon: Bell },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
      <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.className}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{c.label}</span>
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
                <span className="text-forest-800">未指定</span>
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
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-forest-200" />
              <div className="space-y-6">
                {paymentTerms.map((term, index) => (
                  <div key={term.id} className="relative pl-10">
                    <div
                      className={`absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        term.status === 'paid'
                          ? 'border-forest-600 bg-forest-600'
                          : term.status === 'overdue'
                          ? 'border-red-500 bg-white'
                          : 'border-amber-500 bg-white'
                      }`}
                    >
                      {term.status === 'paid' && <CheckCircle2 className="h-3 w-3 text-white" />}
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
                        {getPaymentStatusBadge(term.status)}
                      </div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-2xl font-bold text-forest-900">{formatCurrency(term.amount)}</span>
                      </div>
                      {term.status !== 'paid' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleMarkPaid(term.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                            标记已收款
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSendReminder(term.id)}>
                            <Bell className="h-4 w-4" />
                            发送提醒
                          </Button>
                        </div>
                      )}
                      {term.status === 'paid' && (
                        <p className="text-xs text-forest-500">已完成收款</p>
                      )}
                    </div>
                    {index < paymentTerms.length - 1 && <div className="h-4" />}
                  </div>
                ))}
              </div>
            </div>
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
                {projectFiles.filter((f) => f.category === 'requirement').length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('delivery')}
            >
              交付文件
              <Badge variant="secondary" className="ml-2">
                {projectFiles.filter((f) => f.category === 'delivery').length}
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
                        {file.fileName} · {formatFileSize(file.fileSize)} · {formatDate(file.uploadedAt, 'date')}
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
    </div>
  );
}
