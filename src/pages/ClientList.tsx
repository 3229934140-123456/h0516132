import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  Search,
  Building2,
  User,
  Phone,
  Mail,
  Handshake,
  DollarSign,
  Tag,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientWithStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  companyType: string;
  address: string;
  createdAt: string;
  projectCount: number;
  totalAmount: number;
  tags: string[];
}

const availableTags = ['VIP', '重点客户', '新客户', '老客户', '高价值', '潜在客户', '合作中', '待跟进'];

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-500 text-white',
  重点客户: 'bg-forest-700 text-white',
  新客户: 'bg-blue-100 text-blue-700',
  老客户: 'bg-forest-100 text-forest-700',
  高价值: 'bg-purple-100 text-purple-700',
  潜在客户: 'bg-amber-100 text-amber-700',
  合作中: 'bg-forest-100 text-forest-700',
  待跟进: 'bg-yellow-100 text-yellow-700',
};

const getClientTags = (clientId: string, createdAt: string, projectCount: number, totalAmount: number): string[] => {
  const tags: string[] = [];
  const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceCreated < 30) tags.push('新客户');
  if (daysSinceCreated > 180) tags.push('老客户');
  if (projectCount > 3) tags.push('重点客户');
  if (projectCount > 0) tags.push('合作中');
  if (totalAmount > 100000) tags.push('高价值');
  if (totalAmount > 500000) tags.push('VIP');
  if (projectCount === 0) tags.push('潜在客户');
  if (projectCount === 0 && daysSinceCreated > 60) tags.push('待跟进');

  if (tags.length === 0) tags.push('合作中');
  return tags.slice(0, 3);
};

function ClientCard({ client }: { client: ClientWithStats }) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-forest-300"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100">
              <Building2 className="h-6 w-6 text-forest-600" />
            </div>
            <div>
              <h3 className="font-semibold text-forest-900">{client.name}</h3>
              <p className="text-sm text-forest-500">{client.contactPerson}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-forest-400" />
        </div>

        <div className="mb-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-forest-600">
            <Phone className="h-4 w-4 text-forest-400" />
            <span>{client.phone || '暂无电话'}</span>
          </div>
          <div className="flex items-center gap-2 text-forest-600">
            <Mail className="h-4 w-4 text-forest-400" />
            <span className="truncate">{client.email || '暂无邮箱'}</span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 border-t border-forest-100 pt-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-forest-500">
              <Handshake className="h-3.5 w-3.5" />
              <span>合作次数</span>
            </div>
            <div className="text-lg font-semibold text-forest-800">{client.projectCount}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-forest-500">
              <DollarSign className="h-3.5 w-3.5" />
              <span>累计金额</span>
            </div>
            <div className="text-lg font-semibold text-forest-700">{formatCurrency(client.totalAmount)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {client.tags.map((tag) => (
            <Badge key={tag} className={tagColors[tag] || 'bg-gray-100 text-gray-600'} variant="secondary">
              <Tag className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-3 border-t border-forest-100 pt-3 text-xs text-forest-400">
          客户创建于 {formatDate(client.createdAt, 'date')}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientList() {
  const { clients, projects, contracts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const clientsWithStats: ClientWithStats[] = useMemo(() => {
    return clients.map((client) => {
      const clientProjects = projects.filter((p) => p.clientId === client.id);
      const clientContracts = contracts.filter((c) => c.clientId === client.id);
      const totalAmount = clientContracts.reduce((sum, c) => sum + c.amount, 0);
      const tags = getClientTags(client.id, client.createdAt, clientProjects.length, totalAmount);

      return {
        ...client,
        projectCount: clientProjects.length,
        totalAmount,
        tags,
      };
    });
  }, [clients, projects, contracts]);

  const filteredClients = useMemo(() => {
    return clientsWithStats.filter((client) => {
      const matchesSearch =
        searchQuery === '' ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => client.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [clientsWithStats, searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  if (clientsWithStats.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="暂无客户"
          description="还没有添加任何客户，点击下方按钮添加第一个客户。"
          actionLabel="添加客户"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-forest-900">客户列表</h1>
        <p className="mt-1 text-sm text-forest-500">共 {clientsWithStats.length} 位客户</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-forest-400" />
            <input
              type="text"
              placeholder="搜索客户名称、联系人、电话、邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-forest-200 bg-white py-2.5 pl-10 pr-10 text-sm text-forest-900 placeholder:text-forest-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={() => setShowFilter(!showFilter)}>
            <Filter className="h-4 w-4" />
            筛选
            {selectedTags.length > 0 && (
              <Badge variant="default" className="ml-2">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </div>

        {showFilter && (
          <div className="mt-4 rounded-lg border border-forest-200 bg-forest-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-forest-800">按标签筛选</h4>
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  清除筛选
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? tagColors[tag] || 'bg-forest-700 text-white'
                      : 'border border-forest-200 bg-white text-forest-600 hover:border-forest-300 hover:bg-forest-50'
                  }`}
                >
                  <Tag className="mr-1 inline h-3 w-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {(searchQuery || selectedTags.length > 0) && (
          <div className="mt-3 text-sm text-forest-500">
            找到 <span className="font-semibold text-forest-700">{filteredClients.length}</span> 个匹配的客户
          </div>
        )}
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          title="未找到匹配的客户"
          description="尝试修改搜索条件或清除筛选"
          actionLabel="清除筛选"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
