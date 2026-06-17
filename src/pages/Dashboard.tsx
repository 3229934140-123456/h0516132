import { useEffect, useMemo } from 'react';
import { useStore, type Project } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  Wallet,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Users,
  FileText,
  CreditCard,
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle2,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <Card className="border-forest-100">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-forest-500 font-medium">{title}</p>
            <p className="mt-2 text-2xl font-bold text-forest-900 font-lora">{value}</p>
            {trend && (
              <p className="mt-1 text-xs text-forest-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-green" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-forest-200 bg-white hover:bg-forest-50 hover:border-forest-300 transition-all group"
    >
      <div className="p-2.5 rounded-lg bg-deep-green/10 text-deep-green group-hover:bg-deep-green group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium text-forest-700">{label}</span>
    </button>
  );
}

interface ProjectProgressItemProps {
  project: Project;
  clientName?: string;
}

function ProjectProgressItem({ project, clientName }: ProjectProgressItemProps) {
  const statusMap: Record<string, 'active' | 'pending' | 'completed' | 'paused'> = {
    in_progress: 'active',
    planning: 'pending',
    completed: 'completed',
    on_hold: 'paused',
  };

  return (
    <div className="p-4 rounded-xl border border-forest-100 bg-white hover:border-forest-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-forest-900 truncate">{project.name}</h4>
          <p className="text-sm text-forest-500 mt-0.5 truncate">{clientName || '未知客户'}</p>
        </div>
        <StatusBadge status={statusMap[project.status] || 'pending'} category="project" className="shrink-0 ml-3" />
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-forest-500">项目进度</span>
          <span className="text-sm font-semibold text-deep-green">{project.progress}%</span>
        </div>
        <div className="h-2 bg-forest-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-deep-green to-emerald-green rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-forest-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(project.startDate, 'date')}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          查看详情
        </span>
      </div>
    </div>
  );
}

interface NotificationItemProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  meta: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'amber';
}

function NotificationItem({ icon, iconBg, iconColor, title, description, meta, badge, badgeVariant }: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-forest-50 transition-colors">
      <div className={`p-2 rounded-lg shrink-0 ${iconBg} ${iconColor}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-forest-900 truncate">{title}</h4>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        <p className="text-xs text-forest-500 mt-0.5 truncate">{description}</p>
        <p className="text-xs text-forest-400 mt-1">{meta}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-forest-300 shrink-0 mt-1" />
    </div>
  );
}

export default function Dashboard() {
  const { clients, contracts, projects, paymentTerms, paymentRecords, fetchAll } = useStore();

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const yearPaid = paymentRecords
      .filter((r) => {
        const d = new Date(r.paymentDate);
        return d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const pending = paymentTerms
      .filter((p) => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    const overdue = paymentTerms
      .filter((p) => {
        const due = new Date(p.dueDate);
        return p.status !== 'paid' && due < now;
      })
      .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    const monthPaid = paymentRecords
      .filter((r) => {
        const d = new Date(r.paymentDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    return { yearPaid, pending, overdue, monthPaid };
  }, [paymentRecords, paymentTerms]);

  const inProgressProjects = useMemo(() => {
    return projects
      .filter((p) => p.status === 'in_progress')
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  }, [projects]);

  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || '';
  };

  const notifications = useMemo(() => {
    const now = new Date();

    const duePayments: NotificationItemProps[] = paymentTerms
      .filter((p) => p.status !== 'paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2)
      .map((p) => ({
        icon: <CreditCard className="w-4 h-4" />,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-700',
        title: '到期付款提醒',
        description: `${p.clientName || '未知客户'} - ${formatCurrency(p.amount - p.paidAmount)}`,
        meta: `到期日: ${formatDate(p.dueDate, 'date')}`,
        badge: '待付款',
        badgeVariant: 'amber' as const,
      }));

    const overduePayments: NotificationItemProps[] = paymentTerms
      .filter((p) => {
        const due = new Date(p.dueDate);
        return p.status !== 'paid' && due < now;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2)
      .map((p) => {
        const days = Math.floor((now.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-700',
          title: '逾期欠款警告',
          description: `${p.clientName || '未知客户'} - ${formatCurrency(p.amount - p.paidAmount)}`,
          meta: `已逾期 ${days} 天`,
          badge: '已逾期',
          badgeVariant: 'default' as const,
        };
      });

    const pendingContracts: NotificationItemProps[] = contracts
      .filter((c) => c.status === 'draft')
      .slice(0, 2)
      .map((c) => ({
        icon: <FileText className="w-4 h-4" />,
        iconBg: 'bg-forest-100',
        iconColor: 'text-deep-green',
        title: '待确认合同',
        description: `${getClientName(c.clientId)} - ${c.name}`,
        meta: `金额: ${formatCurrency(c.amount)}`,
        badge: '待签署',
        badgeVariant: 'secondary' as const,
      }));

    return [...duePayments, ...overduePayments, ...pendingContracts];
  }, [paymentTerms, contracts, clients]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-900 font-lora">仪表盘</h1>
        <p className="text-sm text-forest-500 mt-1">欢迎回来，这是您的业务概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="年度实收"
          value={formatCurrency(stats.yearPaid)}
          icon={<Wallet className="w-5 h-5 text-white" />}
          color="bg-deep-green"
          trend="较去年同期 +12.5%"
        />
        <StatCard
          title="待收金额"
          value={formatCurrency(stats.pending)}
          icon={<Clock className="w-5 h-5 text-amber-700" />}
          color="bg-amber-100"
          trend={`${paymentTerms.filter(p => p.status !== 'paid').length} 笔待收`}
        />
        <StatCard
          title="逾期欠款"
          value={formatCurrency(stats.overdue)}
          icon={<AlertTriangle className="w-5 h-5 text-red-700" />}
          color="bg-red-100"
          trend={`${paymentTerms.filter(p => {
            const due = new Date(p.dueDate);
            return p.status !== 'paid' && due < new Date();
          }).length} 笔逾期`}
        />
        <StatCard
          title="本月收入"
          value={formatCurrency(stats.monthPaid)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-emerald-green"
          trend="月度目标 78%"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <QuickAction icon={<Plus className="w-5 h-5" />} label="新增客户" />
            <QuickAction icon={<FileText className="w-5 h-5" />} label="创建合同" />
            <QuickAction icon={<CreditCard className="w-5 h-5" />} label="登记收款" />
            <QuickAction icon={<Calendar className="w-5 h-5" />} label="新建项目" />
            <QuickAction icon={<Users className="w-5 h-5" />} label="客户管理" />
            <QuickAction icon={<Bell className="w-5 h-5" />} label="消息中心" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">进行中项目</CardTitle>
            <Button variant="ghost" size="sm" className="text-deep-green">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {inProgressProjects.length > 0 ? (
              <div className="space-y-3">
                {inProgressProjects.map((project) => (
                  <ProjectProgressItem
                    key={project.id}
                    project={project}
                    clientName={getClientName(project.clientId)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-forest-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无进行中的项目</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">提醒通知</CardTitle>
            <Badge variant="amber">{notifications.length}</Badge>
          </CardHeader>
          <CardContent className="px-3">
            {notifications.length > 0 ? (
              <div className="space-y-1 -mx-3">
                {notifications.map((item, index) => (
                  <NotificationItem key={index} {...item} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-forest-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无提醒通知</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
