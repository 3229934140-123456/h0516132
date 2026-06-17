import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Modal,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { PaymentModal } from "@/components/ui/PaymentModal";
import {
  useStore,
  type PaymentTermWithDetails,
} from "@/store/useStore";
import {
  formatCurrency,
  formatDate,
  exportToCSV,
  type CSVHeader,
} from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  CheckCircle2,
  Mail,
  Copy,
  CopyCheck,
  CreditCard,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  ChevronRight,
  FileDown,
  FileText,
  Receipt,
  ClipboardList,
  Users,
  FileSpreadsheet,
} from "lucide-react";

type TabKey = "pending" | "paid" | "reconciliation";
type InvoiceFilterKey = "all" | "invoiced_unpaid" | "uninvoiced";
type ReconciliationSubTab = "client" | "contract" | "term";

interface ReconciliationSummary {
  totalInvoiced: number;
  totalReceived: number;
  invoicedUnpaid: number;
  uninvoicedPaid: number;
  partialReceived: number;
}

interface ReconciliationByClient {
  clientId: string;
  clientName: string;
  invoicedAmount: number;
  receivedAmount: number;
  invoicedUnpaid: number;
  uninvoicedPaid: number;
  partialReceived: number;
}

interface ReconciliationByContract {
  contractId: string;
  contractNo: string;
  contractName: string;
  clientName: string;
  invoicedAmount: number;
  receivedAmount: number;
  invoicedUnpaid: number;
  uninvoicedPaid: number;
  partialReceived: number;
}

interface ReconciliationByTerm {
  termId: string;
  termNo: number;
  description: string;
  contractNo: string;
  clientName: string;
  invoiceStatus: string;
  invoiceAmount: number;
  invoiceDate?: string;
  invoiceNo?: string;
  termAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

interface ReconciliationData {
  summary: ReconciliationSummary;
  byClient: ReconciliationByClient[];
  byContract: ReconciliationByContract[];
  byTerm: ReconciliationByTerm[];
}

const paymentMethodText: Record<string, string> = {
  bank_transfer: "银行转账",
  cash: "现金",
  check: "支票",
  online: "在线支付",
  other: "其他",
};

const invoiceStatusText: Record<string, string> = {
  uninvoiced: "未开票",
  invoiced: "已开票",
  partial_invoiced: "部分开票",
};

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getInvoiceStatusBadge(status?: string): { label: string; className: string } {
  const statusMap: Record<string, { label: string; className: string }> = {
    uninvoiced: { label: "未开票", className: "bg-gray-100 text-gray-600" },
    invoiced: { label: "已开票", className: "bg-blue-100 text-blue-700" },
    partial_invoiced: { label: "部分开票", className: "bg-purple-100 text-purple-700" },
  };
  return statusMap[status || "uninvoiced"] || statusMap.uninvoiced;
}

function generateReminderEmail(term: PaymentTermWithDetails, daysOverdue: number): string {
  const contactPerson = term.contactPerson || "负责人";
  const clientName = term.clientName || "贵司";
  const projectName = term.projectName || term.contractName || "相关项目";
  const amount = formatCurrency(term.amount - (term.paidAmount || 0));
  const dueDateText = formatDate(term.dueDate, "date");

  const overdueText =
    daysOverdue > 0
      ? `该款项已逾期 ${daysOverdue} 天，`
      : "该款项即将于到期，";

  return `尊敬的 ${contactPerson}：

您好！

感谢贵司长期以来的支持与合作。

现就「${projectName}${term.contractNo ? `（合同编号：${term.contractNo}）` : ""}相关款项事宜，特此提醒如下：

根据合同约定，「${term.description}」款项 ${amount} 应于 ${dueDateText} 支付。${overdueText}请贵司尽快安排付款。

如款项支付信息：
• 项目名称：${projectName}
• 款项说明：${term.description}
• 应付金额：${amount}
• 到期日期：${dueDateText}

如贵司已安排付款，请忽略本邮件。如有任何疑问或需协商付款安排，请随时与我们联系。

感谢贵司的理解与支持，期待继续保持良好合作！

顺祝商祺！`;
}

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [{ value: "", label: "全部" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    options.push({ value: `${y}-${m}`, label: `${y}年${d.getMonth() + 1}月` });
  }
  return options;
}

export default function PaymentTracker() {
  const paymentTerms = useStore((s) => s.paymentTerms);
  const paymentRecords = useStore((s) => s.paymentRecords);
  const fetchPaymentTerms = useStore((s) => s.fetchPaymentTerms);
  const fetchPaymentRecords = useStore((s) => s.fetchPaymentRecords);
  const loading = useStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilterKey>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<PaymentTermWithDetails | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTerm, setEmailTerm] = useState<PaymentTermWithDetails | null>(null);
  const [copied, setCopied] = useState(false);

  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [reconciliationSubTab, setReconciliationSubTab] = useState<ReconciliationSubTab>("client");

  const fetchReconciliation = async (month?: string) => {
    setReconciliationLoading(true);
    try {
      const url = month
        ? `/api/statistics/reconciliation?month=${encodeURIComponent(month)}`
        : "/api/statistics/reconciliation";
      const res = await fetch(url);
      const result = await res.json();
      if (result.success && result.data) {
        setReconciliationData(result.data);
      }
    } catch {
      setReconciliationData(null);
    } finally {
      setReconciliationLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTerms();
    fetchPaymentRecords();
  }, [fetchPaymentTerms, fetchPaymentRecords]);

  useEffect(() => {
    if (activeTab === "reconciliation") {
      fetchReconciliation(selectedMonth || undefined);
    }
  }, [activeTab, selectedMonth]);

  const pendingTerms = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = paymentTerms.filter((t) => t.status !== "paid");

    if (invoiceFilter === "invoiced_unpaid") {
      filtered = filtered.filter((t) => t.invoiceStatus === "invoiced" || t.invoiceStatus === "partial_invoiced");
    } else if (invoiceFilter === "uninvoiced") {
      filtered = filtered.filter((t) => !t.invoiceStatus || t.invoiceStatus === "uninvoiced");
    }

    return filtered
      .map((t) => {
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        const overdue = t.status === "overdue" || due < today;
        const days = getDaysOverdue(t.dueDate);
        return { ...t, isOverdue: overdue, daysOverdue: days };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [paymentTerms, invoiceFilter]);

  const paidRecords = useMemo(() => {
    return [...paymentRecords].sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    );
  }, [paymentRecords]);

  const pendingStats = useMemo(() => {
    const total = pendingTerms.reduce(
      (sum, t) => sum + (t.amount - (t.paidAmount || 0)),
      0,
    );
    const overdueCount = pendingTerms.filter((t) => t.isOverdue).length;
    const overdueTotal = pendingTerms
      .filter((t) => t.isOverdue)
      .reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
    return { total, overdueCount, overdueTotal };
  }, [pendingTerms]);

  const paidStats = useMemo(() => {
    const total = paidRecords.reduce((sum, r) => sum + r.amount, 0);
    return { total, count: paidRecords.length };
  }, [paidRecords]);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const handleMarkPaid = (term: PaymentTermWithDetails) => {
    setSelectedTerm(term);
    setPaymentModalOpen(true);
  };

  const handleGenerateEmail = (term: PaymentTermWithDetails) => {
    setEmailTerm(term);
    setEmailModalOpen(true);
    setCopied(false);
  };

  const handleCopyEmail = async () => {
    if (!emailTerm) return;
    const days = getDaysOverdue(emailTerm.dueDate);
    const text = generateReminderEmail(emailTerm, days);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCSV = () => {
    if (!reconciliationData) return;

    const monthSuffix = selectedMonth || "全部";
    const filename = `对账报表-${monthSuffix}.csv`;

    if (reconciliationSubTab === "client") {
      const headers: CSVHeader<ReconciliationByClient>[] = [
        { key: "clientName", label: "客户名称" },
        { key: "invoicedAmount", label: "已开票" },
        { key: "receivedAmount", label: "已收款" },
        { key: "invoicedUnpaid", label: "已开票未收" },
        { key: "uninvoicedPaid", label: "未开票已收" },
        { key: "partialReceived", label: "部分收款" },
      ];
      exportToCSV(reconciliationData.byClient, headers, filename);
    } else if (reconciliationSubTab === "contract") {
      const headers: CSVHeader<ReconciliationByContract>[] = [
        { key: "contractNo", label: "合同编号" },
        { key: "contractName", label: "合同名称" },
        { key: "clientName", label: "客户" },
        { key: "invoicedAmount", label: "已开票" },
        { key: "receivedAmount", label: "已收款" },
        { key: "invoicedUnpaid", label: "已开票未收" },
        { key: "uninvoicedPaid", label: "未开票已收" },
        { key: "partialReceived", label: "部分收款" },
      ];
      exportToCSV(reconciliationData.byContract, headers, filename);
    } else {
      const headers: CSVHeader<ReconciliationByTerm>[] = [
        { key: "description", label: "节点描述" },
        { key: "contractNo", label: "合同" },
        { key: "clientName", label: "客户" },
        { key: "invoiceStatus", label: "开票状态" },
        { key: "invoiceAmount", label: "开票金额" },
        { key: "termAmount", label: "应收金额" },
        { key: "paidAmount", label: "已收金额" },
        { key: "remainingAmount", label: "剩余未收" },
      ];
      const data = reconciliationData.byTerm.map((t) => ({
        ...t,
        invoiceStatus: invoiceStatusText[t.invoiceStatus] || t.invoiceStatus,
      }));
      exportToCSV(data, headers, filename);
    }
  };

  const emailContent = emailTerm
    ? generateReminderEmail(emailTerm, getDaysOverdue(emailTerm.dueDate))
    : "";

  const MainTabButton = ({
    tab, label, count, icon: Icon,
  }: { tab: TabKey; label: string; count?: number; icon?: React.ComponentType<{ className?: string }> }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
        activeTab === tab
          ? "bg-forest-700 text-white shadow-sm"
          : "text-forest-600 hover:bg-forest-100",
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
            activeTab === tab ? "bg-white/20 text-white" : "bg-forest-200 text-forest-700",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );

  const SubTabButton = ({
    tab, label, icon: Icon,
  }: { tab: ReconciliationSubTab; label: string; icon?: React.ComponentType<{ className?: string }> }) => (
    <button
      onClick={() => setReconciliationSubTab(tab)}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        reconciliationSubTab === tab
          ? "bg-white text-forest-700 shadow-sm border border-forest-200"
          : "text-forest-500 hover:text-forest-700 hover:bg-white/50",
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );

  const SummaryCard = ({
    title, value, icon: Icon, color,
  }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) => (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-forest-500">{title}</p>
          <p className="mt-0.5 text-lg font-bold text-forest-900 tabular-nums">
            {formatCurrency(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-900">收款追踪</h1>
          <p className="mt-1 text-sm text-forest-500">
            管理合同应收款项与收款记录
          </p>
        </div>
      </div>

      {activeTab !== "reconciliation" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">待收总额</p>
                <p className="mt-0.5 text-xl font-bold text-forest-900 tabular-nums">
                  {formatCurrency(pendingStats.total)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">
                  逾期款项（{pendingStats.overdueCount}笔）
                </p>
                <p className="mt-0.5 text-xl font-bold text-red-600 tabular-nums">
                  {formatCurrency(pendingStats.overdueTotal)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-100">
                <CheckCircle2 className="h-6 w-6 text-forest-600" />
              </div>
              <div>
                <p className="text-sm text-forest-500">
                  已收款（{paidStats.count}笔）
                </p>
                <p className="mt-0.5 text-xl font-bold text-forest-900 tabular-nums">
                  {formatCurrency(paidStats.total)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <MainTabButton tab="pending" label="待收款" count={pendingTerms.length} icon={ClipboardList} />
              <MainTabButton tab="paid" label="已收款" count={paidRecords.length} icon={CheckCircle2} />
              <MainTabButton tab="reconciliation" label="对账视图" icon={FileSpreadsheet} />
            </div>

            {activeTab === "pending" && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInvoiceFilter("all")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    invoiceFilter === "all"
                      ? "bg-forest-100 text-forest-700"
                      : "text-forest-500 hover:bg-forest-50 hover:text-forest-700"
                  )}
                >
                  全部
                </button>
                <button
                  onClick={() => setInvoiceFilter("invoiced_unpaid")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    invoiceFilter === "invoiced_unpaid"
                      ? "bg-blue-100 text-blue-700"
                      : "text-forest-500 hover:bg-forest-50 hover:text-forest-700"
                  )}
                >
                  已开票未收款
                </button>
                <button
                  onClick={() => setInvoiceFilter("uninvoiced")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    invoiceFilter === "uninvoiced"
                      ? "bg-gray-100 text-gray-700"
                      : "text-forest-500 hover:bg-forest-50 hover:text-forest-700"
                  )}
                >
                  未开票
                </button>
              </div>
            )}

            {activeTab === "reconciliation" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm font-medium text-forest-700">月份：</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-lg border border-forest-200 bg-white px-3 py-1.5 text-sm text-forest-700 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
                  >
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleExportCSV}
                  disabled={!reconciliationData}
                >
                  <FileDown className="h-4 w-4" />
                  导出 CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {activeTab === "pending" && (
            <div className="space-y-3">
              {pendingTerms.length === 0 ? (
                <EmptyState
                  title="暂无待收款项"
                  description="所有付款节点均已结清，太棒了！"
                />
              ) : (
                pendingTerms.map((term) => {
                  const remaining = term.amount - (term.paidAmount || 0);
                  return (
                    <div
                      key={term.id}
                      className={cn(
                        "rounded-xl border p-5 transition-colors",
                        term.isOverdue
                          ? "border-red-200 bg-red-50/50"
                          : "border-forest-200 bg-white",
                      )}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-forest-900">
                              {term.description || "付款节点"}
                            </h3>
                            {term.termNo && (
                              <Badge variant="secondary">
                                第{term.termNo}期
                              </Badge>
                            )}
                            {term.isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                                逾期 {term.daysOverdue} 天
                              </span>
                            ) : (
                              <Badge variant="outline">
                                即将到期
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-forest-600">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {term.clientName}
                            </span>
                            {term.projectName && (
                              <span className="inline-flex items-center gap-1">
                                <ChevronRight className="h-3.5 w-3.5" />
                                {term.projectName}
                              </span>
                            )}
                            {term.contractNo && (
                              <span className="text-forest-400">
                                {term.contractNo}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="inline-flex items-center gap-1 text-forest-500">
                              <Calendar className="h-3.5 w-3.5" />
                              到期：{formatDate(term.dueDate, "date")}
                            </span>
                            <StatusBadge
                              status={
                                term.isOverdue ? "overdue" : "pending"
                              }
                              category="payment"
                            />
                            <Badge className={getInvoiceStatusBadge(term.invoiceStatus).className}>
                              {getInvoiceStatusBadge(term.invoiceStatus).label}
                            </Badge>
                            {term.invoiceNo && (
                              <span className="text-xs text-forest-400">
                                发票号：{term.invoiceNo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 md:flex-row md:items-center">
                          <div className="text-right space-y-1">
                            {(term.paidAmount || 0) > 0 && remaining > 0 && (
                              <div className="text-xs text-forest-500 mb-1">
                                <span className="text-forest-600 font-medium">已收 {formatCurrency(term.paidAmount || 0)}</span>
                                <span className="text-forest-400 mx-1">/</span>
                                <span>应收 {formatCurrency(term.amount)}</span>
                              </div>
                            )}
                            <p
                              className={cn(
                                "text-xl font-bold tabular-nums",
                                remaining > 0
                                  ? term.isOverdue
                                    ? "text-red-600"
                                    : "text-amber-600"
                                  : "text-forest-600",
                              )}
                            >
                              剩余 {formatCurrency(remaining)}
                            </p>
                            {(term.paidAmount || 0) > 0 && remaining > 0 && (
                              <div className="mt-2 h-1.5 w-32 bg-forest-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${((term.paidAmount || 0) / term.amount) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateEmail(term)}
                            >
                              <Mail className="h-4 w-4" />
                              催款邮件
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleMarkPaid(term)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              标记收款
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "paid" && (
            <div className="overflow-hidden rounded-xl border border-forest-200">
              {paidRecords.length === 0 ? (
                <EmptyState
                  title="暂无收款记录"
                  description="还没有任何收款记录"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-forest-200 bg-forest-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                          项目/合同
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                          客户
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                          金额
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                          日期
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                          付款方式
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                          备注
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest-100 bg-white">
                      {paidRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="transition-colors hover:bg-forest-50/50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-forest-900">
                                {record.contractName || "-"}
                              </span>
                              {record.contractNo && (
                                <span className="text-xs text-forest-500">
                                  {record.contractNo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-forest-700">
                              <User className="h-3.5 w-3.5 text-forest-400" />
                              {record.clientName || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-forest-900 tabular-nums">
                              {formatCurrency(record.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-forest-600">
                              <Calendar className="h-3.5 w-3.5 text-forest-400" />
                              {formatDate(record.paymentDate, "date")}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="inline-flex items-center gap-1.5 text-sm text-forest-700">
                              <CreditCard className="h-3.5 w-3.5 text-forest-400" />
                              {paymentMethodText[record.paymentMethod] ||
                                record.paymentMethod}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-forest-500">
                              {record.remark || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "reconciliation" && (
            <div className="space-y-5">
              {reconciliationLoading ? (
                <div className="py-12 text-center text-forest-500">加载中...</div>
              ) : !reconciliationData ? (
                <EmptyState title="暂无对账数据" description="请尝试选择其他月份" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <SummaryCard
                      title="已开票总额"
                      value={reconciliationData.summary.totalInvoiced}
                      icon={Receipt}
                      color="bg-blue-500"
                    />
                    <SummaryCard
                      title="已收款总额"
                      value={reconciliationData.summary.totalReceived}
                      icon={CheckCircle2}
                      color="bg-forest-600"
                    />
                    <SummaryCard
                      title="已开票未收"
                      value={reconciliationData.summary.invoicedUnpaid}
                      icon={AlertTriangle}
                      color="bg-amber-500"
                    />
                    <SummaryCard
                      title="未开票已收"
                      value={reconciliationData.summary.uninvoicedPaid}
                      icon={FileText}
                      color="bg-purple-500"
                    />
                    <SummaryCard
                      title="部分收款"
                      value={reconciliationData.summary.partialReceived}
                      icon={DollarSign}
                      color="bg-teal-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 rounded-xl bg-forest-50 p-2">
                    <SubTabButton tab="client" label="按客户" icon={Users} />
                    <SubTabButton tab="contract" label="按合同" icon={FileSpreadsheet} />
                    <SubTabButton tab="term" label="按付款节点" icon={ClipboardList} />
                  </div>

                  {reconciliationSubTab === "client" && (
                    <div className="overflow-hidden rounded-xl border border-forest-200">
                      {reconciliationData.byClient.length === 0 ? (
                        <EmptyState title="暂无客户对账数据" />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-forest-200 bg-forest-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  客户名称
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已开票
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已收款
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已开票未收
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  未开票已收
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  部分收款
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-forest-100 bg-white">
                              {reconciliationData.byClient.map((row) => (
                                <tr key={row.clientId} className="transition-colors hover:bg-forest-50/50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-forest-900">
                                      <Users className="h-4 w-4 text-forest-400" />
                                      {row.clientName}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-forest-700">
                                    {formatCurrency(row.invoicedAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-forest-700">
                                    {formatCurrency(row.receivedAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-amber-600">
                                    {formatCurrency(row.invoicedUnpaid)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-purple-600">
                                    {formatCurrency(row.uninvoicedPaid)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-teal-600">
                                    {formatCurrency(row.partialReceived)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {reconciliationSubTab === "contract" && (
                    <div className="overflow-hidden rounded-xl border border-forest-200">
                      {reconciliationData.byContract.length === 0 ? (
                        <EmptyState title="暂无合同对账数据" />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-forest-200 bg-forest-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  合同
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  客户
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已开票
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已收款
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已开票未收
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  未开票已收
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  部分收款
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-forest-100 bg-white">
                              {reconciliationData.byContract.map((row) => (
                                <tr key={row.contractId} className="transition-colors hover:bg-forest-50/50">
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-forest-900">
                                        {row.contractName}
                                      </span>
                                      <span className="text-xs text-forest-500">
                                        {row.contractNo}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-forest-700">{row.clientName}</span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-forest-700">
                                    {formatCurrency(row.invoicedAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-forest-700">
                                    {formatCurrency(row.receivedAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-amber-600">
                                    {formatCurrency(row.invoicedUnpaid)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-purple-600">
                                    {formatCurrency(row.uninvoicedPaid)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-teal-600">
                                    {formatCurrency(row.partialReceived)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {reconciliationSubTab === "term" && (
                    <div className="overflow-hidden rounded-xl border border-forest-200">
                      {reconciliationData.byTerm.length === 0 ? (
                        <EmptyState title="暂无付款节点对账数据" />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-forest-200 bg-forest-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  节点描述
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  合同
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  客户
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  开票状态
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  开票金额
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  应收金额
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  已收金额
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-forest-600">
                                  剩余未收
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-forest-100 bg-white">
                              {reconciliationData.byTerm.map((row) => (
                                <tr key={row.termId} className="transition-colors hover:bg-forest-50/50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-forest-900">
                                        {row.description}
                                      </span>
                                      {row.termNo && (
                                        <Badge variant="secondary">第{row.termNo}期</Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-forest-600">{row.contractNo}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-forest-700">{row.clientName}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={getInvoiceStatusBadge(row.invoiceStatus).className}>
                                      {getInvoiceStatusBadge(row.invoiceStatus).label}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-blue-600">
                                    {formatCurrency(row.invoiceAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm tabular-nums text-forest-700">
                                    {formatCurrency(row.termAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-forest-700">
                                    {formatCurrency(row.paidAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">
                                    <span className={cn(
                                      row.remainingAmount > 0 ? "text-amber-600" : "text-forest-600"
                                    )}>
                                      {formatCurrency(row.remainingAmount)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
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
        open={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setEmailTerm(null);
          setCopied(false);
        }}
        title="催款邮件草稿"
        description={
          emailTerm
            ? `${emailTerm.clientName} - ${emailTerm.description}`
            : undefined
        }
      >
        <ModalBody>
          <div className="rounded-lg border border-forest-200 bg-forest-50/50 p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-forest-800">
              {emailContent}
            </pre>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setEmailModalOpen(false);
              setEmailTerm(null);
            }}
          >
            关闭
          </Button>
          <Button variant="default" onClick={handleCopyEmail}>
            {copied ? (
              <>
                <CopyCheck className="h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制邮件内容
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
