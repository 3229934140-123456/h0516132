import { useMemo } from 'react';
import { useStore, type Project } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, getProjectStatusText } from '@/utils/format';
import { FolderKanban, Building2, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectWithClient extends Project {
  clientName?: string;
  contractAmount?: number;
  receivedAmount?: number;
}

const statusGroups: { key: ProjectWithClient['status']; label: string; color: string }[] = [
  { key: 'planning', label: '规划中', color: 'bg-amber-100 text-amber-700' },
  { key: 'in_progress', label: '进行中', color: 'bg-forest-100 text-forest-700' },
  { key: 'on_hold', label: '已交付', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'completed', label: '已完成', color: 'bg-forest-700 text-white' },
];

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-forest-500">项目进度</span>
        <span className="font-medium text-forest-700">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-forest-100">
        <div
          className="h-full rounded-full bg-forest-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectWithClient }) {
  const navigate = useNavigate();
  const statusGroup = statusGroups.find((g) => g.key === project.status);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-forest-300"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-forest-600" />
            <h3 className="font-semibold text-forest-900 line-clamp-1">{project.name}</h3>
          </div>
          <Badge className={statusGroup?.color} variant="secondary">
            {getProjectStatusText(project.status)}
          </Badge>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-forest-600">
            <Building2 className="h-4 w-4 text-forest-400" />
            <span className="truncate">{project.clientName || '未关联客户'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="flex items-center gap-1 text-forest-500">
                <DollarSign className="h-3.5 w-3.5" />
                <span>合同金额</span>
              </div>
              <div className="font-semibold text-forest-800">
                {formatCurrency(project.contractAmount || 0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-forest-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>已收款</span>
              </div>
              <div className="font-semibold text-forest-700">
                {formatCurrency(project.receivedAmount || 0)}
              </div>
            </div>
          </div>
        </div>

        <ProgressBar progress={project.progress} />

        <div className="mt-4 flex items-center justify-between border-t border-forest-100 pt-3 text-xs text-forest-500">
          <span>开始: {new Date(project.startDate).toLocaleDateString('zh-CN')}</span>
          <div className="flex items-center gap-1 text-forest-600">
            查看详情 <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectList() {
  const { projects, clients, contracts, paymentTerms } = useStore();

  const projectsWithDetails: ProjectWithClient[] = useMemo(() => {
    return projects.map((project) => {
      const client = clients.find((c) => c.id === project.clientId);
      const contract = contracts.find((c) => c.id === project.contractId);
      const projectPayments = paymentTerms.filter((p) => p.contractId === project.contractId && p.status === 'paid');
      const receivedAmount = projectPayments.reduce((sum, p) => sum + p.paidAmount, 0);

      return {
        ...project,
        clientName: client?.name,
        contractAmount: contract?.amount || 0,
        receivedAmount,
      };
    });
  }, [projects, clients, contracts, paymentTerms]);

  const groupedProjects = useMemo(() => {
    return statusGroups.map((group) => ({
      ...group,
      projects: projectsWithDetails.filter((p) => p.status === group.key),
    }));
  }, [projectsWithDetails]);

  if (projectsWithDetails.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="暂无项目"
          description="还没有创建任何项目，点击下方按钮创建第一个项目。"
          actionLabel="创建项目"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-900">项目列表</h1>
        <p className="mt-1 text-sm text-forest-500">共 {projectsWithDetails.length} 个项目</p>
      </div>

      <div className="space-y-8">
        {groupedProjects.map((group) => (
          <div key={group.key}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-semibold text-forest-800">{group.label}</h2>
              <Badge className={group.color} variant="secondary">
                {group.projects.length}
              </Badge>
            </div>

            {group.projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-forest-200 bg-forest-50/30 p-6 text-center text-sm text-forest-400">
                暂无{group.label}的项目
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
