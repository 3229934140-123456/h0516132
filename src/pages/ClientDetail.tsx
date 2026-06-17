import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, getProjectStatusText, getContractStatusText } from '@/utils/format';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Handshake,
  DollarSign,
  FileText,
  FolderKanban,
  Edit3,
  Save,
  X,
  TrendingUp,
  Tag,
  ChevronRight,
} from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, projects, contracts, paymentTerms, paymentRecords, updateClient } = useStore();

  const client = clients.find((c) => c.id === id);
  const clientProjects = projects.filter((p) => p.clientId === id);
  const clientContracts = contracts.filter((c) => c.clientId === id);
  const clientContractIds = clientContracts.map((c) => c.id);
  const clientPayments = paymentRecords.filter((p) => clientContractIds.includes(p.contractId));

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: client?.name || '',
    contactPerson: client?.contactPerson || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    companyType: client?.companyType || '',
  });

  const stats = useMemo(() => {
    const totalContractAmount = clientContracts.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const activeProjects = clientProjects.filter((p) => p.status === 'in_progress').length;
    const completedProjects = clientProjects.filter((p) => p.status === 'completed').length;

    return {
      totalContractAmount,
      totalPaid,
      totalProjects: clientProjects.length,
      activeProjects,
      completedProjects,
      totalContracts: clientContracts.length,
    };
  }, [clientContracts, clientPayments, clientProjects]);

  if (!client) {
    return (
      <div className="p-6">
        <EmptyState title="客户不存在" description="未找到对应的客户信息" />
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditForm({
      name: client.name,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
      address: client.address,
      companyType: client.companyType,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    const success = await updateClient(id, editForm);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-forest-900">{client.name}</h1>
          <p className="mt-1 text-sm text-forest-500">{client.contactPerson}</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={handleStartEdit}>
            <Edit3 className="h-4 w-4" />
            编辑信息
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
              取消
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4" />
              保存
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-100">
                <DollarSign className="h-5 w-5 text-forest-600" />
              </div>
              <div>
                <p className="text-xs text-forest-500">累计合同金额</p>
                <p className="text-lg font-bold text-forest-900">{formatCurrency(stats.totalContractAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-forest-500">累计已收款</p>
                <p className="text-lg font-bold text-forest-900">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Handshake className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-forest-500">合作项目数</p>
                <p className="text-lg font-bold text-forest-900">{stats.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-forest-500">合同总数</p>
                <p className="text-lg font-bold text-forest-900">{stats.totalContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-forest-600" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-forest-600">公司名称</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-forest-600">联系人姓名</label>
                  <input
                    type="text"
                    value={editForm.contactPerson}
                    onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-forest-600">联系电话</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-forest-600">电子邮箱</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-forest-600">公司地址</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="请输入地址"
                    className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-forest-600">公司类型</label>
                  <input
                    type="text"
                    value={editForm.companyType}
                    onChange={(e) => setEditForm({ ...editForm, companyType: e.target.value })}
                    placeholder="请输入公司类型"
                    className="w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">公司名称</p>
                    <p className="text-forest-800">{client.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">联系人</p>
                    <p className="text-forest-800">{client.contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">电话</p>
                    <p className="text-forest-800">{client.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">邮箱</p>
                    <p className="text-forest-800 break-all">{client.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">地址</p>
                    <p className="text-forest-800">{client.address || '暂无地址信息'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">公司类型</p>
                    <p className="text-forest-800">{client.companyType || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-forest-400" />
                  <div>
                    <p className="text-xs text-forest-500">创建时间</p>
                    <p className="text-forest-800">{formatDate(client.createdAt, 'full')}</p>
                  </div>
                </div>
                <div className="border-t border-forest-100 pt-4">
                  <p className="mb-2 text-xs text-forest-500">
                    <Tag className="mr-1 inline h-3 w-3" />
                    客户标签
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">合作中</Badge>
                    {stats.totalContractAmount > 100000 && <Badge variant="default">高价值</Badge>}
                    {stats.totalProjects > 3 && <Badge className="bg-amber-500 text-white">重点客户</Badge>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-forest-600" />
                合作历史项目
                <Badge variant="secondary" className="ml-2">
                  {clientProjects.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientProjects.length === 0 ? (
                <EmptyState
                  title="暂无合作项目"
                  description="该客户还没有关联任何项目"
                  className="min-h-[200px]"
                />
              ) : (
                <div className="space-y-3">
                  {clientProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-forest-200 p-4 transition-all hover:bg-forest-50"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-100">
                          <FolderKanban className="h-5 w-5 text-forest-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-forest-900">{project.name}</h4>
                          <p className="text-xs text-forest-500">
                            {formatDate(project.startDate, 'date')}
                            {project.endDate ? ` - ${formatDate(project.endDate, 'date')}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-forest-800">进度 {project.progress}%</p>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-forest-100">
                            <div
                              className="h-full rounded-full bg-forest-600"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <StatusBadge
                          status={
                            project.status === 'in_progress'
                              ? 'active'
                              : project.status === 'completed'
                              ? 'completed'
                              : project.status === 'on_hold'
                              ? 'paused'
                              : 'pending'
                          }
                          category="project"
                        />
                        <ChevronRight className="h-5 w-5 text-forest-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-forest-600" />
                合同记录
                <Badge variant="secondary" className="ml-2">
                  {clientContracts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientContracts.length === 0 ? (
                <EmptyState
                  title="暂无合同记录"
                  description="该客户还没有关联任何合同"
                  className="min-h-[200px]"
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-forest-200">
                  <table className="w-full text-sm">
                    <thead className="bg-forest-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-forest-700">合同名称</th>
                        <th className="px-4 py-3 text-right font-medium text-forest-700">金额</th>
                        <th className="px-4 py-3 text-center font-medium text-forest-700">开始日期</th>
                        <th className="px-4 py-3 text-center font-medium text-forest-700">结束日期</th>
                        <th className="px-4 py-3 text-center font-medium text-forest-700">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest-100">
                      {clientContracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-forest-50/50">
                          <td className="px-4 py-3 text-forest-900">{contract.name}</td>
                          <td className="px-4 py-3 text-right font-medium text-forest-800">
                            {formatCurrency(contract.amount)}
                          </td>
                          <td className="px-4 py-3 text-center text-forest-600">
                            {formatDate(contract.startDate, 'date')}
                          </td>
                          <td className="px-4 py-3 text-center text-forest-600">
                            {formatDate(contract.endDate, 'date')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              status={
                                contract.status === 'active'
                                  ? 'active'
                                  : contract.status === 'completed'
                                  ? 'completed'
                                  : contract.status === 'terminated'
                                  ? 'cancelled'
                                  : 'pending'
                              }
                              category="contract"
                              showIcon={false}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-forest-600" />
                累计金额统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-forest-50 p-4 text-center">
                    <p className="text-xs text-forest-500">合同总金额</p>
                    <p className="mt-1 text-xl font-bold text-forest-900">
                      {formatCurrency(stats.totalContractAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-forest-50 p-4 text-center">
                    <p className="text-xs text-forest-500">已收款</p>
                    <p className="mt-1 text-xl font-bold text-forest-700">{formatCurrency(stats.totalPaid)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 text-center">
                    <p className="text-xs text-amber-600">待收款</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">
                      {formatCurrency(stats.totalContractAmount - stats.totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="text-xs text-blue-600">回款率</p>
                    <p className="mt-1 text-xl font-bold text-blue-700">
                      {stats.totalContractAmount > 0
                        ? Math.round((stats.totalPaid / stats.totalContractAmount) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                {stats.totalContractAmount > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-forest-600">收款进度</span>
                      <span className="font-medium text-forest-700">
                        {formatCurrency(stats.totalPaid)} / {formatCurrency(stats.totalContractAmount)}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-forest-100">
                      <div
                        className="h-full rounded-full bg-forest-600 transition-all"
                        style={{ width: `${(stats.totalPaid / stats.totalContractAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
