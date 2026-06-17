import { useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatLargeNumber, calculatePercentage } from '@/utils/format';
import {
  Wallet,
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  type TooltipProps,
} from 'recharts';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}

function SummaryCard({ title, value, icon, color, subValue }: SummaryCardProps) {
  return (
    <Card className="border-forest-100">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-forest-500 font-medium">{title}</p>
            <p className="mt-2 text-2xl font-bold text-forest-900 font-lora">{value}</p>
            {subValue && (
              <p className="mt-1 text-xs text-emerald-green flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {subValue}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthlyData {
  month: string;
  revenue: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-forest-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-forest-900 mb-1">{label}</p>
        <p className="text-sm text-deep-green font-semibold">
          收入: {formatCurrency(payload[0].value as number)}
        </p>
      </div>
    );
  }
  return null;
}

interface ClientRankItem {
  rank: number;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  contractCount: number;
  percentage: number;
}

function ClientRankRow({ item }: { item: ClientRankItem }) {
  const rankColors = [
    'bg-amber-gold text-white',
    'bg-gray-400 text-white',
    'bg-amber-600 text-white',
  ];

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-forest-50 rounded-lg transition-colors">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          item.rank <= 3 ? rankColors[item.rank - 1] : 'bg-forest-100 text-forest-600'
        }`}
      >
        {item.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-forest-900 truncate">{item.clientName}</p>
          <p className="text-sm font-semibold text-deep-green ml-2 shrink-0">
            {formatCurrency(item.totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-forest-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-deep-green to-emerald-green rounded-full"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          <span className="text-xs text-forest-500 shrink-0 w-16 text-right">
            {formatLargeNumber(item.paidAmount)} 已收
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="secondary" className="text-[10px] py-0">
            {item.contractCount} 个合同
          </Badge>
          <span className="text-[10px] text-forest-400">
            回款率 {calculatePercentage(item.paidAmount, item.totalAmount)}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface ProjectStatusData {
  status: string;
  name: string;
  value: number;
  color: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: '#D4A853' },
  in_progress: { label: '进行中', color: '#2D8659' },
  completed: { label: '已完成', color: '#0D4F3C' },
  on_hold: { label: '已暂停', color: '#9CA3AF' },
};

export default function Statistics() {
  const { clients, contracts, projects, paymentTerms, fetchAll } = useStore();

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const summary = useMemo(() => {
    const totalContractAmount = contracts.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = paymentTerms
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.paidAmount, 0);
    const totalPending = paymentTerms
      .filter((p) => p.status === 'pending' || p.status === 'invoiced')
      .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    return {
      totalContractAmount,
      totalPaid,
      totalPending,
      clientCount: clients.length,
    };
  }, [contracts, paymentTerms, clients]);

  const monthlyData = useMemo((): MonthlyData[] => {
    const now = new Date();
    const months: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthLabel = `${year}年${month + 1}月`;

      const monthPaid = paymentTerms
        .filter((p) => {
          if (p.status !== 'paid' || !p.paidDate) return false;
          const d = new Date(p.paidDate);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((sum, p) => sum + p.paidAmount, 0);

      months.push({ month: monthLabel, revenue: monthPaid });
    }

    return months;
  }, [paymentTerms]);

  const clientRanking = useMemo((): ClientRankItem[] => {
    const maxAmount = Math.max(
      ...clients.map((c) => {
        const clientContracts = contracts.filter((ct) => ct.clientId === c.id);
        return clientContracts.reduce((sum, ct) => sum + ct.amount, 0);
      }),
      1
    );

    const ranking = clients.map((client, index) => {
      const clientContracts = contracts.filter((ct) => ct.clientId === client.id);
      const totalAmount = clientContracts.reduce((sum, ct) => sum + ct.amount, 0);
      const contractPayments = paymentTerms.filter(
        (p) => p.clientName === client.name && p.status === 'paid'
      );
      const paidAmount = contractPayments.reduce((sum, p) => sum + p.paidAmount, 0);

      return {
        rank: index + 1,
        clientName: client.name,
        totalAmount,
        paidAmount,
        contractCount: clientContracts.length,
        percentage: calculatePercentage(totalAmount, maxAmount),
      };
    });

    ranking.sort((a, b) => b.totalAmount - a.totalAmount);
    ranking.forEach((item, index) => {
      item.rank = index + 1;
    });

    return ranking.slice(0, 5);
  }, [clients, contracts, paymentTerms]);

  const projectStatusData = useMemo((): ProjectStatusData[] => {
    const statusCounts = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => {
      const config = STATUS_CONFIG[status] || { label: status, color: '#9CA3AF' };
      return {
        status,
        name: config.label,
        value: count,
        color: config.color,
      };
    });
  }, [projects]);

  const renderCustomLegend = (props: { payload?: Array<{ value: string; color: string }> }) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-forest-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-900 font-lora">收入统计</h1>
        <p className="text-sm text-forest-500 mt-1">全面了解您的业务收入和项目情况</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="合同总金额"
          value={formatCurrency(summary.totalContractAmount)}
          icon={<FileText className="w-5 h-5 text-white" />}
          color="bg-deep-green"
          subValue={`${contracts.length} 份合同`}
        />
        <SummaryCard
          title="累计实收"
          value={formatCurrency(summary.totalPaid)}
          icon={<Wallet className="w-5 h-5 text-white" />}
          color="bg-emerald-green"
          subValue={`回款率 ${calculatePercentage(summary.totalPaid, summary.totalContractAmount)}%`}
        />
        <SummaryCard
          title="待收金额"
          value={formatCurrency(summary.totalPending)}
          icon={<TrendingUp className="w-5 h-5 text-amber-700" />}
          color="bg-amber-100"
          subValue={`${paymentTerms.filter(p => p.status === 'pending' || p.status === 'invoiced').length} 笔待收`}
        />
        <SummaryCard
          title="合作客户"
          value={summary.clientCount.toString()}
          icon={<Users className="w-5 h-5 text-white" />}
          color="bg-[#3f7b56]"
          subValue="活跃客户"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-deep-green" />
              <CardTitle className="text-base">月度收入趋势</CardTitle>
            </div>
            <Badge variant="secondary">近 6 个月</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D4F3C" stopOpacity={1} />
                      <stop offset="50%" stopColor="#2D8659" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3f7b56" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickFormatter={(value: number) => formatLargeNumber(value)}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13, 79, 60, 0.05)' }} />
                  <Bar
                    dataKey="revenue"
                    name="收入"
                    fill="url(#colorRevenue)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-deep-green" />
              <CardTitle className="text-base">项目状态统计</CardTitle>
            </div>
            <Badge variant="outline">{projects.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} 个`, '项目数']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend content={renderCustomLegend} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {projectStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-forest-500">{item.name}</span>
                  <span className="font-semibold text-forest-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-gold" />
            <CardTitle className="text-base">客户收入排行榜</CardTitle>
          </div>
          <Badge variant="amber">TOP 5</Badge>
        </CardHeader>
        <CardContent>
          {clientRanking.length > 0 ? (
            <div className="space-y-1">
              {clientRanking.map((item) => (
                <ClientRankRow key={item.clientName} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-forest-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无客户数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
