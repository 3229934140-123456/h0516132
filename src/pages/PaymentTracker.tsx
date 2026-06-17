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
import { formatCurrency, formatDate } from "@/utils/format";
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
} from "lucide-react";

type TabKey = "pending" | "paid";

const paymentMethodText: Record<string, string> = {
  bank_transfer: "银行转账",
  cash: "现金",
  check: "支票",
  online: "在线支付",
  other: "其他",
};

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
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

export default function PaymentTracker() {
  const paymentTerms = useStore((s) => s.paymentTerms);
  const paymentRecords = useStore((s) => s.paymentRecords);
  const fetchPaymentTerms = useStore((s) => s.fetchPaymentTerms);
  const fetchPaymentRecords = useStore((s) => s.fetchPaymentRecords);
  const loading = useStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<PaymentTermWithDetails | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTerm, setEmailTerm] = useState<PaymentTermWithDetails | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPaymentTerms();
    fetchPaymentRecords();
  }, [fetchPaymentTerms, fetchPaymentRecords]);

  const pendingTerms = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return paymentTerms
      .filter((t) => t.status !== "paid")
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
  }, [paymentTerms]);

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

  const emailContent = emailTerm
    ? generateReminderEmail(emailTerm, getDaysOverdue(emailTerm.dueDate))
    : "";

  const TabButton = ({
    tab, label, count }: { tab: TabKey; label: string; count: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
        activeTab === tab
          ? "bg-forest-700 text-white shadow-sm"
          : "text-forest-600 hover:bg-forest-100",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
          activeTab === tab ? "bg-white/20 text-white" : "bg-forest-200 text-forest-700",
        )}
      >
        {count}
      </span>
    </button>
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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TabButton tab="pending" label="待收款" count={pendingTerms.length} />
            <TabButton tab="paid" label="已收款" count={paidRecords.length} />
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
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 md:flex-row md:items-center">
                            <div className="text-right">
                              <p className="text-xs text-forest-500">
                                应收金额
                              </p>
                              <p
                                className={cn(
                                  "text-xl font-bold tabular-nums",
                                  term.isOverdue
                                    ? "text-red-600"
                                    : "text-forest-900",
                                )}
                              >
                                {formatCurrency(remaining)}
                              </p>
                              {term.paidAmount > 0 && (
                                <p className="text-xs text-forest-500">
                                  已收{" "}
                                  {formatCurrency(term.paidAmount)} /{" "}
                                  {formatCurrency(term.amount)}
                                </p>
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
